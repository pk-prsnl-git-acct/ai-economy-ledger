# Pull Request Log

## PR33 public compatibility - Progressive trust decisions and UI

- Status: merged
- Pull request: GitHub PR `#26`
- Pull request URL: `https://github.com/pk-prsnl-git-acct/ai-economy-ledger/pull/26`
- Branch: `agent/pr33-public-trust-compatibility`
- Private dependency: data-engine PR `#48`, squash commit
  `8cb0a68edf178503944f949a28d15baba9d1d9b0`
- Purpose: consume the stable private PR33 contract and render its explicit
  progressive-trust decisions without recreating private autonomy policy
- Scope: copied `public-trust-admin-review@33.0.0` contract, fail-closed typed
  parser, corrected verified/headline selectors, system-validated fixture,
  trust/autonomy/certification badges, eligibility status UI, safe admin lineage
  detail, regression tests, visual review, and project-memory updates
- Data impact: rights-safe fixture transport only; no raw source material,
  production dataset, published snapshot, or private operational payload
- Schema/RLS impact: none; existing auth and RLS boundaries are unchanged and
  remain covered by repository contract tests
- Deployment impact: none; no Cloudflare or Supabase mutation, hosted migration,
  secret change, production deployment, or publication
- Verification: GitHub CI run `29306389893` passed on the reviewed head;
  `pnpm verify` passed with 62 tests; `pnpm build`,
  `pnpm build:cloudflare`, generated-output secret scan, and four-route workerd
  preview smoke passed; desktop and 390px mobile visual review found no console
  errors
- Next task after merge and both repositories verify: private Logical PR34; do
  not begin it in this PR

## Logical PR 30.1B — Authenticated admin review and trust-state UI

- Status: merged
- Pull request: GitHub PR `#25`
- Pull request URL: `https://github.com/pk-prsnl-git-acct/ai-economy-ledger/pull/25`
- Branch: `feat/logical-pr-30-1b-admin-trust-ui`
- Purpose: consume the merged private PR30.1A contract in the public app through
  fixture-backed CI adapters, protected admin review routes, and public
  trust-state rendering
- Scope: `/admin/review`, `/admin/review/[reviewCaseId]`,
  `/admin/settings/data-trust`, server-only PR30.1A contract adapter, safe
  fixture transport, version/stale/idempotency action checks, visibility policy
  UI, trust-state badges and public disclosure rendering, tests, builds, and docs
- Data impact: rights-safe contract fixture only; no raw source documents,
  private-engine operational data, published snapshot, or production dataset
- Deployment impact: none; no Cloudflare/Supabase production configuration or
  secret changes
- Security: reuses existing Supabase session and `private.app_user_roles`
  authorization; no second auth system, service-role key, private credential, or
  unrestricted evidence path
- Verification: local `pnpm verify`, `pnpm build`, `pnpm build:cloudflare`, and
  pre-push verify/OpenNext/Cloudflare preview smoke passed before PR-number
  metadata update
- Next active task after merge and post-merge verification: Logical PR 31, but
  do not begin it in this PR

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
- Data/schema impact: adds `ledger.relationships`, `ledger.scenario_runs`, related enums, triggers, grants, and RLS through migration `0001_circularity_scenarios.sql`; the reviewed migration was later applied to hosted Supabase on 2026-07-11 under ignored local private environment values only
- Deployment impact: no Cloudflare mutation, snapshot publication, or production deployment; hosted Supabase remote history now includes `0001`
- Verification: 46 tests, strict TypeScript, lint, Drizzle migration check, data validation, OpenNext Cloudflare build, workerd preview smoke, and required GitHub `quality` check passed
- Hosted follow-up verification: remote migration history includes `0001`; `ledger.relationships` and `ledger.scenario_runs` exist; RLS is enabled on both; `anon` still has zero table grants and only the two intended `api` RPC execute grants; anonymous REST reads/writes to the new tables fail; read-only health query succeeded; no service-role key reference was found in browser-facing code
- GitHub: merged by rebase with the documented solo-maintainer administrator bypass

## PR 10 — Scheduled health checks and production readiness

- Status: merged
- Pull request: GitHub PR `#12`
- Branch: `agent/pr10-health-cron-readiness`
- Internal label: logical PR 10
- Purpose: add read-only production readiness checks, Cloudflare Cron wiring, structured health logs, and deployment/runbook coverage before first production deploy
- Requirements enhancement: no published snapshots is `degraded` rather than `down`, while missing config, missing token, or public snapshot RPC failure is `down`
- Scope: pure readiness evaluator; protected no-store internal health route; admin health panel; Worker wrapper with `scheduled`; 30-minute Cron trigger; tests and operational documentation
- Data/schema impact: none
- Deployment impact: configuration only; no Worker deploy, domain binding, DNS change, Supabase mutation, snapshot publication, or production secret write
- Security: health route requires `HEALTHCHECK_TOKEN`, uses publishable Supabase access only, emits summarized logs without secrets, and keeps service-role keys out of browser-facing code
- Verification: required GitHub `quality` check passed before merge
- GitHub: merged by rebase with the documented solo-maintainer administrator bypass

## PR 11 — Production deploy, domain binding, and final smoke

- Status: merged
- Pull request: GitHub PR `#13`
- Branch: `agent/pr11-production-deploy-record`
- Internal label: logical PR 11
- Purpose: deploy the reviewed Cloudflare/OpenNext Worker, bind `aieconomyledger.com`, upload required runtime values from ignored local environment, and run final production smoke checks
- Production actions completed on 2026-07-12: built the OpenNext artifact; deployed Worker `ai-economy-ledger`; uploaded required runtime variables/secrets without printing them; confirmed zone Worker route `aieconomyledger.com/* -> ai-economy-ledger`; exposed hosted Supabase Data API schema `api` without exposing `ledger` or `private`; initialized account workers.dev subdomain `aieconomyledger`; attached Cloudflare Cron `*/30 * * * *`
- Code fix: public snapshot RPC calls now send PostgREST `accept-profile: api` and `content-profile: api` headers
- Smoke results: `/` and `/methodology` return HTTP 200 from production; `/api/v1/snapshots` returns HTTP 200 with `{"data":[]}`; protected `/api/internal/health` returns HTTP 200 with status `degraded` only because no published snapshot exists; Cloudflare schedule list includes `*/30 * * * *`
- Deployment impact: production Worker, route, workers.dev account subdomain, Cron schedule, and Supabase PostgREST exposed-schema config changed; Supabase schema/data were not changed; no published snapshot was created
- Verification: 53 tests, strict TypeScript, OpenNext Cloudflare build, local workerd preview smoke, production route smoke, protected health smoke, direct Supabase public RPC smoke, and Cloudflare schedule API verification
- GitHub: merged as PR `#13` by rebase with the documented solo-maintainer administrator bypass

## PR 12 — Canonical www redirect and end-to-end production verification

- Status: merged
- Pull request: GitHub PR `#15`
- Branch: `agent/pr12-www-canonical-e2e`
- Internal label: logical PR 12
- Purpose: complete the deploy-adjacent decision gate by making `www.aieconomyledger.com` redirect canonically to `aieconomyledger.com` and rerunning end-to-end production checks
- Scope: Worker-level 308 redirect for `www`; committed Cloudflare route config for apex and `www`; static tests; production/browser/API smoke
- Data/schema impact: none
- Deployment impact: Cloudflare Worker code and route configuration only; no Supabase schema/data change and no snapshot publication
- Production smoke: apex and methodology return HTTP 200; `www` root redirects to apex with HTTP 308; nested `www` path/query redirects preserve path and query; public snapshots return `{"data":[]}`; protected health remains `degraded` only because no snapshot is published; Cloudflare schedule still includes `*/30 * * * *`
- Browser E2E: Playwright loaded the apex dashboard and verified `https://www.aieconomyledger.com/methodology?x=1` lands on `https://aieconomyledger.com/methodology?x=1`
- Verification: 53 tests, strict TypeScript, OpenNext Cloudflare build, production HTTP/API/health/schedule smoke, and Playwright browser E2E
- GitHub: merged as PR `#15` by rebase with the documented solo-maintainer administrator bypass

## Operational hardening — OpenNext generated env sanitization

- Status: complete
- Pull request: GitHub PR `#16`
- Purpose: prevent ignored local `.open-next/` build artifacts from retaining private env values after a Cloudflare build
- Scope: post-build sanitizer for `.open-next/cloudflare/next-env.mjs`; generated-output secret scan for `.open-next/`; script/test coverage
- Verification: `pnpm build:cloudflare` now sanitizes the generated fallback env file and passes the generated-output secret scan
- GitHub: merged as PR `#16`; merge commit `8d2d634177f762f933d341eb8f81efd01c868ace`

## PR 12.2 — OpenNext secret-hardening regression coverage and project-memory cleanup

- Status: merged
- Branch: `agent/pr12-2-opennext-secret-regression`
- Internal label: logical PR 12.2
- Purpose: close stale project-memory status and add deterministic regression coverage for OpenNext generated-env sanitization and generated-output secret scanning
- Scope: importable sanitizer/scanner helpers, behavioral tests using temporary generated-output fixtures, exact-value scanning for sensitive environment variables present during build, and targeted documentation cleanup
- NEXT_PUBLIC handling: sanitizer now keeps only the explicitly approved browser/public keys from `.env.example`, current browser-facing code, and deployment docs instead of allowing every `NEXT_PUBLIC_*`
- Security: scanner reports only generated file paths plus pattern/variable names; it never prints detected secret values
- Data/schema impact: none
- Deployment impact: none; no Cloudflare production deploy, DNS change, Supabase schema/data mutation, snapshot publication, or PR 13 data work
- Verification: sanitizer/scanner behavioral tests, generated-output scan, full repository test suite, strict TypeScript, OpenNext Cloudflare build, Cloudflare preview smoke, diff whitespace check, and Git status check
- Next phase: PR 13 begins in private repository `pk-prsnl-git-acct/ai-economy-ledger-data-engine`; this public repository remains independent and receives only reviewed, redistribution-safe components and published outputs

## Public docs alignment — private data-engine incubation

- Status: in progress
- Purpose: align public project memory with the private data-engine repository split after bootstrap
- Scope: docs-only memory update; no private strategy content, application code, Supabase, Cloudflare, DNS, or production data changes
- Public/private boundary: public app remains independently cloneable, buildable, testable, and deployable; private data-engine work has no runtime dependency here
- Verification: pending

## Logical PR34 — Public dataset distribution bridge

- Status: in review
- Branch: `feat/pr34-public-dataset-distribution`
- Private dependency: data-engine GitHub PR `#49`, merged at `eb353b70bcf80066fd62ff8ef9d03efa4ac5bdd2`
- Purpose: distribute the reviewed PR34 release candidate through stable downloads, release APIs, coverage/source transparency, and append-only history surfaces
- Release identity: `dataset-release:1:5424bda5073c2a1a09cb`; manifest SHA-256 `30b8a9ccb5687695ef4603b57e57879c3e8718f17b5f5b2cc51d397a59e0c7f3`
- Scope: server-only hash/contract validator; JSON/CSV artifacts; release, record, coverage, source, revision, artifact, and correction APIs; responsive data pages; ETag and cache policy; Cloudflare preview smoke and contract tests
- Data impact: adds a redistribution-safe candidate with 6 source-attributed records, 4 human-verified records, 60 expected coverage cells, 4 covered cells, and zero revisions, corrections, or sample rows
- Security: rejects unsafe release/artifact paths, missing/extra/hash-mismatched bytes, private material, stale contracts, invalid lane membership, and publication-enabled candidates; no private runtime dependency or browser credential
- Deployment impact: none; no Cloudflare deploy, Supabase migration/data mutation, live publication, DNS change, secret write, or production infrastructure action
- Verification: lint, strict TypeScript, migration check, data validation, 70 tests, Next.js build, OpenNext build, generated-output secret scan, 11-page/8-API workerd smoke, and desktop/mobile browser inspection pass; GitHub CI and post-merge verification pending
