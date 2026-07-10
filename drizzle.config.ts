import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DIRECT_URL;

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./supabase/migrations",
  strict: true,
  verbose: true,
  dbCredentials: databaseUrl ? { url: databaseUrl } : undefined,
});
