# Architecture

## Context

AI Economy Ledger is a public, source-linked financial intelligence product. It must support inexpensive public reads, protected review workflows, scheduled data operations, reproducible publication, and auditable provenance.

## System shape

```text
Public and admin users
        |
Cloudflare Workers / OpenNext
  UI, read API, auth guards, scheduled triggers
        |
Backend modular monolith
  ingestion -> normalization -> review -> metrics -> publication
        |
Supabase Postgres and Auth
  source of truth, RLS, revisions, published snapshots
```

GitHub hosts code, reviews, documentation, and optional quality checks. It is not the production runtime.

## Runtime responsibilities

- Cloudflare request path: pages, lightweight APIs, authorization checks, cached public snapshots
- Cloudflare Cron: keep-alive reads, freshness scans, publication triggers
- Cloudflare Queues: later asynchronous ingestion and normalization
- Cloudflare Workflows: later durable multi-step jobs and retries
- Supabase: authentication, canonical relational data, RLS, review state, revisions
- Generated snapshots: fast and reproducible public JSON/CSV delivery

## Modular monolith boundaries

Planned modules under `src/server/modules/`:

```text
market-research       source-discovery     ingestion
extraction            normalization        entity-resolution
validation            confidence-scoring   review-queue
metric-store          circularity          scenario-engine
publication           observability
```

Modules expose typed boundaries and keep provider-specific access behind adapters. Microservices are out of scope for v0.1.

## Data flow

```text
source document -> candidate claim -> normalized metric -> entity match
-> validation -> confidence score -> human review -> approved observation
-> revision history -> published snapshot
```

## Architectural decisions

- Cloudflare-first prevents framework-host lock-in and consolidates edge runtime, scheduling, queues, and caching.
- Supabase supplies portable Postgres plus authentication without becoming the frontend runtime.
- Drizzle is preferred for explicit, reviewable SQL-first schemas.
- Published snapshots isolate public traffic from analytical write workflows.
- Provider integrations remain replaceable and secrets remain server-only.

## Data architecture

```text
Protected server/reviewer path
  -> postgres.js transaction pool connection (prepared statements disabled)
  -> Drizzle typed queries
  -> ledger schema + RLS + immutable revision history

Public path
  -> Supabase Data API / api RPCs
  -> published_snapshots only
  -> published + non-sample predicate enforced in PostgreSQL
```

The canonical tables live in the unexposed `ledger` schema. Authorization helpers and the `auth.users`-linked role map live in unexposed `private`. The exposed `api` schema contains only reviewed publication functions. This makes accidental table exposure less likely than placing canonical data in `public`, while retaining RLS and least-privilege grants as additional controls.

Serverless application connections use the Supabase transaction pooler through `postgres.js` with prepared statements disabled and a one-connection client ceiling per Worker isolate. Migrations use the direct database URL and never the transaction pooler. The database adapter is server-only and accepts its connection URI explicitly so environment selection remains visible.

Trade-offs:

- Typed Drizzle schema plus SQL-only Supabase security creates two review surfaces, but keeps portable query types without reducing RLS, trigger, or RPC expressiveness.
- Snapshot RPCs trade arbitrary public queries for a smaller, cacheable, auditable surface.
- A relational role table adds one indexed lookup to reviewer policies, but avoids trusting user-editable metadata and supports immediate role revocation.
- A modular monolith and universal observation table optimize consistency and iteration speed; specialized projection tables can be added when measured query load justifies them.

Revisit connection pooling and add Cloudflare Hyperdrive only after production traffic and regional latency are measured. Revisit snapshot storage when payload size or cache invalidation requires R2. Consider Supabase preview branches when contributor volume justifies their cost.

## Implemented runtime foundation

PR 2 establishes Next.js 16 App Router on React 19, Tailwind CSS 4, and the OpenNext Cloudflare adapter. `wrangler.toml` targets `.open-next/worker.js`, enables `nodejs_compat`, serves `.open-next/assets`, and enables Worker observability. No database binding, R2 cache, Queue, Workflow, custom domain, or production deployment is configured yet.

PR 3 establishes the PostgreSQL 17 schema contract, local Supabase workflow, typed Drizzle schema/client, RLS role model, provenance and revision constraints, and public snapshot RPC boundary. It does not apply the migration to hosted Supabase or connect an application route to production data.

PR 4 establishes a static Server Component presentation layer. `src/ui/site-map.ts` is the route/navigation contract, `src/ui/metadata.ts` standardizes route metadata, and `components/ledger.tsx` contains the reusable Ledger Dark shell and trust-state primitives. All required public and admin routes are statically generated. The pages contain fictional placeholders only and intentionally make no database, authentication, or write calls; later PRs replace page interiors while retaining the route and trust contracts.

PR 5 establishes a repository-level import contract, not a production ingestion surface. CSV headers live under `data/import-templates`, fictional demo rows live under `data/sample/demo-import`, and the sample workbook mirrors those rows for contributor-friendly review. Local validation proves sample rows keep their sample labels and cannot enter verified totals before KPI work begins.

PR 6 establishes the first pure calculation module under `src/server/modules/kpi`. It performs fixed-scale decimal arithmetic over approved, non-sample observation-shaped records and returns deterministic totals plus diagnostics. It intentionally has no database adapter, public API, snapshot publication, or production runtime side effect.

PR 7 wires the publication modular-monolith boundary. A server-only PostgreSQL adapter joins source registry, source documents, approved claims, current observations, and companies; a pure read-model builder filters every sample/review boundary and computes confidence and freshness; and a deterministic generator combines that evidence with PR 6 KPIs into a versioned SHA-256 snapshot. Generation can persist only a draft. Public HTTP GET routes call the existing `api` schema RPCs with a publishable key, so PostgreSQL remains the enforcement point for published/non-sample visibility and canonical tables remain unreachable.

Publication is deliberately two-stage: deterministic draft generation followed by a separately authorized review/publish transition in PR 8. If payload size, request volume, or cache invalidation becomes material, retain the same content-hash contract while moving immutable payload delivery to R2.

PR 8 establishes the protected admin runtime boundary. Admin routes are dynamic Server Components that read a Supabase session cookie, verify the token with Supabase Auth using the publishable key, and then check reviewer/admin authorization against `private.app_user_roles` through the server-only database connection. The review queue is read through a dedicated server repository. Browser code never receives service-role or database credentials, and the PR adds explicit bootstrap and RLS smoke scripts without running them against production by default.

Local development uses `next dev`; runtime verification builds the OpenNext artifact and smoke-tests it through Wrangler/workerd. The application does not opt into Next.js Edge Runtime because OpenNext Cloudflare targets the Node.js runtime compatibility layer.

See [Decision Log](DECISION_LOG.md) for accepted decisions and trade-offs.
