import Link from "next/link";
import type { Equipment } from "@/data/demo";
import { statusLabel } from "@/data/demo";

export function StatusPill({ status }: { status: Equipment["status"] }) {
  const styles = {
    available: "border-[rgba(63,185,140,.35)] bg-[rgba(63,185,140,.12)] text-available",
    loaned: "border-edge-strong bg-[#1a2340] text-loaned",
    maintenance: "border-[rgba(224,163,63,.35)] bg-[rgba(224,163,63,.12)] text-maintenance",
  };
  return <span className={`inline-flex w-fit items-center rounded-full border px-[9px] py-[3px] text-[11px] font-semibold ${styles[status]}`}>{statusLabel(status)}</span>;
}

export function EquipmentCard({ item }: { item: Equipment }) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-[9px] bg-sunken text-action-light"><i className={`ph ${item.icon} text-xl`} aria-hidden="true" /></span>
        <StatusPill status={item.status} />
      </div>
      <div className="flex min-w-0 flex-col gap-1"><h2 className="truncate text-[14px] font-semibold text-copy">{item.name}</h2><p className="text-xs text-dim">{item.categoryLabel} <span className="text-ghost">·</span> {item.assetTag}</p></div>
      <p className={`min-h-5 text-xs ${item.status === "available" ? "font-semibold text-action-light" : "text-faint"}`}>
        {item.status === "available" ? <>Solicitar <i className="ph ph-arrow-right" aria-hidden="true" /></> : item.status === "loaned" ? `Com ${item.holder} · devolve ${item.dueDate}` : item.note}
      </p>
    </>
  );

  const className = `flex min-h-[174px] flex-col justify-between gap-3 rounded-xl border border-edge-card bg-surface p-4 transition-colors ${item.status === "available" ? "hover:border-[#3c5dbe]" : ""}`;
  return item.status === "available"
    ? <Link aria-label={`${item.name}, ${item.assetTag}, disponível. Ver detalhes`} className={className} href={`/catalogo/${item.assetTag}`}>{content}</Link>
    : <article className={className}>{content}</article>;
}

export function RuleNotice() {
  return (
    <aside className="flex gap-3 rounded-[10px] border border-[#25408f] bg-[linear-gradient(90deg,#0e1530,#0b1128)] px-4 py-3">
      <i className="ph ph-info mt-0.5 text-[17px] text-action-light" aria-hidden="true" />
      <div className="flex flex-col gap-1"><strong className="text-[13px] font-semibold text-copy">Regras de empréstimo</strong><p className="text-xs leading-5 text-loaned">Até 3 itens por pessoa · prazo de 14 dias · atraso bloqueia novo empréstimo · itens em manutenção ficam indisponíveis.</p></div>
    </aside>
  );
}

export function PageHeading({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return <div className="flex flex-wrap items-end justify-between gap-4"><div className="flex flex-col gap-1.5">{eyebrow && <p className="text-[11px] uppercase tracking-[0.1em] text-faint">{eyebrow}</p>}<h1 className="text-2xl leading-tight font-semibold tracking-[-0.01em] text-copy">{title}</h1>{description && <p className="text-[13px] text-muted">{description}</p>}</div>{action}</div>;
}

export function OutlinedButton({ children, href, disabled = false }: { children: React.ReactNode; href?: string; disabled?: boolean }) {
  const className = `inline-flex h-9 items-center justify-center gap-2 rounded-lg border px-4 text-[13px] font-semibold transition-colors ${disabled ? "cursor-not-allowed border-edge-strong text-loaned opacity-45" : "border-action text-action-text hover:bg-[rgba(91,127,224,.12)] hover:text-[#eef2fe]"}`;
  if (href) return <Link className={className} href={href}>{children}</Link>;
  return <button className={className} disabled={disabled} type="button">{children}</button>;
}