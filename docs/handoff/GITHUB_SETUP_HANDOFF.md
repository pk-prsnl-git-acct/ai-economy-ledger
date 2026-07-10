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
- the current PAT can read but cannot update the ruleset; adding `quality` as a required server-side check needs `Administration: write` permission or a manual owner update

Repository operations must use the project-specific owner identity. Do not use a global or ChatGPT-connected GitHub account without explicit owner approval.
