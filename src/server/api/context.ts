import { TRPCError } from "@trpc/server";
import type { Membership, Prisma } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/server/db";

export type AuthenticatedUser = {
  id: string;
  email: string | null;
};

export type MembershipContext = Pick<Membership, "id" | "userId" | "tenantId" | "role">;

export type TRPCContext = {
  prisma: typeof prisma;
  user: AuthenticatedUser | null;
  memberships: MembershipContext[];
  runWithTenant<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
    scope?: "equipment-availability",
  ): Promise<T>;
};

async function setLocalSetting(
  transaction: Prisma.TransactionClient,
  key: string,
  value: string,
) {
  await transaction.$queryRaw`SELECT set_config(${key}, ${value}, true)`;
}

async function assertRuntimeRole(transaction: Prisma.TransactionClient) {
  const roles = await transaction.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
    SELECT role.rolsuper, role.rolbypassrls
    FROM pg_roles AS role
    WHERE role.rolname = current_user
  `;

  if (roles.length !== 1 || roles[0].rolsuper || roles[0].rolbypassrls) {
    throw new Error("The application database role must not bypass row-level security.");
  }
}

export async function createTRPCContext(): Promise<TRPCContext> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") {
    throw new Error("Unable to verify the current Supabase session.", { cause: error });
  }

  const user = data.user
    ? { id: data.user.id, email: data.user.email ?? null }
    : null;

  let memberships: MembershipContext[] = [];

  if (user) {
    memberships = await prisma.$transaction(async (transaction) => {
      await assertRuntimeRole(transaction);
      await setLocalSetting(transaction, "app.user_id", user.id);
      return transaction.membership.findMany({
        where: { userId: user.id },
        select: { id: true, userId: true, tenantId: true, role: true },
        take: 2,
      });
    });
  }

  async function runWithTenant<T>(
    operation: (transaction: Prisma.TransactionClient) => Promise<T>,
    scope?: "equipment-availability",
  ) {
    if (!user || memberships.length !== 1) {
      throw new TRPCError({
        code: user ? "FORBIDDEN" : "UNAUTHORIZED",
        message: user
          ? "A conta precisa ter exatamente um vínculo aprovado para acessar o sistema."
          : "Entre para continuar.",
      });
    }

    const membership = memberships[0];
    if (!membership) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Vínculo de acesso inválido." });
    }

    return prisma.$transaction(async (transaction) => {
      await assertRuntimeRole(transaction);
      await setLocalSetting(transaction, "app.user_id", user.id);
      await setLocalSetting(transaction, "app.tenant_id", membership.tenantId);
      await setLocalSetting(transaction, "app.role", membership.role);
      if (scope) {
        await setLocalSetting(transaction, "app.loan_read_scope", scope);
      }
      return operation(transaction);
    });
  }

  return { prisma, user, memberships, runWithTenant };
}
