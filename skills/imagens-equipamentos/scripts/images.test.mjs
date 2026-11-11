import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { afterEach, describe, expect, it, vi } from "vitest";
import equipment from "../equipment.json" with { type: "json" };
import {
  assertCandidateCanBeReplaced,
  downloadCandidate,
  getPixabaySearchResults,
  isUsablePixabayHit,
  runDownload,
  searchPixabay,
  selectPixabayHit,
} from "./download.mjs";
import { labelSvg } from "./contact-sheet.mjs";
import { readFreshSearchCache, reservePixabayRequest, writeSearchCache } from "./common.mjs";
import {
  assertAllImagesApproved,
  isLocalSupabaseUrl,
  validateUploadInputs,
} from "./upload.mjs";

const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("skill imagens-equipamentos", () => {
  it("[IMG-CA-01] mantém os 12 equipamentos, categorias e consultas Pixabay", () => {
    expect(equipment).toHaveLength(12);
    expect(equipment.filter((item) => item.category === "notebook")).toHaveLength(4);
    expect(equipment.filter((item) => item.category === "monitor")).toHaveLength(3);
    expect(equipment.filter((item) => item.category === "cabo")).toHaveLength(3);
    expect(equipment.filter((item) => item.category === "camera")).toHaveLength(2);
    expect(equipment.every((item) => item.query.trim().length > 0)).toBe(true);
    expect(equipment.find((item) => item.assetTag === "TI-0010")?.conditionStatus).toBe("AVAILABLE");
  });

  it("[IMG-CA-11] exige chave sem revelar valor quando ela está ausente", async () => {
    await expect(runDownload({ assetTag: "TI-0001", env: {} }))
      .rejects.toThrow("Configure PIXABAY_API_KEY no ambiente local.");
  });

  it("[IMG-CA-13] documenta a chave no exemplo sem valor e ignora ambientes locais", async () => {
    const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
    const example = await readFile(path.join(repositoryRoot, ".env.example"), "utf8");
    const gitignore = await readFile(path.join(repositoryRoot, ".gitignore"), "utf8");
    expect(example).toMatch(/^PIXABAY_API_KEY=$/m);
    expect(gitignore).toMatch(/^\.env\*/m);
  });

  it("[IMG-CA-08] exige um patrimônio antes de consultar Pixabay", async () => {
    const fetchImpl = vi.fn();
    await expect(runDownload({ env: { PIXABAY_API_KEY: "local-key" }, fetchImpl }))
      .rejects.toThrow("Informe um patrimônio para buscar uma imagem por vez.");
    await expect(runDownload({ assetTag: "TI-9999", env: { PIXABAY_API_KEY: "local-key" }, fetchImpl }))
      .rejects.toThrow("Patrimônio não encontrado: TI-9999");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("[IMG-CA-02] aceita somente hits Pixabay seguros, atribuíveis e de hosts válidos", () => {
    const hit = {
      id: 123,
      user: "Photographer",
      pageURL: "https://pixabay.com/photos/computer-device-123/",
      largeImageURL: "https://pixabay.com/get/abc_1280.jpg",
      tags: "computer, device",
    };
    expect(isUsablePixabayHit(hit)).toBe(true);
    expect(isUsablePixabayHit({ ...hit, tags: "computer, people" })).toBe(false);
    expect(isUsablePixabayHit({ ...hit, largeImageURL: "https://example.com/image.jpg" })).toBe(false);
    expect(() => selectPixabayHit([], undefined)).toThrow(/Nenhum resultado Pixabay utilizável/);
  });

  it("[IMG-CA-02] consulta a API oficial Pixabay com filtro de foto e safe search", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ hits: [] }),
    });
    await searchPixabay("laptop on white desk", "local-test-key", fetchImpl, vi.fn());
    const requestUrl = new URL(fetchImpl.mock.calls[0][0]);
    expect(requestUrl.origin + requestUrl.pathname).toBe("https://pixabay.com/api/");
    expect(requestUrl.searchParams.get("q")).toBe("laptop on white desk");
    expect(requestUrl.searchParams.get("image_type")).toBe("photo");
    expect(requestUrl.searchParams.get("safesearch")).toBe("true");
    expect(requestUrl.searchParams.get("lang")).toBe("en");
  });

  it("[IMG-CA-02] não inclui chave nos erros de transporte da API", async () => {
    await expect(searchPixabay("webcam", "sensitive-test-key", vi.fn().mockRejectedValue(
      new Error("failed https://pixabay.com/api/?key=sensitive-test-key"),
    ), vi.fn())).rejects.toThrow("Falha de comunicação com a API Pixabay.");
  });

  it("[IMG-CA-12] trata HTTP 429 sem revelar a chave e informa o tempo de espera", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers({ "X-RateLimit-Reset": "17" }),
    });
    await expect(searchPixabay("webcam", "sensitive-test-key", fetchImpl, vi.fn()))
      .rejects.toThrow("A API Pixabay retornou HTTP 429. Aguarde 17 segundos antes de tentar novamente.");
  });

  it("[IMG-CA-12] reserva chamadas com intervalo e estado persistidos", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "empresTI-pixabay-limit-"));
    temporaryDirectories.push(tempDir);
    let currentTime = 10_000;
    const now = () => currentTime;
    const sleep = async (delay) => { currentTime += delay; };
    const [first, second] = await Promise.all([
      reservePixabayRequest({ baseDir: tempDir, now, sleep }),
      reservePixabayRequest({ baseDir: tempDir, now, sleep }),
    ]);
    const state = JSON.parse(await readFile(path.join(tempDir, "pixabay-rate-limit.json"), "utf8"));
    const [earlier, later] = [first, second].sort((a, b) => a - b);
    expect(later - earlier).toBeGreaterThanOrEqual(1_100);
    expect(state.nextAllowedAt).toBe(later + 1_100);
    await expect(readFile(path.join(tempDir, "pixabay-rate-limit.lock")))
      .rejects.toMatchObject({ code: "ENOENT" });
  });

  it("[IMG-CA-10] identifica Pixabay e o fotógrafo na legenda da folha de contato", () => {
    const label = labelSvg("TI-0001", "pending", "Foto & Autor").toString();
    expect(label).toContain("Pixabay · Foto &amp; Autor");
  });

  it("[IMG-CA-02][IMG-CA-09] reutiliza o cache por 24 horas e consulta a API após expirar", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "empresTI-pixabay-cache-"));
    temporaryDirectories.push(tempDir);
    const now = 1_800_000_000_000;
    const result = { hits: [{ id: 1 }] };
    await writeSearchCache("laptop", result, now, tempDir);
    expect(await readFreshSearchCache("laptop", now + 86_399_999, tempDir)).toEqual(result);
    expect(await readFreshSearchCache("laptop", now + 86_400_000, tempDir)).toBeNull();
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, json: async () => result });
    const reserveRequest = vi.fn();
    const fresh = await getPixabaySearchResults(
      "laptop", "local-test-key", fetchImpl, tempDir, now + 86_400_000, reserveRequest,
    );
    expect(fresh.fromCache).toBe(false);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(reserveRequest).toHaveBeenCalledTimes(1);
    const cached = await getPixabaySearchResults(
      "laptop", "local-test-key", fetchImpl, tempDir, now + 86_400_001, reserveRequest,
    );
    expect(cached.fromCache).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("[IMG-CA-03] redimensiona a imagem para exatamente 800x600", async () => {
    const tempDir = await mkdtemp(path.join(os.tmpdir(), "empresTI-images-"));
    temporaryDirectories.push(tempDir);
    const input = await sharp({
      create: { width: 120, height: 80, channels: 3, background: "#336699" },
    }).jpeg().toBuffer();
    const output = await downloadCandidate({
      equipment: { assetTag: "TI-TESTE" },
      hit: { largeImageURL: "https://pixabay.com/get/test_1280.jpg" },
      targetDir: tempDir,
      fetchImpl: vi.fn().mockResolvedValue({
        ok: true,
        headers: new Headers({ "content-type": "image/jpeg" }),
        arrayBuffer: async () => input,
      }),
    });
    const metadata = await sharp(await readFile(output.filePath)).metadata();
    expect(metadata.width).toBe(800);
    expect(metadata.height).toBe(600);
    expect(output.width).toBe(800);
    expect(output.height).toBe(600);
  });

  it("[IMG-CA-07] permite somente Supabase local e recusa URL remota antes do cliente", async () => {
    expect(isLocalSupabaseUrl("http://localhost:54321")).toBe(true);
    expect(isLocalSupabaseUrl("http://[::1]:54321")).toBe(true);
    expect(isLocalSupabaseUrl("https://project.supabase.co")).toBe(false);
    const clientFactory = vi.fn();
    await expect(validateUploadInputs({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "not-a-real-key",
        SUPABASE_STORAGE_BUCKET: "equipment-images",
      },
      clientFactory,
    })).rejects.toThrow(/deve apontar/);
    expect(clientFactory).not.toHaveBeenCalled();
  });

  it("[IMG-CA-06] recusa bucket ausente ou privado sem ocultar erro", async () => {
    const clientFactory = vi.fn().mockReturnValue({
      storage: { getBucket: vi.fn().mockResolvedValue({ data: { public: false }, error: null }) },
    });
    await expect(validateUploadInputs({
      env: {
        NEXT_PUBLIC_SUPABASE_URL: "http://localhost:54321",
        SUPABASE_SERVICE_ROLE_KEY: "local-key",
        SUPABASE_STORAGE_BUCKET: "equipment-images",
      },
      clientFactory,
    })).rejects.toThrow(/precisa existir e ser público/);
  });

  it("[IMG-CA-04] impede upload enquanto qualquer imagem estiver pendente ou rejeitada", () => {
    const items = [{ assetTag: "TI-0001" }, { assetTag: "TI-0002" }];
    const approvedEntry = {
      reviewStatus: "approved",
      reviewedPhotoId: 123,
      photoId: 123,
      width: 800,
      height: 600,
      photographer: "Photographer",
      sourceUrl: "https://pixabay.com/photos/device-123/",
    };
    expect(() => assertAllImagesApproved(items, {
      items: { "TI-0001": approvedEntry, "TI-0002": { ...approvedEntry, reviewStatus: "pending" } },
    })).toThrow(/revisar TI-0002/);
  });

  it("[IMG-CA-05] permite substituir rejeitada e nunca sobrescreve aprovada/publicada", () => {
    expect(() => assertCandidateCanBeReplaced({ reviewStatus: "rejected" }, "TI-0001")).not.toThrow();
    expect(() => assertCandidateCanBeReplaced({ reviewStatus: "approved" }, "TI-0001"))
      .toThrow(/não será sobrescrito/);
    expect(() => assertCandidateCanBeReplaced({ publicUrl: "http://localhost/image.jpg" }, "TI-0001"))
      .toThrow(/não será sobrescrito/);
  });
});
