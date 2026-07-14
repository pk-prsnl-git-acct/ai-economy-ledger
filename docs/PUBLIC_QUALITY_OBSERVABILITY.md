# Public Quality Observability

The public application consumes the private engine's `quality-observability@36.0.0` contract and `release-quality-report@36.0.0` through a server-only adapter. It verifies report and PR34 release-manifest bindings before returning an intentionally small safe summary.

`/data/quality` shows measurable, insufficient-sample, and unmeasurable counts plus limitations. `/admin/health` adds protected connector, backlog, drift, certification, and release-integrity summaries. Neither surface recomputes SLO, drift, suspension, trust, or publication policy.

The checked-in transport is fixture-backed for CI. No live private endpoint, external alert channel, production enforcement, deployment, secret, or publication is enabled.
