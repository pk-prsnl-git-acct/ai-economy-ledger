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

- Status: merged
- Pull request: `#4`
- Branch: `agent/pr3_5-prod-supabase-apply`
- Purpose: apply the already-reviewed PR 3 migration to the existing hosted Supabase project, record the live verification outcome, and add the missing roadmap checkpoint amendment
- Target: Supabase project ref `vupwphakeyvvhaoxuvuw`
- Scope control: no schema changes beyond merged `supabase/migrations/0000_ledger_foundation.sql`; no dashboard table creation; local private env only
- Deployment impact: hosted Supabase mutated; Cloudflare production untouched
- Verification: remote migration history includes `0000`; expected `ledger` and `private` tables exist; RLS enabled where expected; anon has no table grants; anon can execute only the intended `api` snapshot RPCs; anonymous canonical reads and writes fail; read-only health query succeeds; no service-role key reference found in browser-facing code
- Roadmap amendment: added logical checkpoint PRs 2.5, 3.6, and 11; `PR 4`, `PR 5`, `PR 7`, and `PR 8` now absorb their related half-step checkpoints by default, and PR 3.6 is unnecessary if this PR merges with the amendment docs
- GitHub: required `quality` check passed; merged by rebase with the documented solo-maintainer administrator bypass

## PR 4 — Ledger Dark UX shell and route checkpoint

- Status: merged
- Pull request: `#5`
- Branch: `agent/pr4-app-shell-routes`
- Internal label: logical PR 4; includes the route skeleton checkpoint previously tracked as PR 4.5
- Purpose: establish the static Ledger Dark design system, reusable trust components, and every required public/admin route before deeper product work
- Public routes: dashboard, companies, funding, revenue/debt, compute/infrastructure, circularity, methodology, sources, and downloads
- Admin routes: overview, review queue, sources, companies, import, claims, metric revisions, health, and update log
- Scope control: fictional sample placeholders only; no numeric financial claims, database calls, authentication, write controls, or production data connection
- Trust UX: visible sample, confidence, freshness, source, methodology, production-connection, and admin-access states
- Metadata: every route declares title, description, canonical URL, and Open Graph basics
- Verification: strict TypeScript, lint, 21 repository/route tests, static Next.js production build for all routes, representative multi-route OpenNext/workerd HTTP smoke, and browser desktop/mobile semantic and responsive smoke
- Data/schema impact: none
- Deployment impact: none; Cloudflare and Supabase production untouched
- GitHub: required `quality` check passed; merged by rebase with the documented solo-maintainer administrator bypass

## PR 5 — Sample import templates and isolation checkpoint

- Status: merged
- Pull request: `#6`
- Branch: `agent/pr5-import-templates-sample-isolation`
- Internal label: logical PR 5; includes the demo import/sample isolation checkpoint previously tracked as PR 5.5
- Purpose: add contributor-facing CSV import templates, a fictional sample workbook, demo import fixtures, and local validation that sample rows cannot enter verified totals
- Templates: companies, metric definitions, source registry, source documents, claims, and metric observations
- Scope control: fictional sample data only; no production import UI, database writes, schema migration, Supabase mutation, or Cloudflare deployment
- Verification: local import contract tests and data validation prove template headers remain stable, demo rows preserve sample labels, and verified totals ignore sample observations
- Data/schema impact: repository sample/template files only; no database schema or hosted data changes
- Deployment impact: none; Cloudflare and Supabase production untouched
- GitHub: required `quality` check passed; merged by rebase with the documented solo-maintainer administrator bypass

## PR 6 — KPI calculation engine

- Status: merged
- Pull request: `#7`
- Branch: `agent/pr6-kpi-calculation-engine`
- Purpose: add pure KPI formulas for capital in, obligations, gross AI economic flow, and net external AI revenue before publication/runtime wiring
- Scope control: no database reads or writes, schema migrations, public API, published snapshots, admin workflow, Supabase mutation, or Cloudflare deployment
- Methodology: implements the existing `v0.1.0` formulas with explicit approved/non-sample filtering, fixed-scale decimal arithmetic, and conservative net revenue exclusions
- Verification: unit tests cover decimal precision, sample/unapproved exclusion, debt dual treatment, gross vs net revenue, confidence exclusion, and explicit low-confidence override
- Data/schema impact: none
- Deployment impact: none; Cloudflare and Supabase production untouched
- GitHub: required `quality` check passed; merged by rebase with the documented solo-maintainer administrator bypass

## PR 7 — Publication runtime and read-only public API

- Status: merged
- Pull request: `#8`
- Branch: `agent/pr7-publication-runtime`
- Purpose: wire reviewed source, claim, observation, confidence, freshness, revision, KPI, and snapshot contracts into an auditable publication runtime
- Scope: server-only canonical lineage adapter; deterministic public read model and snapshot hash; draft-only persistence service; GET-only snapshot list/detail API through existing Supabase RPCs
- Security: approved/current/non-sample filtering at generation; published/non-sample filtering remains database-enforced at delivery; no private review/storage/actor fields in payloads; no service-role or secret key in the public adapter
- Verification: unit and contract tests cover eligibility, leakage prevention, confidence/freshness, deterministic ordering/hash, repository lineage, draft-only persistence, publishable-key RPC use, and absence of write routes
- Data/schema impact: none; uses the merged PR 3 schema and RPCs without migration changes
- Deployment impact: none; no production snapshot, Supabase mutation, Cloudflare change, or deployment
- GitHub: required `quality` check passed; draft was marked ready and merged by rebase with the documented solo-maintainer administrator bypass

## PR 8 — Admin authentication, review queue, and RLS smoke

- Status: merged
- Pull request: `#9`
- Branch: `agent/pr8-admin-auth-review`
- Internal label: logical PR 8; includes the admin bootstrap/RLS smoke checkpoint previously tracked as PR 8.5
- Purpose: protect admin routes behind Supabase Auth plus the private reviewer/admin role table and expose the first server-read review queue surface
- Scope: dynamic admin routes; server-only session verification; private role lookup; server-only review queue repository; first-admin bootstrap script; RLS smoke script
- Security: browser code receives no service-role, secret, or database credential; authorization comes from `private.app_user_roles`, not user-editable metadata
- Verification: strict TypeScript and admin runtime tests cover protected route wiring, Supabase cookie support, private role-table checks, server-only review queue reads, bootstrap guardrails, RLS smoke coverage, and public/client secret isolation
- Data/schema impact: none; uses the merged PR 3 schema without migration changes
- Deployment impact: none; no production role grant, Supabase mutation, published snapshot, Cloudflare change, or deployment
- GitHub: required `quality` check passed; merged by rebase with the documented solo-maintainer administrator bypass

## PR 9 — Circularity and scenario engine

- Status: merged
- Pull request: `#10`
- Branch: `agent/pr9-circularity-scenarios`
- Internal label: logical PR 9
- Purpose: make relationship-driven circularity adjustments auditable and add deterministic, baseline-preserving scenario analysis
- Scope: typed relationship/scenario schema; reviewed migration; RLS policies; pure circularity analysis; directed-cycle signals; deterministic scenario operators; tests and methodology/architecture records
- Requirements enhancement: topology is a signal only, adjustment requires an approved non-sample relationship linked to an observation, duplicate edges cannot double-subtract, zero gross has an explicit null ratio, and scenarios cannot mutate facts or publish
- Data/schema impact: adds `ledger.relationships`, `ledger.scenario_runs`, related enums, triggers, grants, and RLS through migration `0001_circularity_scenarios.sql`; hosted migration is not applied by this PR
- Deployment impact: none; no Supabase apply, Cloudflare mutation, snapshot publication, or production deployment
- Verification: 46 tests, strict TypeScript, lint, Drizzle migration check, data validation, OpenNext Cloudflare build, workerd preview smoke, and required GitHub `quality` check passed
- GitHub: merged by rebase with the documented solo-maintainer administrator bypass
