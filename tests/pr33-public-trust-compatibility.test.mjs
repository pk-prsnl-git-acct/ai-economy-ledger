import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const contract = JSON.parse(readFileSync("data/contracts/public-trust/pr30_1a_public_trust_admin_review_contract.json", "utf8"));
const adapter = readFileSync("src/server/admin/public-trust/contract.ts", "utf8");
const ledger = readFileSync("components/ledger.tsx", "utf8");
const admin = readFileSync("components/admin.tsx", "utf8");
const page = readFileSync("app/page.tsx", "utf8");
const overview = readFileSync("components/five-layer-overview.tsx", "utf8");

test("public app copies the stable PR33 progressive-trust contract exactly", () => {
  assert.equal(contract.contractVersion, "public-trust-admin-review@33.0.0");
  assert.equal(contract.policyVersion, "public-trust-policy@33.0.0");
  assert.deepEqual(contract.progressiveTrustDecisionFields, [
    "publicVisibilityEligible",
    "verifiedLaneEligible",
    "headlineEligible",
    "publicationExecutionEligible",
    "autonomyLevel",
    "certificationState",
    "certificationKey",
    "autonomyDecisionKey",
    "promotionReasonCodes",
  ]);
  assert.equal(contract.publicRecordPayload.publicationExecutionEligible, false);
  assert.equal(contract.publicRecordPayload.publicationEnabled, false);
});

test("server-only adapter fails closed on stale versions and inconsistent decisions", () => {
  assert.match(adapter, /public-trust-admin-review@33\.0\.0/);
  assert.match(adapter, /export function parsePublicTrustRecord\(input: unknown\)/);
  assert.match(adapter, /invalid_progressive_trust_field/);
  assert.match(adapter, /publication_enabled_payload_rejected/);
  assert.match(adapter, /progressive_trust_contract_fields_mismatch/);
  assert.match(adapter, /human_verification_state_mismatch/);
  assert.match(adapter, /system_validation_certification_inactive/);
  assert.match(adapter, /inactive_certification_privilege/);
  assert.match(adapter, /publication_execution_not_supported/);
  assert.match(adapter, /progressive_trust_decision_missing/);
});

test("verified and headline selectors consume explicit private-engine decisions", () => {
  assert.match(adapter, /view === "verified"\) return item\.verifiedLaneEligible/);
  assert.match(adapter, /filter\(\(item\) => item\.headlineEligible\)/);
  assert.match(adapter, /if \(!item\.publicVisibilityEligible\) return false/);
  assert.doesNotMatch(adapter, /view === "verified"\) return item\.trustState ===/);
  assert.doesNotMatch(ledger, /records\.filter\(\(record\) => record\.trustState === "human_verified"\)/);
  assert.match(page, /getReleaseRecords\(releaseId, "latest_source_attributed"\)/);
  assert.match(overview, /record\.trustState === "human_verified"/);
  assert.match(overview, /record\.trustState === "system_validated"/);
  assert.match(overview, /record\.disclosure\.label/);
  assert.doesNotMatch(page, /src\/server\/admin\/public-trust/);
});

test("system validation and human verification stay visually and semantically distinct", () => {
  assert.match(adapter, /trustState: "system_validated"/);
  assert.match(adapter, /autonomyLevel: "certified_system_validation"/);
  assert.match(adapter, /certificationState: "active"/);
  assert.match(adapter, /resultingTrustState: humanApproved \? "human_verified"/);
  assert.match(ledger, /Certified system validation/);
  assert.match(ledger, /human verified and.*system validated/s);
  assert.match(admin, /<option value="system_validated">System validated<\/option>/);
});

test("UI renders safe decisions without recreating private autonomy policy", () => {
  for (const field of [
    "publicVisibilityEligible",
    "verifiedLaneEligible",
    "headlineEligible",
    "publicationExecutionEligible",
    "autonomyDecisionKey",
    "certificationKey",
    "promotionReasonCodes",
  ]) {
    assert.match(`${ledger}\n${admin}`, new RegExp(field));
  }
  assert.doesNotMatch(`${ledger}\n${admin}`, /maxErrorRate|maxShadowDisagreementRate|connectorImplementationHash|benchmarkRelease/);
  assert.match(admin, /Raw copyrighted documents and unrestricted storage paths are not rendered/);
});
