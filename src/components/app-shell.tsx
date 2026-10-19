"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const collaboratorLinks = [
  { href: "/catalogo", label: "Catálogo", icon: "ph-squares-four" },
  { href: "/meus-emprestimos", label: "Meus empréstimos", icon: "ph-hand-arrow-down", badge: "2" },
];

const operationsLinks = [
  { href: "/operacoes/emprestimos", label: "Empréstimos em aberto", icon: "ph-list-checks" },
  { href: "/operacoes/equipamentos/novo", label: "Cadastrar equipamento", icon: "ph-plus-square" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const title = pathname.startsWith("/operacoes/equipamentos") ? "Operações / Cadastrar equipamento"
    : pathname.startsWith("/operacoes") ? "Operações / Empréstimos em aberto"
      : pathname.startsWith("/meus-emprestimos") ? "Meus empréstimos"
        : pathname.startsWith("/catalogo/") ? "Catálogo / Equipamento"
          : "Catálogo";

  function navLink(item: (typeof collaboratorLinks)[number] | (typeof operationsLinks)[number]) {
    const active = pathname === item.href || (item.href !== "/catalogo" && pathname.startsWith(`${item.href}/`)) || (item.href === "/catalogo" && pathname.startsWith("/catalogo"));
    return (
      <Link key={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] transition-colors ${active ? "bg-surface text-copy shadow-[inset_2px_0_0_#5b7fe0]" : "text-loaned hover:bg-sunken hover:text-copy"}`} href={item.href}>
        <i className={`${active ? item.icon.replace("ph-", "ph-fill ph-") : `ph ${item.icon}`} text-base ${active ? "text-action-light" : ""}`} aria-hidden="true" />
        <span>{item.label}</span>
        {"badge" in item && <span className="ml-auto rounded-full bg-[#132663] px-2 py-0.5 text-[11px] font-semibold text-action-text">{item.badge}</span>}
      </Link>
    );
  }

  return (
    <div className="grid min-h-screen md:grid-cols-[236px_minmax(0,1fr)]">
      <aside className="hidden min-h-screen flex-col gap-[26px] border-r border-edge-soft bg-sidebar px-3.5 py-[22px] md:flex">
        <Link className="flex items-center gap-2.5 px-2 text-copy" href="/catalogo">
          <span className="grid size-7 place-items-center rounded-[7px] bg-[#001449] text-action-light shadow-[0_0_0_1px_#25408f]"><i className="ph ph-package text-base" aria-hidden="true" /></span>
          <span className="text-sm font-semibold tracking-[0.02em]">EmpresTI</span>
        </Link>
        <nav className="flex flex-col gap-3" aria-label="Navegação principal">
          <div className="flex flex-col gap-[3px]">
            <p className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.12em] text-ghost">Colaborador</p>
            {collaboratorLinks.map(navLink)}
          </div>
          <div className="flex flex-col gap-[3px] pt-2">
            <p className="px-2 pb-1.5 text-[10px] uppercase tracking-[0.12em] text-ghost">Operações</p>
            {operationsLinks.map(navLink)}
          </div>
        </nav>
        <div className="mt-auto flex flex-col gap-3">
          <div className="flex items-center gap-2.5 rounded-[10px] border border-edge-soft bg-sunken p-3">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#132663] text-[11px] font-semibold text-action-text">MA</span>
            <div className="min-w-0"><p className="truncate text-xs font-semibold text-copy">Marina Alves</p><p className="text-[11px] text-dim">Design · demonstração</p></div>
          </div>
          <span className="text-center text-[10px] uppercase tracking-[0.1em] text-faint">Dados demonstrativos</span>
        </div>
      </aside>
      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-edge-soft bg-bg/95 px-4 backdrop-blur sm:px-7">
          <form action="/catalogo" className="flex h-9 w-full max-w-[420px] items-center gap-2 rounded-lg border border-edge bg-sunken px-3">
            <i className="ph ph-magnifying-glass text-[17px] text-faint" aria-hidden="true" />
            <input aria-label="Buscar equipamento" className="min-w-0 flex-1 bg-transparent text-[13px] text-copy outline-none placeholder:text-faint" name="q" placeholder="Buscar equipamento ou patrimônio" />
            <button className="sr-only" type="submit">Buscar</button>
          </form>
          <div className="hidden shrink-0 items-center gap-3 sm:flex">
            <span className="rounded-full border border-edge-card bg-sunken px-3 py-1.5 text-xs text-muted">2 de 3 itens com você</span>
            <span className="rounded-full border border-[#25408f] bg-[#132663] px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-action-text">Prévia</span>
          </div>
        </header>
        <div className="border-b border-edge-row px-4 py-2 text-[11px] text-faint sm:hidden">{title} · prévia demonstrativa</div>
        <main className="flex-1 px-4 py-6 sm:px-7 sm:py-8">{children}</main>
        <nav className="grid grid-cols-4 border-t border-edge-soft bg-sidebar px-1 py-2 md:hidden" aria-label="Navegação móvel">
          {[...collaboratorLinks, ...operationsLinks].map((item) => {
            const active = pathname === item.href || (item.href === "/catalogo" && pathname.startsWith("/catalogo"));
            return <Link key={item.href} className={`flex flex-col items-center gap-1 px-1 py-1 text-center text-[9px] ${active ? "text-action-text" : "text-dim"}`} href={item.href}><i className={`ph ${item.icon} text-lg`} aria-hidden="true" /><span>{item.label === "Empréstimos em aberto" ? "Operações" : item.label === "Cadastrar equipamento" ? "Cadastrar" : item.label}</span></Link>;
          })}
        </nav>
      </div>
    </div>
  );
}