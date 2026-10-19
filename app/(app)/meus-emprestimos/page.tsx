import { OutlinedButton, PageHeading } from "@/components/asset-components";
import { myLoans } from "@/data/demo";

export default function MyLoansPage() {
  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
      <PageHeading title="Comigo agora" description="2 de 3 itens · nenhum em atraso" action={<div className="flex items-center gap-4"><div className="hidden w-[180px] gap-1.5 sm:flex" aria-label="2 de 3 itens emprestados"><span className="h-[5px] flex-1 rounded-full bg-action" /><span className="h-[5px] flex-1 rounded-full bg-action" /><span className="h-[5px] flex-1 rounded-full bg-edge" /></div><OutlinedButton href="/catalogo"><i className="ph ph-plus" aria-hidden="true" /> Pegar emprestado</OutlinedButton></div>} />
      <section className="flex flex-col divide-y divide-edge-row rounded-xl border border-edge-soft bg-bg" aria-label="Empréstimos atuais">
        {myLoans.map((loan) => <article className="grid gap-4 px-4 py-5 sm:grid-cols-[44px_minmax(0,1fr)_180px_auto] sm:items-center sm:gap-[18px] sm:px-5" key={loan.assetTag}>
          <span className="grid size-11 place-items-center rounded-[10px] bg-sunken text-action-light"><i className={`ph ${loan.icon} text-[21px]`} aria-hidden="true" /></span>
          <div className="min-w-0"><h2 className="text-[15px] font-semibold text-copy">{loan.name}</h2><p className="mt-1 text-xs text-dim">{loan.categoryLabel} · {loan.assetTag}</p></div>
          <div className="flex flex-col gap-2"><div className="flex justify-between text-xs"><span className="text-faint">Devolver até</span><strong className="font-semibold text-action-text">{loan.dueDate}</strong></div><div className="h-1 overflow-hidden rounded-full bg-edge"><span className="block h-full rounded-full bg-action" style={{ width: `${(loan.daysUsed / 14) * 100}%` }} /></div><span className="text-[10px] text-faint">{loan.daysUsed} de 14 dias</span></div>
          <OutlinedButton disabled>Devolver</OutlinedButton>
        </article>)}
      </section>
      <p className="text-[11px] text-faint">Ação de devolução indisponível nesta prévia. Dados demonstrativos.</p>
    </div>
  );
}