import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  assertDemoImportIsSampleOnly,
  importTemplates,
  loadDemoImport,
  metricTotalsForVerifiedObservations,
  validateImportRows,
  validateTemplateHeaders,
} from "../scripts/import/import-contracts.mjs";

test("import CSV templates preserve the reviewed header contract", () => {
  assert.equal(validateTemplateHeaders(process.cwd()).length, 0);
  assert.deepEqual(
    importTemplates.map((template) => template.name),
    [
      "companies",
      "metric_definitions",
      "source_registry",
      "source_documents",
      "claims",
      "metric_observations",
    ],
  );
});

test("demo import rows remain sample-only and valid", () => {
  const demoImport = loadDemoImport(process.cwd());

  assert.equal(validateImportRows(demoImport).length, 0);
  assert.doesNotThrow(() => assertDemoImportIsSampleOnly(demoImport));
  assert.deepEqual(metricTotalsForVerifiedObservations(demoImport.metric_observations), {});
});

test("sample observations are excluded from verified totals even beside approved rows", () => {
  const demoImport = loadDemoImport(process.cwd());
  const approvedFixture = {
    ...demoImport.metric_observations[0],
    observation_key: "approved-fixture-capital",
    review_state: "approved",
    is_sample: "false",
    normalized_value: "5",
  };

  assert.deepEqual(metricTotalsForVerifiedObservations([...demoImport.metric_observations, approvedFixture]), {
    "sample.capital_in": 5,
  });
});

test("sample workbook exists and mirrors the import-template sheet set", () => {
  const workbook = "data/sample/ai_economy_ledger_sample_import.xlsx";
  assert.equal(existsSync(workbook), true);

  const content = readFileSync(workbook);
  assert.equal(content.subarray(0, 2).toString("utf8"), "PK");

  const workbookXml = execFileSync("unzip", ["-p", workbook, "xl/workbook.xml"], { encoding: "utf8" });
  for (const template of importTemplates) {
    assert.match(workbookXml, new RegExp(`name="${template.name}"`));
  }
});
