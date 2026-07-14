# Market Intelligence Views

Logical PR37 renders deterministic analytical decisions created by the private
data engine from an immutable PR34 release. The public application verifies and
displays those decisions. It does not select inputs, recompute eligibility,
assign trust, infer AI allocation, or manufacture missing values.

## Reading the views

Every view states whether it is available, limited, awaiting methodology,
missing eligible data, or lacking sufficient history. `Unavailable` means the
release cannot support the analysis; it never means zero. The current candidate
covers five companies, six selected SEC filing observations, and four of sixty
named coverage cells. It is not a complete financial statement or a measure of
the whole AI market.

Truth class and trust state are separate. A reported fact can be lawfully
source-attributed without being human verified. A human-verified fact retains
that distinct classification. Derived metrics must name formulas and exact
components; the current capital-inflow definition remains draft and produces no
public total because the release has no eligible capital events.

## Releases, sources, and corrections

Each artifact binds to release
`dataset-release:1:5424bda5073c2a1a09cb`, its PR34 manifest hash, the PR36
quality report, and analytics build `analytical-build@37.0.0`. Event rows retain
safe stable record/version and evidence references. Coverage and quality limits
appear beside views. Future corrections or methodology changes require a newly
bound analytical build; historical bytes are not silently rewritten.

Use `/api/data/analytics` for the safe catalog and
`/api/data/analytics/{artifact}.json` for immutable artifacts. Cite the view key,
view version, release ID, methodology version, and access date. Link the release,
coverage, source, and methodology pages when republishing analysis.

These views are research infrastructure, not investment advice. No output is a
recommendation, valuation, forecast, or claim of complete market coverage.
Production deployment and publication remain separate owner-controlled actions.
