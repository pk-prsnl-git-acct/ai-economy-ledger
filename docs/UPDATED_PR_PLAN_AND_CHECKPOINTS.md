# Updated PR Plan and Checkpoints

This document records the July 2026 roadmap amendment. It complements the project ground rules, roadmap, tracker, PR log, runbook, deployment guide, and Codex memory. It does not replace them.

## Why this exists

The original PR plan correctly established a small, reviewed, one-PR-at-a-time workflow. The missing part was a set of explicit operational checkpoints between large implementation steps. Without those checkpoints, the project could accidentally have migrations that exist but are not applied, Cloudflare config that is not smoke-tested, sample data that leaks into verified totals, or production deploys that happen without final smoke tests.

## Execution rules

- Work one logical PR scope at a time.
- Stop after each PR or checkpoint and wait for owner approval.
- Do not start PR 4 until PR 3.5 is reviewed and approved.
- Do not invent verified financial data or treat sample data as real.
- Do not broaden checkpoint PRs into feature implementation unless the roadmap explicitly allows that pairing.
- Do not commit or print secrets.
- Do not use GitHub Actions as production runtime.
- Do not change production infrastructure without explicit approval and an audit record.

GitHub PR numbers do not have to match logical PR labels. The logical labels below are the project roadmap labels and remain the canonical internal planning structure. When the numbers differ, write both values explicitly as `logical PR X` and `GitHub PR #Y`.

## Logical PR Sequence

| Logical PR | Scope | Gate |
|---|---|---|
| PR 0 | Local bootstrap and planning only | Local env ignored, handoffs read, no commits/PRs unless approved |
| PR 1 | Repository scaffold, docs, governance, baseline package setup | Baseline checks and protected PR workflow |
| PR 2 | Next.js and Cloudflare/OpenNext scaffold | Build and Cloudflare config exist without production deploy |
| PR 2.5 | Cloudflare/OpenNext preview smoke checkpoint | Worker-like local preview/build smoke before heavy UI/API work |
| PR 3 | Supabase schema, Drizzle scaffold, RLS, typed data layer | Reviewed migration files and local DB/RLS tests |
| PR 3.5 | Supabase remote migration apply and verification | Hosted schema applied, RLS/public surface verified |
| PR 3.6 | Roadmap amendment and checkpoint documentation | Only needed if checkpoint docs are not included in PR 3.5 |
| PR 4 | Ledger Dark static UX shell from mockups plus full required route skeleton and navigation coverage | Sample placeholders only, no production data connection; all public/admin route placeholders exist |
| PR 4.5 | Route skeleton and navigation checkpoint, only if PR 4 intentionally ships in two parts | All public/admin route placeholders exist before deeper product work |
| PR 5 | Sample workbook and CSV import templates plus demo import and sample isolation verification | Templates and mappings preserve sample labels; sample rows cannot enter verified totals |
| PR 5.5 | Demo import and sample isolation checkpoint, only if PR 5 intentionally ships in two parts | Sample rows cannot enter verified totals before verified metrics work continues |
| PR 6 | KPI calculation engine and tests | Pure formulas, methodology docs, confidence/sample tests |
| PR 7 | Source registry, claims, observations runtime model plus published snapshots and public read API | Traceability runtime, revision/freshness read models, and approved read-only public surface |
| PR 7.5 | Published snapshots and public API checkpoint, only if PR 7 intentionally ships in two parts | Read-only public surface exposes approved published data only |
| PR 8 | Admin auth and review queue plus admin bootstrap and RLS smoke verification | Protected admin/reviewer workflow aligned with RLS and first-admin path verified |
| PR 8.5 | Admin bootstrap and RLS smoke checkpoint, only if PR 8 intentionally ships in two parts | First-admin path and write protections verified before broader admin rollout |
| PR 9 | Circularity and scenario engine | AI economy relationship/circularity analysis with tests |
| PR 10 | Cloudflare Cron, observability, production readiness | Read-only keep-alive, freshness checks, readiness runbook |
| PR 11 | Production deploy, domain, final smoke test | Worker, domain, secrets, cache, health, and rollback verified |

## Checkpoint Gates

| Gate | Must happen before | Reason |
|---|---|---|
| Cloudflare/OpenNext preview smoke | heavy UI/API work | Catch Worker runtime incompatibilities early |
| Supabase remote migration apply | DB-backed runtime features | Ensure schema exists outside local repo |
| RLS and no-public-write verification | admin/review/data entry | Prevent unsafe data exposure |
| Full route skeleton | deeper page work | Avoid missing core public/admin surfaces |
| Sample isolation verification | dashboard metrics | Prevent demo data becoming truth |
| Published snapshot/public API | production dashboard | Avoid static mock data becoming a fake app |
| Admin bootstrap/RLS smoke | reviewer workflow | Confirm first admin path and route guards |
| Production deploy/domain smoke | public launch | Confirm DNS, Worker, secrets, routes, cache, and health |

## Current Mapping

- Logical PR 1 is merged as GitHub PR `#1`.
- Logical PR 2 is merged as GitHub PR `#2`; it already included OpenNext build and workerd HTTP smoke evidence, so logical PR 2.5 is considered satisfied unless future runtime changes invalidate it.
- Logical PR 3 is merged as GitHub PR `#3`.
- Logical PR 3.5 is merged as GitHub PR `#4`; it records the hosted Supabase migration apply and this roadmap amendment.
- Logical PR 3.6 is not needed because GitHub PR `#4` merged with this document and related roadmap updates.
- Logical PR 4 is merged as GitHub PR `#5`; it includes the former route skeleton/checkpoint scope that was labeled logical PR 4.5.
- Logical PR 5 is merged as GitHub PR `#6`; it includes the former demo import/sample isolation checkpoint scope that was labeled logical PR 5.5.
- Logical PR 4 is the only active internal label for the Ledger Dark UX shell and route skeleton work. Do not refer to the active work as PR 4.5 unless the owner explicitly re-splits it.
- Logical PR 5 is the only internal label for sample workbook, CSV import templates, demo import, and sample isolation work. Do not refer to that merged scope as PR 5.5 unless the owner explicitly re-splits it.
- PR 7 and PR 7.5 are now planned as one combined implementation by default. Re-split them only if published snapshots/public API must be deferred for scope-control reasons discovered during PR 7.
- PR 8 and PR 8.5 are now planned as one combined implementation by default. Re-split them only if admin bootstrap/RLS smoke verification must be deferred for scope-control reasons discovered during PR 8.

## Required Stop Output

After each PR/checkpoint, report:

- summary
- files changed
- tests/checks run
- data/schema impact
- deployment impact
- security/RLS impact
- known risks
- next recommended PR

Then stop and wait for owner approval before beginning the next logical PR.
