import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { pathToFileURL } from "node:url";
import { generatedDir, imagesDir, readEquipment, readManifest } from "./common.mjs";

const columns = 4;
const tileWidth = 400;
const tileHeight = 300;
const labelHeight = 60;

export function labelSvg(text, status, photographer) {
  const safeText = `${text} · ${status}`.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  const safePhotographer = photographer.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  return Buffer.from(
    `<svg width="${tileWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#111827" fill-opacity=".85"/><text x="12" y="23" fill="white" font-size="16" font-family="Arial">${safeText}</text><text x="12" y="45" fill="white" font-size="12" font-family="Arial">Pixabay · ${safePhotographer}</text></svg>`,
  );
}

export async function createContactSheet() {
  const equipment = await readEquipment();
  const manifest = await readManifest();
  const composites = [];

  for (const [index, item] of equipment.entries()) {
    const entry = manifest.items[item.assetTag];
    if (!entry) {
      throw new Error(`Imagem ainda não gerada para ${item.assetTag}.`);
    }
    if (typeof entry.photographer !== "string" || !entry.photographer.trim()) {
      throw new Error(`Atribuição Pixabay ausente para ${item.assetTag}.`);
    }
    const filePath = path.join(imagesDir, `${item.assetTag}.jpg`);
    const image = await sharp(await readFile(filePath))
      .resize(tileWidth, tileHeight - labelHeight, { fit: "cover" })
      .jpeg()
      .toBuffer();
    const x = (index % columns) * tileWidth;
    const y = Math.floor(index / columns) * tileHeight;
    composites.push({ input: image, left: x, top: y });
    composites.push({
      input: labelSvg(item.assetTag, entry.reviewStatus, entry.photographer),
      left: x,
      top: y + tileHeight - labelHeight,
    });
  }

  await sharp({
    create: {
      width: columns * tileWidth,
      height: Math.ceil(equipment.length / columns) * tileHeight,
      channels: 3,
      background: "#d1d5db",
    },
  })
    .composite(composites)
    .jpeg({ quality: 88 })
    .toFile(path.join(generatedDir, "contact-sheet.jpg"));
  console.log("Folha de contato gerada em skills/imagens-equipamentos/generated/contact-sheet.jpg.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  createContactSheet().catch((error) => {
    console.error(`Falha ao gerar a folha de contato: ${error.message}`);
    process.exitCode = 1;
  });
}
