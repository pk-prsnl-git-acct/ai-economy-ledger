# Security Policy

## Reporting a vulnerability

Use GitHub private vulnerability reporting for security issues. Do not open a public issue containing exploit details, credentials, private URLs, or sensitive data.

Include:

- affected component and revision
- reproduction steps
- expected and observed behavior
- potential impact
- suggested mitigation, if known

## Supported versions

Until the first stable release, only the current `main` branch is supported.

## Security boundaries

- Public browser code may use only intentionally public `NEXT_PUBLIC_` configuration.
- Service-role, database, Cloudflare, GitHub, and health-check credentials are server-only.
- Public users receive read-only access to explicitly published data.
- Admin and reviewer writes require authentication, authorization, and database policies.
- Secrets must use local ignored files or provider-managed secret stores.
- Production changes must remain auditable and reversible.

See [docs/SECURITY_NOTES.md](docs/SECURITY_NOTES.md) for the engineering threat model and operational controls.
