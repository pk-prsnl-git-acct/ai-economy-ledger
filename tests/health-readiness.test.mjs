import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { evaluateReadiness, summarizeReadiness } from "../src/server/modules/health/readiness.mjs";

const readyEnv = {
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
  HEALTHCHECK_TOKEN: "test-token",
};

test("readiness is degraded before the first published snapshot, not down", async () => {
  const report = await evaluateReadiness({
    env: readyEnv,
    now: new Date("2026-07-11T00:00:00.000Z"),
    listSnapshots: async () => [],
  });

  assert.equal(report.status, "degraded");
  assert.equal(report.summary.publishedSnapshotCount, 0);
  assert.equal(report.checks.find((check) => check.name === "published_snapshot_presence")?.status, "warn");
  assert.equal(report.checks.find((check) => check.name === "public_snapshot_rpc")?.status, "pass");
});

test("readiness is ok when runtime config exists and latest snapshot is fresh", async () => {
  const report = await evaluateReadiness({
    env: readyEnv,
    now: new Date("2026-07-11T00:00:00.000Z"),
    listSnapshots: async () => [{ slug: "ledger", version: 2, published_at: "2026-07-10T00:00:00.000Z" }],
  });

  assert.equal(report.status, "ok");
  assert.equal(report.summary.latestSnapshotSlug, "ledger");
  assert.equal(report.summary.latestSnapshotAgeDays, 1);
});

test("readiness is degraded when the latest snapshot is stale", async () => {
  const report = await evaluateReadiness({
    env: readyEnv,
    now: new Date("2026-07-11T00:00:00.000Z"),
    maxSnapshotAgeDays: 30,
    listSnapshots: async () => [{ slug: "ledger", version: 1, published_at: "2026-05-01T00:00:00.000Z" }],
  });

  assert.equal(report.status, "degraded");
  assert.equal(report.checks.find((check) => check.name === "published_snapshot_freshness")?.status, "warn");
});

test("readiness is down when required runtime config or snapshot RPC fails", async () => {
  const missingEnvReport = await evaluateReadiness({
    env: { HEALTHCHECK_TOKEN: "test-token" },
    listSnapshots: async () => [],
  });
  const rpcFailureReport = await evaluateReadiness({
    env: readyEnv,
    listSnapshots: async () => { throw new Error("unavailable"); },
  });

  assert.equal(missingEnvReport.status, "down");
  assert.equal(rpcFailureReport.status, "down");
  assert.equal(rpcFailureReport.checks.find((check) => check.name === "public_snapshot_rpc")?.status, "fail");
});

test("readiness summary is safe for structured logs", async () => {
  const report = await evaluateReadiness({
    env: readyEnv,
    listSnapshots: async () => [],
  });
  const summary = summarizeReadiness(report);

  assert.deepEqual(Object.keys(summary).sort(), ["checkedAt", "checks", "status"]);
  assert.doesNotMatch(JSON.stringify(summary), /test-token|sb_publishable_example|example\.supabase\.co/i);
});

test("internal health route is protected, no-store, and does not use service-role secrets", () => {
  const route = readFileSync("app/api/internal/health/route.ts", "utf8");

  assert.match(route, /HEALTHCHECK_TOKEN/);
  assert.match(route, /x-healthcheck-token/);
  assert.match(route, /authorization/);
  assert.match(route, /cache-control/);
  assert.match(route, /no-store/);
  assert.match(route, /summarizeReadiness/);
  assert.doesNotMatch(route, /SUPABASE_SERVICE_ROLE_KEY|SUPABASE_SECRET_KEY|service_role/i);
});

test("Cloudflare Worker wrapper delegates fetch and handles scheduled readiness checks", () => {
  const worker = readFileSync("worker.mjs", "utf8");
  const wrangler = readFileSync("wrangler.toml", "utf8");

  assert.match(worker, /openNextWorker\.fetch\(request, env, ctx\)/);
  assert.match(worker, /scheduled\(controller, env, ctx\)/);
  assert.match(worker, /\/api\/internal\/health/);
  assert.match(worker, /scheduled_readiness_check/);
  assert.match(worker, /x-healthcheck-token/);
  assert.match(wrangler, /main = "worker\.mjs"/);
  assert.match(wrangler, /\[triggers\]/);
  assert.match(wrangler, /crons = \["\*\/30 \* \* \* \*"\]/);
});
