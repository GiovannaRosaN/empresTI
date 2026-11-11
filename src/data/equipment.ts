export type EquipmentCategory = "notebook" | "monitor" | "camera" | "peripheral" | "projector" | "other";
export type EquipmentStatus = "available" | "loaned" | "maintenance" | "out_of_service";
export type OperationalStatus = "AVAILABLE" | "MAINTENANCE" | "OUT_OF_SERVICE";

export type EquipmentItem = {
  id: string;
  assetTag: string;
  name: string;
  category: EquipmentCategory;
  categoryLabel: string;
  location: string;
  status: EquipmentStatus;
  icon: string;
  dueDate?: string;
  note?: string;
  description: string;
};

export const equipmentCategories: { value: EquipmentCategory; label: string }[] = [
  { value: "notebook", label: "Notebook" },
  { value: "monitor", label: "Monitor" },
  { value: "camera", label: "Câmera" },
  { value: "peripheral", label: "Periférico" },
  { value: "projector", label: "Projetor" },
  { value: "other", label: "Outro" },
];

export function categoryLabel(category: EquipmentCategory) {
  return equipmentCategories.find((item) => item.value === category)?.label ?? "Outro";
}

export function categoryIcon(category: EquipmentCategory) {
  return {
    notebook: "ph-laptop",
    monitor: "ph-monitor",
    camera: "ph-video-camera",
    peripheral: "ph-usb",
    projector: "ph-projector-screen",
    other: "ph-package",
  }[category];
}

export function statusLabel(status: EquipmentStatus) {
  return {
    available: "Disponível",
    loaned: "Emprestado",
    maintenance: "Manutenção",
    out_of_service: "Fora de uso",
  }[status];
}
