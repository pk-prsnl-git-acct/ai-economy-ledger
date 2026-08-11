import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = readFileSync("app/tranche-4-candidate-preview/page.tsx", "utf8");
const companyPage = readFileSync("app/tranche-4-candidate-preview/companies/[entityKey]/page.tsx", "utf8");
const artifactRoute = readFileSync("app/tranche-4-candidate-preview/artifacts/[artifactName]/route.ts", "utf8");
const component = readFileSync("components/tranche4-candidate-preview.tsx", "utf8");
const model = readFileSync("src/server/tranche4/preview-model.ts", "utf8");
const styles = readFileSync("app/globals.css", "utf8");
const labels = readFileSync("src/ui/public-labels.ts", "utf8");
const productionModel = readFileSync("src/server/tranche4/production-model.ts", "utf8");

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
  assert.match(component, /formatFinancialValue/);
  assert.match(component, /formatExactFinancialValue/);
  assert.match(component, /AI Capex Race/);
  assert.match(component, /Scale vs Investment/);
  assert.match(component, /R&D Intensity/);
  assert.match(component, /What Changed This Release/);
  assert.match(component, /InvestmentScatter/);
  assert.match(component, /CompanyDataEvidence/);
  assert.match(component, /CandidateDataPathways/);
  assert.match(model, /buildRdIntensity/);
  assert.match(model, /buildScaleVsInvestment/);
  assert.match(model, /same annual fiscal year/);
  assert.doesNotMatch(component, /company_wide_capex_intensity/);
});

test("Tranche 4 visual product preserves evidence-gated unavailable states and forbidden claims", () => {
  assert.match(component, /No layer financial totals are calculated/);
  assert.match(component, /Company-wide capex intensity/);
  assert.match(component, /not AI-specific capex/);
  assert.match(component, /This is not AI-specific spending/);
  assert.match(component, /Unsupported views are explicit unavailable contracts/);
  assert.match(component, /not AI-specific allocations/);
  assert.match(component, /Missing remains unavailable, never zero/);
  assert.doesNotMatch(component, /<CandidateDirectory model=\{model\}\s*\/>/);
  assert.doesNotMatch(component, /<CandidateObservations model=\{model\}/);
  assert.doesNotMatch(component, /<CandidateDataCenter model=\{model\}/);
  assert.match(component, /Evidence references and source links/);
  assert.match(component, /row\.source\.lawfulSourceUrl/);
  assert.match(component, /row\.evidence\.evidenceSetKey/);
  assert.doesNotMatch(component.toLowerCase(), /market-wide ai spending/);
  assert.doesNotMatch(component.toLowerCase(), /total ecosystem revenue/);
  assert.doesNotMatch(component.toLowerCase(), /estimated ai allocation/);
});

test("Tranche 4 visual product provides accessible tables and responsive layout hooks", () => {
  assert.match(component, /aria-label/);
  assert.match(component, /title=\{exactMoney/);
  assert.match(component, /className="table-scroll"/);
  assert.match(component, /<table className="candidate-table"/);
  assert.match(component, /view\.downloads\.json/);
  assert.match(component, /view\.downloads\.csv/);
  assert.match(component, /encodeURIComponent\(view\.downloads\.json\)/);
  assert.match(artifactRoute, /Content-Disposition/);
  assert.match(artifactRoute, /X-Tranche-4-Artifact-Hash/);
  assert.match(styles, /\.candidate-bars/);
  assert.match(styles, /\.candidate-line-chart/);
  assert.match(styles, /\.candidate-scatter/);
  assert.match(styles, /\.investment-comparison/);
  assert.match(styles, /\.candidate-disclosure/);
  assert.match(styles, /\.candidate-data-actions/);
  assert.match(styles, /\.table-scroll/);
  assert.match(styles, /\.candidate-table/);
  assert.match(styles, /@media \(max-width: 720px\)[\s\S]*candidate-grid/);
});

test("Tranche 4 UX uses centralized public labels and preserves compatibility routes", () => {
  const siteMap = readFileSync("src/ui/site-map.ts", "utf8");
  const observationsPage = readFileSync("app/observations/page.tsx", "utf8");
  const shell = readFileSync("components/ledger.tsx", "utf8");

  assert.match(labels, /system_validated/);
  assert.match(labels, /System validated/);
  assert.match(labels, /taxonomy-v2@tranche-4/);
  assert.match(siteMap, /label: "Trends"/);
  assert.match(siteMap, /href: "\/observations"/);
  assert.match(observationsPage, /ObservationLedger/);
  assert.match(shell, /\["\/", "\/ai-stack", "\/market", "\/companies", "\/data"\]/);
  assert.match(shell, /\/sources/);
  assert.match(shell, /\/methodology/);
});

test("Tranche 4 production wiring is active-release gated and does not depend on the preview flag", () => {
  for (const file of ["app/page.tsx", "app/ai-stack/page.tsx", "app/market/page.tsx", "app/companies/page.tsx", "app/companies/[entityKey]/page.tsx", "app/data/page.tsx", "app/observations/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /getTranche4ProductionModelIfActive/, file);
    assert.doesNotMatch(source, /TRANCHE4_CANDIDATE_PREVIEW_ENABLED|tranche4PreviewEnabled/, file);
  }
  assert.match(productionModel, /TRANCHE4_CANDIDATE_MANIFEST_HASH/);
  assert.match(productionModel, /getProductionReleaseTransport/);
  assert.match(productionModel, /active\.manifestHash !== TRANCHE4_CANDIDATE_MANIFEST_HASH/);
  assert.match(productionModel, /candidate trust root mismatch/);
  for (const file of ["wrangler.toml", "open-next.config.ts", "package.json"]) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /TRANCHE4_CANDIDATE_PREVIEW_ENABLED=true/, file);
  }
});
