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

## Checkpoint Gates

| Logical checkpoint | Required evidence |
|---|---|
| PR 2.5 Cloudflare/OpenNext preview smoke | OpenNext build and Worker-like HTTP smoke evidence |
| PR 3.5 Supabase remote migration apply | remote migration history, expected tables, RLS, anon denial, explicit public RPC grants, read-only health query |
| PR 4 route skeleton coverage | all required public/admin routes render placeholders with navigation and warnings before deeper product work continues |
| PR 5 demo import isolation | sample flags preserved and sample rows excluded from verified totals before verified metrics work continues |
| PR 7 public API isolation | published snapshot generation and public read-only API isolation tests before public dashboard rollout |
| PR 8 admin/RLS smoke | first-admin bootstrap, admin write proof, public write denial, and service-role server-only proof before broader admin rollout |
| PR 11 production deploy smoke | domain, Worker, routes, admin protection, health, cache, logs, rollback evidence |

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

CI now validates repository/secret safety, Next.js ESLint, strict TypeScript, Drizzle migration integrity, database contract tests, data-directory safety, the full OpenNext Worker build, and an HTTP smoke test in workerd. PR 3 also adds local Supabase migration reset, pgTAP RLS/integrity tests, and database lint commands. PR 4 adds static tests for the complete public/admin route map, canonical metadata, required Ledger Dark components, sample/admin warnings, and absence of backend or secret references from the UI. Its manual browser gate covers semantic snapshots plus desktop and 390px responsive review. Container-based database integration is required locally for schema PRs; it can move into CI when runtime cost and contributor volume justify a dedicated database job. Later PRs add domain coverage, automated accessibility, interaction-level Playwright, and broader security jobs without turning GitHub Actions into production infrastructure.

Flaky tests are defects. Quarantine requires an owner, tracking issue, and removal deadline.
