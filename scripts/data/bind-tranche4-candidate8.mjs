import { createHash } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { generateTranche4PublicPresentation } from "./generate-tranche4-public-presentation.mjs";

const privateRoot = process.env.AI_ECONOMY_LEDGER_PRIVATE_ROOT ?? "../ai-economy-ledger-data-engine";
const candidateSource = join(privateRoot, "data/releases/tranche4_set1_candidate_8");
const reportSource = join(privateRoot, "data/reports/tranche-4-candidate-8-forward-fix-report.json");
const releaseSource = join(privateRoot, "data/releases/tranche4_set1_release_candidate_8");
const candidateTarget = "data/releases/tranche4_set1_candidate";
const analyticsTarget = "data/analytics/tranche4_set1_candidate";
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));

const candidate = readJson(join(candidateSource, "candidate-manifest.json"));
const report = readJson(reportSource);
const release = readJson(join(releaseSource, "manifest.json"));
if (candidate.candidateId !== "set1-candidate:8:4a293cead8f3d491c723") throw new Error("Unexpected Candidate 8 identity");
if (candidate.manifestHash !== "3afdae1fcd8dc76d0e54d75e256979ac8cf55e37eab414351786bb08abc0ecaf") throw new Error("Unexpected Candidate 8 manifest hash");
if (report.releaseId !== "dataset-release:9:82a1b14fba34df5ac40e" || release.releaseId !== report.releaseId) throw new Error("Unexpected Release 9 identity");
for (const artifact of candidate.artifacts) if (hash(readFileSync(join(candidateSource, artifact.name))) !== artifact.sha256) throw new Error(`Candidate artifact hash mismatch: ${artifact.name}`);

rmSync(candidateTarget, { recursive: true, force: true });
cpSync(candidateSource, candidateTarget, { recursive: true });
const analytics = generateTranche4PublicPresentation({ candidateDirectory: candidateTarget, analyticsDirectory: analyticsTarget });

const sourceBytes = (path) => readFileSync(path);
const compatibility = {
  contractVersion: "public-tranche-4-set1-compatibility@3.0.0",
  privateCandidateRemediationPullRequest: 98,
  privateCandidateRemediationMergeCommit: "2c19137d25b539f2457401e66c615b1273c71326",
  publicGitHubPr: 0,
  publicGitHubPrUrl: null,
  candidateId: candidate.candidateId,
  candidateContractVersion: candidate.contractVersion,
  candidateBuildVersion: candidate.buildVersion,
  candidateManifestHash: candidate.manifestHash,
  candidateManifestSourceByteHash: hash(sourceBytes(join(candidateSource, "candidate-manifest.json"))),
  candidateCompositionReportByteHash: null,
  analyticsContractVersion: analytics.contractVersion,
  analyticsBuildVersion: analytics.buildVersion,
  analyticsManifestHash: analytics.manifestHash,
  analyticsManifestSourceByteHash: hash(sourceBytes(join(analyticsTarget, "analytics-manifest.json"))),
  analyticsReportByteHash: null,
  candidateStatusReportByteHash: null,
  rollbackTarget: { releaseId: report.rollbackReference.releaseId, manifestHash: report.rollbackReference.manifestHash, rollbackPointerState: "restore_previous_published_release_pointer" },
  publicRelease1CompatibilityReference: { releaseId: "dataset-release:1:5424bda5073c2a1a09cb", manifestHash: "30b8a9ccb5687695ef4603b57e57879c3e8718f17b5f5b2cc51d397a59e0c7f3", taxonomyVersion: "taxonomy-v1@pr34", compatibilityPreserved: true },
  candidateTaxonomyVersion: candidate.taxonomyVersion,
  candidateMethodologyVersion: candidate.methodologyVersion,
  canonicalRoster: candidate.entityRoster,
  canonicalAliases: [{ canonicalEntityKey: "entity:company:google", canonicalDisplayName: "Google", aliases: ["Alphabet"] }],
  canonicalDisplayNames: Object.fromEntries(candidate.entityRoster.map((key) => [key, key === "entity:company:nvidia" ? "Nvidia" : readJson(join(candidateSource, "candidate-observations.json")).observations.find((item) => item.entityKey === key).displayName])),
  expectedCounts: { ...candidate.counts, metricSlotCount: 51, includedMetricCount: 48, unavailableMetricCount: 0, limitedMetricCount: 0, notApplicableMetricCount: 0 },
  expectedTrustStateCounts: { system_validated: 1402, human_verified: 0, source_attributed_unverified: 0 },
  withheldMetrics: readJson(join(candidateSource, "excluded-records.json")).excludedRecords.map(({ entityKey, metricKey, reason }) => ({ entityKey, metricKey, reason })),
  historicalCandidates: { candidate3: { candidateId: "set1-candidate:3:ac31b765c2c7ae242f11", manifestHash: "c2450a0e5948114d8247ee7ebec2f729c3e1ea9efee265e05b597c9c67b694d9", status: "rejected_not_promotion_safe", reasons: ["canonical_roster_mismatch", "unsupported_human_verified_provenance", "stale_rollback_pointer"] } },
  taxonomyV1RequiredForRelease1: true, taxonomyV2RequiredForCandidate: true, normalProductionRoutesExposeCandidate: false, livePrivateTransportEnabled: false, browserPolicyRecomputationAllowed: false, publicationEnabled: false, promotionRequiresOwnerApproval: false, releasePointerChangeAllowed: false, release1MutationAllowed: false, candidate2MutationAllowed: false, set2OrSet3Started: false,
  historyPolicyVersion: candidate.historyPolicyVersion,
  releaseCandidate: { releaseId: report.releaseId, manifestHash: report.releaseManifestHash, latestSourceAttributedCount: report.releaseCounts.latestSourceAttributed, verifiedCount: report.releaseCounts.verified },
  authoritativeReleaseAnalyticsManifestHash: report.analyticsManifestHash,
  authoritativeReleaseAnalyticsContractVersion: analytics.contractVersion,
  publicPresentationAnalyticsManifestHash: analytics.manifestHash,
  publicPresentationAnalyticsManifestSourceByteHash: hash(sourceBytes(join(analyticsTarget, "analytics-manifest.json"))),
  forwardFix: report.forwardFix
};
const status = { reportVersion: "tranche-4-candidate-status@4.0.0", candidate3: { ...compatibility.historicalCandidates.candidate3, immutableArtifactsModified: false }, candidate7: { candidateId: "set1-candidate:7:f092cabc7ccc56ceb407", status: "superseded_by_candidate_8", immutableArtifactsModified: false }, replacementCandidate: { candidateId: candidate.candidateId, manifestHash: candidate.manifestHash, releaseCandidateId: report.releaseId, releaseManifestHash: report.releaseManifestHash, status: "unpublished_candidate" }, publicationEnabled: false, productionStateChanged: false };
const analyticsReport = { reportVersion: "release-8-forward-fix-public-analytics@1.0.0", candidateId: candidate.candidateId, candidateManifestHash: candidate.manifestHash, analyticsManifestHash: analytics.manifestHash, authoritativeReleaseAnalyticsManifestHash: report.analyticsManifestHash, releaseId: report.releaseId, validation: { valid: true, errors: [] }, publicationEnabled: false, releasePointerChanged: false };
compatibility.candidateStatusReportByteHash = hash(Buffer.from(JSON.stringify(status)));
const compositionReport = { ...report, publicationEnabled: false, productionStateChanged: false };
compatibility.candidateCompositionReportByteHash = hash(Buffer.from(`${JSON.stringify(compositionReport)}\n`));
compatibility.analyticsReportByteHash = hash(Buffer.from(`${JSON.stringify(analyticsReport)}\n`));
compatibility.candidateStatusReportByteHash = hash(Buffer.from(`${JSON.stringify(status)}\n`));
for (const [path, value] of [["data/contracts/tranche4/set1_candidate_public_compatibility.json", compatibility], ["data/reports/tranche-4-candidate-status-report.json", status], ["data/reports/tranche-4-candidate-composition-report.json", compositionReport], ["data/reports/tranche-4-candidate-analytics-report.json", analyticsReport]]) { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, `${JSON.stringify(value)}\n`); }
console.log(JSON.stringify({ status: "ok", candidateId: candidate.candidateId, releaseId: report.releaseId, observationCount: candidate.counts.observationCount }));
