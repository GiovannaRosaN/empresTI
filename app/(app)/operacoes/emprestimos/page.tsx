"use client";

import { useState } from "react";
import { OutlinedButton, PageHeading } from "@/components/asset-components";
import { trpc } from "@/trpc/client";

const filters = ["Todos", "Em atraso", "Vencem em 7 dias", "Notebooks"] as const;
const conditionOptions = [
  { value: "AVAILABLE", label: "Disponível" },
  { value: "MAINTENANCE", label: "Manutenção" },
  { value: "OUT_OF_SERVICE", label: "Fora de uso" },
] as const;

export default function OperationsPage() {
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>("Todos");
  const [returnConditions, setReturnConditions] = useState<Record<string, (typeof conditionOptions)[number]["value"]>>({});
  const utils = trpc.useUtils();
  const overviewQuery = trpc.operations.overview.useQuery();
  const recordReturn = trpc.operations.recordReturn.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.operations.overview.invalidate(),
        utils.equipment.list.invalidate(),
        utils.loan.mine.invalidate(),
        utils.user.me.invalidate(),
      ]);
    },
  });

  if (overviewQuery.isPending) {
    return <p className="mx-auto max-w-[1120px] rounded-xl border border-edge-soft bg-sunken p-8 text-center text-sm text-muted">Carregando empréstimos…</p>;
  }
  if (overviewQuery.error) {
    return <p className="mx-auto max-w-[1120px] rounded-xl border border-[rgba(224,91,98,.4)] bg-sunken p-8 text-center text-sm text-overdue" role="alert">{overviewQuery.error.message}</p>;
  }

  const overview = overviewQuery.data;
  const filteredLoans = overview.loans.filter((loan) => {
    if (activeFilter === "Em atraso") return loan.overdue;
    if (activeFilter === "Vencem em 7 dias") return loan.dueSoon;
    if (activeFilter === "Notebooks") return loan.equipment.category === "notebook";
    return true;
  });

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      <PageHeading
        title="Empréstimos em aberto"
        description={`${overview.counts.openLoans} itens fora no tenant`}
        action={<OutlinedButton href="/operacoes/equipamentos/novo"><i className="ph ph-plus" aria-hidden="true" /> Cadastrar equipamento</OutlinedButton>}
      />
      {recordReturn.error && <p className="text-sm text-overdue" role="alert">{recordReturn.error.message}</p>}
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        {[
          { label: "Em aberto", value: overview.counts.openLoans, note: "itens fora", tone: "default" },
          { label: "Vencem em 7 dias", value: overview.loans.filter((loan) => loan.dueSoon).length, note: "prazo próximo", tone: "default" },
          { label: "Em atraso", value: overview.counts.overdueLoans, note: "precisam de retorno", tone: "danger" },
          { label: "Em manutenção", value: overview.counts.maintenanceEquipment, note: "indisponíveis", tone: "warning" },
        ].map((stat) => (
          <article className={`flex flex-col gap-2 rounded-[11px] border bg-surface px-4 py-4 sm:px-[18px] ${stat.tone === "danger" ? "border-[rgba(224,91,98,.4)]" : "border-edge-card"}`} key={stat.label}>
            <span className="text-xs text-muted">{stat.label}</span>
            <div className="flex items-baseline gap-2">
              <strong className={`text-[26px] font-semibold ${stat.tone === "danger" ? "text-overdue" : stat.tone === "warning" ? "text-maintenance" : "text-copy"}`}>{stat.value}</strong>
              <span className="text-[11px] text-faint">{stat.note}</span>
            </div>
          </article>
        ))}
      </section>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => <button aria-pressed={activeFilter === filter} className={`rounded-full border px-3 py-1.5 text-xs ${activeFilter === filter ? "border-[#25408f] bg-[#132663] font-semibold text-action-text" : "border-edge text-loaned"}`} key={filter} onClick={() => setActiveFilter(filter)} type="button">{filter}</button>)}
      </div>
      <section className="overflow-x-auto rounded-xl border border-edge-soft" aria-label="Todos os empréstimos em aberto">
        <div className="min-w-[960px]">
          <div className="grid grid-cols-[1.1fr_1.1fr_110px_110px_120px_220px] gap-4 bg-sunken px-[18px] py-3 text-[10px] uppercase tracking-[0.08em] text-faint"><span>Colaborador</span><span>Equipamento</span><span>Retirada</span><span>Prazo</span><span>Situação</span><span>Devolução no balcão</span></div>
          {filteredLoans.length === 0 ? <p className="border-t border-edge-row px-[18px] py-8 text-center text-sm text-muted">Nenhum empréstimo neste filtro.</p> : filteredLoans.map((loan) => (
            <div className={`grid grid-cols-[1.1fr_1.1fr_110px_110px_120px_220px] items-center gap-4 border-t border-edge-row px-[18px] py-3 ${loan.overdue ? "bg-[rgba(224,91,98,.05)]" : ""}`} key={loan.id}>
              <div className="flex flex-col gap-0.5"><strong className="text-[13px] font-semibold text-copy">Colaborador</strong><span className="text-[11px] text-dim" title={loan.borrowerId}>{loan.borrowerId.slice(0, 8)}</span></div>
              <div className="flex flex-col gap-0.5"><span className="text-[13px] text-copy">{loan.equipment.name}</span><span className="text-[11px] text-dim">{loan.equipment.assetTag}</span></div>
              <span className="text-xs text-muted">{loan.borrowedDate}</span>
              <span className={`text-xs ${loan.overdue ? "font-semibold text-overdue" : "text-muted"}`}>{loan.dueDate}</span>
              <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${loan.overdue ? "border-[rgba(224,91,98,.4)] bg-[rgba(224,91,98,.08)] text-overdue" : "border-[rgba(63,185,140,.35)] bg-[rgba(63,185,140,.12)] text-available"}`}>{loan.overdue ? "Atrasado" : "No prazo"}</span>
              <div className="flex items-center gap-2">
                <select
                  aria-label={`Condição de devolução para ${loan.equipment.assetTag}`}
                  className="h-9 min-w-0 flex-1 rounded-lg border border-edge-strong bg-sunken px-2 text-xs text-copy"
                  onChange={(event) => setReturnConditions((current) => ({ ...current, [loan.id]: event.target.value as (typeof conditionOptions)[number]["value"] }))}
                  value={returnConditions[loan.id] ?? "AVAILABLE"}
                >
                  {conditionOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <OutlinedButton
                  disabled={recordReturn.isPending}
                  onClick={() => {
                    if (window.confirm(`Confirmar recebimento de ${loan.equipment.name}?`)) {
                      recordReturn.mutate({ loanId: loan.id, conditionStatus: returnConditions[loan.id] ?? "AVAILABLE" });
                    }
                  }}
                >
                  Devolver
                </OutlinedButton>
              </div>
            </div>
          ))}
        </div>
      </section>
      <p className="text-xs text-faint">{filteredLoans.length} empréstimos abertos no recorte. O identificador do colaborador é exibido porque não há perfil de usuário nesta versão.</p>
    </div>
  );
}
