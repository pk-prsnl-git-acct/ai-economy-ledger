import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation, DownloadLink } from "@/components/data-release";
import { currentReleaseId, getReleaseManifest, getReleaseRecords } from "@/src/server/data-releases/contract";
import { findPublicRoute } from "@/src/ui/site-map";
import { routeMetadata } from "@/src/ui/metadata";

const route = findPublicRoute("/data");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export default function DataPage() {
  const releaseId = currentReleaseId();
  const manifest = getReleaseManifest(releaseId);
  const latest = getReleaseRecords(releaseId, "latest_source_attributed").records;
  const verified = getReleaseRecords(releaseId, "verified").records;
  const base = `/api/data/releases/${encodeURIComponent(releaseId)}`;
  return (
    <AppShell>
      <HeroSection route={route} />
      <CandidateNotice />
      <DataNavigation />
      <section className="release-metrics" aria-label="Release summary">
        <article className="panel release-stat"><span>Latest source-attributed</span><strong>{latest.length}</strong><small>Includes {latest.filter((record) => record.reviewRequired).length} review-pending</small></article>
        <article className="panel release-stat"><span>Verified lane</span><strong>{verified.length}</strong><small>Explicit private-engine decisions</small></article>
        <article className="panel release-stat"><span>Publication</span><strong>Off</strong><small>Candidate only</small></article>
      </section>
      <section className="panel download-panel">
        <div className="panel-heading"><div><p className="panel-label">Release {manifest.releaseSequence}</p><h2>{releaseId}</h2></div><span className="badge">{manifest.releaseStatus}</span></div>
        <p className="admin-muted">Source-attributed data is not blocked by missing human review. Verified membership, headline use, and publication execution remain separate decisions.</p>
        <div className="download-grid">
          <article><h3>Latest source-attributed</h3><p>All visible current records with disclosures.</p><div><DownloadLink href={`${base}/records?lane=latest_source_attributed&format=json`}>JSON</DownloadLink><DownloadLink href={`${base}/records?lane=latest_source_attributed&format=csv`}>CSV</DownloadLink></div></article>
          <article><h3>Verified</h3><p>Only records explicitly admitted to the verified lane.</p><div><DownloadLink href={`${base}/records?lane=verified&format=json`}>JSON</DownloadLink><DownloadLink href={`${base}/records?lane=verified&format=csv`}>CSV</DownloadLink></div></article>
          <article><h3>Coverage</h3><p>Expected-matrix states and denominator limitations.</p><div><DownloadLink href={`${base}/coverage?format=json`}>JSON</DownloadLink><DownloadLink href={`${base}/coverage?format=csv`}>CSV</DownloadLink></div></article>
          <article><h3>Sources</h3><p>Rights-safe source manifest and release counts.</p><div><DownloadLink href={`${base}/sources?format=json`}>JSON</DownloadLink><DownloadLink href={`${base}/sources?format=csv`}>CSV</DownloadLink></div></article>
        </div>
      </section>
    </AppShell>
  );
}
