# Decision Log

Material decisions use stable identifiers and remain append-only. Reversals reference the superseded decision.

## 2026-07-14 — Public app renders PR33 decisions without recomputing policy

- Decision: consume the merged private PR33 `public-trust-admin-review@33.0.0`
  contract through the existing server-only fixture adapter and render its
  explicit visibility, verified-lane, headline, publication, autonomy, and
  certification fields.
- Why: `system_validated` may enter the verified lane only when the private
  engine explicitly permits it; neither trust state nor browser logic is enough
  to infer that privilege.
- Consequence: selectors fail closed on incompatible or internally inconsistent
  decisions, human and system verification remain visually distinct, inactive
  certification cannot retain stronger lanes, and the browser does not recreate
  private certification policy. Publication remains disabled and no production
  infrastructure changes are included.

## 2026-07-13 — Public app consumes PR30.1A through a fixture-backed trust adapter

- Decision: implement PR30.1B with protected admin Server Components and a
  server-only PR30.1A contract adapter, backed by rights-safe fixtures in CI.
- Why: the public app needs trust-state UI and review workflows before the first
  production dataset, but CI must not require private-engine endpoints,
  production secrets, raw evidence, or publication enablement.
- Consequence: `/admin/review`, `/admin/review/[reviewCaseId]`, and
  `/admin/settings/data-trust` reuse the existing Supabase session and
  `private.app_user_roles` authorization path; public values render explicit
  trust labels and unverified disclosures; Logical PR 31 remains unstarted.

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

## DEC-014 — Keep KPI calculations pure before publication wiring

- Date: 2026-07-11
- Status: accepted
- Decision: Implement PR 6 KPI formulas as pure local calculation functions with fixed-scale decimal arithmetic, approved/non-sample filtering, and diagnostics before connecting them to database reads, public APIs, or published snapshots.
- Rationale: financial formula behavior needs deterministic tests and review before runtime wiring. Keeping the module side-effect-free prevents sample data, pending records, or low-confidence exclusions from becoming public output by accident.

## DEC-015 — Separate deterministic generation from public delivery and approval

- Date: 2026-07-11
- Status: accepted
- Decision: Generate versioned content-hashed snapshots through a pure builder and persist them as drafts only. Deliver public data through the existing publishable-key RPC boundary, and reserve the authenticated review/publish transition for PR 8.
- Rationale: this keeps calculation reproducibility, editorial approval, and anonymous delivery as independently testable trust boundaries. A generator cannot make its own output public, and public routes cannot query canonical records.

## DEC-016 — Server-side admin authorization boundary

- Date: 2026-07-11
- Status: accepted
- Decision: Protect admin routes through server-side Supabase session verification and `private.app_user_roles` lookup rather than adding browser-side auth helpers or trusting user metadata.
- Rationale: reviewer/admin authorization must remain immediately revocable, database-backed, and unavailable to client-side manipulation. Avoiding a browser auth dependency also keeps service-role and database credentials out of public bundles while preserving the existing Supabase Auth and RLS model.

## DEC-017 — Evidence-linked circularity and non-publishing scenarios

- Date: 2026-07-11
- Status: accepted
- Decision: Treat directed cycles as analytical signals while allowing adjusted totals to change only through approved, non-sample relationships linked to exact observations. Evaluate scenarios as deterministic baseline-preserving transformations that cannot publish or mutate canonical facts.
- Rationale: graph topology alone does not prove double counting. Observation links make deductions auditable, one-time adjustment prevents duplicate edges from double-subtracting, and a non-publishing scenario boundary keeps assumptions visibly separate from reviewed evidence.

## DEC-018 — Read-only readiness before production deploy

- Date: 2026-07-11
- Status: accepted
- Decision: Implement production readiness as a protected read-only health route plus a Cloudflare Cron Worker wrapper that delegates normal HTTP traffic to OpenNext and scheduled events to the health route.
- Rationale: OpenNext owns the generated HTTP Worker, while Cloudflare Cron requires a scheduled event handler. A thin wrapper keeps the adapter path intact, adds scheduled checks without production mutation, and makes readiness observable before the first domain deployment.
