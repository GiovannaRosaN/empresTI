import { notFound } from "next/navigation";
import { OutlinedButton, PageHeading, StatusPill } from "@/components/asset-components";
import { equipment } from "@/data/demo";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ patrimonio: string }> }) {
  const { patrimonio } = await params;
  const item = equipment.find((asset) => asset.assetTag.toLowerCase() === patrimonio.toLowerCase());
  if (!item) notFound();

  return (
    <div className="mx-auto grid max-w-[1240px] gap-8 xl:grid-cols-[minmax(0,1fr)_356px]">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2 text-xs text-muted"><a href="/catalogo">Catálogo</a><i className="ph ph-caret-right text-faint" aria-hidden="true" /><span>{item.categoryLabel.split(" · ")[0]}</span><i className="ph ph-caret-right text-faint" aria-hidden="true" /><span className="text-copy">{item.name}</span></div>
        <div className="grid h-[220px] place-items-center rounded-xl border border-edge-soft bg-[radial-gradient(120%_120%_at_20%_0%,#132663_0%,#0b1128_60%)] sm:h-[260px]"><i className={`ph ${item.icon} text-[64px] text-[#3c5dbe]`} aria-hidden="true" /></div>
        <div className="flex flex-col gap-3"><div className="flex flex-wrap items-center gap-3"><h1 className="text-[28px] font-semibold tracking-[-0.01em] text-copy">{item.name}</h1><StatusPill status={item.status} /></div><p className="max-w-[60ch] text-[13px] leading-6 text-muted">{item.description}</p></div>
        <div className="h-px bg-[linear-gradient(to_right,transparent,#222c4a_48px,#222c4a_calc(100%-48px),transparent)]" />
        <section className="flex flex-col gap-4"><h2 className="text-[17px] font-semibold text-copy">Ficha técnica</h2><dl className="grid grid-cols-2 gap-5 sm:grid-cols-4"><div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Categoria</dt><dd className="text-[13px] text-copy">{item.categoryLabel.split(" · ")[0]}</dd></div><div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Patrimônio</dt><dd className="text-[13px] text-copy">{item.assetTag}</dd></div><div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Local</dt><dd className="text-[13px] text-copy">{item.location}</dd></div><div className="flex flex-col gap-1"><dt className="text-[11px] uppercase tracking-[0.08em] text-faint">Situação</dt><dd className="text-[13px] text-copy">{item.status === "available" ? "Pronto para retirada" : item.status === "loaned" ? `Com ${item.holder}` : item.note}</dd></div></dl></section>
      </div>
      <aside className="flex flex-col gap-4">
        <section className="flex flex-col gap-4 rounded-xl border border-edge-card bg-surface p-5"><h2 className="text-[15px] font-semibold text-copy">Solicitar empréstimo</h2><div className="flex flex-col gap-3 rounded-lg border border-edge-soft bg-sunken p-3 text-xs"><div className="flex justify-between gap-3 text-muted"><span>Retirada</span><strong className="text-copy">2º andar · Balcão</strong></div><div className="flex justify-between gap-3 text-muted"><span>Prazo padrão</span><strong className="text-copy">14 dias</strong></div><div className="flex justify-between gap-3 text-muted"><span>Devolver até</span><strong className="text-action-text">14 dias após retirada</strong></div></div><OutlinedButton disabled>{item.status === "available" ? "Solicitar" : "Indisponível"}<i className="ph ph-arrow-right" aria-hidden="true" /></OutlinedButton><p className="text-[11px] leading-5 text-faint">Ação indisponível nesta prévia. O fluxo de solicitação depende da integração de dados.</p></section>
        <section className="flex flex-col gap-3 rounded-xl border border-edge-card bg-surface p-5"><h2 className="text-[15px] font-semibold text-copy">Seus itens</h2><p className="text-[13px] text-muted">2 de 3 itens emprestados</p><div className="flex gap-1.5" aria-label="2 de 3 itens emprestados"><span className="h-[5px] flex-1 rounded-full bg-action" /><span className="h-[5px] flex-1 rounded-full bg-action" /><span className="h-[5px] flex-1 rounded-full bg-edge" /></div><p className="text-[11px] text-faint">Dados ilustrativos de demonstração.</p></section>
      </aside>
    </div>
  );
}