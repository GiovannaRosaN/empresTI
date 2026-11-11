"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OutlinedButton, PageHeading, StatusPill } from "@/components/asset-components";
import { trpc } from "@/trpc/client";

export function EquipmentDetail({ assetTag }: { assetTag: string }) {
  const router = useRouter();
  const utils = trpc.useUtils();
  const [submittedMessage, setSubmittedMessage] = useState("");
  const itemQuery = trpc.equipment.byAssetTag.useQuery({ assetTag });
  const eligibilityQuery = trpc.loan.eligibility.useQuery();
  const requestLoan = trpc.loan.create.useMutation({
    onSuccess: async (result) => {
      setSubmittedMessage(`Empréstimo confirmado. Devolva até ${result.dueDate}.`);
      await Promise.all([
        utils.equipment.list.invalidate(),
        utils.equipment.byAssetTag.invalidate({ assetTag }),
        utils.loan.eligibility.invalidate(),
        utils.loan.mine.invalidate(),
        utils.user.me.invalidate(),
      ]);
    },
  });

  if (itemQuery.isPending) {
    return <p className="mx-auto max-w-[1240px] rounded-xl border border-edge-soft bg-surface p-8 text-center text-sm text-muted">Carregando equipamento…</p>;
  }
  if (itemQuery.error) {
    return <div className="mx-auto max-w-[1240px] rounded-xl border border-[rgba(224,91,98,.4)] bg-surface p-8 text-center text-sm text-overdue" role="alert">{itemQuery.error.message}</div>;
  }

  const item = itemQuery.data;
  const canRequest = item.status === "available" && eligibilityQuery.data?.canRequest === true;

  return (
    <div className="mx-auto grid max-w-[1240px] gap-8 xl:grid-cols-[minmax(0,1fr)_356px]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs text-muted">
          <a href="/catalogo">Catálogo</a><i className="ph ph-caret-right text-faint" aria-hidden="true" />
          <span>{item.categoryLabel}</span><i className="ph ph-caret-right text-faint" aria-hidden="true" />
          <span className="text-copy">{item.name}</span>
        </div>
        <div className="grid h-[220px] place-items-center rounded-xl border border-edge-soft bg-[radial-gradient(120%_120%_at_20%_0%,#132663_0%,#0b1128_60%)] sm:h-[260px]">
          <i className={`ph ${item.icon} text-[64px] text-[#3c5dbe]`} aria-hidden="true" />
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-[28px] font-semibold tracking-[-0.01em] text-copy">{item.name}</h1><StatusPill status={item.status} /></div>
          <p className="max-w-[60ch] text-[13px] leading-6 text-muted">{item.description}</p>
        </div>
        <div className="h-px bg-[linear-gradient(to_right,transparent,#222c4a_48px,#222c4a_calc(100%-48px),transparent)]" />
        <section className="flex flex-col gap-4">
          <h2 className="text-[17px] font-semibold text-copy">Ficha técnica</h2>
          <dl className="grid grid-cols-2 gap-5 sm:grid-cols-4">
            <div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Categoria</dt><dd className="text-[13px] text-copy">{item.categoryLabel}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Patrimônio</dt><dd className="text-[13px] text-copy">{item.assetTag}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Local</dt><dd className="text-[13px] text-copy">{item.location}</dd></div>
            <div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Situação</dt><dd className="text-[13px] text-copy">{item.status === "available" ? "Disponível para empréstimo" : item.note ?? item.status}</dd></div>
          </dl>
        </section>
      </div>
      <aside className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-xl border border-edge-card bg-surface p-5">
          <h2 className="text-[15px] font-semibold text-copy">Solicitar empréstimo</h2>
          <div className="flex flex-col gap-3 rounded-lg border border-edge-soft bg-sunken p-3 text-xs">
            <div className="flex justify-between gap-3 text-muted"><span>Retirada</span><strong className="text-copy">{item.location}</strong></div>
            <div className="flex justify-between gap-3 text-muted"><span>Prazo padrão</span><strong className="text-copy">14 dias úteis</strong></div>
            <div className="flex justify-between gap-3 text-muted"><span>Início da contagem</span><strong className="text-action-text">Próximo dia útil após confirmar</strong></div>
          </div>
          {eligibilityQuery.isPending ? <p className="text-xs text-muted">Verificando regras de empréstimo…</p> : null}
          {eligibilityQuery.error ? <p className="text-xs text-overdue" role="alert">{eligibilityQuery.error.message}</p> : null}
          {eligibilityQuery.data?.messages.map((message) => <p className="text-xs text-overdue" key={message} role="alert">{message}</p>)}
          {requestLoan.error ? <p className="text-xs text-overdue" role="alert">{requestLoan.error.message}</p> : null}
          {submittedMessage ? <p className="text-xs text-available" role="status">{submittedMessage}</p> : null}
          <OutlinedButton
            disabled={!canRequest || requestLoan.isPending}
            onClick={() => {
              if (window.confirm(`Confirmar empréstimo de ${item.name}? O prazo de 14 dias úteis começa no próximo dia útil.`)) {
                requestLoan.mutate({ equipmentId: item.id });
              }
            }}
          >
            {requestLoan.isPending ? "Confirmando…" : item.status === "available" ? "Solicitar" : "Indisponível"}
            <i className="ph ph-arrow-right" aria-hidden="true" />
          </OutlinedButton>
          {eligibilityQuery.data && (
            <div>
              <p className="text-[11px] text-muted">{eligibilityQuery.data.activeCount} de {eligibilityQuery.data.maxActiveLoans} itens emprestados</p>
              <div className="mt-2 flex gap-1.5" aria-label={`${eligibilityQuery.data.activeCount} de ${eligibilityQuery.data.maxActiveLoans} itens emprestados`}>
                {Array.from({ length: eligibilityQuery.data.maxActiveLoans }, (_, index) => <span className={`h-[5px] flex-1 rounded-full ${index < eligibilityQuery.data.activeCount ? "bg-action" : "bg-edge"}`} key={index} />)}
              </div>
            </div>
          )}
        </section>
        <PageHeading title="Seus empréstimos" action={<button className="text-xs text-action-text" onClick={() => router.push("/meus-emprestimos")} type="button">Ver todos</button>} />
      </aside>
    </div>
  );
}
