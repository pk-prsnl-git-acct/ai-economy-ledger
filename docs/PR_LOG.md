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

- Status: ready for review
- Branch: `chore/cloudflare-opennext-scaffold`
- Purpose: add the minimal Next.js App Router shell and a reviewed Cloudflare Workers/OpenNext build contract
- Runtime: Next.js 16.2.10, React 19.2.7, OpenNext Cloudflare 1.20.1, Wrangler 4.110.0
- UI: placeholder foundation page only; no financial metrics or backend connection
- Data/schema impact: none
- Deployment impact: configuration and documentation only; no Worker, build integration, domain, or DNS mutation
- Quality: ESLint, strict TypeScript, 11 foundation/runtime tests, dependency peer audit, Next build, OpenNext build, workerd HTTP smoke
- Supply chain: exact direct versions and explicit pnpm lifecycle-script allowlist
