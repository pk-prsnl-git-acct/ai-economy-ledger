# Operational Runbook

## Before making changes

1. Confirm the intended environment and account.
2. Verify the branch, diff, and repository-specific Git identity.
3. Read the project tracker and relevant decision records.
4. Confirm backups and rollback for production-impacting work.

## Standard verification

```bash
pnpm verify
pnpm build:cloudflare
pnpm test:cloudflare-preview
git status
git diff
git diff --cached
git check-ignore .env.local
```

## Readiness and scheduled health

Use this before production deployment, after environment changes, and when Cloudflare Cron logs show degraded or down readiness.

1. Confirm `HEALTHCHECK_TOKEN`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `NEXT_PUBLIC_SITE_URL` are configured in the target Worker environment.
2. Call `GET /api/internal/health` with `x-healthcheck-token` or `Authorization: Bearer ...`.
3. Treat `ok` as ready, `degraded` as deployable only when the reason is expected and recorded, and `down` as a deploy blocker.
4. For pre-launch environments, `published_snapshot_presence` and `published_snapshot_freshness` may be `warn` because no real snapshot has been published yet.
5. Check Cloudflare logs for structured `scheduled_readiness_check` events after Cron runs. Preserve logs without tokens or database credentials.
6. If the public snapshot RPC fails, verify Supabase Data API exposed schemas, publishable key configuration, and the two intended `api` RPC execute grants before changing application code.

## Failed deployment

1. Stop further promotion.
2. Identify whether failure is build, Worker runtime, binding, DNS, or database related.
3. Restore the last known-good Worker version when user impact exists.
4. Preserve logs without credentials.
5. Record the cause, resolution, and prevention in project memory.

## Suspected credential exposure

1. Stop using the credential.
2. Rotate or revoke it at the provider.
3. Inspect Git history, CI logs, artifacts, and deployment logs.
4. Remove exposure without rewriting shared history unless the owner approves the coordinated procedure.
5. Document the incident without including the secret.

## Data integrity incident

1. Pause publication, not source collection, when safe.
2. Preserve the affected snapshot and revision trail.
3. Identify source, claim, observation, and aggregate impact.
4. Correct through a revision record and republish deterministically.
5. Add a regression test.

## Hosted Supabase migration apply

Use this when a reviewed migration in `supabase/migrations/` must be applied to the live Supabase project.

### Preconditions

1. Confirm the exact project ref and project URL.
2. Confirm the migration scope is already merged and reviewed.
3. Use only ignored local environment files; never paste secrets into commands, docs, or chat.
4. Confirm the target migration list with a dry run before applying.

### Procedure

1. Load local private environment values only.
2. Prefer the IPv4 pooler database URL when the direct database endpoint is not reachable from the current network.
3. List remote migration history.
4. Run `supabase db push --dry-run` and confirm only the intended migration files would apply.
5. Run `supabase db push --include-all --yes` against the target database URL.
6. Verify:
   `supabase_migrations.schema_migrations` includes the expected version,
   expected tables exist,
   RLS is enabled on the expected tables,
   `anon` has no canonical table grants,
   public access is limited to the intended `api` RPCs,
   anonymous canonical writes fail,
   a read-only health query succeeds.
7. Scan source code to confirm service-role secrets are not referenced in browser-facing code.
8. Record the apply in `DEPLOYMENT.md`, `RUNBOOK.md`, `PR_LOG.md`, `CODEX_MEMORY.md`, and `PROJECT_TRACKER.md`.

### Recorded example

On 2026-07-11, hosted project `vupwphakeyvvhaoxuvuw` received `0001_circularity_scenarios.sql` after a dry run confirmed it was the only pending migration. The direct endpoint was not reachable from the current network, so the apply used the ignored local IPv4 pooler connection. Verification confirmed remote history version `0001`, expected `ledger.relationships` and `ledger.scenario_runs` tables, RLS enabled on both, zero `anon` table grants, only the two existing `api` RPC execute grants for `anon`, denied anonymous REST access to the new tables, denied anonymous writes, and a successful read-only health query.

### Rollback guidance

1. Do not drop the newly created schemas or tables as a first response.
2. If the migration succeeded structurally but behavior is wrong, prefer a forward corrective migration.
3. Pause any application rollout before attempting further database changes.
4. Capture migration history, verification results, and the exact corrective plan in project memory before proceeding.

## Admin bootstrap and RLS smoke

Use this only after the target Supabase Auth user exists and the owner has approved granting that user reviewer/admin access.

### Bootstrap first admin

1. Load ignored local private environment values only.
2. Set `DATABASE_URL` to the intended Supabase database connection.
3. Set `ADMIN_BOOTSTRAP_USER_ID` to the Supabase `auth.users.id` UUID.
4. Optionally set `ADMIN_BOOTSTRAP_ROLE=reviewer`; the default is `admin`.
5. Run `pnpm admin:bootstrap`.
6. Do not paste role grants, tokens, or database URLs into docs or chat.

### RLS smoke

1. Load ignored local private environment values only.
2. Run `pnpm admin:rls-smoke`.
3. Optionally set `RLS_SMOKE_REVIEWER_USER_ID` to confirm a mapped reviewer/admin can read the review queue.
4. Confirm the smoke reports anonymous denial, unmapped authenticated isolation, and reviewer path verification when configured.
5. Record only the result and environment name, never secrets.
