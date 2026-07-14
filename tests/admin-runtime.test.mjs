import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminPages = [
  "app/admin/page.tsx",
  "app/admin/review/page.tsx",
  "app/admin/review/[reviewCaseId]/page.tsx",
  "app/admin/settings/data-trust/page.tsx",
  "app/admin/review-queue/page.tsx",
  "app/admin/sources/page.tsx",
  "app/admin/companies/page.tsx",
  "app/admin/import/page.tsx",
  "app/admin/claims/page.tsx",
  "app/admin/metric-revisions/page.tsx",
  "app/admin/health/page.tsx",
  "app/admin/update-log/page.tsx",
];

test("admin routes are dynamic and server protected", () => {
  const pages = adminPages.map((file) => readFileSync(file, "utf8")).join("\n");
  const component = readFileSync("components/admin.tsx", "utf8");
  const session = readFileSync("src/server/admin/session.ts", "utf8");

  for (const file of adminPages) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /export const dynamic = "force-dynamic"/, file);
    assert.match(source, /ProtectedAdminPage/, file);
  }

  assert.match(component, /getAdminSession\("reviewer"\)/);
  assert.match(session, /auth\/v1\/user/);
  assert.match(session, /private\.app_user_roles/);
  assert.match(session, /SUPABASE_PUBLISHABLE_KEY/);
  assert.doesNotMatch(`${pages}\n${component}`, /SUPABASE_SERVICE_ROLE|SUPABASE_SECRET|service_role/i);
});

test("admin auth supports Supabase cookie formats without browser helpers", () => {
  const session = readFileSync("src/server/admin/session.ts", "utf8");

  assert.match(session, /extractSupabaseAccessToken/);
  assert.match(session, /sb-access-token/);
  assert.match(session, /supabase-access-token/);
  assert.match(session, /startsWith\("sb-"\)/);
  assert.match(session, /endsWith\("-auth-token"\)/);
  assert.match(session, /base64-/);
  assert.doesNotMatch(session, /@supabase\/supabase-js|createBrowserClient|localStorage/);
});

test("review queue is read through a server-only database boundary", () => {
  const source = readFileSync("src/server/admin/review-queue.ts", "utf8");

  assert.match(source, /import "server-only"/);
  assert.match(source, /ledger\.review_queue/);
  assert.match(source, /left join ledger\.claims/);
  assert.match(source, /left join ledger\.metric_observations/);
  assert.match(source, /left join ledger\.published_snapshots/);
  assert.doesNotMatch(source, /insert into|update ledger|delete from/i);
});

test("PR30.1B consumes the private PR30.1A trust contract through server-only adapters", () => {
  const contract = readFileSync("src/server/admin/public-trust/contract.ts", "utf8");
  const actions = readFileSync("src/server/admin/public-trust/actions.ts", "utf8");
  const admin = readFileSync("components/admin.tsx", "utf8");

  assert.match(contract, /import "server-only"/);
  assert.match(contract, /public-trust-admin-review@33\.0\.0/);
  assert.match(contract, /contract_version_mismatch/);
  assert.match(contract, /listTrustReviewCases/);
  assert.match(contract, /getTrustReviewCase/);
  assert.match(contract, /getVisibilityPolicy/);
  assert.match(contract, /evaluateDecisionRequest/);
  assert.match(contract, /stale_record_or_evidence_version/);
  assert.match(actions, /"use server"/);
  assert.match(actions, /getAdminSession\("admin"\)/);
  assert.match(admin, /TrustReviewDashboard/);
  assert.match(admin, /TrustReviewDetail/);
  assert.match(admin, /DataTrustSettingsPanel/);
  assert.match(admin, /expectedRecordVersion/);
  assert.match(admin, /expectedEvidenceVersion/);
  assert.match(admin, /idempotencyKey/);
  assert.match(admin, /system_validated/);
  assert.match(admin, /autonomyDecisionKey/);
  assert.match(admin, /certificationKey/);
  assert.doesNotMatch(`${contract}\n${actions}\n${admin}`, /SUPABASE_SERVICE_ROLE|service_role|private-engine secret|signed_url/i);
});

test("PR30.1B admin UI exposes required review, visibility, and safe evidence states", () => {
  const admin = readFileSync("components/admin.tsx", "utf8");
  const siteMap = readFileSync("src/ui/site-map.ts", "utf8");

  for (const route of ["/admin/review", "/admin/settings/data-trust"]) {
    assert.match(siteMap, new RegExp(`href: ["']${route.replaceAll("/", "\\/")}["']`));
  }
  for (const action of ["approve_human_verified", "reject", "request_more_evidence", "defer", "reopen", "supersede"]) {
    assert.match(admin, new RegExp(action));
  }
  for (const setting of [
    "show_source_attributed_unverified",
    "show_system_validated",
    "show_human_verified",
    "show_conflicted_records",
    "exclude_conflicted_from_headlines",
    "exclude_unverified_from_verified_aggregates",
    "show_superseded_history",
    "preview_disclosure_required",
  ]) {
    assert.match(readFileSync("src/server/admin/public-trust/contract.ts", "utf8"), new RegExp(setting));
  }
  assert.match(admin, /safe evidence coordinates only/);
  assert.match(admin, /does not mutate trust state, evidence, review decisions, or certification history/);
});

test("bootstrap and RLS smoke scripts are explicit private-env operations", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const bootstrap = readFileSync("scripts/admin/bootstrap-admin.mjs", "utf8");
  const smoke = readFileSync("scripts/admin/rls-smoke.mjs", "utf8");

  assert.equal(pkg.scripts["admin:bootstrap"], "node scripts/admin/bootstrap-admin.mjs");
  assert.equal(pkg.scripts["admin:rls-smoke"], "node scripts/admin/rls-smoke.mjs");
  assert.match(bootstrap, /ADMIN_BOOTSTRAP_USER_ID/);
  assert.match(bootstrap, /insert into private\.app_user_roles/);
  assert.match(bootstrap, /on conflict \(user_id, role\) do nothing/);
  assert.match(smoke, /set local role \$\{role\}/);
  assert.match(smoke, /asRole\("anon"/);
  assert.match(smoke, /asRole\("authenticated"/);
  assert.match(smoke, /request\.jwt\.claim\.sub/);
  assert.doesNotMatch(`${bootstrap}\n${smoke}`, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY/);
});
