import { EquipmentDetail } from "@/components/equipment-detail";

export default async function EquipmentDetailPage({ params }: { params: Promise<{ patrimonio: string }> }) {
  const { patrimonio } = await params;
  return <EquipmentDetail assetTag={patrimonio} />;
}