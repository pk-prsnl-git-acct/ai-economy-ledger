import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = "public/release11-presentation";
const expected = {
  releaseInputSetHash: "e0466b671f316b7642db9409f243630c8149f8f064b55dd641b5da9f05aa9686",
  candidateId: "set1-candidate:8:4a293cead8f3d491c723",
  candidateManifestHash: "3afdae1fcd8dc76d0e54d75e256979ac8cf55e37eab414351786bb08abc0ecaf",
  observationCount: 1402
};
const hash = (value) => createHash("sha256").update(value).digest("hex");

test("Release 11 presentation assets remain hash-bound to unchanged Candidate 8 bytes", () => {
  const index = JSON.parse(readFileSync(`${root}/index.json`, "utf8"));
  assert.deepEqual(index.binding, expected);
  assert.equal(index.pageSize, 50);
  assert.equal(index.pages.length, 29);
  assert.equal(index.pages[0].start, 0);
  assert.equal(index.pages.at(-1).end, 1402);

  for (const descriptor of index.artifacts) {
    const bytes = readFileSync(`${root}/${descriptor.path}`);
    assert.equal(bytes.byteLength, descriptor.byteLength, descriptor.path);
    assert.equal(hash(bytes), descriptor.sha256, descriptor.path);
  }

  const summary = JSON.parse(readFileSync(`${root}/summary.json`, "utf8"));
  assert.deepEqual(summary.binding, expected);
  assert.equal(summary.payload.manifest.candidateId, expected.candidateId);
  assert.equal(summary.payload.manifest.manifestHash, expected.candidateManifestHash);
  assert.equal(summary.payload.manifest.trustStateCounts.system_validated, 1402);
  assert.equal(summary.payload.manifest.trustStateCounts.human_verified ?? 0, 0);
  assert.deepEqual(summary.payload.observations, []);
  assert.deepEqual(summary.payload.interimHistory, []);
});

test("Data Explorer assets are bounded and cover each immutable observation once", () => {
  const index = JSON.parse(readFileSync(`${root}/index.json`, "utf8"));
  let count = 0;
  for (const page of index.pages) {
    const envelope = JSON.parse(readFileSync(`${root}/${page.path}`, "utf8"));
    assert.deepEqual(envelope.binding, expected);
    assert.ok(envelope.payload.length > 0 && envelope.payload.length <= 50, page.path);
    count += envelope.payload.length;
  }
  assert.equal(count, expected.observationCount);

  const search = JSON.parse(readFileSync(`${root}/observations/search-index.json`, "utf8"));
  assert.equal(search.payload.length, expected.observationCount);
  assert.equal(new Set(search.payload.map((entry) => entry.index)).size, expected.observationCount);
});
