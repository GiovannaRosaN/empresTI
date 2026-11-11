import { router } from "./trpc";
import { equipmentRouter } from "./routers/equipment";
import { loanRouter } from "./routers/loan";
import { operationsRouter } from "./routers/operations";
import { userRouter } from "./routers/user";

export const appRouter = router({
  equipment: equipmentRouter,
  loan: loanRouter,
  operations: operationsRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;
