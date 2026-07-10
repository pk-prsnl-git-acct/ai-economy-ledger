import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("supabase/migrations/0000_ledger_foundation.sql", "utf8");
const schema = readFileSync("src/server/db/schema.ts", "utf8");

test("database dependencies and migration tooling are pinned", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));

  assert.equal(pkg.dependencies["drizzle-orm"], "0.45.2");
  assert.equal(pkg.dependencies.postgres, "3.4.9");
  assert.equal(pkg.dependencies["server-only"], "0.0.1");
  assert.equal(pkg.devDependencies["drizzle-kit"], "0.31.10");
  assert.equal(pkg.devDependencies.supabase, "2.109.1");
  assert.equal(pkg.scripts["db:check"], "drizzle-kit check");
});

test("typed schema and SQL migration contain the canonical ledger tables", () => {
  const tables = [
    "companies",
    "company_aliases",
    "source_registry",
    "source_documents",
    "claims",
    "metric_definitions",
    "metric_observations",
    "metric_revisions",
    "published_snapshots",
    "review_queue",
    "update_log",
    "app_health_checks",
  ];

  for (const table of tables) {
    assert.match(schema, new RegExp(`table\\(\\s*\"${table}\"`));
    assert.match(migration, new RegExp(`CREATE TABLE \"ledger\"\\.\"${table}\"`));
    assert.match(
      migration,
      new RegExp(`ALTER TABLE \"ledger\"\\.\"${table}\" ENABLE ROW LEVEL SECURITY`),
    );
  }
});

test("authorization is isolated from user-editable metadata", () => {
  assert.match(migration, /CREATE TABLE "private"\."app_user_roles"/);
  assert.match(migration, /SECURITY DEFINER/g);
  assert.match(migration, /SET search_path = ''/g);
  assert.doesNotMatch(migration, /raw_user_meta_data|user_metadata/);
  assert.match(migration, /REVOKE ALL ON SCHEMA "private" FROM PUBLIC, anon, authenticated/);
});

test("public API exposes only published non-sample snapshots", () => {
  const config = readFileSync("supabase/config.toml", "utf8");

  assert.match(config, /schemas = \["api", "graphql_public"\]/);
  assert.doesNotMatch(config, /schemas = \[[^\n]*"ledger"/);
  assert.match(migration, /CREATE FUNCTION "api"\."get_published_snapshot"/);
  assert.match(migration, /snapshots\."state" = 'published'/);
  assert.match(migration, /NOT snapshots\."is_sample"/);
  assert.doesNotMatch(migration, /GRANT [^;]* ON [^;]*"ledger"[^;]* TO anon/i);
});

test("lineage, value shape, and revision history are database-enforced", () => {
  assert.match(migration, /CONSTRAINT "claims_source_required"/);
  assert.match(migration, /CONSTRAINT "metric_observations_one_value"/);
  assert.match(migration, /CONSTRAINT "metric_observations_revision_reason"/);
  assert.match(migration, /CREATE TRIGGER "metric_observations_record_revision"/);
  assert.match(migration, /CREATE TRIGGER "metric_observations_validate_revision_target"/);
  assert.match(migration, /CREATE TRIGGER "metric_observations_supersede_prior"/);
  assert.match(migration, /CREATE TRIGGER "metric_revisions_append_only"/);
  assert.match(migration, /approved and superseded records are immutable/);
});

test("Drizzle writes reviewed migrations into the Supabase migration history", () => {
  const config = readFileSync("drizzle.config.ts", "utf8");
  const gitignore = readFileSync(".gitignore", "utf8");

  assert.match(config, /out: "\.\/supabase\/migrations"/);
  assert.match(config, /schema: "\.\/src\/server\/db\/schema\.ts"/);
  assert.doesNotMatch(config, /push/);
  assert.match(gitignore, /^supabase\/\.branches\/$/m);
});
