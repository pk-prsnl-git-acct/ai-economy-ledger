# Data Model

## Design goals

- Preserve provenance and revision history.
- Represent observations over time instead of overwriting snapshots.
- Distinguish recognition, cash-flow, confidence, and review semantics.
- Keep sample rows structurally isolated from verified publication.

## Implemented foundation entities

```text
companies              company_aliases       source_registry
source_documents       claims                metric_definitions
metric_observations    metric_revisions      review_queue
methodology_versions   published_snapshots   update_log
app_health_checks      app_user_roles
```

`metric_observations` is the universal time-series fact layer. Each observation carries entity, metric, value, units, reported and normalized currency values, period, recognition and cash-flow types, source/claim references, confidence, review status, methodology version, and sample status.

Funding deals, obligation-specific views, and compute infrastructure remain planned extensions. PR 9 adds reviewed relationships and scenario runs while referencing the universal observation and provenance layers rather than duplicating their trust semantics.

## Schema boundaries

- `ledger`: canonical business data; RLS-enabled and not exposed through the Supabase Data API
- `private`: reviewer/admin role mapping and security-definer authorization helpers; never exposed
- `api`: narrow public RPC surface for published, non-sample snapshots

`src/server/db/schema.ts` supplies application types and generates structural migrations. SQL-only policies, grants, triggers, and functions live beside the generated DDL in the reviewed Supabase migration. `supabase/migrations` is the only deployable migration history.

## Controlled vocabularies

Recognition types include `announced`, `committed`, `received`, `recognized`, `run_rate`, `estimated`, `face_value`, and `cash_equivalent`.

Review states include `sample`, `pending`, `approved`, `rejected`, `needs_more_sources`, `stale`, and `superseded`.

Cash-flow types must distinguish equity, debt, grants, project finance, credits, capex, leases, power obligations, recognized revenue, run-rate revenue, customer prepayments, and vendor financing.

## Relationships

Directed relationship records represent investor, vendor, customer, cloud, compute, data-center, subsidiary, partner, lender, and borrower edges. Each relationship may carry amounts, periods, sources, confidence, related-party flags, and circularity flags.

`relationships` are directed, claim-backed edges between distinct companies. An optional observation link makes an adjustment traceable to the exact value affected. Approved relationship records are immutable under the same review trigger used by claims and observations.

`scenario_runs` hold an ordered assumption payload and an optional deterministic result/hash. They are reviewer-readable and admin-written. A completed run must contain a result, hash, and completion timestamp; it is analysis state and is never part of the anonymous publication surface by default.

## Security model

- RLS on business tables
- explicit public reads only for approved publication surfaces
- authenticated reviewer/admin writes
- service credentials restricted to protected server jobs and migrations
- revisions instead of silent overwrites

Reviewer and admin authorization uses `private.app_user_roles` linked to `auth.users`; user-editable JWT profile metadata is not trusted for authorization. Approved and superseded claims/observations are immutable to reviewers. A replacement observation references the prior observation and automatically creates an append-only revision record.

Public reads call `api.list_published_snapshots` and `api.get_published_snapshot`. The functions return only rows with `state = published` and `is_sample = false`; anonymous roles receive no grants on canonical ledger tables.

## Progressive trust display contract

PR30.1B imports the PR30.1A public trust/admin review contract as a rights-safe
fixture under `data/contracts/public-trust/`. The fixture is not a published
dataset. It models source-attributed unverified, system-validated,
human-verified, rejected, and superseded states; safe evidence references;
visibility settings; review-case payloads; stale-version responses; and
contract-version mismatch handling. Public UI must exclude rejected and
superseded records from current values, exclude conflicted records from headline
counts by default, and exclude unverified records from verified-only views.

## Migration workflow

PostgreSQL 17 is the project baseline. Drizzle generates schema DDL into `supabase/migrations`, while the Supabase CLI applies and tests the full migration locally. Direct schema pushes and uncaptured remote dashboard changes are prohibited. See [`supabase/README.md`](../supabase/README.md).

All schema changes must be migration-driven and update this document. Migration `0001_circularity_scenarios.sql` is repository-reviewed schema only until a separately approved hosted apply is recorded.

## Import template contract

PR 5 adds CSV templates for companies, metric definitions, source registry records, source documents, claims, and metric observations. These templates are repository contracts for staging data, not a production upload API. The demo import uses fictional sample rows only, and local validation requires sample rows to preserve sample review state and stay excluded from verified totals.
