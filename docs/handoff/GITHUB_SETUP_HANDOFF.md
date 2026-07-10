# GitHub Setup — Sanitized

- Repository: `pk-prsnl-git-acct/ai-economy-ledger`
- Visibility: public
- Default branch: `main`
- License: Apache-2.0
- Write access: owner-controlled
- Branch rules: pull request required, conversations resolved, deletions restricted, force pushes blocked
- Security: dependency and secret protections enabled where available

GitHub Actions are reserved for quality checks. Enable required status checks only after stable job names exist.

Live verification on 2026-07-10 confirmed:

- draft PR creation and branch publication work through the project account
- the `quality` GitHub Actions job completes successfully
- effective `main` rules require pull requests and review-thread resolution and block deletions and non-fast-forward updates
- the current PAT can read but cannot update the ruleset because it lacks `Administration: write`
- the owner manually added `quality` as a strict required check and requires PR branches to be current
- the ruleset currently requires one approval; owner-authored PRs rely on the configured administrator bypass until a second maintainer exists

Repository operations must use the project-specific owner identity. Do not use a global or ChatGPT-connected GitHub account without explicit owner approval.
