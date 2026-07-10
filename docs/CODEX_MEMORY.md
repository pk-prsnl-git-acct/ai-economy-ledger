# Codex Memory

This document contains durable implementation context for future coding sessions. It must never contain secrets.

## Always remember

- Read `PROJECT_TRACKER.md`, `PR_LOG.md`, `DECISION_LOG.md`, and relevant domain docs first.
- Work one reviewed PR scope at a time.
- Product name: AI Economy Ledger.
- Canonical domain: `https://aieconomyledger.com`.
- Runtime: Cloudflare Workers through OpenNext.
- Database/Auth: Supabase.
- Package manager: pnpm.
- Production jobs must be Cloudflare-native, not GitHub Actions.
- All financial metrics require lineage, periods, confidence, review state, and methodology version.
- Sample workbook values are illustrative and never verified facts.
- Keep private component environment files and `.env.local` out of Git.
- Use only the repository-specific GitHub identity and PAT account.

## Infrastructure observations

- GitHub owner access and push/admin permission were verified on 2026-07-10.
- Cloudflare token, account, active zone, Workers API, and DNS read access were verified on 2026-07-10.
- Supabase Auth, JWKS, and server REST access were verified on 2026-07-10.
- Supabase's legacy anon key is obsolete; prefer the current publishable-key model and configure public access only with explicit RLS.
- The public domain currently has no deployed app origin.

## Working conventions

- Keep provider calls behind adapters.
- Prefer pure calculation functions and deterministic publication.
- Record unexpected failures and their resolution here when they may recur.
- Never copy raw private handoff files or credentials into repository documentation.

## Foundation learning

- The local bundled pnpm executable is not guaranteed to be on child-shell PATH. `pnpm verify` therefore delegates to a Node orchestrator instead of recursively invoking pnpm.
- The first combined private environment file contained stale values; authoritative component files were synchronized into it after live read-only verification. Never record their values here.
