import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { adminRoutes, publicRoutes, type RouteDefinition } from "@/src/ui/site-map";

export function AppShell({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  return (
    <div className="app-shell">
      <TopNav admin={admin} />
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <span>AI Economy Ledger · Open-source accounting</span>
        <span>Static sample interface · No investment advice</span>
      </footer>
    </div>
  );
}

export function TopNav({ admin = false }: { admin?: boolean }) {
  const routes = admin ? adminRoutes : publicRoutes;
  const primaryRoutes = admin ? routes.slice(0, 4) : routes.slice(0, 6);

  return (
    <header className="top-nav">
      <Link className="brand" href={(admin ? "/admin" : "/") as Route}>
        <span className="logo-mark" aria-hidden="true">AL</span>
        <span>AI Economy Ledger</span>
      </Link>
      <nav className="nav-links" aria-label={admin ? "Admin navigation" : "Primary navigation"}>
        {primaryRoutes.map((route) => <Link href={route.href as Route} key={route.href}>{route.label}</Link>)}
      </nav>
      <Link className="nav-action" href={(admin ? "/" : "/methodology") as Route}>{admin ? "Public ledger" : "View methodology"}</Link>
    </header>
  );
}

export function HeroSection({ route, aside }: { route: RouteDefinition; aside?: ReactNode }) {
  return (
    <section className="hero-grid">
      <div className="hero-copy">
        <p className="eyebrow">{route.eyebrow}</p>
        <h1>{route.title}</h1>
        <p className="lede">{route.description}</p>
      </div>
      {aside && <aside>{aside}</aside>}
    </section>
  );
}

export function SampleDataWarning() {
  return (
    <section className="warning-banner" aria-label="Sample data warning">
      <strong>Sample interface only</strong>
      <span>All figures and records below are fictional placeholders. They are excluded from verified totals and are not financial claims.</span>
    </section>
  );
}

export function AdminAccessWarning() {
  return (
    <section className="warning-banner admin-warning" aria-label="Admin access warning">
      <strong>Static admin preview</strong>
      <span>Authentication and write actions are intentionally unavailable until the protected admin workflow is implemented in PR 8.</span>
    </section>
  );
}

export function ConfidenceBadge({ level = "Prototype" }: { level?: "High" | "Medium" | "Low" | "Prototype" }) {
  return <span className={`badge badge-${level.toLowerCase()}`}>{level}</span>;
}

export function FreshnessBadge({ label = "Sample · not updated" }: { label?: string }) {
  return <span className="badge badge-freshness">{label}</span>;
}

export function SourceLink({ href = "/sources", children = "View sources" }: { href?: string; children?: ReactNode }) {
  return <Link className="source-link" href={href as Route}>{children} <span aria-hidden="true">↗</span></Link>;
}

export function KpiCard({ label, value, tone = "cyan" }: { label: string; value: string; tone?: "cyan" | "violet" | "amber" | "green" }) {
  return (
    <article className={`panel kpi-card tone-${tone}`}>
      <p className="panel-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <div className="badge-row"><ConfidenceBadge /><FreshnessBadge /></div>
      <dl className="kpi-details">
        <div><dt>Confirmed / estimated</dt><dd>— / sample</dd></div>
        <div><dt>Adjustment</dt><dd>Not calculated</dd></div>
        <div><dt>Sources</dt><dd>0 verified</dd></div>
        <div><dt>Methodology</dt><dd>Preview v0</dd></div>
      </dl>
      <SourceLink />
    </article>
  );
}

export function DataQualityPanel() {
  return (
    <article className="panel quality-panel">
      <div><p className="panel-label">Data-quality state</p><p className="quality-score">Prototype</p></div>
      <dl>
        <div><dt>Verified metrics</dt><dd>0</dd></div>
        <div><dt>Sample records</dt><dd>Clearly labelled</dd></div>
        <div><dt>Production connection</dt><dd>Off</dd></div>
      </dl>
    </article>
  );
}

export function FinancialChartCard({ title, variant = "line" }: { title: string; variant?: "line" | "bars" }) {
  return (
    <article className="panel chart-card">
      <div className="panel-heading"><div><p className="panel-label">Illustrative view</p><h2>{title}</h2></div><FreshnessBadge /></div>
      <div className={`mock-chart mock-chart-${variant}`} aria-label={`${title}, placeholder chart`} role="img">
        {variant === "bars" ? <><i /><i /><i /><i /></> : <><span /><b /></>}
      </div>
      <p className="chart-caption">Layout placeholder only · no underlying financial series</p>
    </article>
  );
}

export function DataTable({ title = "Illustrative company ledger" }: { title?: string }) {
  const rows = [
    ["Open model lab placeholder", "Foundation model", "Sample", "Medium"],
    ["Cloud infrastructure placeholder", "Cloud", "Sample", "High"],
    ["GPU supplier placeholder", "Chips", "Sample", "High"],
    ["AI application placeholder", "Application", "Sample", "Low"]
  ];
  return (
    <section className="panel table-panel">
      <div className="panel-heading"><div><p className="panel-label">Sample records</p><h2>{title}</h2></div><SourceLink /></div>
      <div className="table-scroll"><table><thead><tr><th>Company</th><th>Segment</th><th>Value state</th><th>Confidence</th></tr></thead>
        <tbody>{rows.map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}</tbody></table></div>
    </section>
  );
}

export function PlaceholderPage({ route }: { route: RouteDefinition }) {
  return (
    <AppShell>
      <HeroSection route={route} aside={<DataQualityPanel />} />
      <SampleDataWarning />
      <section className="placeholder-grid">
        <article className="panel placeholder-panel"><p className="panel-label">Planned surface</p><h2>{route.label} analysis</h2><p>This route is intentionally present before its data model and calculations are connected.</p></article>
        <article className="panel placeholder-panel"><p className="panel-label">Trust contract</p><h2>Evidence stays attached</h2><p>Future values will show source count, confidence, freshness, sample state, and methodology version.</p></article>
      </section>
      <RouteDirectory routes={publicRoutes} />
    </AppShell>
  );
}

export function AdminPlaceholderPage({ route, reviewQueue = false }: { route: RouteDefinition; reviewQueue?: boolean }) {
  return (
    <AppShell admin>
      <HeroSection route={route} aside={<DataQualityPanel />} />
      <AdminAccessWarning />
      {reviewQueue ? <ReviewQueuePreview /> : <section className="placeholder-grid"><article className="panel placeholder-panel"><p className="panel-label">Future protected tool</p><h2>{route.label}</h2><p>No session, write control, or production data connection exists on this static route.</p></article><article className="panel placeholder-panel"><p className="panel-label">Security boundary</p><h2>Server-authorized later</h2><p>PR 8 will add authentication, role checks, RLS smoke tests, and the first-admin runbook.</p></article></section>}
      <RouteDirectory routes={adminRoutes} admin />
    </AppShell>
  );
}

export function ReviewQueuePreview() {
  const items = ["Cloud commitment placeholder", "Infrastructure allocation placeholder", "Application ARR placeholder"];
  return <section className="panel queue-panel"><div className="panel-heading"><div><p className="panel-label">Pending claims · sample</p><h2>Review queue preview</h2></div><ConfidenceBadge level="Prototype" /></div>{items.map((item) => <article className="queue-item" key={item}><div><strong>{item}</strong><p>Source-linked claim · sample record · no write action</p></div><span className="disabled-action">Review unavailable</span></article>)}</section>;
}

export function RouteDirectory({ routes, admin = false }: { routes: readonly RouteDefinition[]; admin?: boolean }) {
  return <section className="route-directory" aria-label={admin ? "All admin routes" : "All public routes"}><p className="panel-label">{admin ? "Admin route map" : "Explore the ledger"}</p><div>{routes.map((route) => <Link href={route.href as Route} key={route.href}>{route.label}<span aria-hidden="true">→</span></Link>)}</div></section>;
}
