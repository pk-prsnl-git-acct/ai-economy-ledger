import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const adminPages = [
  "app/admin/page.tsx",
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
