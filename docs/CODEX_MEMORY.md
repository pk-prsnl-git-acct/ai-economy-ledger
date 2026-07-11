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
- Follow `docs/UPDATED_PR_PLAN_AND_CHECKPOINTS.md` for logical PR order, checkpoint gates, and the stop rule before beginning the next PR.

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
- Hosted project `vupwphakeyvvhaoxuvuw` received migration version `0000` on 2026-07-11. The direct database endpoint required IPv6 from this network, so the apply used the local IPv4 pooler connection from ignored environment files after a dry run confirmed only `0000_ledger_foundation.sql`.
- Post-apply verification on 2026-07-11 confirmed the expected `ledger` tables, `private.app_user_roles`, RLS enablement, zero `anon` table grants, only two `api` RPC grants for `anon`, denied anonymous canonical reads/writes, and a successful read-only health query.

## Roadmap checkpoints

- The July 2026 amendment adds explicit checkpoint PRs: 2.5 Cloudflare/OpenNext preview smoke, 3.5 Supabase remote migration apply, 3.6 roadmap amendment if needed, and 11 production deploy/domain smoke.
- PR 4 now absorbs route skeleton and navigation coverage by default. Re-create a separate logical PR 4.5 only if PR 4 needs to ship in two owner-approved parts.
- Logical PR 4 was merged as GitHub PR `#5`; do not rename internal roadmap scopes to match GitHub numbers.
- PR 5 now absorbs demo import and sample isolation verification by default. Re-create a separate logical PR 5.5 only if PR 5 needs to ship in two owner-approved parts.
- Logical PR 5 owns the sample workbook, CSV import templates, demo import fixtures, and sample isolation validation. It must not add production database writes or a protected admin import flow.
- Logical PR 5 was merged as GitHub PR `#6`; post-merge tracker and PR log state must be updated before any later PR begins.
- PR 7 now absorbs published snapshots and public API by default. Re-create a separate logical PR 7.5 only if PR 7 needs to ship in two owner-approved parts.
- PR 8 now absorbs admin bootstrap and RLS smoke verification by default. Re-create a separate logical PR 8.5 only if PR 8 needs to ship in two owner-approved parts.
- PR 2.5 is currently considered satisfied by PR 2's OpenNext build and workerd HTTP smoke evidence. Re-open a checkpoint if later runtime changes invalidate that evidence.
- PR 3.6 is unnecessary if PR 3.5 merges with `docs/UPDATED_PR_PLAN_AND_CHECKPOINTS.md` and the matching roadmap/tracker/log/decision updates.
- After each PR/checkpoint, stop and report summary, files changed, checks, data/schema impact, deployment impact, security/RLS impact, known risks, and next recommended PR.

## UX foundation

- PR 4 centralizes public/admin route definitions in `src/ui/site-map.ts` and builds navigation and route-directory coverage from that source. Preserve this contract when replacing placeholders with product pages.
- Static UI primitives live in `components/ledger.tsx`; they are Server Components and have no production data or browser-side secret dependency.
- All headline placeholders must retain sample, confidence, freshness, source, and methodology states until PR 7 replaces them with approved published snapshots.
- Admin routes before PR 8 are discoverable static previews only. They must keep the admin access warning and contain no functional write controls or misleading authentication state.
- PR 4 browser verification covered the dashboard at desktop width and the review queue at a 390px mobile viewport. Development-only HMR WebSocket errors occurred when Playwright used `127.0.0.1` against a `localhost` dev origin; production compilation and application responses were unaffected.

## Import template foundation

- PR 5 import templates live under `data/import-templates`; fictional demo rows live under `data/sample/demo-import`.
- The sample workbook is generated at `data/sample/ai_economy_ledger_sample_import.xlsx` from the same demo contract.
- `scripts/import/import-contracts.mjs` is the local validation source for template headers, sample/review-state lockstep, and verified-total exclusion.

## KPI calculation foundation

- PR 6 calculation logic lives in `src/server/modules/kpi/calculations.mjs`.
- KPI totals use fixed-scale decimal arithmetic and return decimal strings.
- Verified KPI totals include only approved, non-sample, numeric observations; excluded rows are reported in diagnostics.
- Low and unscored revenue stay visible in gross AI economic flow but are excluded from net external AI revenue by default.
- Logical PR 6 was merged as GitHub PR `#7`; it changes repository logic and tests only, with no Supabase or Cloudflare production mutation.

## Publication runtime foundation

- PR 7 uses a server-only PostgreSQL adapter for canonical source/claim/observation lineage, then passes flattened rows through pure eligibility and snapshot builders.
- Publishable rows require approved claims and observations, non-sample company/source/document/claim/observation state, and no approved successor revision.
- Snapshots have canonical JSON SHA-256 hashes, explicit versions and generation timestamps, source/observation counts, confidence distribution, and freshness state.
- Snapshot generation persists drafts only. The review/publish transition remains PR 8 scope.
- Public Next.js routes are GET-only and call only the two existing `api` RPCs with a publishable key; service-role and secret keys are absent from the adapter and routes.
- PR 7 makes no schema migration, hosted Supabase write, Cloudflare mutation, production snapshot, or deployment.
- Logical PR 7 was merged as GitHub PR `#8`; it includes the former PR 7.5 checkpoint scope.

## Admin runtime foundation

- PR 8 protects admin routes as dynamic Server Components and evaluates access per request.
- Supabase session verification uses the publishable key against Supabase Auth, then checks `private.app_user_roles` through the server database connection.
- The review queue runtime reads `ledger.review_queue` through `src/server/admin/review-queue.ts`; it does not expose canonical tables to the browser.
- `pnpm admin:bootstrap` grants the first reviewer/admin role only when local private env provides `DATABASE_URL` and `ADMIN_BOOTSTRAP_USER_ID`.
- `pnpm admin:rls-smoke` verifies anonymous denial, unmapped authenticated isolation, and the mapped reviewer path when `RLS_SMOKE_REVIEWER_USER_ID` is configured.
- PR 8 makes no schema migration, hosted Supabase mutation by itself, Cloudflare mutation, production role grant, published snapshot, or deployment.
- Logical PR 8 was merged as GitHub PR `#9`; it includes the former PR 8.5 checkpoint scope.
