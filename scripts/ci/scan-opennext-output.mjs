import { existsSync, lstatSync, readFileSync, readdirSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

const root = resolve(".open-next");
const failures = [];

if (!existsSync(root)) {
  console.error("Missing .open-next output. Run pnpm build:cloudflare before scanning generated artifacts.");
  process.exit(1);
}

const textExtensions = new Set([".js", ".mjs", ".cjs", ".json", ".html", ".txt", ".map", ".sql", ".yml", ".yaml", ".css"]);
const secretPatterns = [
  /gh[pousr]_[A-Za-z0-9_]{30,}/,
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /cfut_[A-Za-z0-9_-]{20,}/,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/,
];
const forbiddenKeys = [
  "CLOUDFLARE_API_TOKEN",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_DB_DIRECT_URL",
  "SUPABASE_DB_POOLER_URL",
  "DATABASE_URL",
  "DIRECT_URL",
  "HEALTHCHECK_TOKEN",
  "GITHUB_PAT",
];
const nextEnvPath = resolve(".open-next/cloudflare/next-env.mjs");

scan(root);

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("OpenNext output secret scan passed.");

function scan(path) {
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
    for (const child of readdirSync(path)) scan(join(path, child));
    return;
  }

  if (!textExtensions.has(extname(path))) return;

  const contents = readFileSync(path, "utf8");

  for (const pattern of secretPatterns) {
    if (pattern.test(contents)) failures.push(`Potential credential found in generated output: ${path}`);
  }

  if (path === nextEnvPath) {
    for (const key of forbiddenKeys) {
      if (contents.includes(`"${key}"`) || contents.includes(`${key}=`)) {
        failures.push(`Forbidden secret key name found in generated fallback env: ${path} (${key})`);
      }
    }
  }
}
