import path from "node:path";
import { pathToFileURL } from "node:url";
import { getEquipmentByTag, readEquipment, readManifest, writeManifest } from "./common.mjs";

export async function reviewImage(assetTag, reviewStatus) {
  if (!["approved", "rejected"].includes(reviewStatus)) {
    throw new Error("A revisão deve ser `approved` ou `rejected`.");
  }
  const equipment = await readEquipment();
  getEquipmentByTag(equipment, assetTag);
  const manifest = await readManifest();
  const item = manifest.items[assetTag];
  if (!item) {
    throw new Error(`Imagem candidata não encontrada para ${assetTag}.`);
  }
  if (item.publicUrl) {
    throw new Error(`A imagem ${assetTag} já foi publicada; não é possível alterar sua revisão.`);
  }
  item.reviewStatus = reviewStatus;
  item.reviewedAt = new Date().toISOString();
  item.reviewedPhotoId = item.photoId;
  if (reviewStatus === "rejected") {
    item.publicUrl = null;
  }
  await writeManifest(manifest);
}

async function main() {
  const [, , assetTag, status] = process.argv;
  if (!assetTag || !status) {
    throw new Error("Uso: node review.mjs <patrimonio> <approved|rejected>.");
  }
  await reviewImage(assetTag, status);
  console.log(`Revisão registrada para ${assetTag}.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Falha ao registrar revisão: ${error.message}`);
    process.exitCode = 1;
  });
}
