import Link from "next/link";
import type { Route } from "next";

import type { PublicRecord, ReleaseManifest, SourceManifestEntry } from "@/src/server/data-releases/runtime";
import { formatExactFinancialValue, formatFinancialValue } from "@/src/ui/format-financial-value";
import { stackLayerName, stackRoleFor, summarizeAiStack } from "@/src/ui/ai-stack";

function fiscalLabel(record: PublicRecord) {
  return record.period.replace("period:", "").toUpperCase();
}

export function ReleaseSummary({ manifest, records, sources }: { manifest: ReleaseManifest; records: PublicRecord[]; sources: SourceManifestEntry[] }) {
  const companies = new Set(records.map((record) => record.entity.entityKey)).size;
  const metrics = new Set(records.map((record) => record.metric.metricFamily)).size;
  const periods = [...new Set(records.map(fiscalLabel))].join(", ");
  const verifiedCount = records.filter((record) => record.trustState === "human_verified" || record.trustState === "system_validated").length;
  return <section className="release-summary-grid" aria-label="Current release summary">
    <article className="release-summary-card"><span>Companies tracked</span><strong>{companies}</strong><small>Counted once by company, not by layer.</small></article>
    <article className="release-summary-card"><span>Published observations</span><strong>{records.length}</strong><small>Latest source-attributed release records.</small></article>
    <article className="release-summary-card"><span>Metric families</span><strong>{metrics}</strong><small>Revenue and capital expenditure.</small></article>
    <article className="release-summary-card"><span>Official sources</span><strong>{sources.length}</strong><small>Public-safe source manifest entries.</small></article>
    <article className="release-summary-card"><span>Fiscal periods</span><strong>{periods || "Unavailable"}</strong><small>Periods remain attached to each observation.</small></article>
    <article className="release-summary-card"><span>Verified records</span><strong>{verifiedCount}</strong><small>Human or certified-system verification only.</small></article>
    <article className="release-summary-card"><span>Quality state</span><strong>Release-bound</strong><small>Hash-verified public release contract.</small></article>
    <article className="release-summary-card"><span>Current release date</span><strong>{manifest.effectiveAt.slice(0, 10)}</strong><small>Release {manifest.releaseSequence}.</small></article>
  </section>;
}

export function FiveLayerStack({ records }: { records: PublicRecord[] }) {
  return <section className="stack-section" aria-labelledby="stack-heading">
    <div className="section-heading"><p className="eyebrow">AI stack coverage</p><h2 id="stack-heading">Five layers, with the gaps still visible.</h2><p>Company roles provide product context. Financial observations remain company-wide unless released evidence supports a narrower allocation.</p></div>
    <div className="stack-grid">
      {summarizeAiStack(records).map((layer) => <article className={`stack-card stack-${layer.status.replaceAll(" ", "-")}`} key={layer.key}>
        <div className="stack-card-heading"><span>{layer.status}</span><b>{String(aiStackLayersIndex(layer.key)).padStart(2, "0")}</b></div>
        <h3>{layer.name}</h3><p>{layer.description}</p>
        <dl><div><dt>Tracked companies</dt><dd>{layer.companies.length ? layer.companies.join(", ") : "No production observations in the current release."}</dd></div><div><dt>Primary-layer observations</dt><dd>{layer.primaryObservationCount}</dd></div><div><dt>Metric families</dt><dd>{layer.metricFamilies.length ? layer.metricFamilies.join(" · ") : "Not yet represented"}</dd></div><div><dt>Official sources</dt><dd>{layer.sourceCount || "Not yet represented"}</dd></div></dl>
        <p className="stack-limitation">{layer.limitation}</p><p className="stack-expansion">Next: {layer.expansionState}</p>
        <Link href={(layer.companies.length ? "/companies" : "/ai-stack") as Route}>View coverage <span aria-hidden="true">→</span></Link>
      </article>)}
    </div>
  </section>;
}

function aiStackLayersIndex(layer: ReturnType<typeof summarizeAiStack>[number]["key"]) {
  return ["hardware", "infrastructure", "models", "platforms", "applications"].indexOf(layer) + 1;
}

export function LatestObservations({ records }: { records: PublicRecord[] }) {
  return <section className="panel production-observations" aria-labelledby="latest-observations-heading">
    <div className="panel-heading"><div><p className="panel-label">Latest observations</p><h2 id="latest-observations-heading">Official-filing values, with their review state.</h2></div><Link className="source-link" href={"/events" as Route}>View all observations <span aria-hidden="true">→</span></Link></div>
    <div className="table-scroll"><table><caption className="sr-only">Latest public production observations</caption><thead><tr><th>Company / primary layer</th><th>Observation</th><th>Value</th><th>Period</th><th>Official source</th><th>Review state</th></tr></thead><tbody>
      {records.map((record) => <tr key={record.stableRecordId}><td><strong>{record.entity.displayName}</strong><br /><span className="cell-muted">{stackLayerName(stackRoleFor(record.entity.entityKey)?.primary ?? "applications")}</span></td><td>{record.metric.displayLabel}</td><td><span aria-label={formatExactFinancialValue(record.value)}>{formatFinancialValue(record.value)}</span><br /><span className="cell-muted">{record.unit}</span></td><td>{fiscalLabel(record)}</td><td><a className="source-link" href={record.sources[0]?.url} rel="noreferrer">{record.sources[0]?.sourceName ?? "Official source"}</a></td><td><span className="review-state">{record.trustState === "human_verified" ? "Human verified" : record.trustState === "system_validated" ? "System validated" : "Source-attributed"}</span><br /><span className="cell-muted">{record.disclosure.label}</span></td></tr>)}
    </tbody></table></div>
    <div className="observation-card-list" aria-label="Latest public production observations">
      {records.map((record) => <article className="observation-card" key={record.stableRecordId}>
        <div><strong>{record.entity.displayName}</strong><span>{stackLayerName(stackRoleFor(record.entity.entityKey)?.primary ?? "applications")}</span></div>
        <dl><div><dt>Observation</dt><dd>{record.metric.displayLabel}</dd></div><div><dt>Value</dt><dd aria-label={formatExactFinancialValue(record.value)}>{formatFinancialValue(record.value)} <small>{record.unit}</small></dd></div><div><dt>Period</dt><dd>{fiscalLabel(record)}</dd></div><div><dt>Review state</dt><dd>{record.trustState === "human_verified" ? "Human verified" : record.trustState === "system_validated" ? "System validated" : "Source-attributed"}</dd></div></dl>
        <a className="source-link" href={record.sources[0]?.url} rel="noreferrer">{record.sources[0]?.sourceName ?? "Official source"}</a>
      </article>)}
    </div>
  </section>;
}

export function ScopeLimitations() {
  return <section className="scope-limitations" aria-labelledby="scope-limitations-heading"><div><p className="eyebrow">Scope and limitations</p><h2 id="scope-limitations-heading">An initial SEC-backed baseline, not a complete AI economy model.</h2></div><p>This release covers five companies and selected official-filing revenue and capital-expenditure observations. It does not allocate company-wide financial values across AI-stack layers, calculate market-wide totals, or represent unmeasured companies, products, financing, infrastructure or relationships.</p></section>;
}
