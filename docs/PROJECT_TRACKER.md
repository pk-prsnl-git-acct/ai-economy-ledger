# Project Tracker

Last updated: 2026-07-11

## Current state

- Phase: auditable prototype planning
- Active scope: logical PR 8 implementation in progress
- Production application: static local Ledger Dark prototype; not deployed
- Production data: schema foundation applied; no published snapshots yet
- Repository visibility: public; owner-controlled writes

## Infrastructure readiness

- GitHub account, repository, and owner permissions verified
- Cloudflare account, active zone, Workers API, and DNS read access verified
- Supabase Auth, JWKS, and server-side REST access verified
- Hosted Supabase project `vupwphakeyvvhaoxuvuw` now has migration version `0000` applied
- Public domain has no deployed application origin yet
- Supabase public data access remains intentionally unconfigured before schema and RLS work
- PR 1 is merged and its required GitHub `quality` CI job passed
- PR 2 is merged; its Next.js/OpenNext runtime and Cloudflare preview checks passed, satisfying logical PR 2.5 unless runtime changes invalidate that evidence
- PR 3 is merged; its reviewed migration is now applied to hosted Supabase
- PR 3.5 is merged as GitHub PR `#4`
- PR 4 is merged as GitHub PR `#5`; it includes the former PR 4.5 route skeleton checkpoint scope
- PR 5 is merged as GitHub PR `#6`; it includes the former PR 5.5 demo import/sample isolation checkpoint scope
- PR 6 is merged as GitHub PR `#7`
- PR 7 is merged as GitHub PR `#8` and combines the former PR 7.5 checkpoint scope
- Main requires PRs and resolved review conversations and blocks deletion/force pushes
- GitHub now requires the `quality` check and requires PR branches to be current with `main`
- The ruleset still requires one approval; owner-authored PRs use the administrator bypass until another maintainer can approve them

## Planned sequence

| Logical PR | Scope |
|---|---|
| PR 1 | Repository scaffold and project memory |
| PR 2 | Next.js and Cloudflare/OpenNext runtime scaffold |
| PR 2.5 | Cloudflare/OpenNext preview smoke checkpoint |
| PR 3 | Supabase schema, migrations, RLS, and typed database layer |
| PR 3.5 | Hosted Supabase migration apply and verification record |
| PR 3.6 | Roadmap amendment and checkpoint documentation, only if not absorbed into PR 3.5 |
| PR 4 | Static Ledger Dark experience using sample placeholders plus full required route skeleton and navigation coverage |
| PR 4.5 | Route skeleton and navigation checkpoint, only if PR 4 must be split |
| PR 5 | Sample workbook and CSV import contracts plus demo import and sample isolation verification |
| PR 5.5 | Demo import and sample isolation checkpoint, only if PR 5 must be split |
| PR 6 | KPI calculation engine and tests |
| PR 7 | Source, claim, observation, confidence, revision runtime, published snapshots, and public read API |
| PR 7.5 | Published snapshots and public API checkpoint, only if PR 7 must be split |
| PR 8 | Admin authentication, review queue, admin bootstrap, and RLS smoke verification |
| PR 8.5 | Admin bootstrap and RLS smoke checkpoint, only if PR 8 must be split |
| PR 9 | Circularity and scenario engine |
| PR 10 | Scheduled health checks and production readiness |
| PR 11 | Production deploy, domain binding, and final smoke test |

## Current risks

- Public data licensing must be decided per source before redistribution.
- AI-specific revenue allocations can create false precision.
- The legacy Supabase anon key is obsolete; use the publishable-key model when the client is implemented.
- Domain routing remains on pre-deployment infrastructure.
- Cloudflare Workers Builds, Worker creation, custom-domain binding, and DNS changes remain intentionally pending.
- Direct dependency versions are pinned; updates must preserve Next.js/OpenNext and lint-parser compatibility.
- Open-source differentiation must come from trust, methodology, curation, and execution rather than hidden code.
- Application traffic is still not wired to Supabase; live schema now exists before the first production app deploy, so future releases must preserve the current RLS/public-surface contract.
- Static admin pages are deliberately visible route placeholders, not protected tools; they contain no write controls or backend connection. Authentication remains PR 8 scope.
- PR 5 templates are repository contracts only; they are not a production upload surface and must remain sample/verified-isolated until the protected admin workflow exists.
- PR 6 calculations are pure local functions; they do not read from or write to Supabase and are not yet public snapshot/API outputs.
- PR 7 adds a draft-only deterministic publication runtime and GET-only public API adapter. No production snapshot exists and no hosted environment was changed.
- PR 8 protects admin routes and adds bootstrap/RLS smoke scripts. No production role grant, hosted database mutation, published snapshot, Cloudflare change, or deployment is part of the PR by itself.

## Next decision gate

Complete logical PR 8, verify protected admin behavior and smoke-script guardrails, then merge and synchronize tracking before starting logical PR 9.
