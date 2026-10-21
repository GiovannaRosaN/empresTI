"use client";

import { useMemo, useState } from "react";
import { EquipmentCard, RuleNotice } from "@/components/asset-components";
import { equipment, filterEquipment, type CatalogFilter } from "@/data/demo";

const filters: { id: CatalogFilter; label: string }[] = [
  { id: "all", label: "Todos" }, { id: "notebook", label: "Notebooks" }, { id: "monitor", label: "Monitores" }, { id: "camera", label: "Câmeras" }, { id: "peripheral", label: "Periféricos" }, { id: "projector", label: "Projetores" },
];

export function CatalogBrowser({ initialQuery = "" }: { initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState<CatalogFilter>("all");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const filteredEquipment = useMemo(() => filterEquipment(equipment, query, filter, onlyAvailable), [query, filter, onlyAvailable]);
  const availableCount = equipment.filter((item) => item.status === "available").length;

  return (
    <div className="mx-auto flex max-w-[1320px] flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-4"><div className="flex flex-col gap-1.5"><h1 className="text-2xl font-semibold tracking-[-0.01em] text-copy">Catálogo</h1><p className="text-[13px] text-muted">{equipment.length} equipamentos · {availableCount} disponíveis agora</p></div><label className="flex h-9 items-center gap-2 rounded-lg border border-edge-strong bg-sunken px-3 text-xs text-loaned"><input checked={onlyAvailable} className="accent-[#5b7fe0]" onChange={(event) => setOnlyAvailable(event.target.checked)} type="checkbox" />Só disponíveis</label></header>
      <RuleNotice />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Filtrar por categoria">{filters.map((item) => <button aria-pressed={filter === item.id} className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${filter === item.id ? "border-[#25408f] bg-[#132663] font-semibold text-action-text" : "border-edge bg-transparent text-loaned hover:text-copy"}`} key={item.id} onClick={() => setFilter(item.id)} type="button">{item.label}</button>)}</div>
        <label className="flex h-9 max-w-full items-center gap-2 rounded-lg border border-edge bg-sunken px-3 sm:w-64"><i className="ph ph-magnifying-glass text-faint" aria-hidden="true" /><input aria-label="Filtrar catálogo" className="min-w-0 flex-1 bg-transparent text-xs text-copy outline-none placeholder:text-faint" onChange={(event) => setQuery(event.target.value)} placeholder="Filtrar catálogo" value={query} /></label>
      </div>
      {filteredEquipment.length ? <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredEquipment.map((item) => <EquipmentCard item={item} key={item.assetTag} />)}</div> : <p className="rounded-xl border border-edge-soft bg-sunken p-8 text-center text-sm text-muted">Nenhum equipamento encontrado.</p>}
    </div>
  );
}