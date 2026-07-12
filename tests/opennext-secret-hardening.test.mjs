import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

import { sanitizeOpenNextEnv } from "../scripts/ci/sanitize-opennext-env.mjs";
import { collectSensitiveExactValues, scanOpenNextOutput } from "../scripts/ci/scan-opennext-output.mjs";

const fictionalGitHubToken = `ghp_${"abcdefghijklmnopqrstuvwxyzABCDE1234567890"}`;
const fictionalSupabaseSecret = `sb_${"secret_"}fictionalSecretKeyForTestingOnly12345`;
const fictionalCloudflareToken = `cfut_${"fictionalCloudflareTokenForTestingOnly12345"}`;
const fictionalPostgresUrl = `postgresql://${"user:password"}@example.test:5432/db`;

function createOpenNextFixture() {
  const root = mkdtempSync(join(tmpdir(), "ael-opennext-"));
  const cloudflareDir = join(root, "cloudflare");
  mkdirSync(cloudflareDir, { recursive: true });
  return {
    root,
    cloudflareDir,
    nextEnvPath: join(cloudflareDir, "next-env.mjs"),
  };
}

function writeNextEnv(path, values) {
  writeFileSync(path, `export const env = ${JSON.stringify(values)};\n`);
}

test("sanitizer removes forbidden secrets and preserves approved runtime values", async () => {
  const fixture = createOpenNextFixture();
  writeNextEnv(fixture.nextEnvPath, {
    NEXTJS_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://aieconomyledger.com",
    NEXT_PUBLIC_APP_NAME: "AI Economy Ledger",
    NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fictional",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "legacy-public-placeholder",
    NEXT_PUBLIC_UNAPPROVED: "remove-me",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fictional",
    SUPABASE_JWKS_URL: "https://example.supabase.co/auth/v1/.well-known/jwks.json",
    SUPABASE_SERVICE_ROLE_KEY: fictionalSupabaseSecret,
    DATABASE_URL: fictionalPostgresUrl,
    HEALTHCHECK_TOKEN: "fictional-health-token",
  });

  sanitizeOpenNextEnv({ nextEnvPath: fixture.nextEnvPath });

  const sanitizedSource = readFileSync(fixture.nextEnvPath, "utf8");
  assert.match(sanitizedSource, /NEXT_PUBLIC_SITE_URL/);
  assert.match(sanitizedSource, /NEXT_PUBLIC_APP_NAME/);
  assert.match(sanitizedSource, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(sanitizedSource, /NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY/);
  assert.match(sanitizedSource, /NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  assert.match(sanitizedSource, /SUPABASE_URL/);
  assert.match(sanitizedSource, /SUPABASE_PUBLISHABLE_KEY/);
  assert.match(sanitizedSource, /SUPABASE_JWKS_URL/);
  assert.doesNotMatch(sanitizedSource, /NEXT_PUBLIC_UNAPPROVED/);
  assert.doesNotMatch(sanitizedSource, /SUPABASE_SERVICE_ROLE_KEY|DATABASE_URL|HEALTHCHECK_TOKEN/);
  assert.doesNotMatch(sanitizedSource, /sb_secret_|postgresql:\/\/user:password|fictional-health-token/);

  const importedEnvModule = await import(`${pathToFileURL(fixture.nextEnvPath).href}?t=${Date.now()}`);
  assert.deepEqual(Object.keys(importedEnvModule.env).sort(), [
    "NEXTJS_ENV",
    "NEXT_PUBLIC_APP_NAME",
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_JWKS_URL",
    "SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_URL",
  ]);
});

test("sanitizer fails safely when generated artifact is missing or malformed", () => {
  const fixture = createOpenNextFixture();
  assert.throws(
    () => sanitizeOpenNextEnv({ nextEnvPath: fixture.nextEnvPath }),
    /Missing .*next-env\.mjs/,
  );

  writeFileSync(fixture.nextEnvPath, 'export const env = {"DATABASE_URL": "postgresql://user:password@example.test/db",};\n');
  assert.throws(
    () => sanitizeOpenNextEnv({ nextEnvPath: fixture.nextEnvPath }),
    (error) => {
      assert.match(error.message, /Malformed generated env export env/);
      assert.doesNotMatch(error.message, /password/);
      return true;
    },
  );
});

test("scanner detects credential patterns without printing secret values", () => {
  const cases = [
    ["github.js", `export const token = ${JSON.stringify(fictionalGitHubToken)};`, "GitHub PAT-shaped value", fictionalGitHubToken],
    ["supabase.js", `export const token = ${JSON.stringify(fictionalSupabaseSecret)};`, "Supabase secret-key-shaped value", fictionalSupabaseSecret],
    ["cloudflare.js", `export const token = ${JSON.stringify(fictionalCloudflareToken)};`, "Cloudflare token-shaped value", fictionalCloudflareToken],
    ["database.js", `export const url = ${JSON.stringify(fictionalPostgresUrl)};`, "credential-bearing PostgreSQL URL", fictionalPostgresUrl],
  ];

  for (const [fileName, contents, expectedLabel, secretValue] of cases) {
    const fixture = createOpenNextFixture();
    writeNextEnv(fixture.nextEnvPath, { NEXT_PUBLIC_SITE_URL: "https://aieconomyledger.com" });
    writeFileSync(join(fixture.root, fileName), contents);

    const result = scanOpenNextOutput({
      root: fixture.root,
      nextEnvPath: fixture.nextEnvPath,
      env: {},
    });

    assert.equal(result.ok, false);
    const output = result.failures.join("\n");
    assert.match(output, new RegExp(expectedLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(output.includes(secretValue), false);
  }
});

test("scanner detects forbidden secret-key entries inside next-env.mjs", () => {
  const fixture = createOpenNextFixture();
  writeNextEnv(fixture.nextEnvPath, {
    NEXT_PUBLIC_SITE_URL: "https://aieconomyledger.com",
    DATABASE_URL: "value-redacted-by-test",
  });

  const result = scanOpenNextOutput({
    root: fixture.root,
    nextEnvPath: fixture.nextEnvPath,
    env: {},
  });

  assert.equal(result.ok, false);
  assert.match(result.failures.join("\n"), /Forbidden secret key name.*DATABASE_URL/);
  assert.doesNotMatch(result.failures.join("\n"), /value-redacted-by-test/);
});

test("scanner detects exact sensitive env values by variable name only", () => {
  const fixture = createOpenNextFixture();
  const secret = "fictional-healthcheck-secret-value-12345";
  writeNextEnv(fixture.nextEnvPath, { NEXT_PUBLIC_SITE_URL: "https://aieconomyledger.com" });
  writeFileSync(join(fixture.root, "worker.js"), `export const leaked = ${JSON.stringify(secret)};\n`);

  const result = scanOpenNextOutput({
    root: fixture.root,
    nextEnvPath: fixture.nextEnvPath,
    env: {
      HEALTHCHECK_TOKEN: secret,
      GITHUB_PAT: "replace_with_placeholder_value",
      SUPABASE_DB_PASSWORD: "short",
    },
  });

  const output = result.failures.join("\n");
  assert.equal(result.ok, false);
  assert.match(output, /worker\.js \(HEALTHCHECK_TOKEN\)/);
  assert.doesNotMatch(output, new RegExp(secret));
});

test("scanner exact-value collection skips empty, placeholder, and too-short values", () => {
  assert.deepEqual(
    collectSensitiveExactValues({
      GITHUB_PAT: "",
      CLOUDFLARE_API_TOKEN: "replace_with_cloudflare_token",
      SUPABASE_SECRET_KEY: "short",
      HEALTHCHECK_TOKEN: "realistic-fictional-token-12345",
    }),
    [{ key: "HEALTHCHECK_TOKEN", value: "realistic-fictional-token-12345" }],
  );
});

test("scanner passes sanitized and ordinary generated artifacts", () => {
  const fixture = createOpenNextFixture();
  writeNextEnv(fixture.nextEnvPath, {
    NEXTJS_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://aieconomyledger.com",
    NEXT_PUBLIC_APP_NAME: "AI Economy Ledger",
    SUPABASE_URL: "https://example.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_fictional",
  });
  writeFileSync(join(fixture.root, "server.js"), "const name = process.env.DATABASE_URL;\n");
  writeFileSync(join(fixture.root, "manifest.json"), '{"name":"ai-economy-ledger"}\n');
  writeFileSync(join(fixture.root, "style.css"), "body { color: #fff; }\n");

  const result = scanOpenNextOutput({
    root: fixture.root,
    nextEnvPath: fixture.nextEnvPath,
    env: {
      DATABASE_URL: "fictional-database-secret-that-is-not-present",
      HEALTHCHECK_TOKEN: "fictional-health-secret-that-is-not-present",
    },
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.failures, []);
});
