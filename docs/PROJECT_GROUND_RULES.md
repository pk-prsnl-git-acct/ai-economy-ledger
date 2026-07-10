# Project Ground Rules

## Core principle

No important knowledge may live only in chat or private notes. Architecture, schema, methodology, source policy, deployment behavior, operational learning, and material decisions belong in the repository.

## Required behavior

- Work in focused PR-sized changes and stop at the agreed boundary.
- Preserve source lineage from evidence to published metric.
- Keep sample, estimated, and verified data separate.
- Use migrations for schema changes and revision records for reviewed metrics.
- Make public reads explicit and protect all writes.
- Keep production workloads Cloudflare-native.
- Update tests and documentation with behavior changes.
- Review the full diff and secret exposure before every commit.
- Use the human contributor's verified Git identity.

## Prohibited behavior

- Committing credentials or private environment files
- Presenting estimates, commitments, or sample values as confirmed facts
- Redistributing restricted commercial data
- Allowing unauthenticated writes or exposing server credentials to browser code
- Using GitHub Actions as the production scheduler or ingestion runtime
- Manually changing production schema without a migration
- Copying proprietary interfaces or making investment recommendations

## Source-of-truth order

1. Current repository documentation and accepted decision records
2. Current implementation, migrations, and automated tests
3. Sanitized infrastructure handoffs
4. Historical handoff materials

If implementation and documentation conflict, stop and reconcile them in the same PR.

## Session checklist

1. Read the tracker, recent PR log, decision log, and relevant domain documents.
2. Confirm acceptance criteria, affected files, risks, and required tests.
3. Work on a dedicated branch.
4. Run the baseline checks before and after material changes.
5. Inspect unstaged and staged diffs for secrets and scope creep.
6. Update project memory.
7. Commit only under the verified contributor identity.

The detailed contributor procedure is canonical in [Development and Pull Request Workflow](DEVELOPMENT_WORKFLOW.md).
