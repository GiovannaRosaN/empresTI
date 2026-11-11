import { categoryIcon, categoryLabel, type EquipmentCategory, type EquipmentItem, type EquipmentStatus } from "@/data/equipment";

const legacyAvailableStates = new Set(["GOOD", "EXCELLENT", "AVAILABLE"]);

export function normalizeEquipmentCategory(value: string): EquipmentCategory {
  const category = value.trim().toLocaleLowerCase("pt-BR");

  if (category.includes("notebook") || category.includes("laptop")) return "notebook";
  if (category.includes("monitor")) return "monitor";
  if (category.includes("câmera") || category.includes("camera")) return "camera";
  if (category.includes("perif")) return "peripheral";
  if (category.includes("projetor") || category.includes("projector")) return "projector";
  if (category === "outro" || category === "other") return "other";

  return "other";
}

export function normalizeOperationalStatus(value: string): "AVAILABLE" | "MAINTENANCE" | "OUT_OF_SERVICE" {
  const status = value.toLocaleUpperCase("en-US");

  if (legacyAvailableStates.has(status)) return "AVAILABLE";
  if (status === "MAINTENANCE" || status === "OUT_OF_SERVICE") return status;

  throw new Error(`Unknown equipment operational status: ${value}`);
}

export function mapEquipmentStatus(
  operationalStatus: string,
  hasOpenLoan: boolean,
): EquipmentStatus {
  if (hasOpenLoan) return "loaned";
  const normalized = normalizeOperationalStatus(operationalStatus);

  if (normalized === "MAINTENANCE") return "maintenance";
  if (normalized === "OUT_OF_SERVICE") return "out_of_service";
  return "available";
}

export function toEquipmentItem(input: {
  id: string;
  assetTag: string;
  name: string;
  category: string;
  location: string | null;
  notes: string | null;
  conditionStatus: string;
  dueAt?: Date;
  hasOpenLoan: boolean;
}): EquipmentItem {
  const category = normalizeEquipmentCategory(input.category);
  const status = mapEquipmentStatus(input.conditionStatus, input.hasOpenLoan);

  return {
    id: input.id,
    assetTag: input.assetTag,
    name: input.name,
    category,
    categoryLabel: categoryLabel(category),
    location: input.location ?? "Local não informado",
    status,
    icon: categoryIcon(category),
    ...(input.dueAt ? { dueDate: new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "short",
    }).format(input.dueAt) } : {}),
    ...(status === "maintenance" ? { note: input.notes ?? "Em manutenção" } : {}),
    description: input.notes ?? "Sem descrição cadastrada.",
  };
}
