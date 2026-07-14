import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";

const directory = "data/analytics/pr37_release_candidate";
const read = (name) => readFileSync(`${directory}/${name}`);
const json = (name) => JSON.parse(read(name));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const compatibility = JSON.parse(readFileSync("data/contracts/analytics/pr37_public_compatibility.json", "utf8"));
const contractBytes = readFileSync("data/contracts/analytics/pr37_market_intelligence_contract.json");
const contract = JSON.parse(contractBytes);
const manifest = json("analytics-manifest.json");
const catalog = json("view-catalog.json");

test("PR37 copies the exact private contract and analytical manifest trust root", () => {
  assert.equal(hash(contractBytes), compatibility.privateContractSourceByteHash);
  assert.equal(hash(read("analytics-manifest.json")), compatibility.analyticsManifestSourceByteHash);
  assert.equal(contract.contractVersion, "market-intelligence@37.0.0");
  assert.equal(manifest.buildVersion, "analytical-build@37.0.0");
  assert.equal(compatibility.privateMergeCommit, "2703363f6b444b438b7e1c23704a2845413896e1");
});

test("PR37 public boundary remains server-only, fixture-backed, and non-publishing", () => {
  const adapter = readFileSync("src/server/market-intelligence/contract.ts", "utf8");
  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /contractSource\.base64/);
  assert.match(adapter, /listReleases/);
  assert.match(adapter, /getReleaseRecords/);
  assert.match(adapter, /missing exact PR34 component binding/);
  assert.match(adapter, /releaseManifestHash/);
  assert.match(adapter, /qualityReportHash/);
  assert.match(adapter, /missing or extra analytical artifact/);
  assert.match(adapter, /private material detected/);
  assert.equal(contract.browserPolicyRecomputationAllowed, false);
  assert.equal(compatibility.browserPolicyRecomputationAllowed, false);
  assert.equal(compatibility.livePrivateTransportEnabled, false);
  assert.equal(compatibility.publicationEnabled, false);
  assert.equal(manifest.publicationEnabled, false);
});

test("PR37 artifact set, descriptors, checksums, and byte lengths reconcile", () => {
  const names = readdirSync(directory).sort();
  assert.deepEqual(names, [...manifest.artifactNames].sort());
  assert.equal(names.length, 16);
  const checksums = json("analytics-checksums.json");
  for (const descriptor of manifest.descriptors) {
    const bytes = read(descriptor.name);
    assert.equal(bytes.byteLength, descriptor.byteLength, descriptor.name);
    assert.equal(hash(bytes), descriptor.sha256, descriptor.name);
    if (descriptor.name !== "analytics-checksums.json") assert.equal(checksums.artifacts[descriptor.name], descriptor.sha256, descriptor.name);
  }
});

test("PR37 availability stays private-authored and current scope is honest", () => {
  assert.equal(catalog.views.length, 11);
  assert.equal(catalog.views.filter((view) => view.availabilityState === "available_with_limitations").length, 4);
  assert.equal(catalog.views.some((view) => view.availabilityState === "available"), false);
  for (const view of catalog.views) {
    assert.ok(contract.availabilityStates.includes(view.availabilityState));
    assert.ok(view.reasonCodes.length > 0);
    assert.equal(view.lastEvaluatedRelease, manifest.releaseId);
    assert.equal(view.qualityState.overallStatus, "shadow");
  }
});

test("PR37 unavailable values are never coerced into zero or speculative graphs", () => {
  for (const name of ["capital-inflow-series.json", "obligation-maturity-series.json", "recognized-vs-announced.json", "compute-price-index.json", "power-facility-pipeline.json", "relationship-graph.json"]) {
    const artifact = json(name);
    assert.deepEqual(artifact.points, []);
    assert.notEqual(artifact.availability.availabilityState, "available");
    assert.equal(JSON.stringify(artifact).includes('"value":0'), false);
  }
  assert.equal(manifest.unsupportedMarketWideTotalGenerated, false);
});

test("PR37 event records preserve exact safe lineage and truth/trust separation", () => {
  const ledger = json("economic-event-ledger.json");
  assert.equal(ledger.records.length, 6);
  assert.deepEqual(new Set(ledger.records.map((record) => record.truthClass)), new Set(["human_verified_fact", "reported_fact"]));
  for (const record of ledger.records) {
    assert.equal(record.releaseId, compatibility.releaseId);
    assert.ok(record.componentRecordRefs[0].includes("@"));
    assert.ok(record.evidenceSafeRefs.length > 0);
    assert.ok(record.sourceCount > 0);
    if (record.trustStateSummary !== "human_verified") assert.notEqual(record.truthClass, "human_verified_fact");
  }
});

test("PR37 mixed metrics and unknown AI allocation do not produce a value", () => {
  const split = json("ai-relevance-trust-split.json");
  assert.ok(split.groups.every((group) => group.aiRelevance === "unknown"));
  assert.ok(split.groups.every((group) => group.value === null && group.truthClass === "unavailable"));
  assert.ok(split.groups.every((group) => group.reason.includes("cannot be summed")));
});

test("PR37 coverage names the limited denominator and company profiles disclaim completeness", () => {
  const coverage = json("coverage-freshness-heatmap.json");
  const profiles = json("entity-profiles.json");
  assert.equal(coverage.summary.expected, 60);
  assert.equal(coverage.summary.covered, 4);
  assert.equal(coverage.summary.percentage, "6.67");
  assert.equal(profiles.entities.length, 5);
  assert.ok(profiles.entities.every((profile) => profile.limitation === "Not a complete financial statement."));
});

test("PR37 UI and APIs expose limited states without browser recomputation", () => {
  for (const file of ["app/market/page.tsx", "app/events/page.tsx", "app/companies/page.tsx", "app/relationships/page.tsx", "app/api/data/analytics/route.ts", "app/api/data/analytics/[artifact]/route.ts"]) {
    assert.doesNotThrow(() => readFileSync(file));
  }
  const component = readFileSync("components/market-intelligence.tsx", "utf8");
  assert.match(component, /Missing values are unavailable, never zero/);
  assert.match(component, /Mixed metrics are not aggregated/);
  assert.doesNotMatch(component, /use client/);
  const relationship = readFileSync("app/relationships/page.tsx", "utf8");
  assert.match(relationship, /does not draw a speculative network/);
  assert.match(readFileSync("app/globals.css", "utf8"), /prefers-reduced-motion[\s\S]*availability-card \{ animation: none/);
});

test("PR37 copied bundle and adapter contain no private material or credentials", () => {
  const bytes = Buffer.concat(readdirSync(directory).map((name) => read(name))).toString("utf8").toLowerCase();
  for (const prohibited of ["authorization", "service_role", "signed_url", "/users/", "/private/", "revieweremail"]) assert.equal(bytes.includes(prohibited), false, prohibited);
  assert.equal(bytes.includes('"publicationenabled":true'), false);
});
