# Decision Log

Material decisions use stable identifiers and remain append-only. Reversals reference the superseded decision.

## DEC-001 — Cloudflare-first runtime

- Date: 2026-07-09
- Status: accepted
- Decision: Deploy the Next.js application through OpenNext on Cloudflare Workers. Use Cloudflare-native scheduling and asynchronous services.
- Rationale: coherent low-cost edge platform, scheduled work, caching, and reduced dependence on GitHub or a framework-specific host.

## DEC-002 — Supabase for Postgres and authentication

- Date: 2026-07-09
- Status: accepted
- Decision: Use Supabase Postgres, Auth, and RLS as the canonical data and identity layer.
- Rationale: portable SQL foundation with managed authentication and explicit access policies.

## DEC-003 — Modular monolith

- Date: 2026-07-09
- Status: accepted
- Decision: Keep v0.1 in one repository and deployment with typed domain-module boundaries.
- Rationale: preserves maintainability without premature distributed-system complexity.

## DEC-004 — Public repository with owner-controlled writes

- Date: 2026-07-10
- Status: accepted
- Decision: Keep the repository public while only the owner has direct write access.
- Rationale: transparency and early credibility support the product thesis. Protected branches and PR workflow control changes.

## DEC-005 — Repository-specific Git identity

- Date: 2026-07-10
- Status: accepted
- Decision: Authenticate only as `pk-prsnl-git-acct` and use `PK RSV Personal <pankaj.kharode@gmail.com>` locally for this repository.
- Rationale: prevents cross-account commits and preserves accurate authorship.

## DEC-006 — Explicit OpenNext Cloudflare configuration

- Date: 2026-07-10
- Status: accepted
- Decision: Maintain reviewed `wrangler.toml` and `open-next.config.ts` files rather than running remote-aware automatic migration.
- Rationale: keeps Worker name, compatibility flags, assets, and observability visible in Git while avoiding accidental R2 creation, deployment, or DNS mutation.

## DEC-007 — Pinned runtime toolchain and lifecycle allowlist

- Date: 2026-07-10
- Status: accepted
- Decision: Pin direct runtime/build dependencies exactly and allow dependency lifecycle scripts only for the reviewed Next.js/OpenNext build packages.
- Rationale: reproducible builds and explicit supply-chain review outweigh convenience from floating versions or blanket script approval.

## DEC-008 — Isolated database schemas and narrow public API

- Date: 2026-07-10
- Status: accepted
- Decision: Keep canonical data in unexposed `ledger`, authorization state in unexposed `private`, and expose only reviewed publication RPCs from `api`.
- Rationale: schema isolation reduces accidental Data API exposure while RLS, explicit grants, and published/non-sample predicates provide defense in depth.

## DEC-009 — Drizzle types with Supabase SQL migrations

- Date: 2026-07-10
- Status: accepted
- Decision: Use Drizzle for typed PostgreSQL schema/query contracts and generate into the repository-owned Supabase migration history. Keep RLS, grants, triggers, and RPC functions in reviewed SQL within the same migration.
- Rationale: the application gets portable compile-time types without limiting PostgreSQL security features or allowing direct schema pushes.

## DEC-010 — Append-only reviewed observations and snapshots

- Date: 2026-07-10
- Status: accepted
- Decision: Approved or superseded claims and observations are immutable to reviewers. Corrections create linked observations and append-only revision records; public output is delivered as versioned content-hashed snapshots.
- Rationale: financial claims require reproducible lineage and visible correction history rather than silent overwrites.

## DEC-011 — Explicit operational checkpoint PRs

- Date: 2026-07-11
- Status: accepted
- Decision: Add named checkpoint PRs between large implementation phases: Cloudflare/OpenNext preview smoke, hosted Supabase migration apply, route skeleton, demo import/sample isolation, published snapshot/public API, admin bootstrap/RLS smoke, and production deploy/domain smoke.
- Rationale: the product needs proof at operational boundaries, not only code review. Checkpoint PRs prevent skipped migrations, unsafe public access, static mock data being mistaken for live data, sample data leaking into verified totals, and production deploys without final smoke evidence.

## DEC-012 — Combine PR 4 and route skeleton coverage by default

- Date: 2026-07-11
- Status: accepted
- Decision: Treat the Ledger Dark UX shell and the full required route skeleton/navigation coverage as one default logical PR 4 scope. Keep a separate logical PR 4.5 only when route coverage must be deferred for scope-control reasons discovered during implementation.
- Rationale: the route skeleton is part of making the shell usable and reviewable. Splitting it by default adds process overhead without much additional risk reduction, while still allowing a follow-up checkpoint if PR 4 becomes too large.

## DEC-013 — Combine PR 5, PR 7, and PR 8 with their related half-step checkpoints by default

- Date: 2026-07-11
- Status: accepted
- Decision: Treat PR 5 with demo import/sample isolation, PR 7 with published snapshots/public API, and PR 8 with admin bootstrap/RLS smoke as combined default scopes. Keep separate logical PR 5.5, 7.5, or 8.5 only when those proof steps must be deferred for scope-control reasons discovered during implementation.
- Rationale: these verification steps are tightly coupled to the main feature scopes and are usually part of making the feature reviewable. Keeping them together by default reduces coordination overhead while preserving the option to split if a scope grows too large.
