import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const artifactBytes = readFileSync("public/product-reset/product-reset-analytics.json");
const artifact = JSON.parse(artifactBytes);
const manifest = JSON.parse(readFileSync("public/product-reset/manifest.json"));
const pages = ["app/page.tsx", "app/ai-stack/page.tsx", "app/market/page.tsx", "app/companies/page.tsx", "app/companies/[entityKey]/page.tsx"]
  .map((path) => readFileSync(path, "utf8")).join("\n");
const component = readFileSync("components/product-reset.tsx", "utf8");
const client = readFileSync("components/product-reset-client.tsx", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

test("product reset artifact is hash-bound to immutable Candidate 8", () => {
  assert.equal(createHash("sha256").update(artifactBytes).digest("hex"), manifest.artifacts[0].sha256);
  assert.equal(artifact.candidateBinding.candidateId, "set1-candidate:8:4a293cead8f3d491c723");
  assert.equal(artifact.candidateBinding.candidateManifestHash, "3afdae1fcd8dc76d0e54d75e256979ac8cf55e37eab414351786bb08abc0ecaf");
  assert.equal(artifact.contractVersion, "product-reset-common-period@1.0.0");
});

test("common window and bounded cohort presentation remain exact", () => {
  assert.deepEqual(artifact.commonPeriod, {
    commonComparisonQuarter: "2026-Q1",
    cutoffDate: "2026-03-31",
    dataThrough: "2026-03-31",
    reconciledCompanyCount: 17,
    totalTrackedCompanyCount: 17,
    newerPartialQuarterCompanyCount: 16
  });
  assert.equal(artifact.companies.length, 17);
  assert.ok(artifactBytes.byteLength < 100_000);
});

test("rankings and layer rollups exclude unavailable values and double counting", () => {
  assert.equal(artifact.rankings.ttmCapex.some((item) => item.entityKey === "entity:company:digital-realty"), false);
  assert.equal(artifact.rankings.ttmResearchAndDevelopment.some((item) => item.entityKey === "entity:company:amazon"), false);
  const constituents = artifact.layerRollups.flatMap((layer) => layer.constituents.map((item) => item.entityKey));
  assert.equal(constituents.length, 17);
  assert.equal(new Set(constituents).size, 17);
  assert.equal(artifact.layer5.companyFinancialRollup, null);
});

test("primary routes use the product artifact and preserve Release 11 fallbacks", () => {
  assert.match(pages, /getProductResetAnalyticsIfActive/);
  assert.match(pages, /getTranche4ProductionModelIfActive/);
  assert.match(pages, /variant="product"/);
  assert.doesNotMatch(component, /Operating Income|Net Income|Operating Cash Flow|Total Debt|debt issued|borrowing capacity/i);
  assert.doesNotMatch(component, /tranche4-candidate-preview/);
});

test("V3 product surfaces expose comparison, trend, data, and accessibility contracts", () => {
  assert.match(component, /AI Stack economics/);
  assert.match(component, /not AI-segment totals/);
  assert.match(`${component}\n${client}`, /not AI-specific spending/);
  assert.match(client, /Select up to four companies/);
  assert.match(client, /horizontally scrollable on narrow screens/);
  assert.match(styles, /--pr-bg: #f3f1e9/);
  assert.match(styles, /@media \(max-width: 720px\)/);
});
