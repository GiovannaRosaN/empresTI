export type EquipmentStatus = "available" | "loaned" | "maintenance";
export type EquipmentCategory = "notebook" | "monitor" | "camera" | "peripheral" | "projector";
export type CatalogFilter = "all" | EquipmentCategory;

export type Equipment = {
  assetTag: string;
  name: string;
  category: EquipmentCategory;
  categoryLabel: string;
  location: string;
  status: EquipmentStatus;
  icon: string;
  holder?: string;
  dueDate?: string;
  note?: string;
  description: string;
};

export const equipment: Equipment[] = [
  { assetTag: "PAT-1042", name: 'MacBook Pro 14"', category: "notebook", categoryLabel: "Notebook · Apple", location: "Design", status: "loaned", icon: "ph-laptop", holder: "Marina Alves", dueDate: "29/set", description: "Notebook Apple para trabalho de design e edição." },
  { assetTag: "PAT-1188", name: "ThinkPad T14", category: "notebook", categoryLabel: "Notebook · Lenovo", location: "2º andar", status: "available", icon: "ph-laptop", description: "Notebook Lenovo para uso em projetos e trabalho híbrido." },
  { assetTag: "PAT-1190", name: "ThinkPad T14", category: "notebook", categoryLabel: "Notebook · Lenovo", location: "Engenharia", status: "loaned", icon: "ph-laptop", holder: "Bruno Kato", dueDate: "02/out", description: "Notebook Lenovo para desenvolvimento e uso diário." },
  { assetTag: "PAT-0871", name: "Dell UltraSharp 27\"", category: "monitor", categoryLabel: "Monitor · Dell", location: "2º andar", status: "available", icon: "ph-monitor", description: "Monitor de 27 polegadas para estação de trabalho." },
  { assetTag: "PAT-0910", name: "LG UltraFine 24\"", category: "monitor", categoryLabel: "Monitor · LG", location: "Assistência", status: "maintenance", icon: "ph-monitor", note: "Em avaliação técnica", description: "Monitor de 24 polegadas em avaliação técnica." },
  { assetTag: "PAT-0233", name: "Sony A7 III", category: "camera", categoryLabel: "Câmera · Sony", location: "2º andar", status: "available", icon: "ph-video-camera", description: "Câmera para captação de foto e vídeo institucional." },
  { assetTag: "PAT-0455", name: "Dock USB-C Anker", category: "peripheral", categoryLabel: "Dock · Anker", location: "Marketing", status: "loaned", icon: "ph-usb", holder: "Ana Sato", dueDate: "30/set", description: "Dock USB-C com conexões para periféricos e monitores." },
  { assetTag: "PAT-0338", name: "Adaptador HDMI Belkin", category: "peripheral", categoryLabel: "Adaptador · Belkin", location: "2º andar", status: "available", icon: "ph-usb", description: "Adaptador HDMI para conexão de equipamentos de vídeo." },
  { assetTag: "PAT-0102", name: "Projetor Epson X49", category: "projector", categoryLabel: "Projetor · Epson", location: "Sala multiuso", status: "maintenance", icon: "ph-projector-screen", note: "Aguardando peça", description: "Projetor para apresentações em salas e reuniões." },
  { assetTag: "PAT-1204", name: 'MacBook Air 13" M2', category: "notebook", categoryLabel: "Notebook · Apple", location: "2º andar", status: "available", icon: "ph-laptop", description: "Notebook Apple leve para trabalho móvel." },
];

export const myLoans = [
  { assetTag: "PAT-1042", name: 'MacBook Pro 14"', categoryLabel: "Notebook · Apple", dueDate: "29/set", daysUsed: 13, icon: "ph-laptop" },
  { assetTag: "PAT-0918", name: "Monitor Dell P2422H", categoryLabel: "Monitor · Dell", dueDate: "04/out", daysUsed: 8, icon: "ph-monitor" },
];

export const operationsLoans = [
  { person: "Camila Duarte", team: "Marketing", item: 'MacBook Air 13" M2', assetTag: "PAT-1204", checkout: "01/set", due: "15/set", status: "Atrasado", category: "Notebooks" },
  { person: "Tiago Menezes", team: "Suporte", item: "ThinkPad T14", assetTag: "PAT-1182", checkout: "02/set", due: "16/set", status: "Atrasado", category: "Notebooks" },
  { person: "Helena Prado", team: "Comercial", item: "Sony A7 III", assetTag: "PAT-0231", checkout: "04/set", due: "18/set", status: "Atrasado", category: "Câmeras" },
  { person: "Marina Alves", team: "Design", item: 'MacBook Pro 14"', assetTag: "PAT-1042", checkout: "15/set", due: "29/set", status: "No prazo", category: "Notebooks" },
  { person: "Bruno Kato", team: "Engenharia", item: "ThinkPad T14", assetTag: "PAT-1190", checkout: "18/set", due: "02/out", status: "No prazo", category: "Notebooks" },
  { person: "Ana Sato", team: "Financeiro", item: "Dock USB-C Anker", assetTag: "PAT-0455", checkout: "16/set", due: "30/set", status: "No prazo", category: "Periféricos" },
  { person: "Rafael Lima", team: "Engenharia", item: 'Dell UltraSharp 27"', assetTag: "PAT-0875", checkout: "20/set", due: "04/out", status: "No prazo", category: "Monitores" },
];

export function filterEquipment(items: Equipment[], query: string, filter: CatalogFilter, onlyAvailable = false) {
  const normalizedQuery = query.trim().toLocaleLowerCase("pt-BR");
  return items.filter((item) => {
    const matchesQuery = !normalizedQuery || `${item.name} ${item.assetTag} ${item.categoryLabel}`.toLocaleLowerCase("pt-BR").includes(normalizedQuery);
    const matchesCategory = filter === "all" || item.category === filter;
    const matchesAvailability = !onlyAvailable || item.status === "available";
    return matchesQuery && matchesCategory && matchesAvailability;
  });
}

export function statusLabel(status: EquipmentStatus) {
  return { available: "Disponível", loaned: "Emprestado", maintenance: "Manutenção" }[status];
}