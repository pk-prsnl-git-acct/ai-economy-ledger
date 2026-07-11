# Development and Pull Request Workflow

This is the required path from an idea to merged code. It applies to maintainers, external contributors, and coding agents.

## Workflow at a glance

```text
Issue or approved scope
  -> branch from current main
  -> implement code, tests, and docs
  -> local hooks and pnpm verify
  -> contributor-authored commit
  -> push branch
  -> draft pull request
  -> GitHub CI and review
  -> resolve findings
  -> maintainer merge
  -> branch cleanup and project-memory update
```

Production deployment is a separate, explicitly approved stage. A merged PR does not authorize live migrations, DNS changes, secret changes, or production deployment.

Logical roadmap labels may differ from GitHub PR numbers. Follow `docs/UPDATED_PR_PLAN_AND_CHECKPOINTS.md` for the current logical PR sequence and checkpoint gates.

## 1. Define the work

Use an issue or an owner-approved PR scope. Record:

- problem and desired outcome
- acceptance criteria and exclusions
- affected data, schema, security, and deployment surfaces
- required tests and documentation
- licensing or source-policy implications

Large proposals should be split before implementation.

## 2. Prepare the repository

```bash
git switch main
git pull --ff-only origin main
pnpm install --frozen-lockfile
pnpm setup
pnpm verify
```

`pnpm setup` installs repository-managed Git hooks by setting the local checkout's `core.hooksPath` to `.githooks`. It does not modify global Git configuration.

Confirm your own identity before committing:

```bash
git config --local user.name
git config --local user.email
```

Never use another contributor's identity or a default automation account.

## 3. Create a focused branch

```bash
git switch -c feature/short-description
```

Allowed prefixes include `feature/`, `fix/`, `docs/`, `test/`, `data/`, and `chore/`. Do not work directly on `main`.

## 4. Implement with evidence

- Keep changes inside the approved scope.
- Add tests with behavior changes.
- Update architecture, methodology, schema, deployment, or security docs in the same PR.
- Update `PROJECT_TRACKER.md`, `PR_LOG.md`, and `CODEX_MEMORY.md` when future sessions need the new state or learning.
- Add a `DECISION_LOG.md` entry for material architecture, methodology, licensing, security, or governance decisions.
- Keep credentials, private source material, and restricted datasets outside Git.

## 5. Verify locally

Run the narrow test during development, then the full gate:

```bash
pnpm verify
pnpm build                     # once the runtime exists
pnpm test:cloudflare-preview   # for Worker/server changes
git diff --check
git status
git diff
```

Review data/schema and deployment impact explicitly. Confirm `.env.local` remains ignored:

```bash
git check-ignore .env.local
```

The pre-commit hook runs repository and secret-safety checks. The pre-push hook runs the complete local verification suite. Hooks are a convenience and safety net; CI remains authoritative.

## 6. Commit intentionally

Stage only files belonging to the PR and inspect the staged diff:

```bash
git add <explicit paths>
git diff --cached --check
git diff --cached
git commit -m "type: concise outcome"
```

Use `feat`, `fix`, `docs`, `test`, `refactor`, `chore`, `ci`, or `data`. Commits must be authored by the actual contributor. Co-authorship is added only when explicitly agreed.

## 7. Push and open a draft PR

```bash
git push -u origin "$(git branch --show-current)"
gh pr create --draft --base main --fill
```

Complete the PR template. Explain what changed, why, verification, data/schema impact, deployment impact, risks, follow-ups, and project-memory updates.

For automated owner workflows, authenticate `gh` using the project PAT through the `GH_TOKEN` environment variable. Do not reuse an unrelated global GitHub session or put a PAT in the remote URL.

## 8. CI and review

Every PR runs the GitHub `quality` job. As the application matures, required jobs expand to lint, typecheck, unit/integration tests, data validation, build, Cloudflare preview, migration verification, and security analysis.

Current enforcement: GitHub requires the `quality` check and requires the branch to be current with `main`. The ruleset also requires one approval. Because GitHub does not allow an author to approve their own PR, an owner-authored PR may use the configured administrator bypass while the project has only one maintainer. Contributor-authored PRs still receive owner review. Revisit the approval and CODEOWNER requirements when a second maintainer is appointed.

A PR may merge only when:

- required checks pass
- review conversations are resolved
- scope and documentation are complete
- source/data licensing is acceptable
- no secrets or private data are present
- the maintainer approves the change

Failed checks are fixed on the same branch. Do not bypass or weaken a gate merely to merge.

## 9. Merge and clean up

Use squash merge for noisy iterative histories and preserve meaningful individual commits when they improve auditability. Never force-push `main`.

After merge:

```bash
git switch main
git pull --ff-only origin main
git branch -d <merged-branch>
```

Delete the remote branch when no longer needed. Before any later PR begins, update release notes, `PROJECT_TRACKER.md`, `PR_LOG.md`, `CODEX_MEMORY.md`, and any roadmap/status docs touched by the merged scope so the repository reflects the post-merge state rather than the pre-merge review state.

Post-merge tracking minimum:

- mark the merged logical PR as `merged` everywhere it was previously `draft`, `in progress`, or `ready for review`
- move `PROJECT_TRACKER.md` from the merged active scope to either the next approved logical PR or an explicit waiting state
- record the final GitHub PR number and merge outcome in `PR_LOG.md`
- update the next decision gate to the next unstarted logical PR

After each logical PR or checkpoint, stop and report summary, files changed, checks run, data/schema impact, deployment impact, security/RLS impact, known risks, and the next recommended PR. Do not start the next logical PR without explicit owner approval.

## 10. Deployment boundary

CI validates code; Cloudflare runs the product. Production deployment requires its own approval and gates:

- verified build and Cloudflare preview
- backward-compatible migration plan and rollback notes
- environment inventory and provider bindings
- observability and smoke test
- last-known-good Worker/snapshot recovery path

GitHub Actions must not become the production scheduler, ingestion worker, or Supabase keep-alive mechanism.

## Exceptions and emergencies

Urgent fixes still use a branch, PR, CI, and documented review. If a production incident requires an exceptional bypass, the maintainer records why, limits the change, validates immediately afterward, and adds a follow-up preventing recurrence.
