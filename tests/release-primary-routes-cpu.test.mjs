import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const file of ["app/page.tsx", "app/market/page.tsx", "app/data/page.tsx", "app/sources/page.tsx", "app/api/data/analytics/route.ts", "src/server/market-intelligence/runtime.ts"]) {
  test(`${file} does not aggregate production release artifact reads concurrently`, () => {
    assert.doesNotMatch(readFileSync(file, "utf8"), /Promise\.all/);
  });
}

test("production routes load bounded generated presentation assets", () => {
  const production = readFileSync("src/server/tranche4/production-model.ts", "utf8");
  const presentation = readFileSync("src/server/tranche4/production-presentation.ts", "utf8");
  assert.doesNotMatch(production, /getTranche4PreviewModel|candidate-contract/);
  assert.match(production, /getRelease11SummaryModel/);
  assert.match(production, /getRelease11TrendsModel/);
  assert.match(production, /getRelease11CompanyModel/);
  assert.match(production, /getRelease11ObservationPage/);
  assert.match(presentation, /env\.ASSETS\.fetch/);
  assert.match(presentation, /pageSize !== 50/);
  assert.doesNotMatch(presentation, /Promise\.all/);
});
