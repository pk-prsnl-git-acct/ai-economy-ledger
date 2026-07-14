import "server-only";

import { createHash } from "node:crypto";

import {
  analyticsIndexHash as embeddedIndexHash,
  getAnalyticsArtifact as getEmbeddedArtifact,
  getAnalyticsManifest as getEmbeddedManifest,
  getCoverageHeatmap as getEmbeddedCoverage,
  getEconomicEventLedger as getEmbeddedLedger,
  getEntityProfiles as getEmbeddedProfiles,
  getRelationshipGraph as getEmbeddedRelationships,
  getTrustSplit as getEmbeddedTrust,
  getViewCatalog as getEmbeddedCatalog,
} from "./contract";
import type { AnalyticalRecord, ViewAvailability } from "./contract";
import { getProductionReleaseTransport } from "../data-releases/production-transport";
import { getReleaseRecords } from "../data-releases/runtime";

export type { AnalyticalRecord, ViewAvailability } from "./contract";

type AnalyticsManifest = {
  releaseId: string;
  releaseManifestHash: string;
  contractVersion: string;
  buildVersion: string;
  qualityReportHash: string;
  publicationEnabled: false;
  artifactNames: string[];
  descriptors: Array<{ name: string; byteLength: number; sha256: string }>;
  unsupportedMarketWideTotalGenerated: false;
};

function sha256(value: Buffer | string) {
  return createHash("sha256").update(value).digest("hex");
}

function parse<T>(bytes: Buffer, name: string): T {
  try { return JSON.parse(bytes.toString("utf8")) as T; }
  catch { throw new Error(`Production analytics rejected malformed ${name}`); }
}

async function liveManifest() {
  const transport = await getProductionReleaseTransport();
  if (!transport) return null;
  const [index, artifact] = await Promise.all([transport.index(), transport.artifact("analytics/analytics-manifest.json")]);
  const manifest = parse<AnalyticsManifest>(artifact.bytes, "analytics-manifest.json");
  if (manifest.releaseId !== index.releaseId || manifest.releaseManifestHash !== index.manifestHash || manifest.qualityReportHash !== index.qualityReportHash || artifact.hash !== index.analyticsManifestHash) throw new Error("Production analytics binding rejected");
  if (manifest.contractVersion !== "market-intelligence@37.0.0" || manifest.buildVersion !== "analytical-build@37.0.0" || manifest.publicationEnabled || manifest.unsupportedMarketWideTotalGenerated) throw new Error("Production analytics contract rejected");
  if (new Set(manifest.artifactNames).size !== manifest.artifactNames.length || !manifest.artifactNames.includes("analytics-manifest.json")) throw new Error("Production analytics artifact set rejected");
  return { transport, manifest, artifact };
}

async function liveArtifact(name: string) {
  const live = await liveManifest();
  if (!live) return null;
  if (!/^[a-z0-9][a-z0-9-]*\.json$/.test(name) || !live.manifest.artifactNames.includes(name)) throw new Error("Unknown production analytics artifact");
  if (name === "analytics-manifest.json") return { name, bytes: live.artifact.bytes, hash: live.artifact.hash, mediaType: live.artifact.mediaType };
  const artifact = await live.transport.artifact(`analytics/${name}`);
  const descriptor = live.manifest.descriptors.find((item) => item.name === name);
  if (!descriptor || descriptor.byteLength !== artifact.bytes.byteLength || descriptor.sha256 !== artifact.hash) throw new Error("Production analytics artifact integrity rejected");
  return { name, bytes: artifact.bytes, hash: artifact.hash, mediaType: artifact.mediaType };
}

export async function getAnalyticsManifest() {
  return (await liveManifest())?.manifest ?? getEmbeddedManifest();
}

export async function getViewCatalog() {
  const artifact = await liveArtifact("view-catalog.json");
  return artifact ? parse<{ releaseId: string; views: ViewAvailability[] }>(artifact.bytes, artifact.name) : getEmbeddedCatalog();
}

export async function getEconomicEventLedger() {
  const artifact = await liveArtifact("economic-event-ledger.json");
  if (!artifact) return getEmbeddedLedger();
  const ledger = parse<{ releaseId: string; headlineEligible: boolean; records: Omit<AnalyticalRecord, "metricLabel">[] }>(artifact.bytes, artifact.name);
  const releaseRecords = (await getReleaseRecords(ledger.releaseId, "latest_source_attributed")).records;
  return {
    ...ledger,
    records: ledger.records.map((record) => {
      const component = record.componentRecordRefs[0];
      const match = releaseRecords.find((candidate) => `${candidate.stableRecordId}@${candidate.recordVersion}` === component);
      if (!match) throw new Error(`Production analytics missing exact release component: ${component}`);
      return { ...record, metricLabel: match.metric.displayLabel };
    }),
  };
}

export async function getEntityProfiles() {
  const artifact = await liveArtifact("entity-profiles.json");
  return artifact ? parse<{ releaseId: string; entities: Array<{ entity: { entityKey: string; displayName: string }; recordCount: number; truthClassCounts: Record<string, number>; limitation: string }> }>(artifact.bytes, artifact.name) : getEmbeddedProfiles();
}

export async function getCoverageHeatmap() {
  const artifact = await liveArtifact("coverage-freshness-heatmap.json");
  return artifact ? parse<{ releaseId: string; summary: { expected: number; covered: number; percentage: string | null; limitations: string[] }; cells: Array<Record<string, unknown>> }>(artifact.bytes, artifact.name) : getEmbeddedCoverage();
}

export async function getRelationshipGraph() {
  const artifact = await liveArtifact("relationship-graph.json");
  return artifact ? parse<{ releaseId: string; availability: ViewAvailability; points: [] }>(artifact.bytes, artifact.name) : getEmbeddedRelationships();
}

export async function getTrustSplit() {
  const artifact = await liveArtifact("ai-relevance-trust-split.json");
  return artifact ? parse<{ releaseId: string; groups: Array<{ aiRelevance: string; trustState: string; recordCount: number; value: null; truthClass: "unavailable"; reason: string }> }>(artifact.bytes, artifact.name) : getEmbeddedTrust();
}

export async function getAnalyticsArtifact(name: string) {
  return (await liveArtifact(name)) ?? getEmbeddedArtifact(name);
}

export async function analyticsIndexHash() {
  const live = await liveManifest();
  if (!live) return embeddedIndexHash();
  return sha256(JSON.stringify({ manifestHash: live.artifact.hash, views: (await getViewCatalog()).views }));
}
