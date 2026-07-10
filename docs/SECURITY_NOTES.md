# Security Notes

## Assets

- source evidence and reviewed metrics
- admin/reviewer identities and sessions
- Supabase and Cloudflare credentials
- database connection strings and health tokens
- publication integrity and revision history

## Primary threats

- secret exposure through Git, logs, browser bundles, or CI
- unauthorized writes or RLS bypass
- sample or unreviewed data promoted to public metrics
- source tampering and silent metric revision
- malicious imports, formula injection, or oversized files
- dependency and workflow supply-chain compromise
- cache leakage of authenticated content

## Baseline controls

- deny-by-default database policies
- server-only credential modules
- protected branches and minimal CI permissions
- explicit review states and immutable revision history
- schema validation, input limits, content hashing, and safe CSV export
- dependency review and Dependabot
- no secrets in generated snapshots or logs
- cache authenticated/admin/health routes as private or no-store

## Secret handling

Use `.env.local` only for local development and provider-managed secret stores for deployed environments. `.env.example` contains placeholders. Rotate any credential suspected of exposure and document the incident without recording the credential.

## Future security gates

Add dependency auditing, secret scanning, CodeQL, CSP, rate limiting, session hardening, RLS integration tests, upload malware controls, and signed publication artifacts as the corresponding surfaces appear.
