import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("runtime dependencies and scripts are pinned", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));

  assert.equal(pkg.dependencies.next, "16.2.10");
  assert.equal(pkg.dependencies.react, "19.2.7");
  assert.equal(pkg.devDependencies["@opennextjs/cloudflare"], "1.20.1");
  assert.equal(pkg.devDependencies.wrangler, "4.110.0");
  assert.equal(pkg.devDependencies.typescript, "6.0.3");
  assert.equal(pkg.devDependencies.eslint, "9.39.4");
  assert.equal(pkg.scripts.build, "next build");
  assert.match(pkg.scripts["build:cloudflare"], /opennextjs-cloudflare build/);
});

test("CI builds and smoke-tests the Workers artifact", () => {
  const workflow = readFileSync(".github/workflows/ci.yml", "utf8");
  const workspace = readFileSync("pnpm-workspace.yaml", "utf8");
  const smoke = readFileSync("scripts/ci/cloudflare-preview-smoke.mjs", "utf8");

  assert.match(workflow, /pnpm build:cloudflare/);
  assert.match(workflow, /pnpm test:cloudflare-preview/);
  for (const route of ["/ai-stack", "/companies", "/companies/entity%3Acompany%3Aalphabet", "/methodology", "/admin/review-queue"]) {
    assert.match(smoke, new RegExp(route.replaceAll("/", "\\/")));
  }
  assert.match(smoke, /Five layers, with the gaps still visible/);
  assert.match(smoke, /Protected admin access/);
  for (const dependency of ["esbuild", "rclone.js", "sharp", "unrs-resolver", "workerd"]) {
    assert.match(workspace, new RegExp(`${dependency.replace(".", "\\.")}: true`));
  }
});

test("Cloudflare configuration targets the intended Worker safely", () => {
  const wrangler = readFileSync("wrangler.toml", "utf8");

  assert.match(wrangler, /name = "ai-economy-ledger"/);
  assert.match(wrangler, /main = "worker\.mjs"/);
  assert.match(wrangler, /compatibility_date = "2026-07-10"/);
  assert.match(wrangler, /"nodejs_compat"/);
  assert.match(wrangler, /directory = "\.open-next\/assets"/);
  assert.match(wrangler, /\[triggers\]/);
  assert.match(wrangler, /crons = \["\*\/30 \* \* \* \*"\]/);
});

test("OpenNext is configured for Node runtime without remote cache bindings", () => {
  const openNext = readFileSync("open-next.config.ts", "utf8");
  const appSources = ["app/layout.tsx", "app/page.tsx"].map((file) => readFileSync(file, "utf8")).join("\n");

  assert.match(openNext, /defineCloudflareConfig\(\)/);
  assert.doesNotMatch(openNext, /incrementalCache|r2IncrementalCache/);
  assert.doesNotMatch(appSources, /runtime\s*=\s*["']edge["']/);
});

test("production overview uses release-bound observations rather than sample claims", () => {
  const page = readFileSync("app/page.tsx", "utf8");
  const overview = readFileSync("components/five-layer-overview.tsx", "utf8");
  const runtime = readFileSync("src/server/data-releases/runtime.ts", "utf8");

  assert.match(page, /currentReleaseId/);
  assert.match(page, /getReleaseManifest/);
  assert.match(page, /getReleaseRecords/);
  assert.doesNotMatch(page, /SampleDataWarning|FinancialChartCard|DataTable|\$— sample/);
  assert.match(overview, /formatFinancialValue\(record\.value\)/);
  assert.match(overview, /formatExactFinancialValue\(record\.value\)/);
  assert.match(runtime, /record\.sampleData \|\| !record\.visibilityEligible/);
});

test("local development variables stay ignored", () => {
  const gitignore = readFileSync(".gitignore", "utf8");

  assert.match(gitignore, /^\.dev\.vars$/m);
  assert.match(gitignore, /^!\.dev\.vars\.example$/m);
});
