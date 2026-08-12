import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const releaseDirectory = "data/releases/tranche4_set1_candidate";
const analyticsDirectory = "data/analytics/tranche4_set1_candidate";
const read = (directory, name) => readFileSync(`${directory}/${name}`);
const json = (directory, name) => JSON.parse(read(directory, name));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sort = (values) => [...values].sort();

const compatibility = JSON.parse(readFileSync("data/contracts/tranche4/set1_candidate_public_compatibility.json", "utf8"));
const candidateManifest = json(releaseDirectory, "candidate-manifest.json");
const candidateObservations = json(releaseDirectory, "candidate-observations.json").observations;
const analyticsManifest = json(analyticsDirectory, "analytics-manifest.json");
const viewCatalog = json(analyticsDirectory, "view-catalog.json");
const compositionReport = JSON.parse(readFileSync("data/reports/tranche-4-candidate-composition-report.json", "utf8"));
const analyticsReport = JSON.parse(readFileSync("data/reports/tranche-4-candidate-analytics-report.json", "utf8"));
const statusReport = JSON.parse(readFileSync("data/reports/tranche-4-candidate-status-report.json", "utf8"));

test("Tranche 4 public compatibility binds the complete-history Candidate 7 trust roots", () => {
  assert.equal(compatibility.contractVersion, "public-tranche-4-set1-compatibility@2.0.0");
  assert.equal(compatibility.privateCandidateRemediationPullRequest, 97);
  assert.equal(compatibility.privateCandidateRemediationMergeCommit, "a7017e3eb77ff1ad2557e82c63c611ce32e380be");
  assert.equal(hash(read(releaseDirectory, "candidate-manifest.json")), compatibility.candidateManifestSourceByteHash);
  assert.equal(candidateManifest.manifestHash, compatibility.candidateManifestHash);
  assert.equal(hash(read(analyticsDirectory, "analytics-manifest.json")), compatibility.analyticsManifestSourceByteHash);
  assert.equal(analyticsManifest.manifestHash, compatibility.analyticsManifestHash);
  assert.equal(hash(readFileSync("data/reports/tranche-4-candidate-composition-report.json")), compatibility.candidateCompositionReportByteHash);
  assert.equal(hash(readFileSync("data/reports/tranche-4-candidate-analytics-report.json")), compatibility.analyticsReportByteHash);
  assert.equal(hash(readFileSync("data/reports/tranche-4-candidate-status-report.json")), compatibility.candidateStatusReportByteHash);
});

test("Tranche 4 candidate remains unpublished, owner-gated, and rollback-safe", () => {
  assert.equal(candidateManifest.candidateId, compatibility.candidateId);
  assert.equal(candidateManifest.candidateStatus, "unpublished_candidate");
  assert.equal(candidateManifest.publicationEnabled, false);
  assert.equal(candidateManifest.promotionRequiresOwnerApproval, false);
  assert.equal(candidateManifest.release1Unchanged, true);
  assert.equal(candidateManifest.candidate2Unchanged, true);
  assert.equal(analyticsManifest.publicationEnabled, false);
  assert.equal(analyticsManifest.releasePointerChanged, false);
  assert.equal(analyticsManifest.release1Changed, false);
  assert.equal(analyticsManifest.candidate2Changed, false);
  assert.equal(analyticsManifest.set2OrSet3Started, false);
  assert.equal(compatibility.normalProductionRoutesExposeCandidate, false);
  assert.equal(compatibility.releasePointerChangeAllowed, false);
  assert.equal(compatibility.release1MutationAllowed, false);
  assert.equal(compatibility.candidate2MutationAllowed, false);

  const release1 = json("data/releases/pr34_release_candidate", "manifest.json");
  assert.equal(release1.releaseId, compatibility.publicRelease1CompatibilityReference.releaseId);
  assert.equal(hash(read("data/releases/pr34_release_candidate", "manifest.json")), compatibility.publicRelease1CompatibilityReference.manifestHash);
  assert.equal(release1.releaseContractVersion, "public-dataset-release@34.0.0");
  assert.equal(release1.recordSchemaVersion, "public-record@34.0.0");
  assert.equal(release1.publicationEnabled, false);

  const rollbackMetadata = json(releaseDirectory, "rollback-metadata.json");
  assert.equal(rollbackMetadata.previousPublishedReleaseId, compatibility.rollbackTarget.releaseId);
  assert.equal(rollbackMetadata.previousPublishedManifestHash, compatibility.rollbackTarget.manifestHash);
  assert.equal(rollbackMetadata.rollbackPointerState, compatibility.rollbackTarget.rollbackPointerState);
});

test("Tranche 4 candidate carries Taxonomy V2, the canonical Set 1 roster, and Candidate 3 history", () => {
  assert.equal(compatibility.taxonomyV1RequiredForRelease1, true);
  assert.equal(compatibility.taxonomyV2RequiredForCandidate, true);
  assert.equal(candidateManifest.taxonomyVersion, "taxonomy-v2@tranche-4");
  assert.equal(candidateManifest.methodologyVersion, "methodology@tranche-4-five-year-history");
  assert.equal(analyticsManifest.taxonomyVersion, "taxonomy-v2@tranche-4");
  assert.equal(analyticsManifest.methodologyVersion, "methodology@tranche-4-five-year-history");
  assert.equal(analyticsManifest.contractVersion, "tranche-4-release-bound-analytics@1.0.0");
  assert.equal(analyticsManifest.candidateManifestHash, candidateManifest.manifestHash);
  assert.deepEqual(sort(candidateManifest.entityRoster), sort(compatibility.canonicalRoster));
  assert.equal(candidateManifest.canonicalIdentityDecisions[0].canonicalEntityKey, "entity:company:google");
  assert.equal(candidateManifest.canonicalIdentityDecisions[0].canonicalDisplayName, "Google");
  assert.deepEqual(candidateManifest.canonicalIdentityDecisions[0].aliases, ["Alphabet"]);
  assert.equal(compatibility.canonicalDisplayNames["entity:company:google"], "Google");
  assert.equal(compatibility.canonicalDisplayNames["entity:company:nvidia"], "Nvidia");
  assert.equal(statusReport.candidate3.status, "rejected_not_promotion_safe");
  assert.deepEqual(statusReport.candidate3.reasons, compatibility.historicalCandidates.candidate3.reasons);
  assert.equal(statusReport.candidate4.status, "superseded_by_candidate_5");
  assert.equal(statusReport.candidate5.status, "superseded_by_candidate_7");
  assert.equal(statusReport.replacementCandidate.candidateId, compatibility.candidateId);
  assert.equal(statusReport.replacementCandidate.manifestHash, compatibility.candidateManifestHash);
});

test("Tranche 4 release and analytics artifact descriptors reconcile exactly", () => {
  const releaseNames = readdirSync(releaseDirectory).sort();
  const expectedReleaseNames = [...candidateManifest.artifacts.map((artifact) => artifact.name), "candidate-manifest.json"].sort();
  assert.deepEqual(releaseNames, expectedReleaseNames);
  for (const descriptor of candidateManifest.artifacts) {
    const bytes = read(releaseDirectory, descriptor.name);
    assert.equal(bytes.byteLength, descriptor.byteLength, descriptor.name);
    assert.equal(hash(bytes), descriptor.sha256, descriptor.name);
    if (compositionReport.artifactHashes) assert.equal(compositionReport.artifactHashes[descriptor.name], descriptor.sha256, descriptor.name);
  }
  if (compositionReport.artifactHashes) assert.equal(compositionReport.artifactHashes["candidate-manifest.json"], compatibility.candidateManifestSourceByteHash);
  assert.equal(compositionReport.manifestHash, candidateManifest.manifestHash);

  const analyticsNames = readdirSync(analyticsDirectory).sort();
  const expectedAnalyticsNames = [...analyticsManifest.descriptors.map((artifact) => artifact.name), "analytics-manifest.json"].sort();
  assert.deepEqual(analyticsNames, expectedAnalyticsNames);
  const checksums = json(analyticsDirectory, "analytics-checksums.json");
  for (const descriptor of analyticsManifest.descriptors) {
    const bytes = read(analyticsDirectory, descriptor.name);
    assert.equal(bytes.byteLength, descriptor.byteLength, descriptor.name);
    assert.equal(hash(bytes), descriptor.sha256, descriptor.name);
    if (descriptor.name !== "analytics-checksums.json") assert.equal(checksums.artifacts[descriptor.name], descriptor.sha256, descriptor.name);
  }
  assert.equal(analyticsReport.analyticsManifestHash, analyticsManifest.manifestHash);
});

test("Tranche 4 candidate values preserve public metadata, restored scope, and corrected trust", () => {
  assert.equal(candidateManifest.counts.entityCount, compatibility.expectedCounts.entityCount);
  assert.equal(candidateManifest.counts.observationCount, compatibility.expectedCounts.observationCount);
  assert.equal(candidateManifest.counts.annualObservationCount, compatibility.expectedCounts.annualObservationCount);
  assert.equal(candidateManifest.counts.interimObservationCount, compatibility.expectedCounts.interimObservationCount);
  assert.equal(candidateManifest.counts.latestAnnualIncludedCount, compatibility.expectedCounts.latestAnnualIncludedCount);
  assert.equal(candidateManifest.counts.withheldMetricCount, compatibility.expectedCounts.withheldMetricCount);
  assert.equal(candidateObservations.length, compatibility.expectedCounts.observationCount);
  assert.deepEqual(candidateManifest.trustStateCounts, { system_validated: 1397 });
  assert.ok(candidateObservations.some((observation) => observation.periodClass === "annual"));
  assert.ok(candidateObservations.some((observation) => observation.periodClass === "quarter"));
  assert.ok(candidateObservations.some((observation) => observation.periodClass === "ytd_interim"));
  assert.ok(candidateObservations.some((observation) => observation.entityKey === "entity:company:intel"));
  assert.ok(candidateObservations.some((observation) => observation.entityKey === "entity:company:salesforce"));
  assert.ok(candidateObservations.some((observation) => observation.entityKey === "entity:company:google"));
  assert.ok(candidateObservations.every((observation) => observation.entityKey !== "entity:company:alphabet"));
  assert.ok(candidateObservations.every((observation) => observation.trustState === "system_validated"));
  for (const observation of candidateObservations) {
    assert.equal(observation.sampleData, false, observation.observationId);
    assert.equal(observation.publicationEligible, false, observation.observationId);
    assert.ok(observation.fiscalPeriod, observation.observationId);
    assert.ok(observation.periodClass, observation.observationId);
    assert.ok(observation.financialScope, observation.observationId);
    assert.ok(observation.freshnessState, observation.observationId);
    assert.ok(observation.readinessState, observation.observationId);
    assert.ok(observation.comparability, observation.observationId);
    assert.ok(observation.source.accession, observation.observationId);
    assert.equal(observation.source.rightsState, "official_sec_structured_metadata_only", observation.observationId);
    assert.ok(observation.evidence.evidenceSetKey, observation.observationId);
    assert.ok(observation.evidence.sourceHashes.companyfacts || observation.evidence.sourceHashes.safeEvidenceRefHash, observation.observationId);
  }
});

test("Tranche 4 coverage and withheld metrics remain explicit and never zero-filled", () => {
  const summary = json(releaseDirectory, "coverage-readiness-summary.json");
  assert.equal(summary.metricSlotCount, compatibility.expectedCounts.metricSlotCount);
  assert.equal(summary.slotStates.length, compatibility.expectedCounts.metricSlotCount);
  assert.equal(summary.latestAnnualIncludedCount, compatibility.expectedCounts.latestAnnualIncludedCount);
  assert.deepEqual(sort(summary.entityRoster), sort(compatibility.canonicalRoster));

  const withheld = summary.slotStates.filter((slot) => slot.latestAnnualState === "withheld");
  assert.equal(withheld.length, compatibility.withheldMetrics.length);
  assert.deepEqual(
    sort(withheld.map((slot) => `${slot.entityKey}:${slot.metricKey}`)),
    sort(compatibility.withheldMetrics.map((slot) => `${slot.entityKey}:${slot.metricKey}`))
  );

  const excluded = json(releaseDirectory, "excluded-records.json");
  assert.deepEqual(sort(excluded.entityRoster), sort(compatibility.canonicalRoster));
  assert.deepEqual(
    sort(excluded.excludedRecords.map((record) => `${record.entityKey}:${record.metricKey}:${record.reason}`)),
    sort(compatibility.withheldMetrics.map((record) => `${record.entityKey}:${record.metricKey}:${record.reason}`))
  );
  assert.ok(excluded.excludedRecords.every((record) => record.candidateInclusion === "withheld_unavailable"));

  const annual = json(analyticsDirectory, "latest-annual-company-comparison.json");
  const annualPairs = new Set(annual.chartReadyValues.map((value) => `${value.entityKey}:${value.metricKey}`));
  for (const withheldMetric of compatibility.withheldMetrics) {
    assert.equal(annualPairs.has(`${withheldMetric.entityKey}:${withheldMetric.metricKey}`), false);
  }
});

test("Tranche 4 analytics preserve the corrected roster and availability contracts", () => {
  assert.equal(viewCatalog.taxonomyVersion, "taxonomy-v2@tranche-4");
  assert.equal(viewCatalog.views.length, 10);
  assert.equal(viewCatalog.views.filter((view) => view.eligibilityState === "available_with_limitations").length, 8);
  assert.equal(viewCatalog.views.filter((view) => view.eligibilityState === "unavailable").length, 2);

  const coverage = json(analyticsDirectory, "ecosystem-coverage-map.json");
  assert.equal(coverage.analyticalQuestion, "Which Taxonomy V2 layers and sub-layers are covered by Set 1?");
  assert.ok(coverage.chartReadyValues.some((value) => value.subLayers?.length > 0));
  assert.ok(coverage.chartReadyValues.some((value) => value.coveredSubLayers?.length > 0));
  assert.ok(coverage.chartReadyValues.some((value) => value.entityKey === "users_economic_outcomes"));
  const layer5 = coverage.chartReadyValues.find((value) => value.entityKey === "users_economic_outcomes");
  assert.equal(layer5.value, "0");
  assert.equal(layer5.trustState, "not_applicable");

  const readiness = json(analyticsDirectory, "coverage-freshness-readiness-matrix.json");
  assert.ok(readiness.chartReadyValues.some((value) => value.value === "withheld"));
  assert.ok(readiness.chartReadyValues.some((value) => value.value === "included"));
  assert.ok(readiness.chartReadyValues.every((value) => value.periodClass === "annual_slot"));

  const annual = json(analyticsDirectory, "latest-annual-company-comparison.json");
  assert.ok(annual.chartReadyValues.every((value) => value.periodClass === "annual"));
  assert.ok(annual.chartReadyValues.every((value) => value.financialScope === "company_wide_consolidated"));
  assert.ok(annual.chartReadyValues.every((value) => value.entityKey !== "entity:company:alphabet"));
});

test("Tranche 4 preserves the reconciled five-year annual and full interim history", () => {
  const annualHistory = json(analyticsDirectory, "recent-annual-company-histories.json");
  assert.equal(annualHistory.chartReadyValues.length, 238);
  assert.ok(annualHistory.chartReadyValues.every((value) => value.periodClass === "annual"));
  assert.ok(annualHistory.chartReadyValues.every((value) => Number(value.fiscalYear) >= 2021));

  const interim = candidateObservations.filter((observation) => observation.periodClass !== "annual");
  assert.equal(interim.length, 1159);
  assert.ok(interim.some((observation) => observation.periodClass === "quarter"));
  assert.ok(interim.some((observation) => observation.periodClass === "ytd_interim"));
  assert.ok(interim.every((observation) => Number(observation.fiscalYear) >= 2021));
  assert.equal(candidateObservations.filter((observation) => observation.periodClass === "annual").length, 238);
});

test("Tranche 4 public bundle does not expose private material or live-publication state", () => {
  const bytes = Buffer.concat([
    ...readdirSync(releaseDirectory).map((name) => read(releaseDirectory, name)),
    ...readdirSync(analyticsDirectory).map((name) => read(analyticsDirectory, name)),
    readFileSync("data/contracts/tranche4/set1_candidate_public_compatibility.json")
  ]).toString("utf8").toLowerCase();
  for (const prohibited of ["bearer ", "service_role", "signed_url", "storage_key", "revieweremail", "private note", "file://", "/users/", "/private/"]) {
    assert.equal(bytes.includes(prohibited), false, prohibited);
  }
  assert.equal(bytes.includes('"publicationenabled":true'), false);
});

test("Tranche 4 Candidate 7 carries no unsupported human-verified provenance", () => {
  assert.equal(candidateObservations.some((observation) => observation.trustState === "human_verified"), false);
  assert.equal(candidateManifest.trustStateCounts.human_verified ?? 0, 0);
});

test("Tranche 4 candidate is server-only and not wired into current production data routes", () => {
  const adapter = readFileSync("src/server/tranche4/candidate-contract.ts", "utf8");
  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /normalProductionRoutesExposeCandidate/);
  assert.match(adapter, /Release 1 compatibility not preserved/);
  assert.match(adapter, /private material detected/);

  for (const file of ["app/api/data/analytics/route.ts", "app/api/data/analytics/[artifact]/route.ts", "app/api/data/releases/route.ts"]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, /tranche4|set1-candidate|candidate-contract/i, file);
  }
});
