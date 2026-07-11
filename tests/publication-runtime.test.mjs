import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { buildPublicationReadModel, isPublishableRow } from "../src/server/modules/publication/read-model.mjs";
import { createDraftSnapshot } from "../src/server/modules/publication/service.mjs";
import { canonicalJson, generateSnapshot, sha256 } from "../src/server/modules/publication/snapshot.mjs";

const approvedRow = {
  observationId: "obs-1",
  observationReviewState: "approved",
  observationIsSample: false,
  supersededByObservationId: null,
  companySlug: "alpha-ai",
  companyName: "Alpha AI",
  companyIsSample: false,
  metricKey: "recognized-revenue",
  normalizedValue: "100.00000000",
  normalizedCurrency: "USD",
  textValue: null,
  booleanValue: null,
  unit: "USD",
  periodType: "year",
  periodStart: "2025-01-01",
  periodEnd: "2025-12-31",
  asOfDate: null,
  recognitionType: "recognized",
  cashFlowType: "recognized_revenue",
  confidence: "high",
  claimId: "claim-1",
  claimKind: "fact",
  claimText: "Alpha AI recognized USD 100 in AI revenue.",
  claimReviewState: "approved",
  claimIsSample: false,
  sourceDocumentId: "doc-1",
  sourceTitle: "Annual filing",
  sourceUrl: "https://example.test/filing",
  sourcePublishedAt: "2026-01-15T00:00:00.000Z",
  sourceAccessedAt: "2026-01-20T00:00:00.000Z",
  sourceDocumentIsSample: false,
  publisher: "Example regulator",
  sourceType: "regulatory_filing",
  sourceRegistryIsSample: false,
  redistributionAllowed: true,
  reviewNotes: "must never be public",
  storageLocator: "private/bucket/object",
  reviewedBy: "private-user-id",
};

test("publication eligibility requires approved, current, non-sample evidence throughout", () => {
  assert.equal(isPublishableRow(approvedRow), true);
  for (const change of [
    { observationReviewState: "pending" },
    { claimReviewState: "stale" },
    { observationIsSample: true },
    { claimIsSample: true },
    { companyIsSample: true },
    { sourceRegistryIsSample: true },
    { sourceDocumentIsSample: true },
    { supersededByObservationId: "obs-2" },
  ]) {
    assert.equal(isPublishableRow({ ...approvedRow, ...change }), false);
  }
});

test("read model exposes traceability, confidence and freshness without private fields", () => {
  const model = buildPublicationReadModel([approvedRow], { generatedAt: "2026-02-10T00:00:00.000Z" });
  assert.equal(model.observations.length, 1);
  assert.deepEqual(model.evidence.confidence, { high: 1, medium: 0, low: 0, unscored: 0 });
  assert.deepEqual(model.evidence.freshness, {
    newestSourceAccessedAt: "2026-01-20T00:00:00.000Z",
    ageDays: 21,
    state: "current",
  });
  assert.equal(model.sources[0].url, approvedRow.sourceUrl);
  const serialized = JSON.stringify(model);
  for (const secret of [approvedRow.reviewNotes, approvedRow.storageLocator, approvedRow.reviewedBy]) {
    assert.equal(serialized.includes(secret), false);
  }
});

test("snapshot output and content hash are deterministic across input ordering", () => {
  const second = { ...approvedRow, observationId: "obs-2", claimId: "claim-2", normalizedValue: "25" };
  const options = {
    slug: "headline-ledger",
    version: 1,
    methodologyVersion: "v0.1.0",
    generatedAt: "2026-02-10T00:00:00.000Z",
  };
  const firstSnapshot = generateSnapshot([approvedRow, second], options);
  const secondSnapshot = generateSnapshot([second, approvedRow], options);

  assert.deepEqual(firstSnapshot, secondSnapshot);
  assert.equal(firstSnapshot.contentSha256, sha256(firstSnapshot.payload));
  assert.match(firstSnapshot.contentSha256, /^[0-9a-f]{64}$/);
  assert.equal(firstSnapshot.payload.kpis.totals.grossAiEconomicFlow.decimal, "125");
  assert.equal(canonicalJson({ b: 1, a: 2 }), '{"a":2,"b":1}');
});

test("draft publication service uses repository boundary and never publishes directly", async () => {
  const saved = [];
  const repository = {
    async loadPublicationRows() { return [approvedRow]; },
    async nextSnapshotVersion() { return 3; },
    async saveDraftSnapshot(snapshot) { saved.push(snapshot); },
  };
  const snapshot = await createDraftSnapshot(repository, {
    slug: "headline-ledger",
    methodologyVersion: "v0.1.0",
    generatedAt: "2026-02-10T00:00:00.000Z",
  });
  assert.equal(snapshot.version, 3);
  assert.equal(snapshot.isSample, false);
  assert.deepEqual(saved, [snapshot]);
  assert.equal("state" in snapshot, false);
});

test("public API adapter uses publishable credentials and contains no privileged key", async () => {
  const adapter = await readFile(new URL("../src/server/public-snapshots.ts", import.meta.url), "utf8");
  const listRoute = await readFile(new URL("../app/api/v1/snapshots/route.ts", import.meta.url), "utf8");
  const detailRoute = await readFile(new URL("../app/api/v1/snapshots/[slug]/route.ts", import.meta.url), "utf8");
  assert.match(adapter, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(`${adapter}\n${listRoute}\n${detailRoute}`, /SERVICE_ROLE|SECRET_KEY/);
  assert.match(adapter, /list_published_snapshots/);
  assert.match(adapter, /get_published_snapshot/);
  assert.doesNotMatch(`${listRoute}\n${detailRoute}`, /POST|PUT|PATCH|DELETE/);
});

test("database adapter joins full lineage and persists draft snapshots only", async () => {
  const repository = await readFile(
    new URL("../src/server/modules/publication/repository.ts", import.meta.url),
    "utf8",
  );
  for (const relation of [
    "ledger.metric_observations",
    "ledger.companies",
    "ledger.claims",
    "ledger.source_documents",
    "ledger.source_registry",
  ]) {
    assert.match(repository, new RegExp(relation.replace(".", "\\.")));
  }
  assert.match(repository, /successor\.supersedes_observation_id = observation\.id/);
  assert.match(repository, /'draft'/);
  assert.doesNotMatch(repository, /'published'/);
});
