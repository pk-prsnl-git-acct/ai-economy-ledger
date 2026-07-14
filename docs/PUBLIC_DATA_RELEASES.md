# Public Data Releases

The `/data` surface distributes reviewed outputs from the private data engine.
The public application does not query private services or recompute visibility,
trust, verified-lane, headline, or publication policy.

## Candidate identity

- Release: `dataset-release:1:5424bda5073c2a1a09cb`
- Contract: `public-dataset-release@34.0.0`
- Manifest SHA-256: `30b8a9ccb5687695ef4603b57e57879c3e8718f17b5f5b2cc51d397a59e0c7f3`
- Status: local/CI candidate; production publication is disabled

The server-only adapter validates the manifest trust root, exact required file
set, artifact hashes and byte lengths, public-material scan, schema versions,
release ID, record membership, and publication gate before serving the bundle.

## HTTP contract

- `GET /api/data/releases` lists releases with a short revalidation cache.
- `GET /api/data/releases/{releaseId}` returns the immutable manifest.
- `GET /api/data/releases/{releaseId}/records` accepts `lane` and `format`.
- `GET /api/data/releases/{releaseId}/coverage` accepts `json` or `csv`.
- `GET /api/data/releases/{releaseId}/sources` accepts `json` or `csv`.
- `GET /api/data/releases/{releaseId}/revisions` returns immutable history.
- `GET /api/data/releases/{releaseId}/artifacts/{name}` returns a named artifact.
- `GET /api/data/corrections` returns the mutable cursor-ordered correction feed.

Versioned artifacts use `public, max-age=31536000, immutable`. Mutable indexes
and correction feeds use `public, max-age=60, must-revalidate`. Every successful
response includes a SHA-256-derived ETag and honors `If-None-Match` with `304`.

## Interpretation

The latest source-attributed lane includes visible records that may still need
human review. The verified lane contains only explicit private-engine members.
Coverage states describe the expected matrix and are not trust labels. Missing,
not-disclosed, pending-review, and unknown cells must never become zero-valued
observations. The first candidate reports 4 covered cells out of a deliberately
limited 60-cell denominator, or 6.67%.
