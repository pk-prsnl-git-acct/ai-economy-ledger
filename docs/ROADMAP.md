# Roadmap

## Current Bridge

- Private Logical PR33 is merged as data-engine GitHub PR `#48` and defines the
  stable progressive-autonomy/public-trust contract.
- Public GitHub PR `#26`, the merged PR33 compatibility bridge, consumes explicit
  private-engine decisions, corrects verified/headline selection, and adds
  distinct trust, autonomy, and certification presentation without enabling
  publication or requiring a live private-engine endpoint in CI.
- Logical PR34 is the next private task after both repositories pass post-merge
  verification; it has not begun in this initiative.

## Execution Contract

The project advances one logical PR/checkpoint at a time. Each step must update the project memory docs when it changes architecture, data, deployment, security, methodology, or workflow state. See [Updated PR Plan and Checkpoints](UPDATED_PR_PLAN_AND_CHECKPOINTS.md).

## Foundation

- PR 1: repository memory, governance, quality baseline, and PR workflow
- PR 2: Next.js/TypeScript app shell plus Cloudflare/OpenNext configuration
- PR 2.5: Cloudflare/OpenNext preview smoke checkpoint
- PR 3: Supabase migrations, RLS design, typed data access, and local DB tests
- PR 3.5: hosted Supabase migration apply and live RLS/public-surface verification
- PR 3.6: roadmap amendment, only if not already captured by PR 3.5

PR 2.5 is considered satisfied by PR 2's OpenNext build and workerd HTTP smoke evidence unless later runtime changes invalidate that evidence.

## Auditable Prototype

- PR 4: Ledger Dark static UX shell with placeholder/sample data only, including full required public/admin route skeleton and navigation coverage
- PR 4.5: only split out if PR 4 needs a follow-up checkpoint for route coverage
- PR 5: sample workbook and CSV import templates, including demo import run and sample isolation verification
- PR 5.5: only split out if PR 5 needs a follow-up checkpoint for demo import/sample isolation
- PR 6: KPI calculation engine, formula docs, and tests
- PR 7: source registry, claims, metric observations, confidence, freshness, revision runtime, published snapshots, and read-only public API
- PR 7.5: only split out if PR 7 needs a follow-up checkpoint for publication/API isolation

## Admin And Review

- PR 8: Supabase Auth integration, admin route guard, review queue, first admin/reviewer bootstrap, and RLS smoke verification
- PR 8.5: only split out if PR 8 needs a follow-up checkpoint for bootstrap/RLS proof

## Differentiated Analysis

- PR 9: circularity, relationship, related-party, vendor/customer loop, and scenario engine

## Production Readiness

- PR 10: Cloudflare Cron, read-only health/freshness checks, observability, and readiness runbook
- PR 11: Cloudflare Workers production deploy, domain binding, final smoke test, cache/health validation, and rollback record

Broad scraping, paid data redistribution, automated private-market estimates, and complex network visualization remain outside v0.1.
