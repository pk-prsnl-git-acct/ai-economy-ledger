import "server-only";

import { createHash } from "node:crypto";

import compositionReport from "@/data/reports/tranche-4-candidate-composition-report.json";
import analyticsReport from "@/data/reports/tranche-4-candidate-analytics-report.json";
import { listReleases } from "@/src/server/data-releases/contract";
import analyticsArtifacts from "./generated/set1-candidate-analytics-artifacts.json";
import compatibilitySource from "./generated/set1-candidate-compatibility-source.json";
import releaseArtifacts from "./generated/set1-candidate-release-artifacts.json";

export const TRANCHE4_CANDIDATE_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const TRANCHE4_CANDIDATE_INDEX_CACHE_CONTROL = "public, max-age=60, must-revalidate";

const privateMaterial = /(?:authorization|cookie|service_role|signed_url|storage_key|revieweremail|private note|file:\/\/|\/users\/|\/private\/|raw filing payload)/i;
const artifactNamePattern = /^[A-Za-z0-9._-]+\.(?:json|csv|md)$/;
const releaseArtifactMap: Record<string, string> = releaseArtifacts;
const analyticsArtifactMap: Record<string, string> = analyticsArtifacts;

type CompatibilityContract = {
  contractVersion: string;
  candidateId: string;
  candidateContractVersion: string;
  candidateBuildVersion: string;
  candidateManifestHash: string;
  candidateManifestSourceByteHash: string;
  candidateTaxonomyVersion: string;
  candidateMethodologyVersion: string;
  analyticsContractVersion: string;
  analyticsBuildVersion: string;
  analyticsManifestHash: string;
  analyticsManifestSourceByteHash: string;
  release1Reference: { releaseId: string; compatibilityPreserved: boolean };
  taxonomyV1RequiredForRelease1: true;
  taxonomyV2RequiredForCandidate: true;
  normalProductionRoutesExposeCandidate: false;
  livePrivateTransportEnabled: false;
  browserPolicyRecomputationAllowed: false;
  publicationEnabled: false;
  promotionRequiresOwnerApproval: true;
  releasePointerChangeAllowed: false;
  release1MutationAllowed: false;
  candidate2MutationAllowed: false;
  set2OrSet3Started: false;
};

export type Tranche4CandidateManifest = {
  artifacts: Array<{ name: string; mediaType: string; byteLength: number; sha256: string }>;
  buildVersion: string;
  candidate2Unchanged: boolean;
  candidateId: string;
  candidateStatus: "unpublished_candidate";
  contractVersion: string;
  counts: {
    annualObservationCount: number;
    entityCount: number;
    interimObservationCount: number;
    observationCount: number;
    withheldMetricCount: number;
  };
  manifestHash: string;
  methodologyVersion: string;
  promotionRequiresOwnerApproval: true;
  publicationEnabled: false;
  release1Unchanged: true;
  taxonomyVersion: string;
  trustStateCounts: Record<string, number>;
};

export type Tranche4Observation = {
  candidateId?: string;
  entityKey: string;
  metricKey: string;
  periodClass: "annual" | "quarter" | "ytd_interim";
  fiscalPeriod: string;
  source: { accession: string; lawfulSourceUrl: string; rightsState: string };
  financialScope: string;
  trustState: string;
  freshnessState: string;
  readinessState: string;
  comparability: string;
  publicationEligible: false;
  sampleData: false;
};

type AnalyticsManifest = {
  artifactNames?: string[];
  descriptors: Array<{ name: string; byteLength: number; sha256: string }>;
  buildVersion: string;
  candidateId: string;
  candidateManifestHash: string;
  contractVersion: string;
  manifestHash: string;
  methodologyVersion: string;
  publicationEnabled: false;
  releasePointerChanged: false;
  set2OrSet3Started: false;
  supportedViewCount: number;
  taxonomyVersion: string;
  unsupportedMarketWideTotalsGenerated: false;
};

type ViewCatalog = {
  candidateId: string;
  candidateManifestHash: string;
  publicationEnabled: false;
  taxonomyVersion: string;
  views: Array<{
    viewId: string;
    eligibilityState: "available_with_limitations" | "unavailable";
    downloads: { csv: string; json: string };
    observationCount: number;
    withholdingReason: string | null;
  }>;
};

function sha256(bytes: Buffer | string) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(message: string): never {
  throw new Error(`Tranche 4 candidate contract rejected: ${message}`);
}

function compatibility() {
  const bytes = Buffer.from(compatibilitySource.base64, "base64");
  const parsed = JSON.parse(bytes.toString("utf8")) as CompatibilityContract;
  if (parsed.contractVersion !== "public-tranche-4-set1-compatibility@1.0.0") fail("compatibility contract version mismatch");
  return parsed;
}

function safeName(name: string, available: Record<string, string>) {
  let decoded: string;
  try {
    decoded = decodeURIComponent(name);
  } catch {
    return fail("unsafe artifact name");
  }
  if (!artifactNamePattern.test(decoded) || decoded.includes("..") || decoded.includes("/") || decoded.includes("\\")) fail("unsafe artifact name");
  if (!available[decoded]) fail("unknown artifact");
  return decoded;
}

function readBytes(name: string, available: Record<string, string>) {
  return Buffer.from(available[safeName(name, available)], "base64");
}

function parseJson<T>(name: string, available: Record<string, string>) {
  try {
    return JSON.parse(readBytes(name, available).toString("utf8")) as T;
  } catch {
    return fail(`malformed JSON artifact: ${name}`);
  }
}

function validatePublicMaterial(name: string, bytes: Buffer) {
  if (privateMaterial.test(bytes.toString("utf8"))) fail(`private material detected: ${name}`);
}

function validate() {
  const contract = compatibility();
  if (
    contract.publicationEnabled ||
    contract.livePrivateTransportEnabled ||
    contract.browserPolicyRecomputationAllowed ||
    contract.normalProductionRoutesExposeCandidate ||
    contract.releasePointerChangeAllowed ||
    contract.release1MutationAllowed ||
    contract.candidate2MutationAllowed ||
    contract.set2OrSet3Started
  ) {
    fail("public authority boundary mismatch");
  }
  const release1 = listReleases().find((release) => release.releaseId === contract.release1Reference.releaseId);
  if (!release1 || !contract.release1Reference.compatibilityPreserved) fail("Release 1 compatibility not preserved");

  const candidateManifestBytes = readBytes("candidate-manifest.json", releaseArtifactMap);
  if (sha256(candidateManifestBytes) !== contract.candidateManifestSourceByteHash) fail("candidate manifest byte hash mismatch");
  const candidateManifest = JSON.parse(candidateManifestBytes.toString("utf8")) as Tranche4CandidateManifest;
  if (candidateManifest.candidateId !== contract.candidateId || candidateManifest.manifestHash !== contract.candidateManifestHash) fail("candidate trust-root mismatch");
  if (candidateManifest.contractVersion !== contract.candidateContractVersion || candidateManifest.buildVersion !== contract.candidateBuildVersion) fail("candidate version mismatch");
  if (candidateManifest.taxonomyVersion !== contract.candidateTaxonomyVersion || candidateManifest.methodologyVersion !== contract.candidateMethodologyVersion) fail("candidate taxonomy or methodology mismatch");
  if (candidateManifest.publicationEnabled || !candidateManifest.promotionRequiresOwnerApproval || !candidateManifest.release1Unchanged || !candidateManifest.candidate2Unchanged) fail("candidate publication boundary mismatch");
  if (candidateManifest.counts.entityCount !== 17 || candidateManifest.counts.observationCount !== 184 || candidateManifest.counts.withheldMetricCount !== 3) fail("candidate count mismatch");
  if (compositionReport.manifestHash !== candidateManifest.manifestHash || compositionReport.publicationEnabled || !compositionReport.release1Unchanged || !compositionReport.candidate2Unchanged) fail("composition report mismatch");

  const releaseNames = Object.keys(releaseArtifactMap).sort();
  const expectedReleaseNames = [...candidateManifest.artifacts.map((artifact) => artifact.name), "candidate-manifest.json"].sort();
  if (JSON.stringify(releaseNames) !== JSON.stringify(expectedReleaseNames)) fail("missing or extra candidate artifact");
  for (const descriptor of candidateManifest.artifacts) {
    const bytes = readBytes(descriptor.name, releaseArtifactMap);
    if (bytes.byteLength !== descriptor.byteLength || sha256(bytes) !== descriptor.sha256) fail(`candidate artifact integrity mismatch: ${descriptor.name}`);
    validatePublicMaterial(descriptor.name, bytes);
  }

  const observations = parseJson<{ observations: Tranche4Observation[] }>("candidate-observations.json", releaseArtifactMap).observations;
  if (observations.length !== candidateManifest.counts.observationCount) fail("observation count mismatch");
  for (const observation of observations) {
    if (observation.sampleData !== false || observation.publicationEligible !== false) fail("unsafe candidate observation");
    if (!observation.periodClass || !observation.fiscalPeriod || !observation.source.accession || !observation.financialScope) fail("missing public observation metadata");
    if (observation.source.rightsState !== "official_sec_structured_metadata_only") fail("unexpected source rights state");
  }

  const analyticsManifestBytes = readBytes("analytics-manifest.json", analyticsArtifactMap);
  if (sha256(analyticsManifestBytes) !== contract.analyticsManifestSourceByteHash) fail("analytics manifest byte hash mismatch");
  const analyticsManifest = JSON.parse(analyticsManifestBytes.toString("utf8")) as AnalyticsManifest;
  if (analyticsManifest.candidateId !== contract.candidateId || analyticsManifest.manifestHash !== contract.analyticsManifestHash || analyticsManifest.candidateManifestHash !== contract.candidateManifestHash) fail("analytics trust-root mismatch");
  if (analyticsManifest.contractVersion !== contract.analyticsContractVersion || analyticsManifest.buildVersion !== contract.analyticsBuildVersion) fail("analytics version mismatch");
  if (analyticsManifest.taxonomyVersion !== contract.candidateTaxonomyVersion || analyticsManifest.methodologyVersion !== contract.candidateMethodologyVersion) fail("analytics taxonomy or methodology mismatch");
  if (analyticsManifest.publicationEnabled || analyticsManifest.releasePointerChanged || analyticsManifest.set2OrSet3Started || analyticsManifest.unsupportedMarketWideTotalsGenerated) fail("unsafe analytics publication claim");
  if (analyticsReport.analyticsManifestHash !== analyticsManifest.manifestHash || analyticsReport.publicationEnabled || analyticsReport.releasePointerChanged) fail("analytics report mismatch");

  const analyticsNames = Object.keys(analyticsArtifactMap).sort();
  const expectedAnalyticsNames = [...analyticsManifest.descriptors.map((artifact) => artifact.name), "analytics-manifest.json"].sort();
  if (JSON.stringify(analyticsNames) !== JSON.stringify(expectedAnalyticsNames)) fail("missing or extra analytics artifact");
  const checksums = parseJson<{ artifacts: Record<string, string> }>("analytics-checksums.json", analyticsArtifactMap);
  for (const descriptor of analyticsManifest.descriptors) {
    const bytes = readBytes(descriptor.name, analyticsArtifactMap);
    const checksumMatches = descriptor.name === "analytics-checksums.json" || checksums.artifacts[descriptor.name] === descriptor.sha256;
    if (bytes.byteLength !== descriptor.byteLength || sha256(bytes) !== descriptor.sha256 || !checksumMatches) fail(`analytics artifact integrity mismatch: ${descriptor.name}`);
    validatePublicMaterial(descriptor.name, bytes);
  }

  const catalog = parseJson<ViewCatalog>("view-catalog.json", analyticsArtifactMap);
  if (catalog.candidateId !== contract.candidateId || catalog.candidateManifestHash !== contract.candidateManifestHash || catalog.publicationEnabled) fail("view catalog boundary mismatch");
  if (catalog.views.length !== 10 || catalog.views.filter((view) => view.eligibilityState === "available_with_limitations").length !== 8 || catalog.views.filter((view) => view.eligibilityState === "unavailable").length !== 2) fail("view availability mismatch");
  for (const view of catalog.views) {
    if (!analyticsArtifactMap[view.downloads.json] || !analyticsArtifactMap[view.downloads.csv]) fail(`missing view download: ${view.viewId}`);
  }

  return { candidateManifest, analyticsManifest, catalog, observations };
}

let validated: ReturnType<typeof validate> | null = null;
function bundle() {
  validated ??= validate();
  return validated;
}

export function getTranche4CandidateManifest() {
  return bundle().candidateManifest;
}

export function getTranche4CandidateObservations() {
  return bundle().observations;
}

export function getTranche4CandidateViewCatalog() {
  return bundle().catalog;
}

export function getTranche4CandidateArtifact(name: string) {
  const source = releaseArtifactMap[name] ? releaseArtifactMap : analyticsArtifactMap;
  const bytes = readBytes(name, source);
  const descriptor =
    bundle().candidateManifest.artifacts.find((artifact) => artifact.name === name) ??
    bundle().analyticsManifest.descriptors.find((artifact) => artifact.name === name);
  return { name, bytes, hash: descriptor?.sha256 ?? sha256(bytes) };
}

export function tranche4CandidateIndexHash() {
  const { candidateManifest, catalog } = bundle();
  return sha256(JSON.stringify({ candidateManifestHash: candidateManifest.manifestHash, views: catalog.views }));
}
