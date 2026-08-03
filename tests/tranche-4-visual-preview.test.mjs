import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/tranche-4-candidate-preview/page.tsx", "utf8");
const companyPage = readFileSync("app/tranche-4-candidate-preview/companies/[entityKey]/page.tsx", "utf8");
const artifactRoute = readFileSync("app/tranche-4-candidate-preview/artifacts/[artifactName]/route.ts", "utf8");
const component = readFileSync("components/tranche4-candidate-preview.tsx", "utf8");
const model = readFileSync("src/server/tranche4/preview-model.ts", "utf8");
const styles = readFileSync("app/globals.css", "utf8");

test("Tranche 4 candidate preview is explicitly non-production gated", () => {
  assert.match(model, /TRANCHE4_CANDIDATE_PREVIEW_ENABLED/);
  assert.match(page, /tranche4PreviewEnabled\(\)/);
  assert.match(page, /notFound\(\)/);
  assert.match(companyPage, /tranche4PreviewEnabled\(\)/);
  assert.match(companyPage, /notFound\(\)/);
  assert.match(artifactRoute, /tranche4PreviewEnabled\(\)/);
  assert.match(artifactRoute, /notFound\(\)/);
  assert.doesNotMatch(readFileSync("components/ledger.tsx", "utf8"), /tranche-4-candidate-preview/);
});

test("Tranche 4 visual product renders from candidate-bound Contract D artifacts", () => {
  for (const artifact of [
    "latest-annual-company-comparison.json",
    "latest-interim-observations.json",
    "recent-annual-company-histories.json",
    "company-wide-capex-intensity.json",
    "ecosystem-coverage-map.json",
    "coverage-freshness-readiness-matrix.json",
    "trust-evidence-matrix.json",
    "release-change-view.json"
  ]) {
    assert.match(model, new RegExp(artifact.replaceAll(".", "\\.")));
  }
  assert.match(component, /CandidatePreviewHome/);
  assert.match(component, /CandidateCompanyPage/);
  assert.match(component, /CandidateObservations/);
  assert.match(component, /CandidateDataCenter/);
  assert.match(component, /CandidateMethodology/);
  assert.doesNotMatch(component, /const companies = \[/);
  assert.match(model, /getTranche4CanonicalDisplayName/);
  assert.match(model, /trustCounts/);
  assert.match(component, /humanMetricLabel/);
});

test("Tranche 4 visual product preserves evidence-gated unavailable states and forbidden claims", () => {
  assert.match(component, /Layer financial totals are intentionally absent/);
  assert.match(component, /Company-wide capex intensity/);
  assert.match(component, /Unsupported views are explicit unavailable contracts/);
  assert.match(component, /not AI-specific allocations/);
  assert.match(component, /Missing remains unavailable, never zero/);
  assert.match(component, /canonical previews/);
  assert.match(component, /Evidence references and source links/);
  assert.match(component, /row\.source\.lawfulSourceUrl/);
  assert.match(component, /row\.evidence\.evidenceSetKey/);
  assert.doesNotMatch(component.toLowerCase(), /market-wide ai spending/);
  assert.doesNotMatch(component.toLowerCase(), /total ecosystem revenue/);
  assert.doesNotMatch(component.toLowerCase(), /estimated ai allocation/);
});

test("Tranche 4 visual product provides accessible tables and responsive layout hooks", () => {
  assert.match(component, /aria-label/);
  assert.match(component, /className="table-scroll"/);
  assert.match(component, /<table className="candidate-table"/);
  assert.match(component, /view\.downloads\.json/);
  assert.match(component, /view\.downloads\.csv/);
  assert.match(component, /encodeURIComponent\(view\.downloads\.json\)/);
  assert.match(artifactRoute, /Content-Disposition/);
  assert.match(artifactRoute, /X-Tranche-4-Artifact-Hash/);
  assert.match(styles, /\.candidate-bars/);
  assert.match(styles, /\.table-scroll/);
  assert.match(styles, /\.candidate-table/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*candidate-grid/);
});

test("Tranche 4 candidate preview does not mutate production routes or deployment controls", () => {
  for (const file of ["app/page.tsx", "app/market/page.tsx", "app/data/page.tsx", "app/api/data/analytics/route.ts", "app/api/data/releases/route.ts"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /tranche4|candidate-preview|set1-candidate/i, file);
  }
  for (const file of ["wrangler.toml", "open-next.config.ts", "package.json"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /TRANCHE4_CANDIDATE_PREVIEW_ENABLED=true/, file);
  }
});
