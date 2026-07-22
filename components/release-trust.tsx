import { DownloadLink, TrustLabel } from "@/components/data-release";
import type { PublicRecord, ReleaseManifest, SourceManifestEntry } from "@/src/server/data-releases/runtime";
import { stackLayerName, stackRoleFor, summarizeAiStack } from "@/src/ui/ai-stack";
import { formatExactFinancialValue, formatFinancialValue } from "@/src/ui/format-financial-value";

function title(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function fiscalPeriods(records: readonly PublicRecord[]) {
  return [...new Set(records.map((record) => record.period.replace("period:", "").toUpperCase()))].sort().join(", ") || "Unavailable";
}

export function MarketScope({ manifest, records, sources }: { manifest: ReleaseManifest; records: PublicRecord[]; sources: SourceManifestEntry[] }) {
  const layers = summarizeAiStack(records);
  const companies = new Set(records.map((record) => record.entity.entityKey)).size;
  const metricFamilies = [...new Set(records.map((record) => record.metric.metricFamily.replaceAll("_", " ")))].sort();
  return <>
    <section className="scope-intro" aria-labelledby="market-scope-heading"><div><p className="eyebrow">Current market scope</p><h1 id="market-scope-heading">A five-layer map, with the limits in view.</h1></div><p>AI Economy Ledger currently covers selected official-filing observations for {companies} companies. It is not a market-wide estimate, a complete company universe, or a layer-by-layer allocation of company revenue or capital expenditure.</p></section>
    <section className="scope-metrics" aria-label="Current release coverage"><ScopeMetric label="Companies" value={String(companies)} detail="Each company counted once." /><ScopeMetric label="Observations" value={String(records.length)} detail="No values are aggregated." /><ScopeMetric label="Metric families" value={String(metricFamilies.length)} detail={metricFamilies.join(" · ") || "Unavailable"} /><ScopeMetric label="Fiscal periods" value={fiscalPeriods(records)} detail={`Release ${manifest.releaseSequence}.`} /></section>
    <section className="market-layer-grid" aria-label="Five-layer coverage map">{layers.map((layer) => <article className={`panel market-layer-card stack-${layer.status.replaceAll(" ", "-")}`} key={layer.key}><p className="panel-label">{layer.status}</p><h2>{layer.name}</h2><p>{layer.description}</p><dl><div><dt>Companies</dt><dd>{layer.companies.length ? layer.companies.join(", ") : "No production observations"}</dd></div><div><dt>Observations</dt><dd>{layer.primaryObservationCount}</dd></div><div><dt>Metric families</dt><dd>{layer.metricFamilies.join(" · ") || "Not yet represented"}</dd></div><div><dt>Official sources</dt><dd>{layer.sourceCount || "Not yet represented"}</dd></div></dl><p className="source-limit">{layer.limitation}</p></article>)}</section>
    <section className="market-support-grid"><article className="panel market-support-card"><p className="panel-label">This release can support</p><h2>Traceable company observations</h2><p>Individual released revenue and capital-expenditure observations with company, fiscal period, official source, review state, and release membership.</p></article><article className="panel market-support-card"><p className="panel-label">Not yet supported by this release</p><h2>No market-wide totals or AI allocation</h2><p>It cannot support complete AI-market sizing, layer revenue or capex totals, share estimates, trend claims, or an assertion that every company in a layer is covered.</p></article></section>
    <section className="panel scope-detail-panel"><p className="panel-label">Trust and quality</p><h2>Release-bound public data, with review state intact.</h2><dl className="detail-list"><div><dt>Source-attributed</dt><dd>{manifest.trustStateCounts.source_attributed_unverified ?? 0}</dd></div><div><dt>System validated</dt><dd>{manifest.trustStateCounts.system_validated ?? 0}</dd></div><div><dt>Human verified</dt><dd>{manifest.trustStateCounts.human_verified ?? 0}</dd></div><div><dt>Official sources</dt><dd>{sources.length}</dd></div><div><dt>Quality state</dt><dd>Hash-bound release contract</dd></div></dl></section>
  </>;
}

function ScopeMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="scope-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>;
}

export function ReleaseDetail({ manifest, records, sources, revisionCount, correctionCount }: { manifest: ReleaseManifest; records: PublicRecord[]; sources: SourceManifestEntry[]; revisionCount: number; correctionCount: number }) {
  const releasePath = `/api/data/releases/${encodeURIComponent(manifest.releaseId)}`;
  const layers = summarizeAiStack(records);
  return <>
    <section className="release-hero"><p className="eyebrow">Release detail</p><h1>{manifest.releaseId}</h1><p className="lede">{manifest.releaseStatus} release published {manifest.effectiveAt.slice(0, 10)}. Public bytes are hash-bound; coverage remains intentionally limited.</p></section>
    <section className="release-fact-grid" aria-label="Release facts"><ScopeMetric label="Companies" value={String(new Set(records.map((record) => record.entity.entityKey)).size)} detail="Counted once, not by layer." /><ScopeMetric label="Observations" value={String(records.length)} detail="Latest source-attributed lane." /><ScopeMetric label="Official sources" value={String(sources.length)} detail="Public-safe source metadata." /><ScopeMetric label="Sample records" value="0" detail="Excluded by release contract." /></section>
    <section className="panel manifest-panel"><p className="panel-label">Coverage and trust</p><dl className="detail-list"><div><dt>Layer coverage</dt><dd>{layers.filter((layer) => layer.status === "covered").length} covered · {layers.filter((layer) => layer.status === "partially covered").length} partial · {layers.filter((layer) => layer.status === "not yet covered").length} not yet covered</dd></div><div><dt>Metric coverage</dt><dd>{[...new Set(records.map((record) => record.metric.metricFamily.replaceAll("_", " ")))].join(" · ") || "Unavailable"}</dd></div><div><dt>Trust states</dt><dd>{Object.entries(manifest.trustStateCounts).map(([state, count]) => `${title(state)}: ${count}`).join(" · ")}</dd></div><div><dt>Quality state</dt><dd>Hash-bound public release</dd></div><div><dt>Revisions</dt><dd>{revisionCount}</dd></div><div><dt>Corrections</dt><dd>{correctionCount}</dd></div></dl></section>
    <section className="panel artifact-panel"><div><p className="panel-label">Artifact downloads</p><h2>Exact public release artifacts</h2><p>Machine-readable downloads retain exact values. Display formatting is applied only in the interface.</p></div><div className="artifact-links">{manifest.artifacts.map((artifact) => <DownloadLink href={`${releasePath}/artifacts/${encodeURIComponent(artifact.name)}`} key={artifact.name}>{artifact.name}</DownloadLink>)}</div></section>
    <section className="panel release-records"><div className="panel-heading"><div><p className="panel-label">Current membership</p><h2>Values retain their evidence and review state.</h2></div></div><div className="table-scroll"><table><thead><tr><th>Company / metric</th><th>Value</th><th>Period</th><th>Review state</th><th>Official source</th></tr></thead><tbody>{records.map((record) => <tr key={record.stableRecordId}><td><strong>{record.entity.displayName}</strong><br /><span className="cell-muted">{record.metric.displayLabel} · {stackLayerName(stackRoleFor(record.entity.entityKey)?.primary ?? "applications")}</span></td><td><span aria-label={formatExactFinancialValue(record.value)}>{formatFinancialValue(record.value)}</span><br /><span className="cell-muted">{record.unit}</span></td><td>{record.period.replace("period:", "").toUpperCase()}</td><td><TrustLabel record={record} /></td><td><a className="source-link" href={record.sources[0]?.url} rel="noreferrer">{record.sources[0]?.sourceName ?? "Official source"}</a></td></tr>)}</tbody></table></div></section>
    <section className="panel release-limitations"><p className="panel-label">Limitations</p><h2>What remains outside this release</h2><ul>{manifest.knownLimitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul><p>Company-wide revenue and capital expenditure are not allocated to an AI-stack layer unless released evidence supports that allocation.</p></section>
    <section className="release-hash-note"><span>Manifest and artifact hashes are available in the downloaded manifest.</span><code>{manifest.inputSetHash.slice(0, 16)}…</code></section>
  </>;
}

export function SourceManifest({ records, sources, releaseId }: { records: PublicRecord[]; sources: SourceManifestEntry[]; releaseId: string }) {
  return <section className="source-card-grid" aria-label="Release-bound source manifest">{sources.map((source) => {
    const supported = records.filter((record) => record.sources.some((recordSource) => recordSource.sourceKey === source.sourceKey));
    const companies = [...new Set(supported.map((record) => record.entity.displayName))];
    const sourceDates = supported.flatMap((record) => record.sources.filter((recordSource) => recordSource.sourceKey === source.sourceKey).map((recordSource) => recordSource.filingDate)).filter(Boolean).sort();
    const link = supported.flatMap((record) => record.sources).find((recordSource) => recordSource.sourceKey === source.sourceKey)?.url ?? source.officialBaseUrl;
    return <article className="panel source-card" key={source.sourceKey}><p className="panel-label">{source.sourceTier} · {source.sourceFamily.replaceAll("_", " ")}</p><h2>{source.sourceName}</h2><p>{supported.length} observations in release {releaseId}.</p><dl className="detail-list"><div><dt>Companies</dt><dd>{companies.join(", ") || "No released observations"}</dd></div><div><dt>Source class</dt><dd>{source.sourceFamily.replaceAll("_", " ")}</dd></div><div><dt>Filing/publication date</dt><dd>{sourceDates.at(-1) ?? "Unavailable"}</dd></div><div><dt>Rights state</dt><dd>{source.redistributionStatus}</dd></div><div><dt>Metric families</dt><dd>{source.metricFamiliesCovered.map((metric) => metric.replaceAll("_", " ")).join(" · ") || "Unavailable"}</dd></div></dl>{link && <a className="download-action" href={link} rel="noreferrer">Official source ↗</a>}<p className="source-limit">{source.knownLimitations.join(" ")}</p></article>;
  })}</section>;
}

export function Methodology({ manifest }: { manifest: ReleaseManifest }) {
  const principles = [
    ["Five-layer taxonomy", "Companies have one primary product layer and may have secondary roles. This taxonomy adds context; it is not an accounting allocation."],
    ["Source inclusion", "Only released, public-safe official-source metadata and structured observations are displayed. Raw filings and source payloads are not republished here."],
    ["Extraction and normalization", "Values preserve their source, period, unit, currency, and release lineage. The interface uses compact currency display while downloads retain exact raw values."],
    ["Progressive trust", "Source-attributed, system-validated, and human-verified records remain distinct. A missing value remains unavailable, never zero."],
    ["Coverage and limits", "Coverage is limited to the published companies, metrics, fiscal periods, and sources in this release. It does not imply an economy-wide denominator."],
    ["Revisions and corrections", "Public changes are append-only release artifacts. Corrections, amendments, restatements, and supersession states are not silently collapsed."],
  ];
  return <section className="method-grid"><article className="panel equation-card"><p className="panel-label">Implemented methodology</p><h2>Evidence first. Scope always visible.</h2><p className="equation">Company-wide revenue or capital expenditure is never assigned to an AI-stack layer unless released evidence explicitly supports that allocation.</p><p className="method-version">Current release methodology: {manifest.methodologyVersion}</p></article>{principles.map(([heading, copy]) => <article className="panel method-card" key={heading}><h2>{heading}</h2><p>{copy}</p></article>)}<article className="panel method-card"><h2>Unsupported aggregation</h2><p>No market-wide totals, layer totals, or comparative claims are calculated from the current narrow baseline. Companies are counted once by identity, not once per layer role.</p></article></section>;
}
