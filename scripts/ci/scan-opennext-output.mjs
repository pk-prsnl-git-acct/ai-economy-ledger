import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { pathToFileURL } from "node:url";

export const defaultOpenNextRoot = ".open-next";
export const defaultNextEnvPath = ".open-next/cloudflare/next-env.mjs";

export const sensitiveExactValueKeys = [
  "GITHUB_PAT",
  "CLOUDFLARE_API_TOKEN",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_DB_DIRECT_URL",
  "SUPABASE_DB_POOLER_URL",
  "DATABASE_URL",
  "DIRECT_URL",
  "HEALTHCHECK_TOKEN",
];

export const forbiddenFallbackEnvKeys = sensitiveExactValueKeys;

const textExtensions = new Set([".js", ".mjs", ".cjs", ".json", ".html", ".txt", ".map", ".sql", ".yml", ".yaml", ".css"]);

const secretPatterns = [
  { name: "GitHub PAT-shaped value", pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/ },
  { name: "Supabase secret-key-shaped value", pattern: /sb_secret_[A-Za-z0-9_-]{20,}/ },
  { name: "Cloudflare token-shaped value", pattern: /cfut_[A-Za-z0-9_-]{20,}/ },
  { name: "credential-bearing PostgreSQL URL", pattern: /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/ },
];

export function collectSensitiveExactValues(env = process.env) {
  const values = [];

  for (const key of sensitiveExactValueKeys) {
    const value = env[key];
    if (!isScannableSecretValue(value)) continue;
    values.push({ key, value });
  }

  return values;
}

export function scanOpenNextOutput({
  root = defaultOpenNextRoot,
  nextEnvPath = defaultNextEnvPath,
  env = process.env,
} = {}) {
  const resolvedRoot = resolve(root);
  const resolvedNextEnvPath = resolve(nextEnvPath);
  const failures = [];

  if (!existsSync(resolvedRoot)) {
    return {
      ok: false,
      failures: ["Missing .open-next output. Run pnpm build:cloudflare before scanning generated artifacts."],
    };
  }

  const exactValues = collectSensitiveExactValues(env);

  for (const path of listTextFiles(resolvedRoot)) {
    const contents = readFileSync(path, "utf8");
    const displayPath = relative(process.cwd(), path) || path;

    for (const pattern of secretPatterns) {
      if (pattern.pattern.test(contents)) {
        failures.push(`Potential ${pattern.name} found in generated output: ${displayPath}`);
      }
    }

    for (const { key, value } of exactValues) {
      if (contents.includes(value)) {
        failures.push(`Sensitive environment value found in generated output: ${displayPath} (${key})`);
      }
    }

    if (path === resolvedNextEnvPath) {
      for (const key of forbiddenFallbackEnvKeys) {
        if (contents.includes(`"${key}"`) || contents.includes(`${key}=`)) {
          failures.push(`Forbidden secret key name found in generated fallback env: ${displayPath} (${key})`);
        }
      }
    }
  }

  return { ok: failures.length === 0, failures };
}

function* listTextFiles(path) {
  let entry;
  try {
    entry = lstatSync(path);
  } catch {
    return;
  }

  if (entry.isSymbolicLink()) {
    try {
      entry = statSync(path);
    } catch {
      return;
    }
  }

  if (entry.isDirectory()) {
    for (const child of readdirSync(path)) yield* listTextFiles(join(path, child));
    return;
  }

  if (textExtensions.has(extname(path))) yield path;
}

function isScannableSecretValue(value) {
  if (typeof value !== "string") return false;

  const trimmed = value.trim();
  if (trimmed.length < 12) return false;

  const normalized = trimmed.toLowerCase();
  const placeholderSignals = [
    "replace_",
    "replace-with",
    "replace with",
    "placeholder",
    "example",
    "changeme",
    "change_me",
    "dummy",
    "test-token",
    "not-a-secret",
  ];

  return !placeholderSignals.some((signal) => normalized.includes(signal));
}

function readCliOption(name, fallback) {
  const prefix = `--${name}=`;
  const option = process.argv.find((argument) => argument.startsWith(prefix));
  return option ? option.slice(prefix.length) : fallback;
}

function isCliEntryPoint() {
  return process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
}

if (isCliEntryPoint()) {
  const result = scanOpenNextOutput({
    root: readCliOption("root", defaultOpenNextRoot),
    nextEnvPath: readCliOption("next-env-path", defaultNextEnvPath),
  });

  if (!result.ok) {
    console.error(result.failures.join("\n"));
    process.exit(1);
  }

  console.log("OpenNext output secret scan passed.");
}
