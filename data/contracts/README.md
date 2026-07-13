# Data Contracts

This directory contains rights-safe machine-readable contracts consumed by the
public application in CI and local development.

## Public trust contract

- `public-trust/pr30_1a_public_trust_admin_review_contract.json` mirrors the
  merged private data-engine PR30.1A public trust/admin review contract.
- It is a fixture contract, not a live private-engine endpoint, production
  dataset, or publication export.
- It must not contain raw source documents, service-role keys, private database
  credentials, connector secrets, model-provider secrets, signed URLs, or
  unrestricted evidence-storage paths.
