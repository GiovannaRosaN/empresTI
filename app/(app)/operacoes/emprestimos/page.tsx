"use client";

import { useState } from "react";
import { OutlinedButton, PageHeading } from "@/components/asset-components";
import { operationsLoans } from "@/data/demo";

const stats = [
  { label: "Em aberto", value: "21", note: "itens fora", tone: "default" },
  { label: "Vencem em 3 dias", value: "4", note: "prazo próximo", tone: "default" },
  { label: "Em atraso", value: "3", note: "precisam de retorno", tone: "danger" },
  { label: "Em manutenção", value: "2", note: "indisponíveis", tone: "warning" },
];

export default function OperationsPage() {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const filters = ["Todos", "Em atraso", "Vencem esta semana", "Notebooks"];
  const filteredLoans = operationsLoans.filter((loan) => {
    if (activeFilter === "Em atraso") return loan.status === "Atrasado";
    if (activeFilter === "Vencem esta semana") return loan.status === "No prazo";
    if (activeFilter === "Notebooks") return loan.category === "Notebooks";
    return true;
  });

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      <PageHeading title="Empréstimos em aberto" description="21 itens fora · dados de demonstração" action={<OutlinedButton href="/operacoes/equipamentos/novo"><i className="ph ph-plus" aria-hidden="true" /> Cadastrar equipamento</OutlinedButton>} />
      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">{stats.map((stat) => <article className={`flex flex-col gap-2 rounded-[11px] border bg-surface px-4 py-4 sm:px-[18px] ${stat.tone === "danger" ? "border-[rgba(224,91,98,.4)]" : "border-edge-card"}`} key={stat.label}><span className="text-xs text-muted">{stat.label}</span><div className="flex items-baseline gap-2"><strong className={`text-[26px] font-semibold ${stat.tone === "danger" ? "text-overdue" : stat.tone === "warning" ? "text-maintenance" : "text-copy"}`}>{stat.value}</strong><span className="text-[11px] text-faint">{stat.note}</span></div></article>)}</section>
      <div className="flex flex-wrap gap-2">{filters.map((filter) => <button aria-pressed={activeFilter === filter} className={`rounded-full border px-3 py-1.5 text-xs ${activeFilter === filter ? "border-[#25408f] bg-[#132663] font-semibold text-action-text" : "border-edge text-loaned"}`} key={filter} onClick={() => setActiveFilter(filter)} type="button">{filter}</button>)}</div>
      <section className="overflow-x-auto rounded-xl border border-edge-soft" aria-label="Todos os empréstimos em aberto">
        <div className="min-w-[920px]">
          <div className="grid grid-cols-[1.3fr_1.1fr_120px_120px_150px_110px] gap-4 bg-sunken px-[18px] py-3 text-[10px] uppercase tracking-[0.08em] text-faint"><span>Colaborador</span><span>Equipamento</span><span>Retirada</span><span>Prazo</span><span>Situação</span><span>Ação</span></div>
          {filteredLoans.length === 0 ? <p className="border-t border-edge-row px-[18px] py-8 text-center text-sm text-muted">Nenhum empréstimo neste filtro.</p> : filteredLoans.map((loan) => <div className={`grid grid-cols-[1.3fr_1.1fr_120px_120px_150px_110px] items-center gap-4 border-t border-edge-row px-[18px] py-3 ${loan.status === "Atrasado" ? "bg-[rgba(224,91,98,.05)]" : ""}`} key={loan.assetTag}>
            <div className="flex flex-col gap-0.5"><strong className="text-[13px] font-semibold text-copy">{loan.person}</strong><span className="text-[11px] text-dim">{loan.team}</span></div>
            <div className="flex flex-col gap-0.5"><span className="text-[13px] text-copy">{loan.item}</span><span className="text-[11px] text-dim">{loan.assetTag}</span></div>
            <span className="text-xs text-muted">{loan.checkout}</span><span className={`text-xs ${loan.status === "Atrasado" ? "font-semibold text-overdue" : "text-muted"}`}>{loan.due}</span>
            <span className={`w-fit rounded-full border px-2.5 py-1 text-[11px] font-semibold ${loan.status === "Atrasado" ? "border-[rgba(224,91,98,.4)] bg-[rgba(224,91,98,.08)] text-overdue" : "border-[rgba(63,185,140,.35)] bg-[rgba(63,185,140,.12)] text-available"}`}>{loan.status}</span>
            <OutlinedButton disabled>Devolver</OutlinedButton>
          </div>)}
        </div>
      </section>
      <div className="flex items-center justify-between text-xs text-faint"><span>{filteredLoans.length} empréstimos no recorte demonstrativo</span><div className="flex gap-2"><button className="rounded-md border border-edge px-3 py-1.5 text-loaned" disabled>Anterior</button><button className="rounded-md border border-edge px-3 py-1.5 text-loaned" disabled>Próximo</button></div></div>
    </div>
  );
}