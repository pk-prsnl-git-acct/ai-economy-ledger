# Methodology

## Analytical position

AI Economy Ledger maintains an open, source-linked model with confidence scoring, circularity adjustments, and visible uncertainty. It does not claim complete global coverage or provide investment advice.

## Core distinctions

- confirmed versus estimated
- recognized revenue versus annualized run rate
- cash received versus announced commitment
- debt principal versus lease, capex, power, and vendor obligations
- gross economic flow versus net external demand
- source evidence versus analyst assumption
- sample versus verified data

## Core formulas

```text
total_capital_in = equity funding + debt principal + grants
  + project finance + estimated cash value of cloud credits
  + customer prepayments

total_obligations = debt principal + lease obligations
  + compute commitments + capex commitments
  + power purchase obligations + minimum cloud spend commitments

gross_ai_economic_flow = confirmed + reported + estimated AI revenue
  + infrastructure revenue + application revenue

net_external_ai_revenue = gross_ai_economic_flow
  - related-party revenue - internal transfers
  - vendor-financed circular revenue - excluded low-confidence revenue
```

## Calculation rules

The PR 6 calculation engine is pure and deterministic. It accepts normalized metric-observation-shaped records and returns decimal strings, not floating-point totals.

- Only `review_state=approved` and `is_sample=false` observations enter verified KPI totals.
- Sample, pending, rejected, stale, superseded, and non-numeric observations are reported in diagnostics but excluded from totals.
- Monetary values are summed with fixed-scale decimal arithmetic up to 8 decimal places.
- Debt principal may count in both `total_capital_in` and `total_obligations`, matching the methodology distinction between cash inflow and repayment obligation.
- Gross AI economic flow includes approved AI revenue observations, including low-confidence revenue when it is still visible as gross flow.
- Net external AI revenue excludes related-party revenue, internal transfers, vendor-financed circular revenue, explicit exclusions, and low or unscored confidence revenue by default.
- Low-confidence revenue exclusion can be disabled for analysis, but published headline net revenue should keep the default conservative treatment.

Coverage, intensity, circularity, and confidence-weighted metrics must define zero-denominator behavior and preserve units.

## Circularity and scenarios

Circularity adjustments are observation-linked. An approved, non-sample relationship may identify an observation as related-party, circular, or vendor-financed; that observation is deducted at most once even when multiple relationship records support the classification. Gross flow remains unchanged and visible. The circularity ratio is `adjustment / gross flow`; it is `null`, not zero, when gross flow is zero.

Directed cycles are analytical signals, not automatic proof that every value on the cycle is circular. Only reviewed relationship flags linked to an observation change adjusted flow. Scenario runs apply explicit, ordered assumptions to a preserved baseline and report deltas. They do not overwrite observations, change reviewed facts, or publish themselves.

## Publication requirements

Headline metrics must expose confirmed and estimated portions, exclusions, circularity adjustment, source count, freshness, and methodology version. Formula changes require tests, a decision entry, and a methodology-version update. PR 9 adds analytical machinery but does not change the active `v0.1.0` headline KPI formulas.
