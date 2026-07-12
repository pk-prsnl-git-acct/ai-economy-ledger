# Deployment

## Current state

The Cloudflare/OpenNext runtime is deployed to Worker `ai-economy-ledger` and `aieconomyledger.com/*` is routed to it through a Cloudflare zone Worker route. Production readiness is not complete: public snapshot RPC access is down and the Cloudflare Cron schedule is not attached.

Hosted Supabase project `vupwphakeyvvhaoxuvuw` was migrated on 2026-07-11 by applying the reviewed `0000_ledger_foundation.sql` and `0001_circularity_scenarios.sql` migrations from repository history. No additional schema changes were introduced beyond the merged PR 3 and PR 9 migration files.

## Environments

- Local: ignored `.env.local` plus ignored `.dev.vars`
- Preview: future Cloudflare non-production Worker versions with isolated variables
- Production: `ai-economy-ledger` Worker on `aieconomyledger.com`

Environment values must never flow implicitly between tiers.

## Runtime files

| File | Purpose |
|---|---|
| `next.config.ts` | Next.js options and OpenNext local binding bridge |
| `open-next.config.ts` | OpenNext adapter behavior; no remote cache yet |
| `worker.mjs` | Worker wrapper that delegates HTTP to OpenNext and handles scheduled readiness checks |
| `wrangler.toml` | Worker entry point, compatibility date/flags, assets, observability, Cron trigger |
| `.dev.vars.example` | non-secret local Worker variable shape |
| `.env.example` | complete placeholder-only application variable contract |
| `public/_headers` | immutable caching for fingerprinted Next.js assets |

## Local commands

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm build:cloudflare
pnpm test:cloudflare-preview
pnpm cf-typegen
```

`pnpm build:cloudflare` produces the ignored `.open-next/` artifact. The preview smoke test starts that artifact in workerd, requests `/`, checks HTTP success and the expected application/data-warning text, then stops the process.

## Health and readiness

PR 10 adds a protected read-only health route at `GET /api/internal/health`. It requires `HEALTHCHECK_TOKEN` through `x-healthcheck-token` or `Authorization: Bearer ...`, returns `cache-control: no-store`, and never uses service-role credentials. The route evaluates required public Supabase configuration, healthcheck token configuration, public snapshot RPC availability, published snapshot presence, and latest snapshot freshness.

Cloudflare Cron is configured for every 30 minutes in `wrangler.toml`. The committed Worker wrapper delegates normal HTTP requests to the generated OpenNext Worker and handles scheduled events by calling `/api/internal/health` in-process with the configured token, then logging a structured `scheduled_readiness_check` record. An empty published snapshot set reports `degraded` instead of `down` until the first real snapshot is published.

Required production variables before PR 11 deploy:

- `NEXT_PUBLIC_SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`
- `HEALTHCHECK_TOKEN`

PR 11 deployment record on 2026-07-12:

- Worker upload succeeded.
- Runtime variables/secrets were uploaded from ignored local `.env.local` without printing values.
- Zone Worker route `aieconomyledger.com/* -> ai-economy-ledger` is active.
- `/` and `/methodology` return HTTP 200 from production.
- `/api/v1/snapshots` returns HTTP 502 because the hosted Supabase Data API does not expose the intended `api` schema.
- `/api/internal/health` returns HTTP 503/down, as designed for public snapshot RPC failure.
- Cloudflare schedule list is empty because the current token receives 403 on the Worker schedules endpoint.

## Planned Workers Builds configuration

Do not enable until this PR is reviewed and the Worker is intentionally created.

```text
Repository: pk-prsnl-git-acct/ai-economy-ledger
Production branch: main
Root directory: /
Build command: pnpm build:cloudflare
Production deploy command: pnpm exec opennextjs-cloudflare deploy
Non-production deploy command: pnpm exec opennextjs-cloudflare upload
Worker name: ai-economy-ledger
```

Enable non-production branch builds when preview URLs are desired. Build variables must include intentional public build-time values such as `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_APP_NAME`. Store server credentials as Cloudflare secrets, never plain build variables or repository files.

## Production release gates

- required GitHub checks pass on a current branch
- OpenNext build and workerd smoke pass
- environment and binding inventory reviewed
- schema migration and rollback reviewed when applicable
- production approval recorded
- post-deploy smoke and logs checked

For a database release, first configure hosted Data API exposed schemas to `api` (and required Supabase system schemas), never `ledger` or `private`. Apply `supabase/migrations` with the direct database connection in one coordinated operation. Confirm migration history, anonymous denial on canonical tables, public RPC behavior, and reviewer/admin authorization before connecting application traffic.

## Hosted Supabase release record

Production database foundation and the PR 9 relationship/scenario follow-up were applied to project ref `vupwphakeyvvhaoxuvuw` on 2026-07-11 using local private environment values only.

- Applied migration history: `0000_ledger_foundation.sql`, `0001_circularity_scenarios.sql`
- Remote migration history now includes versions `0000` and `0001`
- Expected `ledger` tables exist, including `relationships` and `scenario_runs`, and `private.app_user_roles` exists
- RLS is enabled on all expected `ledger` tables, including `relationships` and `scenario_runs`, and on `private.app_user_roles`
- `anon` has no table grants on `ledger`, `private`, or `api`
- `anon` may execute only `api.list_published_snapshots()` and `api.get_published_snapshot()`
- Anonymous canonical reads and writes were verified to fail; the new PR 9 tables are not exposed on the public REST surface
- Read-only database health query succeeded after apply

Cloudflare production is partially deployed. The live Worker route exists, but final readiness remains blocked by provider configuration.

## Public snapshot runtime

PR 7 adds `GET /api/v1/snapshots` and `GET /api/v1/snapshots/{slug}?version=N`. These server routes call only `api.list_published_snapshots()` and `api.get_published_snapshot()` using `SUPABASE_PUBLISHABLE_KEY` (with the public build-time equivalent as a local fallback). They do not accept writes and never use a service-role or secret key.

Snapshot generation requires a server-side `DATABASE_URL`, produces a deterministic draft, and does not publish it. No generation job, production snapshot, Cloudflare deployment, environment change, or hosted database change is part of PR 7. Before final production readiness, configure hosted Supabase Data API exposed schemas so the intended `api` RPCs are reachable while `ledger` and `private` remain unexposed, then repeat the anonymous RPC isolation smoke.

## Protected admin runtime

PR 8 makes admin routes dynamic and protected. The runtime requires `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and server-side `DATABASE_URL` before authenticated reviewer/admin pages can load production data. Admin session verification uses Supabase Auth and `private.app_user_roles`; no service-role key is needed by the browser or public routes.

First-admin bootstrap is an explicit operational action using `pnpm admin:bootstrap` with ignored local private environment variables. RLS verification is an explicit smoke action using `pnpm admin:rls-smoke`. Merging PR 8 does not grant a production user, publish a snapshot, deploy Cloudflare, or mutate hosted Supabase.

GitHub Actions validates code. Cloudflare Workers Builds and Cloudflare-native services run the product.

## Domain plan

`aieconomyledger.com/*` is currently routed to Worker `ai-economy-ledger`. The route-style binding is live. Remaining domain work:

1. Decide whether route-style binding is sufficient or whether a Worker custom-domain record is still required.
2. Redirect `www.aieconomyledger.com` to the canonical host.
3. Remove/replace only the obsolete Namecheap parking web records.
4. Preserve MX and SPF/TXT email records as DNS-only.
5. Validate HTTPS before considering Full (Strict), TLS minimum changes, or HSTS.

## Rollback

- retain the last known-good Worker version and public snapshot
- use version upload/promotion rather than an unreviewed direct overwrite when gradual deployment is introduced
- make migrations backward-compatible across a deployment window
- prefer forward database fixes when destructive rollback risks data loss
