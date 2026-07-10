# Project Tracker

Last updated: 2026-07-10

## Current state

- Phase: repository foundation
- Active scope: PR 1 complete locally; awaiting review before runtime work
- Production application: not yet implemented
- Production data: none
- Repository visibility: public; owner-controlled writes

## Infrastructure readiness

- GitHub account, repository, and owner permissions verified
- Cloudflare account, active zone, Workers API, and DNS read access verified
- Supabase Auth, JWKS, and server-side REST access verified
- Public domain has no deployed application origin yet
- Supabase public data access remains intentionally unconfigured before schema and RLS work
- Draft PR 1 is open and its GitHub `quality` CI job passes
- Main requires PRs and resolved review conversations and blocks deletion/force pushes
- GitHub now requires the `quality` check and requires PR branches to be current with `main`
- The ruleset still requires one approval; owner-authored PRs use the administrator bypass until another maintainer can approve them

## Planned sequence

1. Repository scaffold and project memory
2. Next.js and Cloudflare/OpenNext runtime scaffold
3. Supabase schema, migrations, RLS, and typed database layer
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
- Open-source differentiation must come from trust, methodology, curation, and execution rather than hidden code.

## Next decision gate

Review the repository foundation, then begin the Next.js and Cloudflare/OpenNext runtime scaffold.
