import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { config as loadDotenv } from "dotenv";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  getEquipmentByTag,
  cacheDir,
  imagesDir,
  readEquipment,
  readFreshSearchCache,
  readManifest,
  reservePixabayRequest,
  writeManifest,
  writeSearchCache,
} from "./common.mjs";

loadDotenv({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env.local"), quiet: true });

const peopleOrBrandTag = /\b(people|person|persons|man|woman|face|portrait|crowd|logo|brand|trademark)\b/i;

export function isUsablePixabayHit(hit) {
  if (
    !hit ||
    !Number.isInteger(hit.id) ||
    hit.id <= 0 ||
    typeof hit.user !== "string" ||
    !hit.user.trim() ||
    typeof hit.pageURL !== "string" ||
    typeof hit.largeImageURL !== "string" ||
    (typeof hit.tags === "string" && peopleOrBrandTag.test(hit.tags))
  ) {
    return false;
  }

  try {
    const page = new URL(hit.pageURL);
    const image = new URL(hit.largeImageURL);
    return page.protocol === "https:" &&
      page.hostname.toLowerCase() === "pixabay.com" &&
      image.protocol === "https:" &&
      image.hostname.toLowerCase() === "pixabay.com";
  } catch {
    return false;
  }
}

export function selectPixabayHit(hits, photoId) {
  if (!Array.isArray(hits)) {
    throw new Error("Resposta Pixabay inválida: campo hits ausente.");
  }
  const usable = hits.filter(isUsablePixabayHit);
  const selected = photoId === undefined
    ? usable[0]
    : usable.find((photo) => photo.id === photoId);
  if (!selected) {
    throw new Error(photoId === undefined
      ? "Nenhum resultado Pixabay utilizável para esta consulta."
      : `A imagem Pixabay ${photoId} não está entre os resultados utilizáveis.`);
  }
  return selected;
}

export function assertCandidateCanBeReplaced(manifestItem, assetTag) {
  if (manifestItem?.reviewStatus === "approved" || manifestItem?.publicUrl) {
    throw new Error(`${assetTag} já foi aprovado; não será sobrescrito.`);
  }
}

export async function downloadCandidate({ equipment, hit, fetchImpl = fetch, targetDir = imagesDir }) {
  const response = await fetchImpl(hit.largeImageURL);
  if (!response.ok) {
    throw new Error(`Falha ao baixar imagem Pixabay (HTTP ${response.status}).`);
  }
  if (!response.headers.get("content-type")?.toLowerCase().startsWith("image/")) {
    throw new Error("A URL de origem não retornou um tipo de conteúdo de imagem.");
  }

  const original = Buffer.from(await response.arrayBuffer());
  const output = await sharp(original)
    .resize(800, 600, { fit: "cover", position: "centre" })
    .jpeg({ quality: 88 })
    .toBuffer();
  const dimensions = await sharp(output).metadata();
  if (dimensions.width !== 800 || dimensions.height !== 600) {
    throw new Error("A imagem processada não tem dimensões 800×600.");
  }

  await mkdir(targetDir, { recursive: true });
  const filePath = path.join(targetDir, `${equipment.assetTag}.jpg`);
  await writeFile(filePath, output);
  return { filePath, width: dimensions.width, height: dimensions.height };
}

export async function searchPixabay(query, apiKey, fetchImpl = fetch, reserveRequest = reservePixabayRequest) {
  const endpoint = new URL("https://pixabay.com/api/");
  endpoint.searchParams.set("q", query);
  endpoint.searchParams.set("image_type", "photo");
  endpoint.searchParams.set("safesearch", "true");
  endpoint.searchParams.set("lang", "en");
  endpoint.searchParams.set("per_page", "20");
  endpoint.searchParams.set("key", apiKey);
  await reserveRequest();
  let response;
  try {
    response = await fetchImpl(endpoint);
  } catch {
    throw new Error("Falha de comunicação com a API Pixabay.");
  }
  if (!response.ok) {
    if (response.status === 429) {
      const reset = response.headers?.get("X-RateLimit-Reset");
      const wait = reset && Number.isFinite(Number(reset)) && Number(reset) > 0
        ? ` Aguarde ${Number(reset)} segundos antes de tentar novamente.`
        : "";
      throw new Error(`A API Pixabay retornou HTTP 429.${wait}`);
    }
    throw new Error(`A API Pixabay retornou HTTP ${response.status}.`);
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("A API Pixabay retornou JSON inválido.");
  }
  if (!Array.isArray(result?.hits)) {
    throw new Error("Resposta Pixabay inválida: campo hits ausente.");
  }
  return result;
}

export async function getPixabaySearchResults(
  query,
  apiKey,
  fetchImpl = fetch,
  cacheDirectory = cacheDir,
  now = Date.now(),
  reserveRequest = reservePixabayRequest,
) {
  const cached = await readFreshSearchCache(query, now, cacheDirectory);
  if (cached) {
    return { result: cached, fromCache: true };
  }
  const result = await searchPixabay(query, apiKey, fetchImpl, reserveRequest);
  await writeSearchCache(query, result, now, cacheDirectory);
  return { result, fromCache: false };
}

export async function runDownload({ assetTag, photoId, env = process.env, fetchImpl = fetch }) {
  if (!env.PIXABAY_API_KEY) {
    throw new Error("Configure PIXABAY_API_KEY no ambiente local.");
  }
  if (!assetTag) {
    throw new Error("Informe um patrimônio para buscar uma imagem por vez.");
  }
  const equipment = await readEquipment();
  const selectedEquipment = getEquipmentByTag(equipment, assetTag);
  const manifest = await readManifest();

  const prior = manifest.items[selectedEquipment.assetTag];
  assertCandidateCanBeReplaced(prior, selectedEquipment.assetTag);
  const { result, fromCache } = await getPixabaySearchResults(selectedEquipment.query, env.PIXABAY_API_KEY, fetchImpl);
  const hit = selectPixabayHit(result.hits, photoId);
  const output = await downloadCandidate({ equipment: selectedEquipment, hit, fetchImpl });
  manifest.items[selectedEquipment.assetTag] = {
    assetTag: selectedEquipment.assetTag,
    name: selectedEquipment.name,
    query: selectedEquipment.query,
    photoId: hit.id,
    photographer: hit.user,
    sourceUrl: hit.pageURL,
    pixabayUrl: hit.pageURL,
    originalWidth: hit.imageWidth,
    originalHeight: hit.imageHeight,
    width: output.width,
    height: output.height,
    filePath: path.relative(path.dirname(path.dirname(imagesDir)), output.filePath),
    reviewStatus: "pending",
    publicUrl: null,
  };
  await writeManifest(manifest);
  console.log(`Imagem candidata Pixabay gerada para ${selectedEquipment.assetTag}; revisão pendente${fromCache ? " (busca em cache)" : ""}.`);
}

async function main() {
  const args = process.argv.slice(2);
  const assetTag = args.find((arg) => !arg.startsWith("--"));
  const photoIdArg = args.find((arg) => arg.startsWith("--photo-id="));
  const photoId = photoIdArg ? Number(photoIdArg.slice("--photo-id=".length)) : undefined;
  if (photoIdArg && (!Number.isInteger(photoId) || photoId <= 0)) {
    throw new Error("--photo-id precisa ser um inteiro positivo.");
  }
  await runDownload({ assetTag, photoId });
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Falha no download de imagens: ${error.message}`);
    process.exitCode = 1;
  });
}

export const downloadScriptPath = fileURLToPath(import.meta.url);
