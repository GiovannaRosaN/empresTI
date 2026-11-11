import { describe, expect, it, vi } from "vitest";
import type { Prisma } from "@prisma/client";
import { prisma } from "../../db";
import { loanRouter } from "./loan";

const user = { id: "collaborator-user", email: null };
const memberships = [{
  id: "membership-1",
  userId: user.id,
  tenantId: "tenant-1",
  role: "COLLABORATOR" as const,
}];

function createCollaboratorCaller({
  dueDates = [],
  conditionStatus = "AVAILABLE",
  hasOpenLoan = false,
  membershipRows = [{ id: memberships[0].id }],
}: {
  dueDates?: Date[];
  conditionStatus?: string;
  hasOpenLoan?: boolean;
  membershipRows?: { id: string }[];
} = {}) {
  const queryRaw = vi.fn()
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce(membershipRows);
  const transaction = {
    $queryRaw: queryRaw,
    loan: {
      findMany: vi.fn().mockResolvedValue(dueDates.map((dueDate) => ({ dueDate }))),
      findFirst: vi.fn().mockResolvedValue(hasOpenLoan ? { id: "open-loan" } : null),
      create: vi.fn().mockResolvedValue({
        id: "loan-created",
        dueDate: new Date("2099-01-01T02:59:59.999Z"),
      }),
    },
    equipment: {
      findUnique: vi.fn().mockResolvedValue({
        id: "equipment-1",
        conditionStatus,
      }),
    },
  } as unknown as Prisma.TransactionClient;

  const caller = loanRouter.createCaller({
    prisma,
    user,
    memberships,
    runWithTenant: async <T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) =>
      operation(transaction),
  });

  return { caller, transaction, queryRaw };
}

describe("loan.create authorization", () => {
  it("[EMP-CA-07] denies loan creation by an ADMIN before accessing tenant data", async () => {
    const runWithTenant = vi.fn(async () => {
      throw new Error("Tenant data should not be accessed.");
    });
    const caller = loanRouter.createCaller({
      prisma,
      user: { id: "admin-user", email: null },
      memberships: [{
        id: "membership-1",
        userId: "admin-user",
        tenantId: "tenant-1",
        role: "ADMIN",
      }],
      runWithTenant,
    });

    await expect(caller.create({ equipmentId: "equipment-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(runWithTenant).not.toHaveBeenCalled();
  });

  it("[EMP-CA-01] creates an open loan for an eligible collaborator", async () => {
    const { caller, transaction, queryRaw } = createCollaboratorCaller({
      dueDates: [new Date("2099-01-01T02:59:59.999Z")],
    });

    await expect(caller.create({ equipmentId: "equipment-1" })).resolves.toMatchObject({
      id: "loan-created",
    });
    expect(transaction.loan.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        tenantId: "tenant-1",
        equipmentId: "equipment-1",
        borrowerId: user.id,
      }),
    }));
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it("[EMP-CA-06] acquires the authenticated user's transaction advisory lock", async () => {
    const { caller, queryRaw } = createCollaboratorCaller();

    await caller.create({ equipmentId: "equipment-1" });

    const [lockSql, lockUserId] = queryRaw.mock.calls[0] ?? [];
    expect(lockSql?.join("")).toContain("pg_advisory_xact_lock(hashtextextended(");
    expect(lockUserId).toBe(user.id);
  });

  it("[EMP-CA-07] rejects loan creation if the membership is no longer visible", async () => {
    const { caller, transaction } = createCollaboratorCaller({ membershipRows: [] });

    await expect(caller.create({ equipmentId: "equipment-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Vínculo de acesso inválido.",
    });
    expect(transaction.loan.findMany).not.toHaveBeenCalled();
    expect(transaction.loan.create).not.toHaveBeenCalled();
  });

  it("[EMP-CA-03] rejects a fourth active loan with the specified limit message", async () => {
    const { caller, transaction } = createCollaboratorCaller({
      dueDates: Array.from({ length: 3 }, () => new Date("2099-01-01T02:59:59.999Z")),
    });

    await expect(caller.create({ equipmentId: "equipment-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Você atingiu o limite de 3 empréstimos ativos. Devolva um item antes de solicitar outro.",
    });
    expect(transaction.loan.create).not.toHaveBeenCalled();
  });

  it("[EMP-CA-04] rejects a request while the collaborator has an overdue loan", async () => {
    const { caller, transaction } = createCollaboratorCaller({
      dueDates: [new Date("2020-01-01T02:59:59.999Z")],
    });

    await expect(caller.create({ equipmentId: "equipment-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Você possui empréstimos em atraso. Regularize as devoluções antes de solicitar outro equipamento.",
    });
    expect(transaction.loan.create).not.toHaveBeenCalled();
  });

  it("[EMP-CA-04] returns both messages when the limit and overdue rules apply", async () => {
    const { caller, transaction } = createCollaboratorCaller({
      dueDates: [
        new Date("2020-01-01T02:59:59.999Z"),
        new Date("2099-01-01T02:59:59.999Z"),
        new Date("2099-01-01T02:59:59.999Z"),
      ],
    });

    await expect(caller.create({ equipmentId: "equipment-1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
      message: "Você atingiu o limite de 3 empréstimos ativos. Devolva um item antes de solicitar outro. Você possui empréstimos em atraso. Regularize as devoluções antes de solicitar outro equipamento.",
    });
    expect(transaction.loan.create).not.toHaveBeenCalled();
  });

  it("[EMP-CA-02] rejects equipment in maintenance without creating a loan", async () => {
    const { caller, transaction } = createCollaboratorCaller({
      conditionStatus: "MAINTENANCE",
    });

    await expect(caller.create({ equipmentId: "equipment-1" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Este equipamento não está disponível para empréstimo.",
    });
    expect(transaction.loan.create).not.toHaveBeenCalled();
  });

  it("[EMP-CA-02] rejects an equipment with an open loan", async () => {
    const { caller, transaction } = createCollaboratorCaller({ hasOpenLoan: true });

    await expect(caller.create({ equipmentId: "equipment-1" })).rejects.toMatchObject({
      code: "CONFLICT",
      message: "Este equipamento não está disponível para empréstimo.",
    });
    expect(transaction.loan.create).not.toHaveBeenCalled();
  });

  it("[EMP-CA-07] ignores borrower and tenant IDs supplied by the caller", async () => {
    const { caller, transaction } = createCollaboratorCaller();
    const untrustedInput = {
      equipmentId: "equipment-1",
      borrowerId: "attacker-user",
      tenantId: "another-tenant",
    };

    await caller.create(untrustedInput);

    expect(transaction.loan.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        borrowerId: user.id,
        tenantId: memberships[0].tenantId,
      }),
    }));
  });
});
