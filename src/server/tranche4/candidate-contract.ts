import "server-only";

import { createHash } from "node:crypto";

import analyticsReport from "@/data/reports/tranche-4-candidate-analytics-report.json";
import compositionReport from "@/data/reports/tranche-4-candidate-composition-report.json";
import statusReport from "@/data/reports/tranche-4-candidate-status-report.json";
import { listReleases } from "@/src/server/data-releases/contract";
import analyticsArtifacts from "./generated/set1-candidate-analytics-artifacts.json";
import compatibilitySource from "./generated/set1-candidate-compatibility-source.json";
import releaseArtifacts from "./generated/set1-candidate-release-artifacts.json";

export const TRANCHE4_CANDIDATE_CACHE_CONTROL = "public, max-age=31536000, immutable";
export const TRANCHE4_CANDIDATE_INDEX_CACHE_CONTROL = "public, max-age=60, must-revalidate";

const privateMaterial = /(?:bearer\s+[A-Za-z0-9._-]+|authorization\s*:|authorization header|cookie\s*:|service_role|signed_url|storage_key|revieweremail|private note|file:\/\/|\/users\/|\/private\/|raw filing payload)/i;
const artifactNamePattern = /^[A-Za-z0-9._-]+\.(?:json|csv|md)$/;
const releaseArtifactMap: Record<string, string> = releaseArtifacts;
const analyticsArtifactMap: Record<string, string> = analyticsArtifacts;

type CompatibilityContract = {
  contractVersion: string;
  privateCandidateRemediationPullRequest: number;
  privateCandidateRemediationMergeCommit: string;
  publicGitHubPr: number;
  publicGitHubPrUrl: string;
  candidateId: string;
  candidateContractVersion: string;
  candidateBuildVersion: string;
  candidateManifestHash: string;
  candidateManifestSourceByteHash: string;
  candidateCompositionReportByteHash: string;
  analyticsContractVersion: string;
  analyticsBuildVersion: string;
  analyticsManifestHash: string;
  analyticsManifestSourceByteHash: string;
  analyticsReportByteHash: string;
  candidateStatusReportByteHash: string;
  rollbackTarget: { releaseId: string; manifestHash: string; rollbackPointerState: string };
  publicRelease1CompatibilityReference: { releaseId: string; manifestHash: string; taxonomyVersion: string; compatibilityPreserved: boolean };
  candidateTaxonomyVersion: string;
  candidateMethodologyVersion: string;
  canonicalRoster: string[];
  canonicalAliases: Array<{ canonicalEntityKey: string; canonicalDisplayName: string; aliases: string[] }>;
  canonicalDisplayNames: Record<string, string>;
  expectedCounts: {
    entityCount: number;
    observationCount: number;
    annualObservationCount: number;
    interimObservationCount: number;
    latestAnnualIncludedCount: number;
    metricSlotCount: number;
    includedMetricCount: number;
    withheldMetricCount: number;
    unavailableMetricCount: number;
    limitedMetricCount: number;
    notApplicableMetricCount: number;
  };
  expectedTrustStateCounts: Record<string, number>;
  withheldMetrics: Array<{ entityKey: string; metricKey: string; reason: string }>;
  historicalCandidates: {
    candidate3: {
      candidateId: string;
      manifestHash: string;
      status: string;
      reasons: string[];
    };
  };
  taxonomyV1RequiredForRelease1: true;
  taxonomyV2RequiredForCandidate: true;
  normalProductionRoutesExposeCandidate: false;
  livePrivateTransportEnabled: false;
  browserPolicyRecomputationAllowed: false;
  publicationEnabled: false;
  promotionRequiresOwnerApproval: boolean;
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
  canonicalIdentityDecisions?: Array<{ canonicalEntityKey: string; canonicalDisplayName: string; aliases: string[]; decision: string }>;
  contractVersion: string;
  counts: {
    annualObservationCount: number;
    entityCount: number;
    interimObservationCount: number;
    latestAnnualIncludedCount: number;
    observationCount: number;
    withheldMetricCount: number;
  };
  entityRoster?: string[];
  manifestHash: string;
  methodologyVersion: string;
  promotionRequiresOwnerApproval: boolean;
  publicationEnabled: false;
  release1Reference?: { releaseId: string; manifestHash: string };
  release1Unchanged: true;
  taxonomyVersion: string;
  trustStateCounts: Record<string, number>;
};

export type Tranche4Observation = {
  candidateId?: string;
  comparability: string;
  displayName: string;
  evidence: { evidenceSetKey: string; sourceHashes: Record<string, string> };
  entityKey: string;
  financialScope: string;
  fiscalPeriod: string;
  metricKey: string;
  observationId: string;
  periodClass: "annual" | "quarter" | "ytd_interim";
  periodEnd: string;
  source: { accession: string; form: string; lawfulSourceUrl: string; rightsState: string; sourceName: string };
  unit: string;
  value: string;
  freshnessState: string;
  readinessState: string;
  trustState: string;
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
  contractVersion: string;
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

type CoverageReadinessSummary = {
  candidateId: string;
  entityRoster: string[];
  latestAnnualIncludedCount: number;
  metricSlotCount: number;
  slotStates: Array<{ entityKey: string; metricKey: string; latestAnnualState: string; limitation: string | null }>;
};

type ExcludedRecords = {
  candidateId: string;
  entityRoster: string[];
  excludedRecords: Array<{ entityKey: string; metricKey: string; reason: string; candidateInclusion: string }>;
};

type RollbackMetadata = {
  candidateId: string;
  previousPublishedReleaseId: string;
  previousPublishedManifestHash: string;
  rollbackPointerState: string;
};

type ReleaseDelta = {
  candidateId: string;
  comparedToReleaseId: string;
  comparedToManifestHash: string;
  entityRoster: string[];
  retainedEntities: string[];
  newEntities: string[];
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
  if (parsed.contractVersion !== "public-tranche-4-set1-compatibility@2.0.0") fail("compatibility contract version mismatch");
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

function countOf(record: Record<string, number> | undefined, key: string) {
  return record?.[key] ?? 0;
}

function sameMembers(left: string[], right: string[]) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
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

  const release1 = listReleases().find((release) => release.releaseId === contract.publicRelease1CompatibilityReference.releaseId);
  if (!release1 || !contract.publicRelease1CompatibilityReference.compatibilityPreserved) fail("Release 1 compatibility not preserved");

  const candidateManifestBytes = readBytes("candidate-manifest.json", releaseArtifactMap);
  if (sha256(candidateManifestBytes) !== contract.candidateManifestSourceByteHash) fail("candidate manifest byte hash mismatch");
  const candidateManifest = JSON.parse(candidateManifestBytes.toString("utf8")) as Tranche4CandidateManifest;
  if (candidateManifest.candidateId !== contract.candidateId || candidateManifest.manifestHash !== contract.candidateManifestHash) fail("candidate trust-root mismatch");
  if (candidateManifest.contractVersion !== contract.candidateContractVersion || candidateManifest.buildVersion !== contract.candidateBuildVersion) fail("candidate version mismatch");
  if (candidateManifest.taxonomyVersion !== contract.candidateTaxonomyVersion || candidateManifest.methodologyVersion !== contract.candidateMethodologyVersion) fail("candidate taxonomy or methodology mismatch");
  if (candidateManifest.publicationEnabled || candidateManifest.promotionRequiresOwnerApproval !== contract.promotionRequiresOwnerApproval || !candidateManifest.release1Unchanged || !candidateManifest.candidate2Unchanged) fail("candidate publication boundary mismatch");
  if (!candidateManifest.entityRoster || !sameMembers(candidateManifest.entityRoster, contract.canonicalRoster)) fail("candidate roster mismatch");
  if (
    candidateManifest.counts.entityCount !== contract.expectedCounts.entityCount ||
    candidateManifest.counts.observationCount !== contract.expectedCounts.observationCount ||
    candidateManifest.counts.annualObservationCount !== contract.expectedCounts.annualObservationCount ||
    candidateManifest.counts.interimObservationCount !== contract.expectedCounts.interimObservationCount ||
    candidateManifest.counts.latestAnnualIncludedCount !== contract.expectedCounts.latestAnnualIncludedCount ||
    candidateManifest.counts.withheldMetricCount !== contract.expectedCounts.withheldMetricCount
  ) fail("candidate count mismatch");
  if (
    countOf(candidateManifest.trustStateCounts, "system_validated") !== contract.expectedTrustStateCounts.system_validated ||
    countOf(candidateManifest.trustStateCounts, "human_verified") !== contract.expectedTrustStateCounts.human_verified ||
    countOf(candidateManifest.trustStateCounts, "source_attributed_unverified") !== contract.expectedTrustStateCounts.source_attributed_unverified
  ) fail("candidate trust-state mismatch");
  if (
    candidateManifest.release1Reference?.releaseId !== contract.rollbackTarget.releaseId ||
    candidateManifest.release1Reference?.manifestHash !== contract.rollbackTarget.manifestHash
  ) fail("candidate rollback target mismatch");

  const aliasDecision = candidateManifest.canonicalIdentityDecisions?.find((decision) => decision.canonicalEntityKey === "entity:company:google");
  if (!aliasDecision || aliasDecision.canonicalDisplayName !== "Google" || !aliasDecision.aliases.includes("Alphabet")) fail("canonical alias decision mismatch");

  if (
    compositionReport.manifestHash !== candidateManifest.manifestHash ||
    compositionReport.publicationEnabled ||
    compositionReport.productionStateChanged ||
    compositionReport.validation?.valid !== true
  ) fail("composition report mismatch");

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
  if (observations.some((observation) => observation.entityKey === "entity:company:alphabet")) fail("alphabet alias promoted as entity");
  if (!observations.some((observation) => observation.entityKey === "entity:company:intel")) fail("intel missing from candidate observations");
  if (!observations.some((observation) => observation.entityKey === "entity:company:salesforce")) fail("salesforce missing from candidate observations");
  for (const observation of observations) {
    if (observation.sampleData !== false || observation.publicationEligible !== false) fail("unsafe candidate observation");
    if (!observation.periodClass || !observation.fiscalPeriod || !observation.source.accession || !observation.financialScope) fail("missing public observation metadata");
    if (observation.source.rightsState !== "official_sec_structured_metadata_only") fail("unexpected source rights state");
  }
  if (observations.some((observation) => observation.trustState === "human_verified" || observation.trustState === "source_attributed_unverified")) fail("unsupported candidate trust state present");

  const coverageSummary = parseJson<CoverageReadinessSummary>("coverage-readiness-summary.json", releaseArtifactMap);
  if (coverageSummary.metricSlotCount !== contract.expectedCounts.metricSlotCount || coverageSummary.latestAnnualIncludedCount !== contract.expectedCounts.latestAnnualIncludedCount) {
    fail("coverage summary count mismatch");
  }
  if (!sameMembers(coverageSummary.entityRoster, contract.canonicalRoster)) fail("coverage summary roster mismatch");
  const withheldSlots = coverageSummary.slotStates.filter((slot) => slot.latestAnnualState === "withheld");
  if (withheldSlots.length !== contract.withheldMetrics.length) fail("withheld slot count mismatch");

  const excludedRecords = parseJson<ExcludedRecords>("excluded-records.json", releaseArtifactMap);
  if (!sameMembers(excludedRecords.entityRoster, contract.canonicalRoster)) fail("excluded-record roster mismatch");
  const excludedKeys = excludedRecords.excludedRecords.map((record) => `${record.entityKey}:${record.metricKey}:${record.reason}`).sort();
  const expectedExcludedKeys = contract.withheldMetrics.map((record) => `${record.entityKey}:${record.metricKey}:${record.reason}`).sort();
  if (JSON.stringify(excludedKeys) !== JSON.stringify(expectedExcludedKeys)) fail("withheld metrics mismatch");
  if (excludedRecords.excludedRecords.some((record) => record.candidateInclusion !== "withheld_unavailable")) fail("withheld metric unexpectedly filled");

  const rollbackMetadata = parseJson<RollbackMetadata>("rollback-metadata.json", releaseArtifactMap);
  if (
    rollbackMetadata.previousPublishedReleaseId !== contract.rollbackTarget.releaseId ||
    rollbackMetadata.previousPublishedManifestHash !== contract.rollbackTarget.manifestHash ||
    rollbackMetadata.rollbackPointerState !== contract.rollbackTarget.rollbackPointerState
  ) fail("rollback metadata mismatch");

  const releaseDelta = parseJson<ReleaseDelta>("release-delta-vs-release1.json", releaseArtifactMap);
  if (
    releaseDelta.comparedToReleaseId !== contract.rollbackTarget.releaseId ||
    releaseDelta.comparedToManifestHash !== contract.rollbackTarget.manifestHash ||
    !sameMembers(releaseDelta.entityRoster, contract.canonicalRoster)
  ) fail("release delta rollback or roster mismatch");
  if (!releaseDelta.retainedEntities.includes("entity:company:nvidia")) fail("release delta retained entity mismatch");
  if (!releaseDelta.newEntities.includes("entity:company:intel") || !releaseDelta.newEntities.includes("entity:company:salesforce")) fail("release delta missing restored entities");

  if (
    statusReport.candidate3.candidateId !== contract.historicalCandidates.candidate3.candidateId ||
    statusReport.candidate3.status !== contract.historicalCandidates.candidate3.status ||
    statusReport.replacementCandidate.candidateId !== contract.candidateId ||
    statusReport.replacementCandidate.manifestHash !== contract.candidateManifestHash
  ) fail("candidate status history mismatch");

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

  const annualComparison = parseJson<{ chartReadyValues: Array<{ entityKey: string; value: string; metricKey: string }> }>("latest-annual-company-comparison.json", analyticsArtifactMap);
  if (annualComparison.chartReadyValues.some((row) => row.entityKey === "entity:company:alphabet")) fail("alphabet alias promoted in analytics");
  const withheldAnnualRows = annualComparison.chartReadyValues.filter((row) => contract.withheldMetrics.some((metric) => metric.entityKey === row.entityKey && metric.metricKey === row.metricKey));
  if (withheldAnnualRows.length !== 0) fail("withheld metric incorrectly materialized in annual comparison");

  return { candidateManifest, analyticsManifest, catalog, observations, contract };
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

export function getTranche4CanonicalDisplayName(entityKey: string, fallback?: string) {
  return bundle().contract.canonicalDisplayNames[entityKey] ?? fallback ?? entityKey;
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
