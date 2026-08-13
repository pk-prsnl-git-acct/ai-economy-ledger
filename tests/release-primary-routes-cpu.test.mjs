import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

for (const file of ["app/page.tsx", "app/market/page.tsx", "app/data/page.tsx", "app/sources/page.tsx", "app/api/data/analytics/route.ts", "src/server/market-intelligence/runtime.ts"]) {
  test(`${file} does not aggregate production release artifact reads concurrently`, () => {
    assert.doesNotMatch(readFileSync(file, "utf8"), /Promise\.all/);
  });
}

test("the immutable Candidate 8 model is parsed once per Worker isolate", () => {
  const model = readFileSync("src/server/tranche4/preview-model.ts", "utf8");
  assert.match(model, /let cachedPreviewModel/);
  assert.match(model, /cachedPreviewModel \?\?= buildTranche4PreviewModel\(\)/);
  assert.match(model, /function buildTranche4PreviewModel\(\)/);
});
