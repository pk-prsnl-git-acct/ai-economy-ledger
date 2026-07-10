# Source Policy

## Evidence priority

1. Official filings and government records
2. Earnings releases and audited company reporting
3. Company press releases and investor-relations material
4. Reputable reporting with transparent attribution
5. Research reports with usable licensing
6. Analyst estimates and user input, always marked as estimates

## Default confidence starting points

| Source type | Default |
|---|---:|
| Official filing | 0.95 |
| Earnings release | 0.90 |
| Company press release | 0.85 |
| Reputable news report | 0.70 |
| Research report | 0.65 |
| Analyst estimate | 0.45 |
| User input | 0.30 |
| Sample workbook | demo only |

Defaults are inputs to review, not substitutes for judgment.

## Required source metadata

- canonical URL or auditable reference
- publisher, title, and source type
- publication and access dates
- covered period
- license or redistribution status
- content hash or revision reference where appropriate
- reviewer and review status

## Licensing rule

Official public sources and permissively licensed reports may support the open dataset. Licensed commercial providers may inform private analysis only when their terms permit it; their records must not enter the public dataset without explicit redistribution rights.

## Collection guardrails

- Respect robots policies, terms, rate limits, copyright, and access controls.
- Do not bypass paywalls or technical restrictions.
- Do not build broad scraping in v0.1.
- Preserve quoted text sparingly and prefer structured factual observations.
- Treat rumors and unattributed private-company estimates as unverified claims.
