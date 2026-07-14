import "server-only";

import { createHash } from "node:crypto";

import {
  correctionFeedHash as embeddedCorrectionFeedHash,
  currentReleaseId as embeddedCurrentReleaseId,
  getArtifact as getEmbeddedArtifact,
  getCorrections as getEmbeddedCorrections,
  getCoverage as getEmbeddedCoverage,
  getReleaseManifest as getEmbeddedManifest,
  getReleaseRecords as getEmbeddedRecords,
  getRevisions as getEmbeddedRevisions,
  getSources as getEmbeddedSources,
  listReleases as listEmbeddedReleases,
  releaseIndexHash as embeddedReleaseIndexHash,
} from "./contract";
import type { CoverageReport, PublicRecord, ReleaseManifest, SourceManifestEntry } from "./contract";
import { getProductionReleaseTransport } from "./production-transport";

export type { CoverageReport, PublicRecord, ReleaseManifest, SourceManifestEntry } from "./contract";

function sha256(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function parse<T>(bytes: Buffer, name: string): T {
  try { return JSON.parse(bytes.toString("utf8")) as T; }
  catch { throw new Error(`Production release transport rejected malformed ${name}`); }
}

export async function listReleases() {
  const transport = await getProductionReleaseTransport();
  if (!transport) return listEmbeddedReleases();
  const { index, manifest } = await transport.manifest();
  return [{
    releaseId: index.releaseId,
    status: index.status,
    effectiveAt: manifest.effectiveAt,
    manifestHash: index.manifestHash,
    laneCounts: manifest.laneCounts,
    publicationEnabled: true,
  }];
}

export async function currentReleaseId() {
  const transport = await getProductionReleaseTransport();
  return transport ? (await transport.index()).releaseId : embeddedCurrentReleaseId();
}

export async function getReleaseManifest(releaseId: string): Promise<ReleaseManifest> {
  const transport = await getProductionReleaseTransport();
  if (!transport) return getEmbeddedManifest(releaseId);
  const result = await transport.manifest();
  if (result.index.releaseId !== releaseId) throw new Error("Unknown production release");
  return result.manifest;
}

export async function getReleaseRecords(releaseId: string, lane: "latest_source_attributed" | "verified") {
  const transport = await getProductionReleaseTransport();
  if (!transport) return getEmbeddedRecords(releaseId, lane);
  if ((await transport.index()).releaseId !== releaseId) throw new Error("Unknown production release");
  const name = lane === "verified" ? "records-verified.json" : "records-latest-source-attributed.json";
  const artifact = await transport.verifiedArtifact(name);
  const result = parse<{ schemaVersion: string; releaseId: string; records: PublicRecord[] }>(artifact.bytes, name);
  if (result.releaseId !== releaseId || result.records.some((record) => record.sampleData || !record.visibilityEligible || (lane === "verified" && !record.verifiedLaneEligible))) throw new Error("Unsafe production release membership");
  return result;
}

export async function getCoverage(releaseId?: string): Promise<CoverageReport> {
  const transport = await getProductionReleaseTransport();
  if (!transport) return getEmbeddedCoverage(releaseId);
  const current = await transport.index();
  if (releaseId && current.releaseId !== releaseId) throw new Error("Unknown production release");
  return parse((await transport.verifiedArtifact("coverage.json")).bytes, "coverage.json");
}

export async function getSources(releaseId?: string) {
  const transport = await getProductionReleaseTransport();
  if (!transport) return getEmbeddedSources(releaseId);
  const current = await transport.index();
  if (releaseId && current.releaseId !== releaseId) throw new Error("Unknown production release");
  return parse<{ schemaVersion: string; releaseId: string; sources: SourceManifestEntry[] }>((await transport.verifiedArtifact("sources.json")).bytes, "sources.json");
}

export async function getRevisions(releaseId?: string) {
  const transport = await getProductionReleaseTransport();
  if (!transport) return getEmbeddedRevisions(releaseId);
  const current = await transport.index();
  if (releaseId && current.releaseId !== releaseId) throw new Error("Unknown production release");
  return parse<{ releaseId: string; revisions: Array<Record<string, unknown>> }>((await transport.verifiedArtifact("revisions.json")).bytes, "revisions.json");
}

export async function getCorrections({ after, limit = 100 }: { after?: string | null; limit?: number } = {}) {
  const transport = await getProductionReleaseTransport();
  if (!transport) return getEmbeddedCorrections({ after, limit });
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) throw new Error("Invalid correction limit");
  if (after && !/^\d{12}$/.test(after)) throw new Error("Invalid correction cursor");
  const artifact = await transport.verifiedArtifact("corrections.json");
  const feed = parse<{ schemaVersion: string; releaseId: string; corrections: Array<{ feedCursor: string } & Record<string, unknown>> }>(artifact.bytes, "corrections.json");
  const corrections = feed.corrections.filter((entry) => !after || entry.feedCursor > after).slice(0, limit);
  return { ...feed, corrections, nextCursor: corrections.length === limit ? corrections.at(-1)?.feedCursor ?? null : null };
}

export async function getArtifact(releaseId: string, name: string) {
  const transport = await getProductionReleaseTransport();
  if (!transport) return getEmbeddedArtifact(releaseId, name);
  if ((await transport.index()).releaseId !== releaseId) throw new Error("Unknown production release");
  return transport.verifiedArtifact(name);
}

export async function releaseIndexHash() {
  const transport = await getProductionReleaseTransport();
  if (!transport) return embeddedReleaseIndexHash();
  return sha256(JSON.stringify(await listReleases()));
}

export async function correctionFeedHash({ after, limit }: { after: string | null; limit: number }) {
  const transport = await getProductionReleaseTransport();
  if (!transport) return embeddedCorrectionFeedHash({ after, limit });
  const artifact = await transport.verifiedArtifact("corrections.json");
  return sha256(Buffer.concat([artifact.bytes, Buffer.from(`\n${JSON.stringify({ after, limit })}`)]));
}
