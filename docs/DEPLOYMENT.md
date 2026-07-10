# Deployment

## Environments

- Local: ignored `.env.local`, local development and tests
- Preview: isolated Cloudflare preview configuration and non-production data
- Production: Cloudflare custom domain and production Supabase project

Environment values must never flow implicitly between these tiers.

## Planned delivery path

```text
pull request -> GitHub quality checks -> owner review -> merge
-> Cloudflare build/preview -> production approval -> Cloudflare deployment
```

GitHub Actions validates changes but does not run production schedules or ingestion.

## Required release gates

- lint, typecheck, tests, data validation, and build
- Cloudflare preview for server/runtime changes
- migration review and dry-run for schema changes
- environment-variable inventory updated
- rollback and observability notes
- no committed secrets

## Domain state

`aieconomyledger.com` is active on Cloudflare. Existing pre-application routing must not be changed until a verified Worker deployment is ready. Preserve email-related DNS records and do not enable HSTS prematurely.

## Rollback principles

- retain the last known-good Worker version and generated snapshot
- use forward database fixes where destructive rollback risks data loss
- make migrations backward-compatible across a deployment window
- document manual recovery steps before production-impacting changes
