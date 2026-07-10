# Cloudflare Setup — Sanitized

- Zone: `aieconomyledger.com`
- Plan: Free
- Registrar: Namecheap
- Status: active
- SSL/TLS: pre-deployment configuration; HTTPS enabled
- Planned runtime: Workers through OpenNext
- Planned jobs: Cron Triggers, then Queues and Workflows when justified

The domain does not yet have a working application origin. Do not change web DNS, enable HSTS, or harden origin-dependent settings before a verified Worker deployment. Preserve email-related DNS records.

API connectivity, Workers read access, and DNS read access were verified on 2026-07-10 without changing remote state.
