# Project Tracker

Last updated: 2026-07-11

## Current state

- Phase: production database foundation record
- Active scope: PR 3.5 — hosted Supabase migration apply record
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
- PR 2 is merged; its Next.js/OpenNext runtime and Cloudflare preview checks passed
- PR 3 is merged; its reviewed migration is now applied to hosted Supabase
- Main requires PRs and resolved review conversations and blocks deletion/force pushes
- GitHub now requires the `quality` check and requires PR branches to be current with `main`
- The ruleset still requires one approval; owner-authored PRs use the administrator bypass until another maintainer can approve them

## Planned sequence

1. Repository scaffold and project memory
2. Next.js and Cloudflare/OpenNext runtime scaffold
3. Supabase schema, migrations, RLS, and typed database layer
3.5. Hosted Supabase migration apply record
4. Static Ledger Dark experience using sample placeholders
5. Sample workbook and CSV import contracts
6. KPI calculation engine and tests
7. Source, claim, observation, confidence, and revision runtime
8. Admin authentication and review queue
9. Circularity and scenario engine
10. Scheduled health checks and production readiness

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

Review PR 3.5's production apply record before any application feature work expands the public or authenticated data surface.
