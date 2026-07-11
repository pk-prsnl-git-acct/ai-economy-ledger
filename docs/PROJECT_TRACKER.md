# Project Tracker

Last updated: 2026-07-11

## Current state

- Phase: production database foundation record
- Active scope: PR 3.5 — hosted Supabase migration apply record plus roadmap checkpoint amendment
- Production application: minimal local placeholder; not deployed
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
- PR 3.5 is open as GitHub PR `#4`
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
| PR 4 | Static Ledger Dark experience using sample placeholders |
| PR 4.5 | Full required route skeleton and navigation coverage |
| PR 5 | Sample workbook and CSV import contracts |
| PR 5.5 | Demo import run and sample isolation verification |
| PR 6 | KPI calculation engine and tests |
| PR 7 | Source, claim, observation, confidence, and revision runtime |
| PR 7.5 | Published snapshots and public read API |
| PR 8 | Admin authentication and review queue |
| PR 8.5 | Admin bootstrap and RLS smoke verification |
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

## Next decision gate

Review PR 3.5's production apply and roadmap checkpoint record before any application feature work expands the public or authenticated data surface. After PR 3.5, stop and wait for explicit owner approval before starting PR 4.
