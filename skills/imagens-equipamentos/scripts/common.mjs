import { mkdir, open, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const skillDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const generatedDir = path.join(skillDir, "generated");
export const imagesDir = path.join(generatedDir, "images");
export const cacheDir = path.join(generatedDir, "cache");
export const equipmentPath = path.join(skillDir, "equipment.json");
export const manifestPath = path.join(generatedDir, "manifest.json");
export const searchCacheTtlMs = 24 * 60 * 60 * 1000;
const pixabayRequestIntervalMs = 1_100;

export async function reservePixabayRequest({
  baseDir = cacheDir,
  now = Date.now,
  sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay)),
} = {}) {
  await mkdir(baseDir, { recursive: true });
  const statePath = path.join(baseDir, "pixabay-rate-limit.json");
  const lockPath = path.join(baseDir, "pixabay-rate-limit.lock");
  const lockDeadline = Date.now() + 30_000;
  let lockHandle;

  while (!lockHandle) {
    try {
      lockHandle = await open(lockPath, "wx");
    } catch (error) {
      if (error?.code !== "EEXIST") {
        throw new Error("Não foi possível bloquear o limitador da API Pixabay.");
      }
      if (Date.now() >= lockDeadline) {
        throw new Error("Tempo esgotado aguardando o limitador da API Pixabay.");
      }
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }

  try {
    let nextAllowedAt = 0;
    try {
      const state = JSON.parse(await readFile(statePath, "utf8"));
      if (!Number.isFinite(state?.nextAllowedAt) || state.nextAllowedAt < 0) {
        throw new Error("Estado do limitador inválido.");
      }
      nextAllowedAt = state.nextAllowedAt;
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw new Error("Não foi possível ler o estado do limitador Pixabay.");
      }
    }

    const scheduledAt = Math.max(now(), nextAllowedAt);
    if (scheduledAt > now()) {
      await sleep(scheduledAt - now());
    }
    const reservedAt = Math.max(scheduledAt, now());
    await writeFile(statePath, `${JSON.stringify({ nextAllowedAt: reservedAt + pixabayRequestIntervalMs })}\n`, "utf8");
    return reservedAt;
  } catch (error) {
    if (error?.message === "Não foi possível ler o estado do limitador Pixabay.") {
      throw error;
    }
    throw new Error("Não foi possível reservar uma chamada à API Pixabay.");
  } finally {
    await lockHandle.close();
    await unlink(lockPath);
  }
}

export async function readEquipment() {
  const parsed = JSON.parse(await readFile(equipmentPath, "utf8"));
  if (!Array.isArray(parsed) || parsed.length !== 12) {
    throw new Error("equipment.json precisa conter exatamente 12 equipamentos.");
  }

  const tags = new Set();
  for (const item of parsed) {
    if (
      typeof item.assetTag !== "string" ||
      typeof item.name !== "string" ||
      typeof item.category !== "string" ||
      typeof item.conditionStatus !== "string" ||
      typeof item.query !== "string" ||
      !item.query.trim() ||
      tags.has(item.assetTag)
    ) {
      throw new Error("equipment.json contém campos inválidos ou patrimônios duplicados.");
    }
    tags.add(item.assetTag);
  }

  return parsed;
}

export async function readManifest() {
  try {
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    if (!manifest || typeof manifest.items !== "object" || Array.isArray(manifest.items)) {
      throw new Error("Formato de manifesto inválido.");
    }
    return manifest;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return { items: {} };
    }
    throw error;
  }
}

export async function writeManifest(manifest) {
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

export function searchCachePath(query, baseDir = cacheDir) {
  const cacheKey = createHash("sha256").update(query).digest("hex");
  return path.join(baseDir, `${cacheKey}.json`);
}

export async function readFreshSearchCache(query, now = Date.now(), baseDir = cacheDir) {
  try {
    const cache = JSON.parse(await readFile(searchCachePath(query, baseDir), "utf8"));
    if (
      typeof cache.cachedAt !== "number" ||
      !Array.isArray(cache.result?.hits) ||
      now - cache.cachedAt < 0 ||
      now - cache.cachedAt >= searchCacheTtlMs
    ) {
      return null;
    }
    return cache.result;
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeSearchCache(query, result, cachedAt = Date.now(), baseDir = cacheDir) {
  await mkdir(baseDir, { recursive: true });
  await writeFile(searchCachePath(query, baseDir), `${JSON.stringify({ cachedAt, result })}\n`, "utf8");
}

export function getEquipmentByTag(items, assetTag) {
  const item = items.find((candidate) => candidate.assetTag === assetTag);
  if (!item) {
    throw new Error(`Patrimônio não encontrado: ${assetTag}`);
  }
  return item;
}
