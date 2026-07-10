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
