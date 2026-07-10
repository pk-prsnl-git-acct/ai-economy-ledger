# Operational Runbook

## Before making changes

1. Confirm the intended environment and account.
2. Verify the branch, diff, and repository-specific Git identity.
3. Read the project tracker and relevant decision records.
4. Confirm backups and rollback for production-impacting work.

## Standard verification

```bash
pnpm verify
git status
git diff
git diff --cached
git check-ignore .env.local
```

## Failed deployment

1. Stop further promotion.
2. Identify whether failure is build, Worker runtime, binding, DNS, or database related.
3. Restore the last known-good Worker version when user impact exists.
4. Preserve logs without credentials.
5. Record the cause, resolution, and prevention in project memory.

## Suspected credential exposure

1. Stop using the credential.
2. Rotate or revoke it at the provider.
3. Inspect Git history, CI logs, artifacts, and deployment logs.
4. Remove exposure without rewriting shared history unless the owner approves the coordinated procedure.
5. Document the incident without including the secret.

## Data integrity incident

1. Pause publication, not source collection, when safe.
2. Preserve the affected snapshot and revision trail.
3. Identify source, claim, observation, and aggregate impact.
4. Correct through a revision record and republish deterministically.
5. Add a regression test.
