import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("package metadata identifies the project", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  assert.equal(pkg.name, "ai-economy-ledger");
  assert.equal(pkg.license, "Apache-2.0");
  assert.equal(pkg.private, true);
});

test("private environment files are ignored", () => {
  const ignored = execFileSync("git", ["check-ignore", ".env.local"], { encoding: "utf8" }).trim();
  assert.equal(ignored, ".env.local");
});

test("public environment example contains placeholders", () => {
  const example = readFileSync(".env.example", "utf8");
  assert.match(example, /^CLOUDFLARE_API_TOKEN=replace_/m);
  assert.match(example, /^SUPABASE_SECRET_KEY=replace_/m);
  assert.match(example, /^HEALTHCHECK_TOKEN=replace_/m);
  assert.doesNotMatch(example, /gh[pousr]_[A-Za-z0-9_]{30,}/);
  assert.doesNotMatch(example, /sb_secret_[A-Za-z0-9_-]{20,}/);
});

test("project memory links its required operating documents", () => {
  const index = readFileSync("docs/README.md", "utf8");
  for (const document of ["PROJECT_TRACKER.md", "DECISION_LOG.md", "CODEX_MEMORY.md", "TESTING_STRATEGY.md", "RUNBOOK.md"]) {
    assert.match(index, new RegExp(document.replace(".", "\\.")));
  }
});

test("repository-managed Git hooks are configured", () => {
  const hooksPath = execFileSync("git", ["config", "--local", "--get", "core.hooksPath"], { encoding: "utf8" }).trim();
  const nodePath = execFileSync("git", ["config", "--local", "--get", "ael.nodePath"], { encoding: "utf8" }).trim();
  assert.equal(hooksPath, ".githooks");
  assert.ok(nodePath.endsWith("/node"));
});
