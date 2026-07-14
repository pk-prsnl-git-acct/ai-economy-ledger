import "server-only";

import { createHash } from "node:crypto";

import compatibility from "@/data/contracts/analytics/pr37_public_compatibility.json";
import contract from "@/data/contracts/analytics/pr37_market_intelligence_contract.json";
import { getReleaseRecords, listReleases } from "@/src/server/data-releases/contract";
import embeddedArtifacts from "./generated/pr37-analytics-artifacts.json";
import contractSource from "./generated/pr37-contract-source.json";

export const ANALYTICS_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const ANALYTICS_INDEX_CACHE_CONTROL = "public, max-age=60, must-revalidate";

const privateMaterial = /(?:authorization|cookie|service_role|signed_url|storage_key|revieweremail|private note|file:\/\/|\/users\/|\/private\/)/i;
const artifactNamePattern = /^[a-z0-9-]+\.json$/;

type AvailabilityState = typeof contract.availabilityStates[number];
type TruthClass = typeof contract.truthClasses[number];

export type ViewAvailability = {
  viewKey: string;
  viewVersion: number;
  availabilityState: AvailabilityState;
  reasonCodes: string[];
  minimumDataRequirements: Record<string, number>;
  actualInputCount: number;
  coverageState: { expectedDenominator: number; applicableDenominator: number; coveredNumerator: number; coveragePercentage: string | null; limitations: string[] };
  qualityState: { overallStatus: string; criticalBreachCount: number; insufficientSampleCount: number };
  lastEvaluatedRelease: string;
  methodologyVersion: string;
  methodologyStatus: string;
  definitionHash: string;
};

export type AnalyticalRecord = {
  resultId: string;
  releaseId: string;
  entityOrGroup: { entityKey: string; displayName: string };
  period: string;
  value: string;
  unit: string;
  metricLabel: string;
  truthClass: TruthClass;
  trustStateSummary: string;
  sourceCount: number;
  componentRecordRefs: string[];
  evidenceSafeRefs: string[];
  methodologyVersion: string;
  availabilityState: AvailabilityState;
  limitationCodes: string[];
};

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

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message: string): never {
  throw new Error(`PR37 analytics contract rejected: ${message}`);
}

function safeName(name: string) {
  let decoded: string;
  try { decoded = decodeURIComponent(name); } catch { return fail("unsafe artifact name"); }
  if (!artifactNamePattern.test(decoded) || decoded.includes("..") || decoded.includes("/") || decoded.includes("\\")) fail("unsafe artifact name");
  return decoded as keyof typeof embeddedArtifacts;
}

function readBytes(name: string) {
  const encoded = embeddedArtifacts[safeName(name)];
  if (!encoded) fail("unknown analytical artifact");
  return Buffer.from(encoded, "base64");
}

function json<T>(name: string): T {
  try { return JSON.parse(readBytes(name).toString("utf8")) as T; } catch { return fail(`malformed artifact: ${name}`); }
}

function validate() {
  const contractBytes = Buffer.from(contractSource.base64, "base64");
  if (sha256(contractBytes) !== compatibility.privateContractSourceByteHash) fail("private contract byte hash mismatch");
  if (contract.contractVersion !== compatibility.privateContractVersion || contract.buildVersion !== compatibility.analyticsBuildVersion) fail("contract version mismatch");
  if (contract.publicationEnabled || contract.browserPolicyRecomputationAllowed || compatibility.publicationEnabled || compatibility.browserPolicyRecomputationAllowed || compatibility.livePrivateTransportEnabled) fail("public authority boundary mismatch");
  const manifestBytes = readBytes("analytics-manifest.json");
  if (sha256(manifestBytes) !== compatibility.analyticsManifestSourceByteHash) fail("analytics manifest trust root mismatch");
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as AnalyticsManifest;
  if (manifest.contractVersion !== contract.contractVersion || manifest.buildVersion !== contract.buildVersion) fail("analytics version mismatch");
  if (manifest.releaseId !== compatibility.releaseId || manifest.releaseManifestHash !== compatibility.releaseManifestHash || manifest.qualityReportHash !== compatibility.qualityReportHash) fail("release or quality binding mismatch");
  const release = listReleases().find((candidate) => candidate.releaseId === manifest.releaseId);
  if (!release || release.manifestHash !== manifest.releaseManifestHash) fail("PR34 release trust root mismatch");
  if (manifest.publicationEnabled || manifest.unsupportedMarketWideTotalGenerated) fail("unsafe analytical publication claim");
  const names = Object.keys(embeddedArtifacts).sort();
  if (JSON.stringify(names) !== JSON.stringify([...manifest.artifactNames].sort())) fail("missing or extra analytical artifact");
  const checksums = json<{ algorithm: string; artifacts: Record<string, string> }>("analytics-checksums.json");
  for (const descriptor of manifest.descriptors) {
    const bytes = readBytes(descriptor.name);
    const checksumMatches = descriptor.name === "analytics-checksums.json" || checksums.artifacts[descriptor.name] === descriptor.sha256;
    if (bytes.byteLength !== descriptor.byteLength || sha256(bytes) !== descriptor.sha256 || !checksumMatches) fail(`artifact integrity mismatch: ${descriptor.name}`);
    if (privateMaterial.test(bytes.toString("utf8"))) fail(`private material detected: ${descriptor.name}`);
  }
  return manifest;
}

let validated: AnalyticsManifest | null = null;
function manifest() { return validated ??= validate(); }

export function getAnalyticsManifest() { return manifest(); }
export function getViewCatalog() { manifest(); return json<{ releaseId: string; views: ViewAvailability[] }>("view-catalog.json"); }
export function getEconomicEventLedger() {
  const current = manifest();
  const ledger = json<{ releaseId: string; headlineEligible: boolean; records: Omit<AnalyticalRecord, "metricLabel">[] }>("economic-event-ledger.json");
  const releaseRecords = getReleaseRecords(current.releaseId, "latest_source_attributed").records;
  return {
    ...ledger,
    records: ledger.records.map((record) => {
      const component = record.componentRecordRefs[0];
      const match = releaseRecords.find((candidate) => `${candidate.stableRecordId}@${candidate.recordVersion}` === component);
      if (!match) fail(`missing exact PR34 component binding: ${component}`);
      return { ...record, metricLabel: match.metric.displayLabel };
    }),
  };
}
export function getEntityProfiles() { manifest(); return json<{ releaseId: string; entities: Array<{ entity: { entityKey: string; displayName: string }; recordCount: number; truthClassCounts: Record<string, number>; limitation: string }> }>("entity-profiles.json"); }
export function getCoverageHeatmap() { manifest(); return json<{ releaseId: string; summary: { expected: number; covered: number; percentage: string | null; limitations: string[] }; cells: Array<Record<string, unknown>> }>("coverage-freshness-heatmap.json"); }
export function getRelationshipGraph() { manifest(); return json<{ releaseId: string; availability: ViewAvailability; points: [] }>("relationship-graph.json"); }
export function getTrustSplit() { manifest(); return json<{ releaseId: string; groups: Array<{ aiRelevance: string; trustState: string; recordCount: number; value: null; truthClass: "unavailable"; reason: string }> }>("ai-relevance-trust-split.json"); }

export function getAnalyticsArtifact(name: string) {
  const current = manifest();
  const safe = safeName(name);
  if (!current.artifactNames.includes(safe)) fail("unknown analytical artifact");
  const descriptor = current.descriptors.find((item) => item.name === safe);
  const hash = descriptor?.sha256 ?? compatibility.analyticsManifestSourceByteHash;
  return { name: safe, bytes: readBytes(safe), hash, mediaType: "application/json; charset=utf-8" };
}

export function analyticsIndexHash() {
  return sha256(JSON.stringify({ manifestHash: compatibility.analyticsManifestSourceByteHash, views: getViewCatalog().views }));
}
