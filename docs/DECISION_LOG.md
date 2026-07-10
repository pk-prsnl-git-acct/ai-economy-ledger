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
