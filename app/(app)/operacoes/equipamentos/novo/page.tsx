"use client";

import { useState, type FormEvent } from "react";
import { EquipmentCard, PageHeading } from "@/components/asset-components";
import { categoryIcon, categoryLabel, equipmentCategories, type EquipmentCategory, type EquipmentItem, type OperationalStatus } from "@/data/equipment";
import { trpc } from "@/trpc/client";

const fieldClass = "h-[42px] w-full rounded-lg border border-edge-strong bg-sunken px-3 text-[13px] text-copy placeholder:text-faint";
const statusOptions: { value: OperationalStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Disponível" },
  { value: "MAINTENANCE", label: "Em manutenção" },
  { value: "OUT_OF_SERVICE", label: "Fora de uso" },
];

export default function NewEquipmentPage() {
  const [name, setName] = useState("");
  const [assetTag, setAssetTag] = useState("");
  const [category, setCategory] = useState<EquipmentCategory>("notebook");
  const [serialNumber, setSerialNumber] = useState("");
  const [location, setLocation] = useState("");
  const [conditionStatus, setConditionStatus] = useState<OperationalStatus>("AVAILABLE");
  const [notes, setNotes] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const utils = trpc.useUtils();
  const overviewQuery = trpc.operations.overview.useQuery();
  const createEquipment = trpc.operations.createEquipment.useMutation({
    onSuccess: async (created) => {
      setSuccessMessage(`Equipamento ${created.assetTag} cadastrado.`);
      setName("");
      setAssetTag("");
      setSerialNumber("");
      setLocation("");
      setNotes("");
      await Promise.all([utils.operations.overview.invalidate(), utils.equipment.list.invalidate()]);
    },
  });
  const reactivateEquipment = trpc.operations.reactivateEquipment.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.operations.overview.invalidate(), utils.equipment.list.invalidate()]);
    },
  });

  const categoryName = categoryLabel(category);
  const preview: EquipmentItem = {
    id: "preview",
    assetTag: assetTag || "PAT-0000",
    name: name || "Nome do equipamento",
    category,
    categoryLabel: categoryName,
    location: location || "Local de retirada não informado",
    status: conditionStatus === "AVAILABLE" ? "available" : conditionStatus === "MAINTENANCE" ? "maintenance" : "out_of_service",
    icon: categoryIcon(category),
    description: notes || "Prévia do novo registro",
    ...(conditionStatus === "MAINTENANCE" ? { note: notes || "Em manutenção" } : {}),
  };
  const unavailableEquipment = overviewQuery.data?.equipment.filter((item) => item.status === "out_of_service") ?? [];

  function submitEquipment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    createEquipment.mutate({ name, assetTag, category: categoryName, serialNumber, location, conditionStatus, notes });
  }

  return (
    <div className="mx-auto grid max-w-[1180px] gap-8 xl:grid-cols-[minmax(0,620px)_320px] xl:justify-between">
      <section className="flex flex-col gap-5">
        <PageHeading eyebrow="Operações / Cadastrar equipamento" title="Cadastrar equipamento" description="Um registro por unidade física." />
        <form className="grid grid-cols-1 gap-x-[18px] gap-y-4 sm:grid-cols-2" onSubmit={submitEquipment}>
          <label className="flex flex-col gap-2 text-xs text-loaned sm:col-span-2">Nome<input autoComplete="off" className={fieldClass} maxLength={200} onChange={(event) => setName(event.target.value)} placeholder={'Ex.: MacBook Pro 14"'} required value={name} /></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Categoria<select className={fieldClass} onChange={(event) => setCategory(event.target.value as EquipmentCategory)} value={category}>{equipmentCategories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Patrimônio<input autoComplete="off" className={fieldClass} maxLength={100} onChange={(event) => setAssetTag(event.target.value)} placeholder="PAT-0000" required value={assetTag} /></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Número de série<input autoComplete="off" className={fieldClass} maxLength={200} onChange={(event) => setSerialNumber(event.target.value)} placeholder="Número de série (opcional)" value={serialNumber} /></label>
          <label className="flex flex-col gap-2 text-xs text-loaned">Local de retirada<input autoComplete="off" className={fieldClass} maxLength={200} onChange={(event) => setLocation(event.target.value)} placeholder="Ex.: 2º andar" value={location} /></label>
          <fieldset className="flex flex-col gap-3 sm:col-span-2">
            <legend className="mb-2 text-xs text-loaned">Situação inicial</legend>
            <div className="flex flex-wrap gap-2">{statusOptions.map((item) => <button aria-pressed={conditionStatus === item.value} className={`rounded-lg border px-3 py-2 text-xs ${conditionStatus === item.value ? "border-[#25408f] bg-[#132663] font-semibold text-action-text" : "border-edge-strong text-loaned"}`} key={item.value} onClick={() => setConditionStatus(item.value)} type="button">{item.label}</button>)}</div>
            <p className="text-[11px] text-faint">Em manutenção e fora de uso, o equipamento não aparece como disponível.</p>
          </fieldset>
          <label className="flex flex-col gap-2 text-xs text-loaned sm:col-span-2">Observações <span className="text-ghost">(opcional)</span><textarea className="min-h-[88px] resize-none rounded-lg border border-edge-strong bg-sunken px-3 py-2.5 text-[13px] text-copy placeholder:text-faint" maxLength={2000} onChange={(event) => setNotes(event.target.value)} placeholder="Informações adicionais" value={notes} /></label>
          {createEquipment.error && <p className="text-sm text-overdue sm:col-span-2" role="alert">{createEquipment.error.message}</p>}
          {successMessage && <p className="text-sm text-available sm:col-span-2" role="status">{successMessage}</p>}
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button className="h-10 rounded-lg border border-action px-5 text-[13px] font-semibold text-action-text disabled:opacity-45" disabled={createEquipment.isPending} type="submit">{createEquipment.isPending ? "Cadastrando…" : "Cadastrar"}</button>
            <button className="h-10 rounded-lg border border-edge-strong px-4 text-[13px] text-loaned" onClick={() => { setName(""); setAssetTag(""); setSerialNumber(""); setLocation(""); setNotes(""); }} type="button">Limpar</button>
          </div>
        </form>
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-copy">Reativar equipamento fora de uso</h2>
          {overviewQuery.isPending ? <p className="text-xs text-muted">Carregando equipamentos…</p> : overviewQuery.error ? <p className="text-xs text-overdue" role="alert">{overviewQuery.error.message}</p> : unavailableEquipment.length === 0 ? <p className="text-xs text-muted">Não há equipamentos fora de uso para reativar.</p> : (
            <div className="flex flex-col divide-y divide-edge-row rounded-xl border border-edge-soft bg-sunken px-3">
              {unavailableEquipment.map((item) => <div className="flex items-center justify-between gap-3 py-3" key={item.id}><div className="min-w-0"><p className="truncate text-xs font-semibold text-copy">{item.name}</p><p className="text-[11px] text-faint">{item.assetTag}</p></div><button className="rounded-lg border border-action px-3 py-2 text-xs font-semibold text-action-text disabled:opacity-45" disabled={reactivateEquipment.isPending} onClick={() => { if (window.confirm(`Reativar ${item.name} como disponível?`)) reactivateEquipment.mutate({ equipmentId: item.id }); }} type="button">Reativar</button></div>)}
            </div>
          )}
          {reactivateEquipment.error && <p className="text-xs text-overdue" role="alert">{reactivateEquipment.error.message}</p>}
        </section>
      </section>
      <aside className="flex flex-col gap-5">
        <section className="flex flex-col gap-3"><h2 className="text-[15px] font-semibold text-copy">Prévia no catálogo</h2><EquipmentCard item={preview} /></section>
        <section className="flex flex-col gap-3">
          <h2 className="text-[15px] font-semibold text-copy">Equipamentos do tenant</h2>
          {overviewQuery.data?.equipment.length ? <div className="flex flex-col divide-y divide-edge-row rounded-xl border border-edge-soft bg-sunken px-3">{overviewQuery.data.equipment.slice(0, 5).map((item) => <p className="py-3 text-xs text-muted" key={item.id}>{item.name}<span className="float-right text-faint">{item.assetTag}</span></p>)}</div> : <p className="text-xs text-muted">Nenhum equipamento cadastrado.</p>}
        </section>
      </aside>
    </div>
  );
}
