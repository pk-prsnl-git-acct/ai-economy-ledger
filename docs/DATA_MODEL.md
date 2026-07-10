# Data Model

## Design goals

- Preserve provenance and revision history.
- Represent observations over time instead of overwriting snapshots.
- Distinguish recognition, cash-flow, confidence, and review semantics.
- Keep sample rows structurally isolated from verified publication.

## Core entities

```text
companies              company_aliases       source_registry
source_documents       claims                metric_observations
funding_deals          revenue_debt          compute_infra
relationships          review_queue          metric_revisions
assumptions            scenario_runs         published_snapshots
update_log             app_health_check
```

`metric_observations` is the universal time-series fact layer. Each observation carries entity, metric, value, units, reported and normalized currency values, period, recognition and cash-flow types, source/claim references, confidence, review status, methodology version, and sample status.

## Controlled vocabularies

Recognition types include `announced`, `committed`, `received`, `recognized`, `run_rate`, `estimated`, `face_value`, and `cash_equivalent`.

Review states include `sample`, `pending`, `approved`, `rejected`, `needs_more_sources`, `stale`, and `superseded`.

Cash-flow types must distinguish equity, debt, grants, project finance, credits, capex, leases, power obligations, recognized revenue, run-rate revenue, customer prepayments, and vendor financing.

## Relationships

Directed relationship records represent investor, vendor, customer, cloud, compute, data-center, subsidiary, partner, lender, and borrower edges. Each relationship may carry amounts, periods, sources, confidence, related-party flags, and circularity flags.

## Security model

- RLS on business tables
- explicit public reads only for approved publication surfaces
- authenticated reviewer/admin writes
- service credentials restricted to protected server jobs and migrations
- revisions instead of silent overwrites

All schema changes must be migration-driven and update this document.
