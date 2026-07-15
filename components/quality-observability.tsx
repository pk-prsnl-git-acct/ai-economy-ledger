import { ReleaseUnavailablePanel } from "@/components/data-release";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { getAdminQualitySummary, getPublicQualitySummary } from "@/src/server/quality-observability/runtime";

export async function PublicQualitySummary() {
  let quality;
  try {
    quality = await getPublicQualitySummary();
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <ReleaseUnavailablePanel surface="quality report" />;
  }
  const live = !quality.coverageSummary.fixtureOnly;
  return <section className="quality-summary" aria-labelledby="quality-summary-heading">
    <div className="panel quality-lead"><p className="panel-label">Release quality</p><h2 id="quality-summary-heading">{live ? "Bounded live quality window" : "Shadow proof, not production history"}</h2><p>{live ? "The private engine verified this limited live release. Long-term SLO attainment is not claimed and missing telemetry remains visible." : "The private engine verified this local candidate report. Missing telemetry remains visible and no SLO target is presented as achieved."}</p><code>{quality.reportHash.slice(0, 20)}…</code></div>
    <div className="quality-stat-grid">
      <article className="panel quality-stat"><span>Measured</span><strong>{quality.measurableSloCount}</strong><small>{live ? "bounded window" : "shadow result"}</small></article>
      <article className="panel quality-stat"><span>Low sample</span><strong>{quality.insufficientSampleCount}</strong><small>not an SLO pass</small></article>
      <article className="panel quality-stat"><span>Unmeasurable</span><strong>{quality.unmeasurableCount}</strong><small>kept visible</small></article>
      <article className="panel quality-stat"><span>Material issues</span><strong>{quality.openMaterialOrCriticalIssueCount}</strong><small>{live ? "open in live report" : "open in fixture proof"}</small></article>
    </div>
    <section className="panel quality-limitations"><h2>Known limitations</h2><ul>{quality.knownLimitations.map((item) => <li key={item}>{item}</li>)}</ul></section>
  </section>;
}

export async function AdminQualitySummary() {
  let quality;
  try {
    quality = await getAdminQualitySummary();
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <ReleaseUnavailablePanel surface="admin quality summary" />;
  }
  return <section className="panel queue-panel" aria-labelledby="admin-quality-heading"><div className="panel-heading"><div><p className="panel-label">Private-engine decision</p><h2 id="admin-quality-heading">Quality, SLO, and drift</h2></div><span className="disabled-action">{quality.overallStatus}</span></div>
    <dl className="quality-admin-list"><div><dt>Connector health</dt><dd>{quality.connectorHealth.status}</dd></div><div><dt>Review backlog</dt><dd>{quality.reviewBacklog.status}</dd></div><div><dt>Release integrity</dt><dd>{quality.releaseIntegrity.status}</dd></div><div><dt>Active enforcement SLOs</dt><dd>{quality.activeSloCount}</dd></div></dl>
    <p className="admin-muted">No external alert, connector suspension, publication, or production enforcement is active. This protected view does not recompute private policy.</p>
  </section>;
}
