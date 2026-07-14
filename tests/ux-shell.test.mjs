import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const publicRoutes = ["/", "/companies", "/funding", "/revenue-debt", "/compute-infra", "/circularity", "/methodology", "/sources", "/downloads"];
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

test("static UX exposes trust and access warnings without backend code", () => {
  const components = readFileSync("components/ledger.tsx", "utf8");
  const appSources = [...publicRoutes, ...adminRoutes].map((route) => readFileSync(pagePath(route), "utf8")).join("\n");

  for (const component of ["AppShell", "TopNav", "HeroSection", "KpiCard", "ConfidenceBadge", "FreshnessBadge", "SourceLink", "DataQualityPanel", "FinancialChartCard", "DataTable", "SampleDataWarning"]) {
    assert.match(components, new RegExp(`function ${component}\\b`));
  }
  assert.match(components, /Static admin preview/);
  assert.match(components, /Authentication and write actions are intentionally unavailable/);
  assert.doesNotMatch(`${components}\n${appSources}`, /src\/server\/db|SUPABASE_SERVICE_ROLE|SUPABASE_SECRET/);
});

test("public dashboard renders progressive trust states with visible disclosure", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  const components = readFileSync("components/ledger.tsx", "utf8");

  assert.match(home, /PublicTrustLedger/);
  assert.match(home, /listPublicTrustRecords/);
  assert.match(home, /getHeadlineRecords/);
  assert.match(components, /Source-attributed — not yet human verified/);
  assert.match(components, /Human verified/);
  assert.match(components, /System validated/);
  assert.match(components, /Conflict detected/);
  assert.match(components, /verified lane follows explicit private-engine decisions/);
  assert.match(components, /TrustDecisionSummary/);
  assert.match(components, /disclosure\.label/);
});

test("every route declares canonical metadata", () => {
  for (const route of [...publicRoutes, ...adminRoutes]) {
    assert.match(readFileSync(pagePath(route), "utf8"), /routeMetadata\(route\.title, route\.description, route\.href\)/, route);
  }
});
