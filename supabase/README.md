# Supabase database workflow

The repository owns the database schema. Never make an uncaptured production change in Studio or the SQL editor.

## Boundaries

- `ledger` contains canonical claims, observations, reviews, revisions, and snapshots. It is not exposed through the Data API.
- `private` contains role mappings and authorization helpers. It must never be added to exposed schemas.
- `api` contains the intentionally public RPC surface. Local configuration exposes `api`; hosted Supabase must be configured the same way before application traffic is enabled.
- `public` is not an application API surface.

The public RPCs return only snapshots that are both published and non-sample. Authenticated reviewer access is controlled by `private.app_user_roles`, not user-editable profile metadata.

## Local workflow

Docker must be running.

```bash
pnpm db:start
pnpm db:reset
pnpm db:test
pnpm db:lint
pnpm db:stop
```

Create schema changes in `src/server/db/schema.ts`, then run `pnpm db:generate`. Review generated SQL and add security functions, grants, policies, or triggers to the same migration when Drizzle cannot express them. Never use `drizzle-kit push` or a remote dashboard as a substitute for a migration.

## Deployment boundary

Merging a migration does not apply it remotely. A remote `supabase db push` requires explicit production approval, a reviewed migration plan, a current backup/recovery point, and post-migration smoke checks. One maintainer coordinates migration application to keep the remote migration history linear.
