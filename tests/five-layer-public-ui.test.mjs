import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

function formatted(values) {
  const code = `import { formatFinancialValue, formatExactFinancialValue } from "./src/ui/format-financial-value.ts"; console.log(JSON.stringify([${values.map((value) => `formatFinancialValue(${JSON.stringify(value)})`).join(",")}, formatFinancialValue(-4200000000), formatFinancialValue(null), formatFinancialValue(0), formatExactFinancialValue(84900000000)]));`;
  return JSON.parse(execFileSync(process.execPath, ["--experimental-strip-types", "-e", code], { encoding: "utf8" }));
}

test("shared financial formatting preserves compact, exact, null, zero, and negative semantics", () => {
  assert.deepEqual(formatted([850, 12450, 3280000, 84900000000, 1250000000000]), ["$850", "$12.5K", "$3.3M", "$84.9B", "$1.25T", "-$4.2B", "Unavailable", "$0", "$84,900,000,000"]);
});

test("five-layer public surfaces use released records and keep allocation boundaries explicit", () => {
  const stack = readFileSync("src/ui/ai-stack.ts", "utf8");
  const companies = readFileSync("components/production-ledger.tsx", "utf8");
  const events = readFileSync("app/events/page.tsx", "utf8");
  const detail = readFileSync("app/companies/[entityKey]/page.tsx", "utf8");

  assert.match(stack, /metricFamilies/);
  assert.match(stack, /sourceCount/);
  assert.match(stack, /No production observations are available for this layer/);
  assert.match(companies, /CompanyDirectory/);
  assert.match(companies, /ObservationLedger/);
  assert.match(companies, /Primary AI-stack layer/);
  assert.match(companies, /company-wide revenue or capital expenditure is not assigned to a specific layer/);
  assert.match(companies, /Source-attributed/);
  assert.match(detail, /decodeURIComponent\(entityKey\)/);
  assert.match(events, /getReleaseRecords\(releaseId, "latest_source_attributed"\)/);
  assert.doesNotMatch(`${companies}\n${events}`, /manifest|truth class|component record reference/i);
});

test("market, source, methodology, and release-detail surfaces remain release-bound and public-safe", () => {
  const releaseIndex = readFileSync("app/data/releases/page.tsx", "utf8");
  const releaseDetail = readFileSync("app/data/releases/[releaseId]/page.tsx", "utf8");
  const market = readFileSync("app/market/page.tsx", "utf8");
  const sources = readFileSync("app/sources/page.tsx", "utf8");
  const methodology = readFileSync("app/methodology/page.tsx", "utf8");
  const presentation = readFileSync("components/release-trust.tsx", "utf8");

  assert.match(releaseIndex, /encodeURIComponent\(release\.releaseId\)/);
  assert.match(releaseDetail, /getReleaseManifest\(releaseId\)/);
  assert.match(releaseDetail, /getSources\(releaseId\)/);
  assert.match(market, /getReleaseRecords\(releaseId, "latest_source_attributed"\)/);
  assert.match(sources, /getSources\(releaseId\)/);
  assert.match(methodology, /getReleaseManifest\(await currentReleaseId\(\)\)/);
  assert.match(presentation, /Not yet supported by this release/);
  assert.match(presentation, /Company-wide revenue and capital expenditure are not allocated/);
  assert.match(presentation, /encodeURIComponent\(manifest\.releaseId\)/);
  assert.match(presentation, /artifact\.mediaType\.startsWith\("application\/json"\)/);
  assert.doesNotMatch(`${market}\n${sources}\n${methodology}\n${presentation}`, /SampleDataWarning|Registry preview|Core equation · preview/);
});

test("planned coverage routes do not retain sample or prototype presentation", () => {
  const ledger = readFileSync("components/ledger.tsx", "utf8");
  const routes = ["app/funding/page.tsx", "app/revenue-debt/page.tsx", "app/compute-infra/page.tsx", "app/circularity/page.tsx"].map((file) => readFileSync(file, "utf8")).join("\n");
  assert.match(ledger, /UnavailableCoveragePage/);
  assert.match(ledger, /Not yet supported by this release/);
  assert.match(ledger, /Planned coverage/);
  assert.doesNotMatch(routes, /PlaceholderPage|SampleDataWarning|Prototype/);
  assert.match(routes, /UnavailableCoveragePage/g);
});
