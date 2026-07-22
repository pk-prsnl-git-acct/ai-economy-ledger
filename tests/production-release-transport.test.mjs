import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import test from "node:test";

const transport = readFileSync("src/server/data-releases/production-transport.ts", "utf8");
const runtime = readFileSync("src/server/data-releases/runtime.ts", "utf8");
const quality = readFileSync("src/server/quality-observability/runtime.ts", "utf8");
const analytics = readFileSync("src/server/market-intelligence/runtime.ts", "utf8");
const wrangler = readFileSync("wrangler.toml", "utf8");

test("production transport is private-service-bound and fails closed", () => {
  assert.match(wrangler, /binding\s*=\s*"DATA_ENGINE"[\s\S]*service\s*=\s*"ai-economy-ledger-data-engine"/);
  assert.match(transport, /PUBLIC_RELEASE_TOKEN/);
  assert.match(transport, /Cloudflare context unavailable in production mode/);
  assert.match(transport, /production bindings unavailable/);
  assert.match(transport, /readonly status = 503/);
  assert.doesNotMatch(transport, /SUPABASE_SERVICE_ROLE|DATABASE_URL|OPERATOR_TOKEN/);
  assert.match(wrangler, /\[env\.preview\.vars\][\s\S]*RELEASE_TRANSPORT_MODE\s*=\s*"embedded"/);
  assert.match(readFileSync("scripts/ci/cloudflare-preview-smoke.mjs", "utf8"), /"--env", "preview"/);
});

test("published artifacts remain exact-release and hash bound", () => {
  assert.match(transport, /x-release-id/);
  assert.match(transport, /manifest trust-root mismatch/);
  assert.match(transport, /quality trust-root mismatch/);
  assert.match(transport, /analytics trust-root mismatch/);
  assert.match(transport, /artifact byte-length mismatch/);
  assert.match(transport, /artifact hash mismatch/);
  assert.match(transport, /private material detected/);
  assert.match(runtime, /record\.sampleData \|\| !record\.visibilityEligible/);
  assert.match(runtime, /lane === "verified" && !record\.verifiedLaneEligible/);
});

test("encoded release path IDs normalize once and malformed encodings fail closed", () => {
  assert.match(runtime, /export function normalizeReleaseId/);
  assert.match(runtime, /decodeURIComponent\(releaseId\)/);
  assert.match(runtime, /const normalizedReleaseId = normalizeReleaseId\(releaseId\)/);
  assert.match(runtime, /throw new Error\("Unknown production release"\)/);
});

test("quality and analytics are bound to the same release trust roots", () => {
  assert.match(quality, /report\.releaseManifestHash !== index\.manifestHash/);
  assert.match(quality, /report\.criticalBreachCount !== 0/);
  assert.match(quality, /report\.coverageSummary\.fixtureOnly/);
  assert.ok(transport.includes('sha256(`${canonical(quality)}\\n`)'));
  assert.match(analytics, /manifest\.releaseManifestHash !== index\.manifestHash/);
  assert.match(analytics, /manifest\.qualityReportHash !== index\.qualityReportHash/);
  assert.match(analytics, /manifest\.publicationEnabled/);
  assert.match(analytics, /unsupportedMarketWideTotalGenerated/);
});

test("public repository does not duplicate private persistence", () => {
  const migrations = readdirSync("supabase/migrations")
    .filter((name) => statSync(`supabase/migrations/${name}`).isFile())
    .map((name) => readFileSync(`supabase/migrations/${name}`, "utf8"))
    .join("\n");
  for (const privateTable of [
    "public_trust_records",
    "public_trust_state_history",
    "review_cases",
    "review_decisions",
    "record_revisions",
    "visibility_policies",
    "visibility_policy_history",
  ]) {
    assert.doesNotMatch(migrations, new RegExp(`CREATE TABLE[^;]+${privateTable}`, "i"));
  }
});

test("pre-publication pages render an intentional unavailable state", () => {
  const panel = readFileSync("components/data-release.tsx", "utf8");
  assert.match(panel, /Production \{surface\} is not published yet/);
  assert.match(panel, /No embedded fixture, candidate-only, or partial private data has been substituted/);
  assert.match(transport, /isProductionReleaseUnavailable/);

  for (const file of [
    "app/data/page.tsx",
    "app/data/releases/page.tsx",
    "app/data/releases/[releaseId]/page.tsx",
    "app/data/coverage/page.tsx",
    "app/data/sources/page.tsx",
    "app/data/revisions/page.tsx",
    "app/data/corrections/page.tsx",
    "app/market/page.tsx",
    "app/events/page.tsx",
    "app/companies/page.tsx",
    "app/relationships/page.tsx",
    "components/quality-observability.tsx",
  ]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /isProductionReleaseUnavailable/);
    assert.match(source, /ReleaseUnavailablePanel/);
  }
});
