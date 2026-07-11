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
