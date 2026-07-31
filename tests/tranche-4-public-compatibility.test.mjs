import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const releaseDirectory = "data/releases/tranche4_set1_candidate";
const analyticsDirectory = "data/analytics/tranche4_set1_candidate";
const read = (directory, name) => readFileSync(`${directory}/${name}`);
const json = (directory, name) => JSON.parse(read(directory, name));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

const compatibility = JSON.parse(readFileSync("data/contracts/tranche4/set1_candidate_public_compatibility.json", "utf8"));
const candidateManifest = json(releaseDirectory, "candidate-manifest.json");
const candidateObservations = json(releaseDirectory, "candidate-observations.json").observations;
const analyticsManifest = json(analyticsDirectory, "analytics-manifest.json");
const viewCatalog = json(analyticsDirectory, "view-catalog.json");
const compositionReport = JSON.parse(readFileSync("data/reports/tranche-4-candidate-composition-report.json", "utf8"));
const analyticsReport = JSON.parse(readFileSync("data/reports/tranche-4-candidate-analytics-report.json", "utf8"));

test("Tranche 4 public compatibility binds the exact private candidate and analytics trust roots", () => {
  assert.equal(compatibility.contractVersion, "public-tranche-4-set1-compatibility@1.0.0");
  assert.equal(compatibility.privateReviewResolutionMergeCommit, "1969d53aee51d6e65fa40b2061ead2ce77bca293");
  assert.equal(compatibility.privateCandidatePackageMergeCommit, "e0c6dba9f5009b7999331bc0cf26f8730eb64b53");
  assert.equal(compatibility.privateAnalyticsMergeCommit, "fbc4461a9906e163be3c2b505d80f117a18827b5");
  assert.equal(hash(read(releaseDirectory, "candidate-manifest.json")), compatibility.candidateManifestSourceByteHash);
  assert.equal(candidateManifest.manifestHash, compatibility.candidateManifestHash);
  assert.equal(hash(read(analyticsDirectory, "analytics-manifest.json")), compatibility.analyticsManifestSourceByteHash);
  assert.equal(analyticsManifest.manifestHash, compatibility.analyticsManifestHash);
  assert.equal(hash(readFileSync("data/reports/tranche-4-candidate-composition-report.json")), compatibility.candidateCompositionReportByteHash);
  assert.equal(hash(readFileSync("data/reports/tranche-4-candidate-analytics-report.json")), compatibility.analyticsReportByteHash);
});

test("Tranche 4 candidate remains unpublished, owner-gated, and separate from Release 1", () => {
  assert.equal(candidateManifest.candidateId, compatibility.candidateId);
  assert.equal(candidateManifest.candidateStatus, "unpublished_candidate");
  assert.equal(candidateManifest.publicationEnabled, false);
  assert.equal(candidateManifest.promotionRequiresOwnerApproval, true);
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
  assert.equal(release1.releaseId, compatibility.release1Reference.releaseId);
  assert.equal(release1.releaseContractVersion, "public-dataset-release@34.0.0");
  assert.equal(release1.recordSchemaVersion, "public-record@34.0.0");
  assert.equal(release1.publicationEnabled, false);
});

test("Tranche 4 candidate carries Taxonomy V2 and candidate-bound analytical contracts", () => {
  assert.equal(compatibility.taxonomyV1RequiredForRelease1, true);
  assert.equal(compatibility.taxonomyV2RequiredForCandidate, true);
  assert.equal(candidateManifest.taxonomyVersion, "taxonomy-v2@tranche-4");
  assert.equal(candidateManifest.methodologyVersion, "methodology@tranche-4");
  assert.equal(analyticsManifest.taxonomyVersion, "taxonomy-v2@tranche-4");
  assert.equal(analyticsManifest.methodologyVersion, "methodology@tranche-4");
  assert.equal(analyticsManifest.contractVersion, "tranche-4-release-bound-analytics@1.0.0");
  assert.equal(analyticsManifest.candidateManifestHash, candidateManifest.manifestHash);
  assert.equal(viewCatalog.taxonomyVersion, "taxonomy-v2@tranche-4");
  assert.equal(viewCatalog.views.length, 10);
  assert.equal(viewCatalog.views.filter((view) => view.eligibilityState === "available_with_limitations").length, 8);
  assert.equal(viewCatalog.views.filter((view) => view.eligibilityState === "unavailable").length, 2);
});

test("Tranche 4 release and analytics artifact descriptors reconcile exactly", () => {
  const releaseNames = readdirSync(releaseDirectory).sort();
  const expectedReleaseNames = [...candidateManifest.artifacts.map((artifact) => artifact.name), "candidate-manifest.json"].sort();
  assert.deepEqual(releaseNames, expectedReleaseNames);
  for (const descriptor of candidateManifest.artifacts) {
    const bytes = read(releaseDirectory, descriptor.name);
    assert.equal(bytes.byteLength, descriptor.byteLength, descriptor.name);
    assert.equal(hash(bytes), descriptor.sha256, descriptor.name);
    assert.equal(compositionReport.artifactHashes[descriptor.name], descriptor.sha256, descriptor.name);
  }
  assert.equal(compositionReport.artifactHashes["candidate-manifest.json"], compatibility.candidateManifestSourceByteHash);
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

test("Tranche 4 candidate values preserve public metadata and exclude sample data", () => {
  assert.equal(candidateManifest.counts.entityCount, 17);
  assert.equal(candidateManifest.counts.observationCount, 184);
  assert.equal(candidateManifest.counts.annualObservationCount, 112);
  assert.equal(candidateManifest.counts.interimObservationCount, 72);
  assert.equal(candidateManifest.counts.withheldMetricCount, 3);
  assert.equal(candidateObservations.length, 184);
  assert.deepEqual(candidateManifest.trustStateCounts, {
    human_verified: 4,
    source_attributed_unverified: 1,
    system_validated: 179
  });
  assert.ok(candidateObservations.some((observation) => observation.periodClass === "annual"));
  assert.ok(candidateObservations.some((observation) => observation.periodClass === "quarter"));
  assert.ok(candidateObservations.some((observation) => observation.periodClass === "ytd_interim"));
  assert.ok(candidateObservations.some((observation) => observation.trustState === "source_attributed_unverified"));
  assert.ok(candidateObservations.some((observation) => observation.trustState === "human_verified"));
  assert.ok(candidateObservations.some((observation) => observation.trustState === "system_validated"));
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
    assert.ok(
      observation.evidence.sourceHashes.companyfacts || observation.evidence.sourceHashes.safeEvidenceRefHash,
      observation.observationId
    );
  }
});

test("Tranche 4 Set classifications, sub-layers, roles, tags, and Layer 5 states are present in candidate analytics", () => {
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
