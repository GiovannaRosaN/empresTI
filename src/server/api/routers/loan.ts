import { Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { calculateDueAt, countElapsedBusinessDays, evaluateLoanEligibility, formatBusinessDate, isEquipmentEligibleForLoan, isLoanOverdue } from "@/server/services/loan-rules";
import { toEquipmentItem } from "@/server/services/equipment-view";
import { protectedProcedure, router } from "../trpc";

async function getEligibility(
  transaction: Prisma.TransactionClient,
  userId: string,
  now: Date,
) {
  const activeLoans = await transaction.loan.findMany({
    where: { borrowerId: userId, returnedAt: null },
    select: { dueDate: true },
  });
  return evaluateLoanEligibility(activeLoans.map(({ dueDate }) => dueDate), now);
}

export const loanRouter = router({
  eligibility: protectedProcedure.query(async ({ ctx }) => ctx.runWithTenant(
    (transaction) => getEligibility(transaction, ctx.user.id, new Date()),
  )),

  mine: protectedProcedure.query(async ({ ctx }) => ctx.runWithTenant(async (transaction) => {
    const now = new Date();
    const loans = await transaction.loan.findMany({
      where: { borrowerId: ctx.user.id, returnedAt: null },
      include: { equipment: true },
      orderBy: { borrowedAt: "desc" },
    });

    return loans.map((loan) => ({
      id: loan.id,
      borrowedAt: loan.borrowedAt,
      dueAt: loan.dueDate,
      dueDate: formatBusinessDate(loan.dueDate),
      daysUsed: countElapsedBusinessDays(loan.borrowedAt, now),
      overdue: isLoanOverdue(loan.dueDate, now),
      equipment: toEquipmentItem({
        ...loan.equipment,
        hasOpenLoan: true,
        dueAt: loan.dueDate,
      }),
    }));
  })),

  create: protectedProcedure
    .input(z.object({ equipmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.membership.role !== "COLLABORATOR") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas colaboradores podem solicitar empréstimos.",
        });
      }

      try {
        return await ctx.runWithTenant(async (transaction) => {
          await transaction.$queryRaw`
            SELECT pg_advisory_xact_lock(hashtextextended(${ctx.user.id}, 0))
          `;

          const membershipRows = await transaction.$queryRaw<{ id: string }[]>`
            SELECT id FROM memberships
            WHERE id = ${ctx.membership.id}
              AND user_id = ${ctx.user.id}
              AND tenant_id = ${ctx.membership.tenantId}
              AND role = 'COLLABORATOR'
          `;

          if (membershipRows.length !== 1) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Vínculo de acesso inválido." });
          }

          const now = new Date();
          const eligibility = await getEligibility(transaction, ctx.user.id, now);
          if (!eligibility.canRequest) {
            throw new TRPCError({ code: "FORBIDDEN", message: eligibility.messages.join(" ") });
          }

          const equipment = await transaction.equipment.findUnique({
            where: { id: input.equipmentId },
            select: { id: true, conditionStatus: true },
          });
          if (!equipment) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Equipamento não encontrado." });
          }
          const existingLoan = await transaction.loan.findFirst({
            where: { equipmentId: equipment.id, returnedAt: null },
            select: { id: true },
          });
          if (!isEquipmentEligibleForLoan(equipment.conditionStatus, Boolean(existingLoan))) {
            throw new TRPCError({ code: "CONFLICT", message: "Este equipamento não está disponível para empréstimo." });
          }

          const dueDate = calculateDueAt(now);
          const loan = await transaction.loan.create({
            data: {
              tenantId: ctx.membership.tenantId,
              equipmentId: equipment.id,
              borrowerId: ctx.user.id,
              borrowedAt: now,
              dueDate,
            },
            select: { id: true, dueDate: true },
          });

          return { id: loan.id, dueDate: formatBusinessDate(loan.dueDate) };
        });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Este equipamento acabou de ser emprestado. Atualize o catálogo.",
            cause: error,
          });
        }
        throw error;
      }
    }),

  returnMine: protectedProcedure
    .input(z.object({ loanId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => ctx.runWithTenant(async (transaction) => {
      const result = await transaction.loan.updateMany({
        where: {
          id: input.loanId,
          borrowerId: ctx.user.id,
          returnedAt: null,
        },
        data: { returnedAt: new Date() },
      });

      if (result.count === 0) {
        const existing = await transaction.loan.findFirst({
          where: { id: input.loanId, borrowerId: ctx.user.id },
          select: { id: true },
        });
        throw new TRPCError({
          code: existing ? "CONFLICT" : "NOT_FOUND",
          message: existing ? "Este empréstimo já foi devolvido." : "Empréstimo não encontrado.",
        });
      }

      return { success: true };
    })),
});
