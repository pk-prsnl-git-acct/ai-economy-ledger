import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const nextEnvPath = resolve(".open-next/cloudflare/next-env.mjs");

if (!existsSync(nextEnvPath)) {
  console.error(`Missing ${nextEnvPath}. Run the Cloudflare build before sanitizing generated env fallbacks.`);
  process.exit(1);
}

const allowExactKeys = new Set([
  "NEXTJS_ENV",
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_JWKS_URL",
]);

const source = readFileSync(nextEnvPath, "utf8");

const sanitized = source.replace(/^export const (\w+) = (.*);$/gm, (_match, envName, jsonLiteral) => {
  const parsed = JSON.parse(jsonLiteral);
  const filtered = Object.fromEntries(
    Object.entries(parsed).filter(([key]) => key.startsWith("NEXT_PUBLIC_") || allowExactKeys.has(key)),
  );

  return `export const ${envName} = ${JSON.stringify(filtered)};`;
});

writeFileSync(nextEnvPath, sanitized);
console.log(`Sanitized ${nextEnvPath}`);
