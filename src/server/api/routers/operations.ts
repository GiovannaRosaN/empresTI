import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { adminProcedure, router } from "../trpc";
import { formatBusinessDate, isLoanOverdue } from "@/server/services/loan-rules";
import { toEquipmentItem } from "@/server/services/equipment-view";

const operationalStatus = z.enum(["AVAILABLE", "MAINTENANCE", "OUT_OF_SERVICE"]);

export const operationsRouter = router({
  overview: adminProcedure.query(async ({ ctx }) => ctx.runWithTenant(async (transaction) => {
    const now = new Date();
    const [loans, equipment] = await Promise.all([
      transaction.loan.findMany({
        where: { returnedAt: null },
        include: { equipment: true },
        orderBy: { dueDate: "asc" },
      }),
      transaction.equipment.findMany({
        include: {
          loans: { where: { returnedAt: null }, select: { dueDate: true }, take: 1 },
        },
        orderBy: [{ name: "asc" }, { assetTag: "asc" }],
      }),
    ]);

    return {
      loans: loans.map((loan) => ({
        id: loan.id,
        borrowerId: loan.borrowerId,
        borrowedAt: loan.borrowedAt,
        borrowedDate: formatBusinessDate(loan.borrowedAt),
        dueAt: loan.dueDate,
        dueDate: formatBusinessDate(loan.dueDate),
        overdue: isLoanOverdue(loan.dueDate, now),
        dueSoon: loan.dueDate >= now && loan.dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        equipment: toEquipmentItem({
          ...loan.equipment,
          hasOpenLoan: true,
          dueAt: loan.dueDate,
        }),
      })),
      equipment: equipment.map((item) => toEquipmentItem({
        ...item,
        hasOpenLoan: item.loans.length > 0,
        ...(item.loans[0] ? { dueAt: item.loans[0].dueDate } : {}),
      })),
      counts: {
        openLoans: loans.length,
        overdueLoans: loans.filter((loan) => isLoanOverdue(loan.dueDate, now)).length,
        maintenanceEquipment: equipment.filter((item) => item.conditionStatus === "MAINTENANCE").length,
      },
    };
  })),

  recordReturn: adminProcedure
    .input(z.object({ loanId: z.string().min(1), conditionStatus: operationalStatus }))
    .mutation(async ({ ctx, input }) => ctx.runWithTenant(async (transaction) => {
      const loan = await transaction.loan.findFirst({
        where: { id: input.loanId, returnedAt: null },
        select: { id: true, equipmentId: true },
      });

      if (!loan) {
        const existing = await transaction.loan.findUnique({
          where: { id: input.loanId },
          select: { id: true },
        });
        throw new TRPCError({
          code: existing ? "CONFLICT" : "NOT_FOUND",
          message: existing ? "Este empréstimo já foi devolvido." : "Empréstimo não encontrado.",
        });
      }

      const updatedLoan = await transaction.loan.updateMany({
        where: { id: loan.id, returnedAt: null },
        data: { returnedAt: new Date() },
      });
      if (updatedLoan.count !== 1) {
        throw new TRPCError({ code: "CONFLICT", message: "Este empréstimo já foi devolvido." });
      }

      await transaction.equipment.update({
        where: { id: loan.equipmentId },
        data: { conditionStatus: input.conditionStatus },
      });

      return { success: true };
    })),

  createEquipment: adminProcedure
    .input(z.object({
      name: z.string().trim().min(1).max(200),
      assetTag: z.string().trim().min(1).max(100),
      category: z.string().trim().min(1).max(100),
      serialNumber: z.string().trim().max(200).optional().default(""),
      location: z.string().trim().max(200).optional().default(""),
      conditionStatus: operationalStatus,
      notes: z.string().trim().max(2000).optional().default(""),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const equipment = await ctx.runWithTenant((transaction) => transaction.equipment.create({
          data: {
            tenantId: ctx.membership.tenantId,
            name: input.name,
            assetTag: input.assetTag,
            category: input.category,
            serialNumber: input.serialNumber || null,
            location: input.location || null,
            conditionStatus: input.conditionStatus,
            notes: input.notes || null,
          },
          select: { id: true, assetTag: true },
        }));

        return equipment;
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "P2002") {
          throw new TRPCError({ code: "CONFLICT", message: "Já existe um equipamento com esse patrimônio neste tenant." });
        }
        throw error;
      }
    }),

  reactivateEquipment: adminProcedure
    .input(z.object({ equipmentId: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => ctx.runWithTenant(async (transaction) => {
      const result = await transaction.equipment.updateMany({
        where: { id: input.equipmentId, conditionStatus: "OUT_OF_SERVICE" },
        data: { conditionStatus: "AVAILABLE" },
      });

      if (result.count === 0) {
        const equipment = await transaction.equipment.findUnique({
          where: { id: input.equipmentId },
          select: { id: true },
        });
        throw new TRPCError({
          code: equipment ? "CONFLICT" : "NOT_FOUND",
          message: equipment ? "Somente equipamentos fora de uso podem ser reativados." : "Equipamento não encontrado.",
        });
      }

      return { success: true };
    })),
});
