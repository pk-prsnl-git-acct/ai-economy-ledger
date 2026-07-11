# Pull Request Log

## PR 1 — Repository scaffold and project memory

- Status: merged
- Pull request: `#1`
- Branch: `chore/repo-scaffold`
- Purpose: establish contributor-ready documentation, governance, security, package metadata, and repeatable baseline checks
- Data impact: none
- Deployment impact: none
- Secrets: local environment remains ignored; public example contains placeholders only
- Verification: repository lint, syntax/type placeholder, four foundation tests, data safety validation, YAML parsing, diff whitespace check, and explicit foundation build placeholder
- Dependencies: none; lockfile created with pnpm 11.7.0
- Follow-up commit: documented the end-to-end PR lifecycle and added repository-managed pre-commit/pre-push hooks
- GitHub: draft PR 1 opened; `quality` CI passed
- Ruleset: `quality` is now a strict server-required check; PR, approval, conversation-resolution, deletion, and force-push protections are active
- Solo-maintainer note: PR 1 requires the configured administrator bypass because authors cannot approve their own PR

## PR 2 — Next.js and Cloudflare/OpenNext scaffold

- Status: merged
- Pull request: `#2`
- Branch: `chore/cloudflare-opennext-scaffold`
- Purpose: add the minimal Next.js App Router shell and a reviewed Cloudflare Workers/OpenNext build contract
- Runtime: Next.js 16.2.10, React 19.2.7, OpenNext Cloudflare 1.20.1, Wrangler 4.110.0
- UI: placeholder foundation page only; no financial metrics or backend connection
- Data/schema impact: none
- Deployment impact: configuration and documentation only; no Worker, build integration, domain, or DNS mutation
- Quality: ESLint, strict TypeScript, 11 foundation/runtime tests, dependency peer audit, Next build, OpenNext build, workerd HTTP smoke
- Supply chain: exact direct versions and explicit pnpm lifecycle-script allowlist
- GitHub: required `quality` check passed; merged by rebase with the documented solo-maintainer administrator bypass

## PR 3 — Supabase data foundation

- Status: merged
- Pull request: `#3`
- Branch: `agent/supabase-data-foundation`
- Purpose: establish the canonical ledger schema, migration workflow, RLS authorization, public snapshot API, and typed Drizzle data layer
- Runtime: PostgreSQL 17 / Supabase CLI 2.109.1 / Drizzle ORM 0.45.2 / postgres.js 3.4.9
- Schema: isolated `ledger`, `private`, and `api` schemas with 14 initial tables and controlled vocabularies
- Security: reviewer/admin roles stored outside exposed schemas; raw ledger data is not public; anon access is limited to reviewed, published, non-sample snapshot RPCs
- Integrity: source requirements, typed observation values, review metadata, revision lineage, sample isolation, append-only audit/revision records, and immutable approved records are database-enforced
- Deployment impact: migration and hosted configuration documentation only; no remote migration, public API change, or production deployment
- Verification: Drizzle migration check, strict TypeScript, static database contract tests, local Supabase migration reset, pgTAP RLS tests, database lint, application build, and Cloudflare preview
- GitHub: required `quality` check passed; merged by rebase with the documented solo-maintainer administrator bypass

## PR 3.5 — Production Supabase migration apply record

- Status: ready for review
- Pull request: pending branch publish
- Branch: `agent/pr3_5-prod-supabase-apply`
- Purpose: apply the already-reviewed PR 3 migration to the existing hosted Supabase project and record the live verification outcome
- Target: Supabase project ref `vupwphakeyvvhaoxuvuw`
- Scope control: no schema changes beyond merged `supabase/migrations/0000_ledger_foundation.sql`; no dashboard table creation; local private env only
- Deployment impact: hosted Supabase mutated; Cloudflare production untouched
- Verification: remote migration history includes `0000`; expected `ledger` and `private` tables exist; RLS enabled where expected; anon has no table grants; anon can execute only the intended `api` snapshot RPCs; anonymous canonical reads and writes fail; read-only health query succeeds; no service-role key reference found in browser-facing code
