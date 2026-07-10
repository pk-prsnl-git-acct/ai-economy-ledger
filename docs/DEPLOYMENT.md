# Deployment

## Current state

The Cloudflare/OpenNext runtime is configured and verified locally. Nothing has been deployed, no Worker has been created, and DNS remains unchanged.

The Supabase migration is also repository-only. Hosted Supabase has not been mutated.

## Environments

- Local: ignored `.env.local` plus ignored `.dev.vars`
- Preview: future Cloudflare non-production Worker versions with isolated variables
- Production: future `ai-economy-ledger` Worker on `aieconomyledger.com`

Environment values must never flow implicitly between tiers.

## Runtime files

| File | Purpose |
|---|---|
| `next.config.ts` | Next.js options and OpenNext local binding bridge |
| `open-next.config.ts` | OpenNext adapter behavior; no remote cache yet |
| `wrangler.toml` | Worker entry point, compatibility date/flags, assets, observability |
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

GitHub Actions validates code. Cloudflare Workers Builds and Cloudflare-native services run the product.

## Domain plan

`aieconomyledger.com` is active on Cloudflare but has no deployed application origin. After a Worker preview is approved:

1. Bind `aieconomyledger.com` as the Worker custom domain.
2. Redirect `www.aieconomyledger.com` to the canonical host.
3. Remove/replace only the obsolete Namecheap parking web records.
4. Preserve MX and SPF/TXT email records as DNS-only.
5. Validate HTTPS before considering Full (Strict), TLS minimum changes, or HSTS.

## Rollback

- retain the last known-good Worker version and public snapshot
- use version upload/promotion rather than an unreviewed direct overwrite when gradual deployment is introduced
- make migrations backward-compatible across a deployment window
- prefer forward database fixes when destructive rollback risks data loss
