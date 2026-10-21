"use client";

import { useState } from "react";
import { EquipmentCard, PageHeading } from "@/components/asset-components";
import type { Equipment, EquipmentCategory, EquipmentStatus } from "@/data/demo";

const categories: { value: EquipmentCategory; label: string }[] = [
  { value: "notebook", label: "Notebook" }, { value: "monitor", label: "Monitor" }, { value: "camera", label: "Câmera" }, { value: "peripheral", label: "Periférico" }, { value: "projector", label: "Projetor" },
];

export default function NewEquipmentPage() {
  const [name, setName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("notebook");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState<EquipmentStatus>("available");
  const [note, setNote] = useState("");
  const categoryLabel = categories.find((item) => item.value === category)?.label ?? "Notebook";
  const preview: Equipment = { assetTag: assetTag || "PAT-0000", name: name || "Nome do equipamento", category, categoryLabel: `${categoryLabel} · Prévia`, location: location || "Local de retirada", status, icon: category === "monitor" ? "ph-monitor" : category === "camera" ? "ph-video-camera" : category === "projector" ? "ph-projector-screen" : category === "peripheral" ? "ph-usb" : "ph-laptop", description: "Prévia do novo registro", ...(note ? { note } : {}) };
  const fieldClass = "h-[42px] w-full rounded-lg border border-edge-strong bg-sunken px-3 text-[13px] text-copy placeholder:text-faint";

  return (
    <div className="mx-auto grid max-w-[1180px] gap-8 xl:grid-cols-[minmax(0,620px)_320px] xl:justify-between">
      <section className="flex flex-col gap-5"><PageHeading eyebrow="Operações / Cadastrar equipamento" title="Cadastrar equipamento" description="Um registro por unidade física." />
        <form className="grid grid-cols-1 gap-x-[18px] gap-y-4 sm:grid-cols-2" onSubmit={(event) => event.preventDefault()}>
          <label className="flex flex-col gap-2 text-xs text-loaned sm:col-span-2">Nome<input className={fieldClass} onChange={(event) => setName(event.target.value)} placeholder={'Ex.: MacBook Pro 14"'} value={name} /></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Categoria<select className={fieldClass} onChange={(event) => setCategory(event.target.value as EquipmentCategory)} value={category}>{categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Patrimônio<input className={fieldClass} onChange={(event) => setAssetTag(event.target.value)} placeholder="PAT-0000" value={assetTag} /></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Número de série<input className={fieldClass} placeholder="Número de série" /></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Local de retirada<input className={fieldClass} onChange={(event) => setLocation(event.target.value)} placeholder="Ex.: 2º andar" value={location} /></label>
          <fieldset className="flex flex-col gap-3 sm:col-span-2"><legend className="mb-2 text-xs text-loaned">Situação inicial</legend><div className="flex flex-wrap gap-2">{([{ value: "available", label: "Disponível" }, { value: "maintenance", label: "Em manutenção" }, { value: "loaned", label: "Fora de uso" }] as const).map((item) => <button aria-pressed={status === item.value} className={`rounded-lg border px-3 py-2 text-xs ${status === item.value ? "border-[#25408f] bg-[#132663] font-semibold text-action-text" : "border-edge-strong text-loaned"}`} key={item.value} onClick={() => setStatus(item.value)} type="button">{item.label}</button>)}</div><p className="text-[11px] text-faint">Em manutenção não aparece como disponível.</p></fieldset>
          <label className="flex flex-col gap-2 text-xs text-loaned sm:col-span-2">Observações <span className="text-ghost">(opcional)</span><textarea className="min-h-[88px] resize-none rounded-lg border border-edge-strong bg-sunken px-3 py-2.5 text-[13px] text-copy placeholder:text-faint" onChange={(event) => setNote(event.target.value)} placeholder="Informações adicionais" value={note} /></label>
          <div className="flex flex-wrap gap-2 sm:col-span-2"><button className="h-10 rounded-lg border border-action px-5 text-[13px] font-semibold text-action-text opacity-45" disabled type="button" title="Cadastro ainda não conectado à API">Cadastrar</button><button className="h-10 rounded-lg border border-edge-strong px-4 text-[13px] text-loaned opacity-45" disabled type="button">Cadastrar e adicionar outro</button></div>
          <p className="text-[11px] text-faint sm:col-span-2">Prévia local. O cadastro será habilitado quando a API e as permissões estiverem conectadas.</p>
        </form>
      </section>
      <aside className="flex flex-col gap-5"><section className="flex flex-col gap-3"><h2 className="text-[15px] font-semibold text-copy">Prévia no catálogo</h2><EquipmentCard item={preview} /></section><section className="flex flex-col gap-3"><h2 className="text-[15px] font-semibold text-copy">Últimos cadastros</h2><div className="flex flex-col divide-y divide-edge-row rounded-xl border border-edge-soft bg-sunken px-3"><p className="py-3 text-xs text-muted">ThinkPad T14 <span className="float-right text-faint">18/set</span></p><p className="py-3 text-xs text-muted">Dock USB-C Anker <span className="float-right text-faint">16/set</span></p><p className="py-3 text-xs text-muted">Sony A7 III <span className="float-right text-faint">12/set</span></p></div></section></aside>
    </div>
  );
}