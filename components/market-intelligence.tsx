import Link from "next/link";
import type { Route } from "next";
import type { CSSProperties, ReactNode } from "react";

import type { AnalyticalRecord, ViewAvailability } from "@/src/server/market-intelligence/contract";

function title(value: string) {
  return value.replaceAll("-", " ").replaceAll("_", " ");
}

export function AnalyticsNotice({ releaseId }: { releaseId: string }) {
  return (
    <section className="analytics-notice" aria-label="Analytical scope notice">
      <div><span className="analytics-pulse" aria-hidden="true" /><strong>Release-bound analysis</strong></div>
      <p>This view is derived from <code>{releaseId}</code>. It covers five companies and selected filings, not the whole AI market. Missing values are unavailable, never zero.</p>
    </section>
  );
}

export function AnalyticsNav() {
  return (
    <nav className="analytics-nav" aria-label="Market intelligence views">
      <Link href={"/market" as Route}>Market overview</Link>
      <Link href={"/events" as Route}>Event ledger</Link>
      <Link href={"/companies" as Route}>Company profiles</Link>
      <Link href={"/relationships" as Route}>Relationships</Link>
      <Link href={"/data/coverage" as Route}>Coverage</Link>
      <Link href={"/methodology" as Route}>Methodology</Link>
    </nav>
  );
}

export function AvailabilityGrid({ views }: { views: ViewAvailability[] }) {
  return (
    <section className="availability-grid" aria-label="Analytical view availability">
      {views.map((view, index) => {
        const limited = view.availabilityState === "available_with_limitations";
        return (
          <article className={`availability-card ${limited ? "availability-limited" : "availability-empty"}`} key={view.viewKey} style={{ "--delay": `${index * 35}ms` } as CSSProperties}>
            <div className="availability-card-top">
              <span className="availability-index">{String(index + 1).padStart(2, "0")}</span>
              <span className={`availability-state state-${limited ? "limited" : "empty"}`}>{title(view.availabilityState)}</span>
            </div>
            <h2>{title(view.viewKey)}</h2>
            <p>{view.reasonCodes.map(title).join(" · ")}</p>
            <dl>
              <div><dt>Eligible inputs</dt><dd>{view.actualInputCount}</dd></div>
              <div><dt>Quality state</dt><dd>{title(view.qualityState.overallStatus)}</dd></div>
              <div><dt>Method</dt><dd>{title(view.methodologyStatus)}</dd></div>
            </dl>
          </article>
        );
      })}
    </section>
  );
}

export function ScopeMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="scope-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function EventLedger({ records }: { records: AnalyticalRecord[] }) {
  return (
    <section className="panel analytics-table-panel">
      <div className="panel-heading"><div><p className="panel-label">Exact release membership</p><h2>Source-attributed metric observations</h2></div><span className="availability-state state-limited">limited view</span></div>
      <p className="analytics-explainer">These are filing observations, not a complete event universe. Mixed metrics are not aggregated. Values retain their own periods, units, trust classes, and evidence references and are never summed here.</p>
      <div className="table-scroll">
        <table className="analytics-table">
          <thead><tr><th>Entity</th><th>Metric</th><th>Period</th><th>Value</th><th>Truth</th><th>Trust</th><th>Lineage</th></tr></thead>
          <tbody>{records.map((record) => <tr key={record.resultId}>
            <td><strong>{record.entityOrGroup.displayName}</strong><small>{record.entityOrGroup.entityKey}</small></td>
            <td>{record.metricLabel}</td>
            <td>{record.period}</td>
            <td><strong>{record.value}</strong><small>{record.unit}</small></td>
            <td><span className="truth-chip">{title(record.truthClass)}</span></td>
            <td>{title(record.trustStateSummary)}</td>
            <td><code>{record.componentRecordRefs[0]}</code><small>{record.sourceCount} official source · <Link href="/data/sources">source manifest</Link></small></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

export function UnavailableView({ availability, children }: { availability: ViewAvailability; children: ReactNode }) {
  return (
    <section className="panel unavailable-view">
      <span className="unavailable-glyph" aria-hidden="true">∅</span>
      <p className="panel-label">{title(availability.availabilityState)}</p>
      <h2>{title(availability.viewKey)} is not available</h2>
      <p>{children}</p>
      <div className="reason-list">{availability.reasonCodes.map((reason) => <span key={reason}>{title(reason)}</span>)}</div>
      <dl><div><dt>Actual inputs</dt><dd>{availability.actualInputCount}</dd></div><div><dt>Methodology</dt><dd>{availability.methodologyVersion}</dd></div></dl>
    </section>
  );
}
