import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation } from "@/components/data-release";
import { getSources } from "@/src/server/data-releases/contract";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/data/sources");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export default function DataSourcesPage() {
  const { sources } = getSources();
  return <AppShell><HeroSection route={route} /><CandidateNotice /><DataNavigation /><section className="source-card-grid">{sources.map((source) => <article className="panel source-card" key={source.sourceKey}><p className="panel-label">{source.sourceTier} · {source.jurisdiction}</p><h2>{source.sourceName}</h2><p>{source.releaseRecordCount} release records · {source.metricFamiliesCovered.length || 0} metric families</p><dl className="detail-list"><div><dt>Rights</dt><dd>{source.redistributionStatus}</dd></div><div><dt>Contract</dt><dd>{source.sourceManifestVersion}</dd></div><div><dt>Entities</dt><dd>{source.entitiesCovered.length}</dd></div></dl>{source.officialBaseUrl && <a className="download-action" href={source.officialBaseUrl}>Official source ↗</a>}<p className="source-limit">{source.knownLimitations.join(" ")}</p></article>)}</section></AppShell>;
}
