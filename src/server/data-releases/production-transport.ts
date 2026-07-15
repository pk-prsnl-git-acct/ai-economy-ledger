import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createHash } from "node:crypto";

import type { ReleaseManifest } from "./contract";

type FetchBinding = { fetch(request: Request): Promise<Response> };

type ProductionEnv = CloudflareEnv & {
  DATA_ENGINE?: FetchBinding;
  PUBLIC_RELEASE_TOKEN?: string;
  RELEASE_TRANSPORT_MODE?: string;
};

export type PublishedReleaseIndex = {
  releaseId: string;
  status: "published";
  manifestHash: string;
  qualityReportHash: string;
  analyticsManifestHash: string;
  latestSourceAttributedCount: number;
  verifiedCount: number;
  sampleRecordCount: 0;
  criticalBreachCount: 0;
  publicationEnabled: true;
  publishedAt: string;
};

export type ProductionArtifact = {
  name: string;
  bytes: Buffer;
  hash: string;
  mediaType: string;
  releaseId: string;
};

const releaseIdPattern = /^dataset-release:[1-9]\d*:[a-f0-9]{20}$/;
const artifactNamePattern = /^(?:[a-z0-9][a-z0-9-]*\.(?:json|csv|md)|analytics\/[a-z0-9][a-z0-9-]*\.json|quality\/report\.json)$/;
const privateMaterial = /(?:authorization|cookie|service_role|signed_url|storage_key|revieweremail|private note|file:\/\/|\/users\/|\/private\/)/i;

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function reject(message: string): never {
  throw new ProductionReleaseTransportError(message);
}

export class ProductionReleaseTransportError extends Error {
  readonly status = 503;
  constructor(message: string) { super(`Production release transport rejected: ${message}`); }
}

export function isProductionReleaseUnavailable(error: unknown) {
  return error instanceof ProductionReleaseTransportError
    && /private service returned 503|production bindings unavailable|Cloudflare context unavailable/i.test(error.message);
}

function validateIndex(value: unknown): PublishedReleaseIndex {
  const index = value as Partial<PublishedReleaseIndex>;
  if (!releaseIdPattern.test(index.releaseId ?? "") || index.status !== "published" || index.publicationEnabled !== true) reject("invalid published pointer");
  if (![index.manifestHash, index.qualityReportHash, index.analyticsManifestHash].every((value) => /^[a-f0-9]{64}$/.test(value ?? ""))) reject("invalid pointer hashes");
  if (index.sampleRecordCount !== 0 || index.criticalBreachCount !== 0 || !Number.isInteger(index.latestSourceAttributedCount) || (index.latestSourceAttributedCount ?? 0) < 1) reject("published pointer failed safety gates");
  if (!Number.isInteger(index.verifiedCount) || (index.verifiedCount ?? -1) < 0) reject("invalid verified count");
  return index as PublishedReleaseIndex;
}

export function createProductionReleaseTransport(binding: FetchBinding, token: string) {
  if (!binding || typeof binding.fetch !== "function" || !token) reject("missing service binding or read token");
  let indexCache: { expiresAt: number; value: PublishedReleaseIndex } | null = null;
  let manifestCache: { manifestHash: string; value: { index: PublishedReleaseIndex; manifest: ReleaseManifest; artifact: ProductionArtifact } } | null = null;

  async function request(path: string) {
    const response = await binding.fetch(new Request(`https://data-engine.internal/internal/release/${path}`, {
      headers: { authorization: `Bearer ${token}` },
    }));
    if (!response.ok) reject(`private service returned ${response.status}`);
    return response;
  }

  async function index() {
    if (indexCache && indexCache.expiresAt > Date.now()) return indexCache.value;
    const response = await request("index.json");
    const value = validateIndex(await response.json());
    indexCache = { expiresAt: Date.now() + 30_000, value };
    return value;
  }

  async function artifact(name: string): Promise<ProductionArtifact> {
    if (!artifactNamePattern.test(name) || name.includes("..")) reject("unsafe artifact name");
    const current = await index();
    const path = name.startsWith("analytics/") || name.startsWith("quality/") ? name : `release/${name}`;
    const response = await request(path);
    if (response.headers.get("x-release-id") !== current.releaseId) reject("release response pointer mismatch");
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = sha256(bytes);
    if (privateMaterial.test(bytes.toString("utf8"))) reject("private material detected");
    if (name === "manifest.json" && hash !== current.manifestHash) reject("manifest trust-root mismatch");
    if (name === "quality/report.json") {
      const quality = JSON.parse(bytes.toString("utf8")) as Record<string, unknown>;
      const reportHash = quality.reportHash;
      delete quality.reportHash;
      if (reportHash !== current.qualityReportHash || sha256(`${canonical(quality)}\n`) !== reportHash) reject("quality trust-root mismatch");
    }
    if (name === "analytics/analytics-manifest.json" && hash !== current.analyticsManifestHash) reject("analytics trust-root mismatch");
    return { name, bytes, hash, mediaType: response.headers.get("content-type") ?? "application/octet-stream", releaseId: current.releaseId };
  }

  async function manifest() {
    const current = await index();
    if (manifestCache?.manifestHash === current.manifestHash) return manifestCache.value;
    const artifactResult = await artifact("manifest.json");
    const value = JSON.parse(artifactResult.bytes.toString("utf8")) as ReleaseManifest;
    if (value.releaseId !== current.releaseId || value.releaseContractVersion !== "public-dataset-release@34.0.0" || value.recordSchemaVersion !== "public-record@34.0.0") reject("manifest contract mismatch");
    if (value.publicationEnabled !== false) reject("immutable candidate bytes changed publication policy");
    const names = value.artifacts.map((entry) => entry.name);
    if (new Set(names).size !== names.length || !names.includes("manifest.json")) reject("invalid manifest artifact set");
    const result = { index: current, manifest: value, artifact: artifactResult };
    manifestCache = { manifestHash: current.manifestHash, value: result };
    return result;
  }

  async function verifiedArtifact(name: string) {
    const { manifest: current } = await manifest();
    const descriptor = current.artifacts.find((entry) => entry.name === name);
    if (!descriptor) reject("artifact absent from manifest");
    const value = await artifact(name);
    if (descriptor.byteLength !== null && descriptor.byteLength !== value.bytes.byteLength) reject("artifact byte-length mismatch");
    if (descriptor.sha256 && descriptor.sha256 !== value.hash) reject("artifact hash mismatch");
    return { ...value, descriptor };
  }

  return Object.freeze({ index, manifest, artifact, verifiedArtifact });
}

export type ProductionReleaseTransport = ReturnType<typeof createProductionReleaseTransport>;

let transportPromise: Promise<ProductionReleaseTransport | null> | null = null;

async function resolveProductionReleaseTransport(): Promise<ProductionReleaseTransport | null> {
  let env: ProductionEnv | undefined;
  try {
    env = (await getCloudflareContext({ async: true })).env as ProductionEnv;
  } catch {
    if (process.env.RELEASE_TRANSPORT_MODE === "production") reject("Cloudflare context unavailable in production mode");
    return null;
  }
  const mode = env.RELEASE_TRANSPORT_MODE ?? process.env.RELEASE_TRANSPORT_MODE;
  if (mode !== "production") return null;
  if (!env.DATA_ENGINE || !env.PUBLIC_RELEASE_TOKEN) reject("production bindings unavailable");
  return createProductionReleaseTransport(env.DATA_ENGINE, env.PUBLIC_RELEASE_TOKEN);
}

export function getProductionReleaseTransport(): Promise<ProductionReleaseTransport | null> {
  transportPromise ??= resolveProductionReleaseTransport();
  return transportPromise;
}
