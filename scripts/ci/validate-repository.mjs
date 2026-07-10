import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { extname } from "node:path";

const mode = process.argv.find((arg) => arg.startsWith("--mode="))?.split("=")[1] ?? "lint";
const failures = [];

const requiredFiles = [
  "README.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "GOVERNANCE.md",
  "SECURITY.md",
  ".env.example",
  "docs/README.md",
  "docs/PROJECT_GROUND_RULES.md",
  "docs/PROJECT_TRACKER.md",
  "docs/ARCHITECTURE.md",
  "docs/DATA_MODEL.md",
  "docs/METHODOLOGY.md",
  "docs/SOURCE_POLICY.md",
  "docs/TESTING_STRATEGY.md",
  "docs/PR_LOG.md",
  "docs/DECISION_LOG.md",
  "docs/CODEX_MEMORY.md",
  "docs/ROADMAP.md",
  "docs/SECURITY_NOTES.md",
  "docs/DEPLOYMENT.md",
  "docs/RUNBOOK.md",
  "docs/DATA_LICENSE.md",
  "docs/UX_REFERENCE.md"
];

for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const trackedFiles = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .filter(Boolean);

const prohibitedPaths = [
  /(^|\/)\.env\.local$/,
  /(^|\/)01_private_secrets\//,
  /github-pat\.txt$/,
  /cloudflare\.env$/,
  /supabase\.env$/
];

for (const file of trackedFiles) {
  if (prohibitedPaths.some((pattern) => pattern.test(file))) {
    failures.push(`Private path is tracked: ${file}`);
  }
}

const sensitiveExampleKeys = [
  "CLOUDFLARE_API_TOKEN",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_DB_PASSWORD",
  "SUPABASE_DB_DIRECT_URL",
  "SUPABASE_DB_POOLER_URL",
  "DATABASE_URL",
  "DIRECT_URL",
  "HEALTHCHECK_TOKEN"
];

if (existsSync(".env.example")) {
  const envExample = readFileSync(".env.example", "utf8");
  for (const key of sensitiveExampleKeys) {
    const value = envExample.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1];
    if (!value?.startsWith("replace_")) failures.push(`${key} must be a placeholder in .env.example`);
  }
}

const secretPatterns = [
  /gh[pousr]_[A-Za-z0-9_]{30,}/,
  /sb_secret_[A-Za-z0-9_-]{20,}/,
  /postgres(?:ql)?:\/\/[^\s:@]+:[^\s@]+@/
];

for (const file of trackedFiles) {
  if (!existsSync(file) || !statSync(file).isFile()) continue;
  if (![".md", ".json", ".mjs", ".js", ".ts", ".tsx", ".yml", ".yaml", ".example"].includes(extname(file)) && file !== ".env.example") continue;
  const contents = readFileSync(file, "utf8");
  if (contents.split("\n").some((line) => /[ \t]+$/.test(line))) failures.push(`Trailing whitespace: ${file}`);
  if (secretPatterns.some((pattern) => pattern.test(contents))) failures.push(`Potential credential found: ${file}`);
}

if (mode === "typecheck") {
  const moduleFiles = trackedFiles.filter((file) => file.endsWith(".mjs"));
  for (const file of moduleFiles) {
    const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
    if (result.status !== 0) failures.push(`Syntax check failed: ${file}\n${result.stderr.trim()}`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`${mode} checks passed.`);
