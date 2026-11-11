import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../trpc";
import { toEquipmentItem } from "@/server/services/equipment-view";

const assetTagInput = z.string().trim().min(1).max(100);

export const equipmentRouter = router({
  list: protectedProcedure
    .input(z.object({
      query: z.string().trim().max(100).default(""),
      category: z.string().trim().max(100).optional(),
      onlyAvailable: z.boolean().default(false),
    }).default({ query: "", onlyAvailable: false }))
    .query(async ({ ctx, input }) => ctx.runWithTenant(async (transaction) => {
      const equipment = await transaction.equipment.findMany({
        where: {
          ...(input.category ? { category: { contains: input.category, mode: "insensitive" } } : {}),
          ...(input.query ? {
            OR: [
              { name: { contains: input.query, mode: "insensitive" } },
              { assetTag: { contains: input.query, mode: "insensitive" } },
              { category: { contains: input.query, mode: "insensitive" } },
            ],
          } : {}),
        },
        orderBy: [{ name: "asc" }, { assetTag: "asc" }],
        include: {
          loans: {
            where: { returnedAt: null },
            select: { dueDate: true },
            take: 1,
          },
        },
      });

      return equipment
        .map((item) => toEquipmentItem({
          ...item,
          hasOpenLoan: item.loans.length > 0,
          ...(item.loans[0] ? { dueAt: item.loans[0].dueDate } : {}),
        }))
        .filter((item) => !input.onlyAvailable || item.status === "available");
    }, "equipment-availability")),

  byAssetTag: protectedProcedure
    .input(z.object({ assetTag: assetTagInput }))
    .query(async ({ ctx, input }) => ctx.runWithTenant(async (transaction) => {
      const item = await transaction.equipment.findFirst({
        where: { assetTag: { equals: input.assetTag, mode: "insensitive" } },
        include: {
          loans: {
            where: { returnedAt: null },
            select: { dueDate: true },
            take: 1,
          },
        },
      });

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Equipamento não encontrado." });
      }

      return toEquipmentItem({
        ...item,
        hasOpenLoan: item.loans.length > 0,
        ...(item.loans[0] ? { dueAt: item.loans[0].dueDate } : {}),
      });
    }, "equipment-availability")),
});
