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

See [Decision Log](DECISION_LOG.md) for accepted decisions and trade-offs.
