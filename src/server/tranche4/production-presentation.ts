import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import type { Tranche4Observation } from "./candidate-contract";
import type { Tranche4PreviewModel } from "./preview-model";

const assetRoot = "release11-presentation";
const expectedBinding = {
  releaseInputSetHash: "e0466b671f316b7642db9409f243630c8149f8f064b55dd641b5da9f05aa9686",
  candidateId: "set1-candidate:8:4a293cead8f3d491c723",
  candidateManifestHash: "3afdae1fcd8dc76d0e54d75e256979ac8cf55e37eab414351786bb08abc0ecaf",
  observationCount: 1402
} as const;

type PresentationEnvelope<T> = { binding: typeof expectedBinding; payload: T };
type PresentationIndex = {
  binding: typeof expectedBinding;
  pageSize: number;
  pages: Array<{ page: number; path: string; start: number; end: number }>;
};
type SearchEntry = { index: number; search: string };

const cache = new Map<string, Promise<unknown>>();

function safePath(path: string) {
  if (!/^[A-Za-z0-9%._/-]+$/.test(path) || path.includes("..") || path.startsWith("/")) {
    throw new Error("Release 11 presentation rejected: unsafe asset path");
  }
  return path;
}

function validateBinding(binding: typeof expectedBinding) {
  for (const [key, value] of Object.entries(expectedBinding)) {
    if (binding?.[key as keyof typeof expectedBinding] !== value) {
      throw new Error(`Release 11 presentation rejected: ${key} mismatch`);
    }
  }
}

async function assetBytes(path: string) {
  const safe = safePath(path);
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(new Request(`https://assets.local/${assetRoot}/${safe}`));
      if (!response.ok) throw new Error(`asset returned ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    }
  } catch (error) {
    if (process.env.RELEASE_TRANSPORT_MODE === "production") throw error;
  }

  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  return readFile(join(process.cwd(), "public", assetRoot, safe));
}

async function readJson<T>(path: string): Promise<T> {
  const existing = cache.get(path);
  if (existing) return existing as Promise<T>;
  const pending = assetBytes(path).then((bytes) => JSON.parse(bytes.toString("utf8")) as T);
  cache.set(path, pending);
  try {
    return await pending;
  } catch (error) {
    cache.delete(path);
    throw error;
  }
}

async function envelope<T>(path: string) {
  const value = await readJson<PresentationEnvelope<T>>(path);
  validateBinding(value.binding);
  return value.payload;
}

export async function getRelease11SummaryModel() {
  return envelope<Tranche4PreviewModel>("summary.json");
}

export async function getRelease11TrendsModel() {
  const summary = await getRelease11SummaryModel();
  const detail = await envelope<Pick<Tranche4PreviewModel, "histories" | "interimHistory">>("trends.json");
  return { ...summary, ...detail };
}

export async function getRelease11CompanyModel(entityKey: string) {
  if (!/^entity:company:[a-z0-9-]+$/.test(entityKey)) return null;
  const summary = await getRelease11SummaryModel();
  const detail = await envelope<Pick<Tranche4PreviewModel, "histories" | "interimHistory" | "observations">>(`companies/${encodeURIComponent(entityKey)}.json`);
  if (!summary.entities.some((entity) => entity.entityKey === entityKey)) return null;
  return { ...summary, ...detail };
}

export type Release11ObservationPage = {
  rows: Tranche4Observation[];
  total: number;
  matched: number;
  page: number;
  pageCount: number;
  query: string;
};

export async function getRelease11ObservationPage(page: number, query: string): Promise<Release11ObservationPage> {
  const index = await readJson<PresentationIndex>("index.json");
  validateBinding(index.binding);
  if (index.pageSize !== 50 || index.pages.length !== Math.ceil(expectedBinding.observationCount / 50)) {
    throw new Error("Release 11 presentation rejected: observation pagination mismatch");
  }

  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    const activePage = Math.min(Math.max(page, 1), index.pages.length);
    const descriptor = index.pages[activePage - 1];
    const rows = await envelope<Tranche4Observation[]>(descriptor.path);
    return { rows, total: expectedBinding.observationCount, matched: expectedBinding.observationCount, page: activePage, pageCount: index.pages.length, query };
  }

  const search = await envelope<SearchEntry[]>("observations/search-index.json");
  const matches = search.filter((entry) => entry.search.includes(normalizedQuery)).map((entry) => entry.index);
  const pageCount = Math.max(1, Math.ceil(matches.length / index.pageSize));
  const activePage = Math.min(Math.max(page, 1), pageCount);
  const selected = matches.slice((activePage - 1) * index.pageSize, activePage * index.pageSize);
  const grouped = new Map<number, number[]>();
  for (const observationIndex of selected) {
    const sourcePage = Math.floor(observationIndex / index.pageSize) + 1;
    grouped.set(sourcePage, [...(grouped.get(sourcePage) ?? []), observationIndex % index.pageSize]);
  }
  const rows: Tranche4Observation[] = [];
  for (const [sourcePage, offsets] of grouped) {
    const pageRows = await envelope<Tranche4Observation[]>(index.pages[sourcePage - 1].path);
    for (const offset of offsets) rows.push(pageRows[offset]);
  }
  return { rows, total: expectedBinding.observationCount, matched: matches.length, page: activePage, pageCount, query };
}
