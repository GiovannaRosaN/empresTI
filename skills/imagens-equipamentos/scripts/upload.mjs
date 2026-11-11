import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { generatedDir, imagesDir, readEquipment, readManifest, writeManifest } from "./common.mjs";

const localHosts = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

export function isLocalSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) &&
      !url.username &&
      !url.password &&
      localHosts.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export function assertAllImagesApproved(equipment, manifest) {
  for (const item of equipment) {
    const entry = manifest.items[item.assetTag];
    if (!entry || entry.reviewStatus !== "approved" || entry.reviewedPhotoId !== entry.photoId) {
      throw new Error(`Todos os itens devem estar aprovados para a foto atual; revisar ${item.assetTag}.`);
    }
    if (entry.width !== 800 || entry.height !== 600) {
      throw new Error(`Dimensões inválidas para ${item.assetTag}; esperado 800×600.`);
    }
    if (
      !Number.isInteger(entry.photoId) ||
      typeof entry.photographer !== "string" ||
      !entry.photographer.trim() ||
      typeof entry.sourceUrl !== "string" ||
      !entry.sourceUrl.trim()
    ) {
      throw new Error(`Metadados de atribuição ausentes para ${item.assetTag}.`);
    }
    let sourceUrl;
    try {
      sourceUrl = new URL(entry.sourceUrl);
    } catch {
      throw new Error(`URL de origem Pixabay inválida para ${item.assetTag}.`);
    }
    if (sourceUrl.protocol !== "https:" || sourceUrl.hostname.toLowerCase() !== "pixabay.com") {
      throw new Error(`URL de origem Pixabay inválida para ${item.assetTag}.`);
    }
  }
}

export async function validateUploadInputs({ env = process.env, clientFactory = createClient } = {}) {
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = env.SUPABASE_STORAGE_BUCKET;
  if (!supabaseUrl || !isLocalSupabaseUrl(supabaseUrl)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL deve apontar para localhost, 127.0.0.1 ou ::1.");
  }
  if (!serviceKey) {
    throw new Error("Configure SUPABASE_SERVICE_ROLE_KEY somente no ambiente local.");
  }
  if (!bucketName) {
    throw new Error("Configure SUPABASE_STORAGE_BUCKET para o bucket público local.");
  }

  const client = clientFactory(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: bucket, error } = await client.storage.getBucket(bucketName);
  if (error) {
    throw new Error(`Não foi possível validar o bucket de Storage: ${error.message}`);
  }
  if (bucket?.public !== true) {
    throw new Error(`O bucket ${bucketName} precisa existir e ser público.`);
  }
  return { client, bucketName, supabaseUrl };
}

export async function uploadApprovedImages({ env = process.env, clientFactory = createClient } = {}) {
  const equipment = await readEquipment();
  const manifest = await readManifest();
  assertAllImagesApproved(equipment, manifest);
  const preparedImages = [];
  for (const item of equipment) {
    const entry = manifest.items[item.assetTag];
    const filePath = path.join(imagesDir, `${item.assetTag}.jpg`);
    preparedImages.push({ item, entry, filePath, buffer: await readFile(filePath) });
  }

  const { client, bucketName } = await validateUploadInputs({ env, clientFactory });
  for (const { item, entry, filePath, buffer } of preparedImages) {
    const { error } = await client.storage.from(bucketName).upload(`${item.assetTag}.jpg`, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) {
      throw new Error(`Falha ao enviar ${item.assetTag}: ${error.message}`);
    }
    const { data } = client.storage.from(bucketName).getPublicUrl(`${item.assetTag}.jpg`);
    if (!data?.publicUrl || !isLocalSupabaseUrl(data.publicUrl)) {
      throw new Error(`A URL pública gerada para ${item.assetTag} não aponta ao Supabase local.`);
    }
    entry.publicUrl = data.publicUrl;
    entry.filePath = path.relative(generatedDir, filePath);
    await writeManifest(manifest);
    console.log(`URL pública gerada para ${item.assetTag}.`);
  }
}

async function main() {
  await uploadApprovedImages();
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(`Falha no upload de imagens: ${error.message}`);
    process.exitCode = 1;
  });
}
