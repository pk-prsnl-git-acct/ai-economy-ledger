import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const publicRoutes = ["/", "/ai-stack", "/companies", "/funding", "/revenue-debt", "/compute-infra", "/circularity", "/methodology", "/sources", "/downloads"];
const adminRoutes = ["/admin", "/admin/review", "/admin/settings/data-trust", "/admin/review-queue", "/admin/sources", "/admin/companies", "/admin/import", "/admin/claims", "/admin/metric-revisions", "/admin/health", "/admin/update-log"];

function pagePath(route) {
  return route === "/" ? "app/page.tsx" : `app${route}/page.tsx`;
}

test("all required public and admin route files exist", () => {
  for (const route of [...publicRoutes, ...adminRoutes]) {
    assert.equal(existsSync(pagePath(route)), true, `missing ${route}`);
  }
});

test("route map is complete and navigation uses it", () => {
  const siteMap = readFileSync("src/ui/site-map.ts", "utf8");
  const components = readFileSync("components/ledger.tsx", "utf8");

  for (const route of [...publicRoutes, ...adminRoutes]) {
    assert.match(siteMap, new RegExp(`href: ["']${route.replaceAll("/", "\\/")}["']`));
  }
  assert.match(components, /publicRoutes/);
  assert.match(components, /adminRoutes/);
  assert.match(components, /RouteDirectory/);
});

test("public UX keeps static admin previews separate from release-bound surfaces", () => {
  const components = readFileSync("components/ledger.tsx", "utf8");
  const appSources = [...publicRoutes, ...adminRoutes].map((route) => readFileSync(pagePath(route), "utf8")).join("\n");

  for (const component of ["AppShell", "TopNav", "HeroSection", "ConfidenceBadge", "SourceLink"]) {
    assert.match(components, new RegExp(`function ${component}\\b`));
  }
  assert.match(components, /Static admin preview/);
  assert.match(components, /Authentication and write actions are intentionally unavailable/);
  assert.doesNotMatch(`${components}\n${appSources}`, /src\/server\/db|SUPABASE_SERVICE_ROLE|SUPABASE_SECRET/);
});

test("production overview binds directly to the current public release", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  const components = readFileSync("components/ledger.tsx", "utf8");
  const overview = readFileSync("components/five-layer-overview.tsx", "utf8");
  const taxonomy = readFileSync("src/ui/ai-stack.ts", "utf8");
  const formatter = readFileSync("src/ui/format-financial-value.ts", "utf8");

  assert.match(home, /currentReleaseId/);
  assert.match(home, /getReleaseRecords/);
  assert.match(home, /FiveLayerStack/);
  assert.match(components, /\["\/", "\/ai-stack", "\/companies", "\/events", "\/market", "\/data", "\/sources", "\/methodology"\]/);
  assert.doesNotMatch(home, /SampleDataWarning|FinancialChartCard|DataTable|\$— sample/);
  assert.match(overview, /Financial observations remain company-wide unless released evidence supports a narrower allocation/);
  assert.match(overview, /record\.disclosure\.label/);
  assert.match(overview, /observation-card-list/);
  assert.match(taxonomy, /Semiconductors & Hardware/);
  assert.match(taxonomy, /Cloud, Compute & Physical Infrastructure/);
  assert.match(taxonomy, /Foundation Models/);
  assert.match(taxonomy, /AI Platforms, Data & Developer Tools/);
  assert.match(taxonomy, /Applications & Distribution/);
  assert.match(taxonomy, /primaryObservationCount/);
  assert.match(formatter, /notation: compact \? "compact" : "standard"/);
});

test("every route declares canonical metadata", () => {
  for (const route of [...publicRoutes, ...adminRoutes]) {
    assert.match(readFileSync(pagePath(route), "utf8"), /routeMetadata\(route\.title, route\.description, route\.href\)/, route);
  }
});
