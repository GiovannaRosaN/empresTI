"use client";

import { OutlinedButton, PageHeading } from "@/components/asset-components";
import { trpc } from "@/trpc/client";

export default function MyLoansPage() {
  const utils = trpc.useUtils();
  const loansQuery = trpc.loan.mine.useQuery();
  const returnLoan = trpc.loan.returnMine.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.loan.mine.invalidate(),
        utils.loan.eligibility.invalidate(),
        utils.user.me.invalidate(),
        utils.equipment.list.invalidate(),
      ]);
    },
  });

  if (loansQuery.isPending) {
    return <p className="mx-auto max-w-[1120px] rounded-xl border border-edge-soft bg-sunken p-8 text-center text-sm text-muted">Carregando empréstimos…</p>;
  }
  if (loansQuery.error) {
    return <p className="mx-auto max-w-[1120px] rounded-xl border border-[rgba(224,91,98,.4)] bg-sunken p-8 text-center text-sm text-overdue" role="alert">{loansQuery.error.message}</p>;
  }

  const loans = loansQuery.data;
  const overdueCount = loans.filter((loan) => loan.overdue).length;

  return (
    <div className="mx-auto flex max-w-[1120px] flex-col gap-6">
      <PageHeading
        title="Comigo agora"
        description={`${loans.length} de 3 itens · ${overdueCount === 0 ? "nenhum em atraso" : `${overdueCount} em atraso`}`}
        action={<OutlinedButton href="/catalogo"><i className="ph ph-plus" aria-hidden="true" /> Pegar emprestado</OutlinedButton>}
      />
      {returnLoan.error && <p className="text-sm text-overdue" role="alert">{returnLoan.error.message}</p>}
      <section className="flex flex-col divide-y divide-edge-row rounded-xl border border-edge-soft bg-bg" aria-label="Empréstimos atuais">
        {loans.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted">Você não tem empréstimos em aberto.</p>
        ) : loans.map((loan) => (
          <article className="grid gap-4 px-4 py-5 sm:grid-cols-[44px_minmax(0,1fr)_180px_auto] sm:items-center sm:gap-[18px] sm:px-5" key={loan.id}>
            <span className="grid size-11 place-items-center rounded-[10px] bg-sunken text-action-light"><i className={`ph ${loan.equipment.icon} text-[21px]`} aria-hidden="true" /></span>
            <div className="min-w-0"><h2 className="text-[15px] font-semibold text-copy">{loan.equipment.name}</h2><p className="mt-1 text-xs text-dim">{loan.equipment.categoryLabel} · {loan.equipment.assetTag}</p></div>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between text-xs"><span className="text-faint">Devolver até</span><strong className={loan.overdue ? "font-semibold text-overdue" : "font-semibold text-action-text"}>{loan.dueDate}</strong></div>
              <div className="h-1 overflow-hidden rounded-full bg-edge"><span className={`block h-full rounded-full ${loan.overdue ? "bg-overdue" : "bg-action"}`} style={{ width: `${(loan.daysUsed / 14) * 100}%` }} /></div>
              <span className="text-[10px] text-faint">{loan.overdue ? "Em atraso" : `${loan.daysUsed} de 14 dias úteis`}</span>
            </div>
            <OutlinedButton
              disabled={returnLoan.isPending}
              onClick={() => {
                if (window.confirm(`Registrar a devolução de ${loan.equipment.name}?`)) {
                  returnLoan.mutate({ loanId: loan.id });
                }
              }}
            >
              Devolver
            </OutlinedButton>
          </article>
        ))}
      </section>
      <p className="text-[11px] text-faint">Registrar a devolução encerra o empréstimo no sistema e não comprova a entrega física do equipamento.</p>
    </div>
  );
}
