# AI Economy Ledger

Open-source accounting for the AI economy.

AI Economy Ledger is a source-linked financial model for AI capital, revenue, debt, compute commitments, and circularity. It is designed to make uncertainty visible: confirmed facts, estimates, commitments, related-party flows, and sample data remain distinguishable from one another.

> The repository is in its foundation phase. It does not yet publish verified financial metrics, and nothing here is investment advice.

## Product principles

- Every public metric must trace to a source and methodology version.
- Confirmed, estimated, stale, circular, and sample values remain visibly separate.
- Gross AI economic flow is not treated as net external AI revenue.
- Restricted commercial data is never redistributed without permission.
- Production runtime and scheduled jobs are Cloudflare-native; GitHub Actions provide quality checks only.

## Planned architecture

- Next.js App Router, TypeScript, Tailwind CSS, and Recharts
- Cloudflare Workers through OpenNext
- Cloudflare Cron Triggers, Queues, and Workflows as needed
- Supabase Postgres and Supabase Auth
- Drizzle ORM
- Vitest and Playwright as the application matures

See [Architecture](docs/ARCHITECTURE.md), [Data Model](docs/DATA_MODEL.md), and [Roadmap](docs/ROADMAP.md).

## Repository status

The current phase establishes project memory, governance, security boundaries, and repeatable quality gates. Application runtime work begins in the next planned change.

## Local setup

Prerequisites:

- Node.js 22 or newer
- pnpm 11

```bash
corepack enable
pnpm install
pnpm verify
pnpm dev
```

Copy `.env.example` to `.env.local` only when local configuration is needed. Never commit `.env.local` or real credentials.

Before a runtime change is pushed, verify the actual Workers target:

```bash
pnpm build:cloudflare
pnpm test:cloudflare-preview
```

`pnpm deploy` is intentionally a manual production action and is not part of ordinary local verification.

## Documentation

Start at the [documentation index](docs/README.md). It links the current project state, decisions, methodology, testing strategy, operational runbook, and the [end-to-end PR workflow](docs/DEVELOPMENT_WORKFLOW.md).

## Contributing

The project is currently owner-maintained but is structured for multiple contributors. Read [CONTRIBUTING.md](CONTRIBUTING.md), follow the pull-request template, and keep changes narrowly scoped.

## Security

Do not open public issues containing credentials or private data. See [SECURITY.md](SECURITY.md) for responsible disclosure guidance.

## License

Code and documentation are available under the [Apache License 2.0](LICENSE). Dataset licensing and source restrictions are documented separately in [docs/DATA_LICENSE.md](docs/DATA_LICENSE.md).
