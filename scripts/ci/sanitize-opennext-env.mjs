import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export const defaultNextEnvPath = ".open-next/cloudflare/next-env.mjs";

export const allowedNextEnvKeys = new Set([
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

const exportLinePattern = /^export const (\w+) = (.*);$/gm;

export function sanitizeGeneratedEnvSource(source) {
  let exportCount = 0;

  const sanitized = source.replace(exportLinePattern, (_match, envName, jsonLiteral) => {
    exportCount += 1;
    let parsed;

    try {
      parsed = JSON.parse(jsonLiteral);
    } catch (error) {
      throw new Error(`Malformed generated env export ${envName}: ${error.message}`);
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`Malformed generated env export ${envName}: expected a JSON object`);
    }

    const filtered = Object.fromEntries(Object.entries(parsed).filter(([key]) => allowedNextEnvKeys.has(key)));

    return `export const ${envName} = ${JSON.stringify(filtered)};`;
  });

  if (exportCount === 0) {
    throw new Error("Malformed generated env artifact: no generated env exports found");
  }

  return sanitized;
}

export function sanitizeOpenNextEnv({ nextEnvPath = defaultNextEnvPath } = {}) {
  const resolvedPath = resolve(nextEnvPath);

  if (!existsSync(resolvedPath)) {
    throw new Error(`Missing ${resolvedPath}. Run the Cloudflare build before sanitizing generated env fallbacks.`);
  }

  const source = readFileSync(resolvedPath, "utf8");
  const sanitized = sanitizeGeneratedEnvSource(source);
  writeFileSync(resolvedPath, sanitized);
  return { path: resolvedPath, sanitized };
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
  try {
    const result = sanitizeOpenNextEnv({
      nextEnvPath: readCliOption("next-env-path", defaultNextEnvPath),
    });
    console.log(`Sanitized ${result.path}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
