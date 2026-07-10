# Testing Strategy

## Objectives

Testing protects financial correctness, source lineage, data isolation, authorization, and Cloudflare runtime compatibility. Coverage percentages are secondary to meaningful protection of these boundaries.

## Test pyramid

- Unit: many fast tests for formulas, normalization, validation, scoring, and state transitions
- Integration: database policies, imports, route contracts, publication, and provider adapters
- End-to-end: a few critical public and admin workflows
- Operational: build, Cloudflare preview, migration dry-runs, health checks, and production smoke tests

## Quality gates by change

| Change | Required checks |
|---|---|
| Documentation/tooling | lint, repository tests, secret scan |
| Pure calculations | unit tests, edge cases, methodology reconciliation |
| Database/schema | migration verification, RLS integration tests, rollback notes |
| API/server runtime | unit, integration, build, Cloudflare preview |
| UI | component/interaction tests, accessibility, responsive review |
| Data/import | schema validation, malformed inputs, idempotency, sample isolation |
| Deployment | build, preview smoke, environment validation, rollback plan |

## Critical test inventory

- capital, obligation, gross/net revenue, circularity, and confidence-weighted formulas
- zero, negative, missing, stale, mixed-currency, and mixed-period inputs
- source confidence and freshness boundaries
- sample data excluded from verified totals
- duplicate imports and idempotent reruns
- claim approval/rejection and metric revision history
- public-read/admin-write authorization and RLS
- read-only Supabase health behavior
- deterministic published snapshots

## Coverage policy

New critical domain modules target at least 90% branch coverage. General application code targets 80% where coverage is meaningful. Generated files, framework glue, and trivial declarations may be excluded with documented justification.

## CI progression

CI now validates repository/secret safety, Next.js ESLint, strict TypeScript, foundation tests, data-directory safety, the full OpenNext Worker build, and an HTTP smoke test in workerd. Later PRs add domain coverage, database/RLS integration, accessibility, Playwright, migration, and security jobs without turning GitHub Actions into production infrastructure.

Flaky tests are defects. Quarantine requires an owner, tracking issue, and removal deadline.
