import { existsSync, readdirSync } from "node:fs";
import {
  assertDemoImportIsSampleOnly,
  loadDemoImport,
  metricTotalsForVerifiedObservations,
  validateImportRows,
  validateTemplateHeaders,
} from "../import/import-contracts.mjs";

if (!existsSync("data")) {
  console.log("No data directory yet; data validation activates with the import-template PR.");
  process.exit(0);
}

const entries = readdirSync("data", { recursive: true });
const forbidden = entries.filter((entry) => /(^|\/)\.env|private|secret/i.test(String(entry)));
if (forbidden.length) {
  console.error(`Potential private files under data/: ${forbidden.join(", ")}`);
  process.exit(1);
}

const errors = validateTemplateHeaders(process.cwd());
const demoImport = loadDemoImport(process.cwd());
errors.push(...validateImportRows(demoImport));

try {
  assertDemoImportIsSampleOnly(demoImport);
  const demoTotals = metricTotalsForVerifiedObservations(demoImport.metric_observations);
  if (Object.keys(demoTotals).length !== 0) {
    errors.push(`Demo import produced verified totals: ${JSON.stringify(demoTotals)}`);
  }
} catch (error) {
  errors.push(error instanceof Error ? error.message : String(error));
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log("Data directory safety and sample import isolation checks passed.");
