import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("release detail loads production artifacts sequentially within the Worker CPU budget", () => {
  const page = readFileSync("app/data/releases/[releaseId]/page.tsx", "utf8");
  assert.doesNotMatch(page, /Promise\.all/);
  assert.match(page, /manifest = await getReleaseManifest\(releaseId\)/);
  assert.match(page, /records = \(await getReleaseRecords\(releaseId, "latest_source_attributed"\)\)\.records/);
  assert.match(page, /corrections = await getCorrections\(\)/);
});
