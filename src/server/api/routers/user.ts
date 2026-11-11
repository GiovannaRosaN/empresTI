import { protectedProcedure, router } from "../trpc";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => ctx.runWithTenant(async (transaction) => {
    const activeLoans = await transaction.loan.count({
      where: { borrowerId: ctx.user.id, returnedAt: null },
    });

    return {
      id: ctx.user.id,
      email: ctx.user.email,
      role: ctx.membership.role,
      activeLoans,
      maxActiveLoans: 3,
    };
  })),
});
