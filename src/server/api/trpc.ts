import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext, MembershipContext } from "./context";

const t = initTRPC.context<TRPCContext>().create();

function getSingleMembership(memberships: MembershipContext[]) {
  return memberships.length === 1 ? memberships[0] : null;
}

const authenticatedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Entre para continuar." });
  }

  const membership = getSingleMembership(ctx.memberships);
  if (!membership) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "A conta precisa ter exatamente um vínculo aprovado para acessar o sistema.",
    });
  }

  return next({ ctx: { ...ctx, user: ctx.user, membership } });
});

export const router = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const protectedProcedure = authenticatedProcedure;
export const tenantProcedure = authenticatedProcedure;
export const adminProcedure = authenticatedProcedure.use(({ ctx, next }) => {
  if (ctx.membership.role !== "ADMIN") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Apenas Operações pode realizar esta ação." });
  }
  return next({ ctx });
});
