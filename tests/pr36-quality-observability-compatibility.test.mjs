import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path) => readFileSync(path);
const json = (path) => JSON.parse(read(path).toString("utf8"));
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const compatibility = json("data/contracts/quality/pr36_public_compatibility.json");
const contract = json("data/contracts/quality/pr36_observability_contract.json");
const report = json("data/quality/pr36_release_quality_report.json");

test("PR36 exact private contract and report bytes are copied and version bound", () => {
  assert.equal(hash(read("data/contracts/quality/pr36_observability_contract.json")), compatibility.privateContractSourceByteHash);
  assert.equal(hash(read("data/quality/pr36_release_quality_report.json")), compatibility.privateReportSourceByteHash);
  assert.equal(contract.contractVersion, "quality-observability@36.0.0");
  assert.equal(report.qualityReportVersion, "release-quality-report@36.0.0");
  assert.equal(report.reportHash, compatibility.reportSemanticHash);
});

test("PR36 public boundary is server-only, fail-closed, and does not recompute policy", () => {
  const adapter = read("src/server/quality-observability/contract.ts").toString("utf8");
  assert.match(adapter, /import "server-only"/);
  assert.match(adapter, /quality report hash mismatch/);
  assert.match(adapter, /release binding mismatch/);
  assert.match(adapter, /production claim rejected/);
  assert.doesNotMatch(adapter, /evaluateSlo|evaluateDrift|suspendCertification/);
  assert.equal(compatibility.browserPolicyRecomputationAllowed, false);
  assert.equal(compatibility.liveTransportEnabled, false);
  assert.equal(compatibility.publicationEnabled, false);
});

test("PR36 safe public quality summary keeps missing evidence visible", () => {
  assert.equal(report.measurableSloCount, 1);
  assert.equal(report.insufficientSampleCount, 1);
  assert.equal(report.unmeasurableCount, 2);
  assert.equal(report.productionHistoryClaimed, false);
  assert.equal(report.externalAlertDeliveryEnabled, false);
  assert.equal(report.publicationEnabled, false);
  assert.ok(report.knownLimitations.some((item) => item.includes("do not establish production SLO attainment")));
});

test("PR36 public and protected admin surfaces are accessible and responsive by contract", () => {
  const page = read("app/data/quality/page.tsx").toString("utf8");
  const component = read("components/quality-observability.tsx").toString("utf8");
  const admin = read("app/admin/health/page.tsx").toString("utf8");
  const css = read("app/globals.css").toString("utf8");
  assert.match(page, /PublicQualitySummary/);
  assert.match(component, /aria-labelledby="quality-summary-heading"/);
  assert.match(component, /not production history/);
  assert.match(admin, /ProtectedAdminPage/);
  assert.match(admin, /AdminQualitySummary/);
  assert.match(css, /quality-stat-grid/);
  assert.match(css, /max-width: 720px[\s\S]*quality-stat-grid/);
  assert.match(css, /prefers-reduced-motion/);
});

test("PR36 copied payload excludes secrets, private paths, prompts, and stack traces", () => {
  const bytes = Buffer.concat([read("data/contracts/quality/pr36_observability_contract.json"), read("data/quality/pr36_release_quality_report.json")]).toString("utf8");
  assert.doesNotMatch(bytes, /authorization|cookie|service_role|signed_url|revieweremail|stack trace|file:\/\/|\/Users\/|\/private\//i);
});
