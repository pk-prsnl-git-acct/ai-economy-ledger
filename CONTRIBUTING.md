# Contributing to AI Economy Ledger

Thank you for helping build an auditable public model of the AI economy.

## Before contributing

1. Read [Project Ground Rules](docs/PROJECT_GROUND_RULES.md).
2. Check [Project Tracker](docs/PROJECT_TRACKER.md) and [Roadmap](docs/ROADMAP.md).
3. Open or reference an issue before starting a large change.
4. Never include credentials, licensed datasets, or unsourced financial claims.

## Development workflow

1. Branch from an up-to-date `main` using `feature/`, `fix/`, `docs/`, `test/`, `data/`, or `chore/`.
2. Keep one concern per pull request.
3. Add or update tests for behavior changes.
4. Update project memory when architecture, methodology, schema, operations, or decisions change.
5. Run `pnpm verify` before requesting review.
6. Complete every section of the pull-request template.

## Commit conventions

Use concise Conventional Commit-style subjects:

```text
feat: add metric observation model
fix: prevent sample data from entering verified totals
docs: clarify circularity methodology
test: cover confidence score boundaries
chore: update repository tooling
```

Commits must use the contributor's own identity. Automated agents must never substitute their identity for the human project owner.

## Data contributions

Data changes require:

- a source URL or auditable source reference
- publisher and source type
- access date and covered period
- confidence and review status
- methodology version
- an explicit sample-data flag
- confirmation that redistribution is permitted

Sample or illustrative data must never be presented as verified.

## Review expectations

Reviewers prioritize correctness, source lineage, security boundaries, data licensing, tests, operational impact, and maintainability. Style preferences should not block a correct change unless they reflect documented conventions.

## Contributor conduct

Be factual, respectful, and transparent about uncertainty. Harassment, fabricated evidence, promotional manipulation, or attempts to conceal conflicts of interest are not acceptable.
