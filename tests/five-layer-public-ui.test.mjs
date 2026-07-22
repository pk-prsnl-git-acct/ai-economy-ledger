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
