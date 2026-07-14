import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const releaseDirectory = "data/releases/pr34_release_candidate";
const read = (name) => readFileSync(`${releaseDirectory}/${name}`);
const json = (name) => JSON.parse(read(name).toString("utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");

const contract = JSON.parse(readFileSync("data/contracts/release/pr34_public_dataset_release_contract.json", "utf8"));
const report = json("release-candidate-report.json");
const manifest = json("manifest.json");
const latest = json("records-latest-source-attributed.json");
const verified = json("records-verified.json");
const coverage = json("coverage.json");
const sources = json("sources.json");
const embeddedArtifacts = JSON.parse(readFileSync("src/server/data-releases/generated/pr34-release-artifacts.json", "utf8"));

function parseCsv(bytes) {
  const text = bytes.toString("utf8");
  assert.ok(text.endsWith("\r\n"), "CSV must end with CRLF");
  assert.doesNotMatch(text.replaceAll("\r\n", ""), /[\r\n]/, "CSV must use CRLF only");
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if (character === "\r" && text[index + 1] === "\n" && !quoted) {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      index += 1;
    } else {
      field += character;
    }
  }
  assert.equal(quoted, false, "CSV quotes must be balanced");
  return rows;
}

test("PR34 contract and release identity are exact and publication stays disabled", () => {
  assert.equal(contract.contractVersion, "public-dataset-release@34.0.0");
  assert.equal(contract.recordSchemaVersion, "public-record@34.0.0");
  assert.equal(contract.coverageSchemaVersion, "coverage@34.0.0");
  assert.equal(contract.correctionFeedSchemaVersion, "correction-feed@34.0.0");
  assert.equal(contract.sourceManifestVersion, "source-manifest@34.0.0");
  assert.equal(contract.authority, "private_data_engine");
  assert.equal(contract.publicPolicyRecomputationAllowed, false);
  assert.equal(contract.browserPrivateEngineAccessAllowed, false);
  assert.equal(report.releaseId, "dataset-release:1:5424bda5073c2a1a09cb");
  assert.equal(manifest.releaseId, report.releaseId);
  assert.equal(manifest.releaseStatus, "candidate");
  assert.equal(manifest.publicationEnabled, false);
  assert.equal(report.productionPublicationPerformed, false);
});

test("manifest trust root binds the complete artifact set byte for byte", () => {
  assert.equal(hash(read("manifest.json")), report.manifestHash);
  const directoryArtifacts = readdirSync(releaseDirectory)
    .filter((name) => name !== "release-candidate-report.json")
    .sort();
  assert.deepEqual(directoryArtifacts, [...contract.requiredArtifacts].sort());
  assert.deepEqual(manifest.artifacts.map(({ name }) => name).sort(), [...contract.requiredArtifacts].sort());
  assert.deepEqual(Object.keys(embeddedArtifacts).sort(), [...contract.requiredArtifacts].sort());
  for (const name of contract.requiredArtifacts) {
    const bytes = read(name);
    assert.equal(hash(bytes), report.artifactHashes[name], `${name} hash mismatch`);
    assert.equal(bytes.byteLength, report.artifactByteLengths[name], `${name} byte length mismatch`);
    const descriptor = manifest.artifacts.find((entry) => entry.name === name);
    assert.ok(descriptor, `${name} descriptor missing`);
    if (name !== "manifest.json") assert.equal(descriptor.byteLength, bytes.byteLength);
    if (descriptor.sha256) assert.equal(descriptor.sha256, report.artifactHashes[name]);
    assert.deepEqual(Buffer.from(embeddedArtifacts[name], "base64"), bytes, `${name} embedded bytes are stale`);
  }
});

test("JSON and RFC4180 CSV lanes have matching rows, exact decimals, and safe cells", () => {
  for (const [stem, payload] of [
    ["records-latest-source-attributed", latest],
    ["records-verified", verified],
  ]) {
    const rows = parseCsv(read(`${stem}.csv`));
    assert.equal(rows.length - 1, payload.records.length);
    const headers = rows[0];
    const stableIdIndex = headers.indexOf("stableRecordId");
    const valueIndex = headers.indexOf("value");
    assert.notEqual(stableIdIndex, -1);
    assert.notEqual(valueIndex, -1);
    assert.deepEqual(rows.slice(1).map((row) => row[stableIdIndex]).sort(), payload.records.map((record) => record.stableRecordId).sort());
    assert.deepEqual(rows.slice(1).map((row) => row[valueIndex]).sort(), payload.records.map((record) => record.value).sort());
    for (const row of rows.slice(1)) {
      for (const cell of row) assert.doesNotMatch(cell, /^[=+@]|^-(?!\d)/, "CSV formula-leading cell escaped incorrectly");
    }
  }
  for (const record of latest.records) {
    assert.equal(typeof record.value, "string");
    assert.match(record.value, /^-?\d+(?:\.\d+)?$/);
    assert.equal(record.sampleData, false);
    assert.equal(record.publicationExecutionEligible, false);
  }
});

test("progressive trust lanes remain distinct private-engine decisions", () => {
  assert.equal(latest.records.length, 6);
  assert.equal(verified.records.length, 4);
  assert.deepEqual(report.trustStateCounts, { human_verified: 4, source_attributed_unverified: 2 });
  assert.ok(latest.records.every((record) => record.visibilityEligible));
  assert.ok(verified.records.every((record) => record.verifiedLaneEligible));
  assert.ok(verified.records.every((record) => record.verificationMethod === "human_reviewed"));
  assert.ok(latest.records.filter((record) => !record.verifiedLaneEligible).every((record) => record.reviewRequired));
  assert.ok(latest.records.every((record) => !(record.trustState === "system_validated" && record.verificationMethod === "human_reviewed")));
});

test("coverage exposes the complete limited denominator without treating absence as zero", () => {
  assert.equal(coverage.expectedCellCount, 60);
  assert.equal(coverage.applicableDenominator, 60);
  assert.equal(coverage.coveredNumerator, 4);
  assert.equal(coverage.coveragePercentage, "6.67");
  assert.deepEqual(coverage.countsByCoverageState, { covered: 4, not_disclosed: 12, pending_review: 13, unknown: 31 });
  assert.equal(coverage.cells.length, 60);
  assert.ok(coverage.knownDenominatorLimitations.length >= 1);
  assert.ok(coverage.cells.filter((cell) => cell.coverageState === "covered").every((cell) => cell.stableRecordId));
  assert.ok(coverage.cells.filter((cell) => ["not_disclosed", "unknown"].includes(cell.coverageState)).every((cell) => cell.stableRecordId === null));
  assert.ok(coverage.cells.filter((cell) => cell.coverageState === "pending_review" && cell.stableRecordId).every((cell) => cell.bestTrustState === "source_attributed_unverified"));
});

test("source, revision, and correction artifacts are safe initial public feeds", () => {
  assert.equal(sources.schemaVersion, "source-manifest@34.0.0");
  assert.ok(sources.sources.length >= 1);
  assert.ok(sources.sources.every((source) => source.redistributionStatus.startsWith("official_public_")));
  assert.ok(sources.sources.every((source) => source.retentionStatus === "metadata_only_no_raw_payload_in_git"));
  assert.ok(sources.sources.every((source) => source.officialBaseUrl === null || source.officialBaseUrl.startsWith("https://")));
  assert.deepEqual(json("revisions.json").revisions, []);
  assert.deepEqual(json("corrections.json").corrections, []);
  const publicBytes = Buffer.concat(readdirSync(releaseDirectory).map((name) => read(name))).toString("utf8");
  assert.doesNotMatch(publicBytes, /service_role|signed_url|storage_key|revieweremail|file:\/\/|\/Users\/|\/private\//i);
});

test("server adapter validates fixed local bytes and never recomputes private policy", () => {
  const adapter = readFileSync("src/server/data-releases/contract.ts", "utf8");
  const http = readFileSync("src/server/data-releases/http.ts", "utf8");
  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /releaseIdPattern = \/\^dataset-release:/);
  assert.match(adapter, /decodeURIComponent\(releaseId\)/);
  assert.match(adapter, /\^\\d\{12\}\$/);
  assert.match(adapter, /JSON\.stringify\(\{ after, limit \}\)/);
  assert.match(adapter, /allowedArtifactNames/);
  assert.match(adapter, /contract\.requiredArtifacts/);
  assert.match(adapter, /embeddedArtifacts/);
  assert.doesNotMatch(adapter, /node:fs|readFileSync|readdirSync/);
  assert.match(adapter, /manifest trust-root mismatch/);
  assert.match(adapter, /missing or extra artifacts/);
  assert.match(adapter, /verified lane exceeds private decision/);
  assert.doesNotMatch(adapter, /maxErrorRate|maxShadowDisagreementRate|connectorImplementationHash/);
  assert.match(http, /max-age=31536000, immutable|RELEASE_CACHE_CONTROL/);
  assert.match(http, /max-age=60, must-revalidate|INDEX_CACHE_CONTROL/);
  assert.match(http, /if-none-match/);
  assert.match(http, /status: 304/);
  assert.match(http, /Content-Disposition/);
  assert.match(http, /Cache-Control": "no-store"/);
});

test("data pages and APIs cover releases, lanes, coverage, sources, history, and corrections", () => {
  const required = [
    "app/data/page.tsx",
    "app/data/releases/page.tsx",
    "app/data/releases/[releaseId]/page.tsx",
    "app/data/coverage/page.tsx",
    "app/data/sources/page.tsx",
    "app/data/revisions/page.tsx",
    "app/data/corrections/page.tsx",
    "app/api/data/releases/route.ts",
    "app/api/data/releases/[releaseId]/records/route.ts",
    "app/api/data/releases/[releaseId]/coverage/route.ts",
    "app/api/data/releases/[releaseId]/sources/route.ts",
    "app/api/data/releases/[releaseId]/revisions/route.ts",
    "app/api/data/corrections/route.ts",
  ];
  for (const path of required) assert.ok(readFileSync(path, "utf8").length > 0, `${path} missing`);
  const notice = readFileSync("components/data-release.tsx", "utf8");
  const coveragePage = readFileSync("app/data/coverage/page.tsx", "utf8");
  assert.match(notice, /not a live production publication/);
  assert.match(notice, /missing values are never converted to zero/);
  assert.match(coveragePage, /Denominator limits/);
  assert.match(coveragePage, /Coverage is not trust/);
  assert.match(readFileSync("app/globals.css", "utf8"), /prefers-reduced-motion[\s\S]*release-stat \{ animation: none/);
});
