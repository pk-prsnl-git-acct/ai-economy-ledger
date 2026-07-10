# Supabase Setup — Sanitized

- Project label: `ai-economy-ledger`
- Plan: Free
- Region: Asia-Pacific
- GitHub repository connection: configured
- Purpose: Postgres source of truth and Auth

Auth, JWKS, and server-side REST connectivity were verified on 2026-07-10. Public database access remains intentionally unconfigured before schema and RLS implementation. The older anon-key credential is obsolete; use the current publishable-key model when implementing the client.

All schema changes must use repository migrations. Enable RLS on business tables, prohibit unauthenticated writes, and expose only reviewed public publication surfaces.
