export type RouteDefinition = {
  href: string;
  label: string;
  eyebrow: string;
  title: string;
  description: string;
};

export const publicRoutes = [
  { href: "/", label: "Dashboard", eyebrow: "Open-source AI economy accounting", title: "Track the math behind the AI economy.", description: "A source-linked view of capital, revenue, debt, compute commitments, and circularity—with uncertainty kept visible." },
  { href: "/companies", label: "Companies", eyebrow: "Company ledger", title: "Compare AI economy exposure company by company.", description: "A future drill-down for segments, capital, revenue, obligations, confidence, and source coverage." },
  { href: "/funding", label: "Funding", eyebrow: "Capital flows", title: "Follow how capital enters the AI economy.", description: "A future view of equity, debt, infrastructure finance, and disclosed commitments without blending unlike flows." },
  { href: "/revenue-debt", label: "Revenue & debt", eyebrow: "Financial flows", title: "Separate operating revenue from financing.", description: "A future reconciliation of reported revenue, estimated revenue, debt, and off-balance-sheet commitments." },
  { href: "/compute-infra", label: "Compute & infra", eyebrow: "Physical capacity", title: "Map the infrastructure behind AI growth.", description: "A future view of chips, cloud capacity, data centers, energy, and compute obligations with period-aware evidence." },
  { href: "/circularity", label: "Circularity", eyebrow: "Relationship analysis", title: "Make circular flows and double counting visible.", description: "A future graph of investor, vendor, customer, lender, and compute relationships with gross and adjusted views." },
  { href: "/methodology", label: "Methodology", eyebrow: "Methods and definitions", title: "Trust comes from showing the math.", description: "Definitions, inclusion rules, confidence treatment, circularity adjustments, and versioned calculation policies." },
  { href: "/sources", label: "Sources", eyebrow: "Evidence registry", title: "Trace every published claim to evidence.", description: "A future registry for filings, company materials, public datasets, research, and review status." },
  { href: "/downloads", label: "Downloads", eyebrow: "Open data exports", title: "Reuse versioned ledger release candidates.", description: "Deterministic JSON and CSV artifacts with explicit trust lanes, integrity hashes, and coverage limitations." },
  { href: "/data", label: "Datasets", eyebrow: "Versioned release candidate", title: "Download the ledger without losing its caveats.", description: "A hash-verified release bundle with separate source-attributed and verified lanes, explicit coverage, and no production publication claim." },
  { href: "/data/releases", label: "Releases", eyebrow: "Immutable release history", title: "Every release keeps its own bytes.", description: "Inspect versioned manifests, artifact hashes, lane counts, and known limitations." },
  { href: "/data/coverage", label: "Coverage", eyebrow: "Expected-matrix coverage", title: "Measure what should exist, not only what was found.", description: "Coverage against entity, metric-family, fiscal-period, and source-class expectations, with denominator limits kept close." },
  { href: "/data/quality", label: "Quality", eyebrow: "Observable data product", title: "See what is measured, missing, or still shadow-only.", description: "A private-engine-signed quality summary that separates targets from evidence and keeps insufficient or unmeasurable domains visible." },
  { href: "/data/sources", label: "Dataset sources", eyebrow: "Rights-safe source manifest", title: "See which official sources support this release.", description: "Safe source metadata, record counts, rights state, and limitations without private engine details." },
  { href: "/data/revisions", label: "Revisions", eyebrow: "Semantic release delta", title: "Changes are events, never silent rewrites.", description: "Value, metadata, trust, visibility, eligibility, amendment, restatement, and withdrawal changes across immutable releases." },
  { href: "/data/corrections", label: "Corrections", eyebrow: "Append-only correction feed", title: "Public corrections keep their lineage.", description: "Cursor-ordered corrections and withdrawals that preserve every affected historical release." }
] as const satisfies readonly RouteDefinition[];

export const adminRoutes = [
  { href: "/admin", label: "Overview", eyebrow: "Admin workspace", title: "Operate the review pipeline.", description: "A static preview of the future protected operations workspace." },
  { href: "/admin/review", label: "Trust review", eyebrow: "Progressive trust", title: "Review source-attributed public records.", description: "Protected queue for trust-state upgrades, stale-safe decisions, and safe evidence review." },
  { href: "/admin/review-queue", label: "Review queue", eyebrow: "Evidence review", title: "Approve evidence before publication.", description: "A future queue for human review, conflict resolution, and publication decisions." },
  { href: "/admin/settings/data-trust", label: "Data trust settings", eyebrow: "Visibility policy", title: "Manage public trust display settings.", description: "Protected controls for non-mutating visibility policy and trust-state display defaults." },
  { href: "/admin/sources", label: "Sources", eyebrow: "Source operations", title: "Register and assess source material.", description: "A future workspace for source metadata, licensing, freshness, and retrieval status." },
  { href: "/admin/companies", label: "Companies", eyebrow: "Entity operations", title: "Resolve companies and economic roles.", description: "A future workspace for canonical entities, aliases, segments, and relationships." },
  { href: "/admin/import", label: "Import", eyebrow: "Controlled ingestion", title: "Stage data before it becomes a claim.", description: "A future guarded import flow with validation, sample isolation, and dry-run reporting." },
  { href: "/admin/claims", label: "Claims", eyebrow: "Claim operations", title: "Turn evidence into reviewable claims.", description: "A future workspace for extracted assertions, conflicts, provenance, and review state." },
  { href: "/admin/metric-revisions", label: "Metric revisions", eyebrow: "Revision history", title: "Preserve every approved correction.", description: "A future immutable timeline of superseded values, reasons, reviewers, and methodology versions." },
  { href: "/admin/health", label: "Health", eyebrow: "System health", title: "Monitor freshness without mutating truth.", description: "A future read-only view of source freshness, publication status, and runtime checks." },
  { href: "/admin/update-log", label: "Update log", eyebrow: "Audit log", title: "Explain what changed and why.", description: "A future append-only record of imports, reviews, publications, and operational events." }
] as const satisfies readonly RouteDefinition[];

export function findPublicRoute(href: string): RouteDefinition {
  const route = publicRoutes.find((candidate) => candidate.href === href);
  if (!route) throw new Error(`Unknown public route: ${href}`);
  return route;
}

export function findAdminRoute(href: string): RouteDefinition {
  const route = adminRoutes.find((candidate) => candidate.href === href);
  if (!route) throw new Error(`Unknown admin route: ${href}`);
  return route;
}
