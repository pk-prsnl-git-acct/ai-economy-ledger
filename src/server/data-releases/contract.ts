import "server-only";

import { createHash } from "node:crypto";

import contract from "@/data/contracts/release/pr34_public_dataset_release_contract.json";
import releaseReport from "@/data/releases/pr34_release_candidate/release-candidate-report.json";
import embeddedArtifacts from "./generated/pr34-release-artifacts.json";

export const RELEASE_CONTRACT_VERSION = "public-dataset-release@34.0.0";
export const RECORD_SCHEMA_VERSION = "public-record@34.0.0";
export const RELEASE_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const INDEX_CACHE_CONTROL = "public, max-age=60, must-revalidate";

const releaseIdPattern = /^dataset-release:[1-9]\d*:[a-f0-9]{20}$/;
const allowedArtifactNames = new Set<string>(contract.requiredArtifacts);
const privateMaterial = /(?:authorization|cookie|service_role|signed_url|storage_key|revieweremail|private note|file:\/\/|\/users\/|\/private\/)/i;

export type PublicRecord = {
  stableRecordId: string;
  recordVersion: string;
  entity: { entityKey: string; displayName: string };
  metric: { metricKey: string; metricFamily: string; displayLabel: string };
  value: string;
  unit: string;
  period: string;
  trustState: "source_attributed_unverified" | "system_validated" | "human_verified";
  reviewRequired: boolean;
  verificationMethod: "source_attribution_pending_review" | "certified_system_validation" | "human_reviewed";
  conflictStatus: string;
  amendmentStatus: string;
  restatementStatus: string;
  disclosure: { code: string; label: string };
  visibilityEligible: boolean;
  verifiedLaneEligible: boolean;
  headlineEligible: boolean;
  publicationExecutionEligible: boolean;
  coverageStatus: string;
  sources: Array<{ sourceKey: string; sourceName: string; url: string; documentType: string; filingDate: string }>;
  sampleData: false;
  releaseId: string;
  contractVersion: string;
};

export type CoverageCell = {
  coverageCellId: string;
  entityKey: string;
  metricFamily: string;
  fiscalPeriod: string;
  sourceClass: string;
  coverageState: string;
  bestTrustState: string | null;
  stableRecordId: string | null;
  freshnessState: string;
  limitation: string | null;
};

export type CoverageReport = {
  expectedCellCount: number;
  applicableDenominator: number;
  coveredNumerator: number;
  coveragePercentage: string | null;
  denominatorLimitationReason: string | null;
  knownDenominatorLimitations: string[];
  countsByCoverageState: Record<string, number>;
  pendingReviewCount: number;
  lastEvaluatedAt: string;
  cells: CoverageCell[];
};

export type SourceManifestEntry = {
  sourceKey: string;
  sourceName: string;
  sourceFamily: string;
  jurisdiction: string;
  officialBaseUrl: string | null;
  sourceTier: string;
  redistributionStatus: string;
  releaseRecordCount: number;
  metricFamiliesCovered: string[];
  entitiesCovered: string[];
  knownLimitations: string[];
  sourceManifestVersion: string;
};

type ArtifactDescriptor = {
  name: string;
  mediaType: string;
  byteLength: number | null;
  rowCount: number | null;
  sha256: string | null;
  integrityBinding?: string;
};

export type ReleaseManifest = {
  releaseId: string;
  releaseSequence: number;
  releaseStatus: string;
  createdAt: string;
  effectiveAt: string;
  releaseContractVersion: string;
  recordSchemaVersion: string;
  coverageSchemaVersion: string;
  correctionFeedSchemaVersion: string;
  methodologyVersion: string;
  inputSetHash: string;
  artifacts: ArtifactDescriptor[];
  laneCounts: Record<string, number>;
  trustStateCounts: Record<string, number>;
  knownLimitations: string[];
  publicationEnabled: false;
};

type CandidateReport = typeof releaseReport;

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message: string): never {
  throw new Error(`PR34 release contract rejected: ${message}`);
}

function safeArtifactName(name: string) {
  if (!allowedArtifactNames.has(name) || name.includes("..") || name.includes("/") || name.includes("\\")) fail("unsafe artifact name");
  return name;
}

function readArtifactBytes(name: string) {
  const safeName = safeArtifactName(name) as keyof typeof embeddedArtifacts;
  const encoded = embeddedArtifacts[safeName];
  if (!encoded) fail("missing embedded artifact");
  return Buffer.from(encoded, "base64");
}

function parseJson<T>(name: string): T {
  try {
    return JSON.parse(readArtifactBytes(name).toString("utf8")) as T;
  } catch {
    return fail(`malformed JSON artifact ${name}`);
  }
}

function validatePublicMaterial(name: string, bytes: Buffer) {
  if (privateMaterial.test(bytes.toString("utf8"))) fail(`private material detected in ${name}`);
}

function validateReleaseBundle() {
  if (contract.contractVersion !== RELEASE_CONTRACT_VERSION) fail("contract version mismatch");
  if (contract.recordSchemaVersion !== RECORD_SCHEMA_VERSION) fail("record schema mismatch");
  if (contract.publicPolicyRecomputationAllowed !== false || contract.browserPrivateEngineAccessAllowed !== false) {
    fail("public policy boundary mismatch");
  }
  const manifestBytes = readArtifactBytes("manifest.json");
  if (sha256(manifestBytes) !== releaseReport.manifestHash) fail("manifest trust-root mismatch");
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as ReleaseManifest;
  if (!releaseIdPattern.test(manifest.releaseId) || manifest.releaseId !== releaseReport.releaseId) fail("release ID mismatch");
  if (manifest.releaseContractVersion !== contract.contractVersion || manifest.recordSchemaVersion !== contract.recordSchemaVersion) {
    fail("manifest contract mismatch");
  }
  if (manifest.publicationEnabled !== false) fail("candidate publication gate enabled");
  const requiredNames = [...contract.requiredArtifacts].sort();
  const directoryNames = Object.keys(embeddedArtifacts).sort();
  if (JSON.stringify(directoryNames) !== JSON.stringify(requiredNames)) fail("missing or extra artifacts");
  const descriptorNames = manifest.artifacts.map((entry) => entry.name).sort();
  if (JSON.stringify(descriptorNames) !== JSON.stringify(requiredNames)) fail("manifest artifact set mismatch");
  for (const name of requiredNames) {
    const bytes = readArtifactBytes(name);
    const expectedHash = releaseReport.artifactHashes[name as keyof CandidateReport["artifactHashes"]];
    if (!expectedHash || sha256(bytes) !== expectedHash) fail(`artifact hash mismatch: ${name}`);
    validatePublicMaterial(name, bytes);
    const descriptor = manifest.artifacts.find((entry) => entry.name === name);
    if (!descriptor) fail(`missing artifact descriptor: ${name}`);
    if (name !== "manifest.json" && descriptor.byteLength !== bytes.byteLength) fail(`artifact byte length mismatch: ${name}`);
    if (descriptor.sha256 && descriptor.sha256 !== expectedHash) fail(`descriptor hash mismatch: ${name}`);
  }
  const latest = parseJson<{ schemaVersion: string; releaseId: string; records: PublicRecord[] }>("records-latest-source-attributed.json");
  const verified = parseJson<{ schemaVersion: string; releaseId: string; records: PublicRecord[] }>("records-verified.json");
  for (const record of latest.records) {
    if (record.sampleData !== false || !record.visibilityEligible || record.contractVersion !== RECORD_SCHEMA_VERSION) fail("invalid public membership");
    if (record.trustState === "system_validated" && record.verificationMethod === "human_reviewed") fail("system validation presented as human verification");
  }
  if (verified.records.some((record) => !record.verifiedLaneEligible)) fail("verified lane exceeds private decision");
  return { manifest, latest, verified };
}

let validated: ReturnType<typeof validateReleaseBundle> | null = null;

function bundle() {
  validated ??= validateReleaseBundle();
  return validated;
}

export function listReleases() {
  const { manifest } = bundle();
  return [{
    releaseId: manifest.releaseId,
    status: manifest.releaseStatus,
    effectiveAt: manifest.effectiveAt,
    manifestHash: releaseReport.manifestHash,
    laneCounts: manifest.laneCounts,
    publicationEnabled: manifest.publicationEnabled
  }];
}

export function getReleaseManifest(releaseId: string) {
  assertKnownRelease(releaseId);
  return bundle().manifest;
}

export function getReleaseRecords(releaseId: string, lane: "latest_source_attributed" | "verified") {
  assertKnownRelease(releaseId);
  return lane === "verified" ? bundle().verified : bundle().latest;
}

export function getCoverage(releaseId = releaseReport.releaseId) {
  assertKnownRelease(releaseId);
  return parseJson<CoverageReport>("coverage.json");
}

export function getSources(releaseId = releaseReport.releaseId) {
  assertKnownRelease(releaseId);
  return parseJson<{ schemaVersion: string; releaseId: string; sources: SourceManifestEntry[] }>("sources.json");
}

export function getRevisions(releaseId = releaseReport.releaseId) {
  assertKnownRelease(releaseId);
  return parseJson<{ releaseId: string; revisions: Array<Record<string, unknown>> }>("revisions.json");
}

export function getCorrections({ after, limit = 100 }: { after?: string | null; limit?: number } = {}) {
  const feed = parseJson<{ schemaVersion: string; releaseId: string; corrections: Array<{ feedCursor: string } & Record<string, unknown>> }>("corrections.json");
  if (!Number.isInteger(limit) || limit < 1 || limit > 1000) fail("invalid correction limit");
  if (after && !/^\d{12}$/.test(after)) fail("invalid correction cursor");
  const entries = feed.corrections.filter((entry) => !after || entry.feedCursor > after).slice(0, limit);
  return { ...feed, corrections: entries, nextCursor: entries.length === limit ? entries.at(-1)?.feedCursor ?? null : null };
}

export function getArtifact(releaseId: string, name: string) {
  assertKnownRelease(releaseId);
  const manifest = bundle().manifest;
  const descriptor = manifest.artifacts.find((entry) => entry.name === safeArtifactName(name));
  if (!descriptor) fail("unknown artifact");
  return { bytes: readArtifactBytes(name), descriptor, hash: releaseReport.artifactHashes[name as keyof CandidateReport["artifactHashes"]] };
}

export function releaseIndexHash() {
  return sha256(JSON.stringify(listReleases()));
}

export function correctionFeedHash({ after, limit }: { after: string | null; limit: number }) {
  return sha256(Buffer.concat([
    readArtifactBytes("corrections.json"),
    Buffer.from(`\n${JSON.stringify({ after, limit })}`),
  ]));
}

export function currentReleaseId() {
  return releaseReport.releaseId;
}

export function assertKnownRelease(releaseId: string) {
  let decodedReleaseId: string;
  try {
    decodedReleaseId = decodeURIComponent(releaseId);
  } catch {
    return fail("unknown or unsafe release ID");
  }
  if (!releaseIdPattern.test(decodedReleaseId) || decodedReleaseId !== releaseReport.releaseId) fail("unknown or unsafe release ID");
}
