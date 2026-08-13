import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("release API does not load the release manifest concurrently in one Worker invocation", () => {
  const route = readFileSync("app/api/data/releases/[releaseId]/route.ts", "utf8");
  assert.doesNotMatch(route, /Promise\.all/);
  assert.match(route, /manifest = await getReleaseManifest\(releaseId\)/);
  assert.match(route, /artifact = await getArtifact\(releaseId, "manifest\.json"\)/);
});
