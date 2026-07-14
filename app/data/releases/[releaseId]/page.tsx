import { notFound } from "next/navigation";

import { AppShell } from "@/components/ledger";
import { CandidateNotice, DataNavigation, DecisionBadges, TrustLabel } from "@/components/data-release";
import { getReleaseManifest, getReleaseRecords } from "@/src/server/data-releases/contract";

export default async function ReleaseDetailPage({ params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params;
  let manifest;
  let records;
  try {
    manifest = getReleaseManifest(releaseId);
    records = getReleaseRecords(releaseId, "latest_source_attributed").records;
  } catch {
    notFound();
  }
  return <AppShell><section className="release-hero"><p className="eyebrow">Immutable release detail</p><h1>{manifest.releaseId}</h1><p className="lede">Manifest hash-bound candidate effective {manifest.effectiveAt.slice(0, 10)}. Historical bytes are immutable.</p></section><CandidateNotice /><DataNavigation /><section className="panel manifest-panel"><p className="panel-label">Contract</p><dl className="detail-list"><div><dt>Release contract</dt><dd>{manifest.releaseContractVersion}</dd></div><div><dt>Record schema</dt><dd>{manifest.recordSchemaVersion}</dd></div><div><dt>Methodology</dt><dd>{manifest.methodologyVersion}</dd></div><div><dt>Artifacts</dt><dd>{manifest.artifacts.length}</dd></div><div><dt>Publication enabled</dt><dd>No</dd></div></dl></section><section className="panel table-panel release-records"><div className="panel-heading"><div><p className="panel-label">Current membership</p><h2>Trust and decisions stay separate</h2></div></div><div className="table-scroll"><table><thead><tr><th>Entity / metric</th><th>Value</th><th>Trust</th><th>Private decisions</th><th>Disclosure</th></tr></thead><tbody>{records.map((record) => <tr key={record.stableRecordId}><td><strong>{record.entity.displayName}</strong><br /><span className="cell-muted">{record.metric.displayLabel} · {record.period}</span></td><td>{record.value} {record.unit}</td><td><TrustLabel record={record} /></td><td><DecisionBadges record={record} /></td><td>{record.disclosure.label}</td></tr>)}</tbody></table></div></section></AppShell>;
}
