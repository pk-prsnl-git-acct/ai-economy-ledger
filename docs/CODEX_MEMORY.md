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
- GitHub PR 1 is the first live workflow proof; its `quality` job passes.
- The project PAT cannot update repository rulesets (`403` without `Administration: write`); do not use another account. The owner manually configured `quality` as a strict required check.
- The ruleset requires one approval. Owner-authored PRs may need the configured administrator bypass until a second maintainer exists; contributor PRs still require owner review.

## Working conventions

- Keep provider calls behind adapters.
- Prefer pure calculation functions and deterministic publication.
- Record unexpected failures and their resolution here when they may recur.
- Never copy raw private handoff files or credentials into repository documentation.
- Follow `docs/DEVELOPMENT_WORKFLOW.md` from scope through PR, CI, merge, and deployment approval.

## Foundation learning

- The local bundled pnpm executable is not guaranteed to be on child-shell PATH. `pnpm verify` therefore delegates to a Node orchestrator instead of recursively invoking pnpm.
- The first combined private environment file contained stale values; authoritative component files were synchronized into it after live read-only verification. Never record their values here.
- Repository-managed hooks live in `.githooks`; `pnpm setup` configures them locally without changing global Git settings.
- Git hooks record the Node executable used during setup so checks do not accidentally run under an unrelated system Node version.

## Runtime foundation

- Pinned stack: Next.js 16.2.10, React 19.2.7, TypeScript 6.0.3, ESLint 9.39.4, Tailwind 4.3.2, OpenNext Cloudflare 1.20.1, Wrangler 4.110.0.
- TypeScript 7 was incompatible with the current TypeScript-ESLint parser; ESLint 10 was outside the peer ranges of current React/JSX plugins. Preserve the compatible TypeScript 6 / ESLint 9 pairing until upstream support changes.
- Next.js needs `turbopack.root` fixed to this repository because an unrelated lockfile exists higher in the local filesystem.
- OpenNext invokes `pnpm build` by command name. In the Codex desktop runtime, add the bundled pnpm wrapper directory to PATH for OpenNext commands; standard contributor and CI pnpm installations already do this.
- `pnpm-workspace.yaml` is the pnpm 11 source of truth for approved lifecycle scripts. Do not move the allowlist back into `package.json`.
- `wrangler.toml` has no R2, database, Queue, Workflow, or service bindings yet. The preview smoke runs locally in workerd and does not deploy.

## Data foundation

- Hosted Supabase runs PostgreSQL 17.6; local configuration targets major version 17.
- Canonical data lives in unexposed `ledger`; role data/helpers live in unexposed `private`; only snapshot RPCs live in exposed `api`.
- Reviewer/admin authorization uses `private.app_user_roles` linked to `auth.users`, never user-editable metadata.
- Drizzle schema generates structural SQL into `supabase/migrations`; SQL-only RLS, grants, triggers, and RPCs are reviewed in that same migration history.
- Serverless pooled connections disable prepared statements and cap each Worker isolate at one database connection. Direct connections are migration-only.
- No PR or merge authorizes `supabase db push`; hosted migrations remain a separately approved release action.
- Next.js 16.2.10 still declares vulnerable PostCSS 8.4.31 internally; the repository overrides all PostCSS resolutions to the already-pinned 8.5.16 patched release. Preserve the override until Next.js updates its dependency.
