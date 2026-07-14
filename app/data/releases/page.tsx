import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation } from "@/components/data-release";
import { listReleases } from "@/src/server/data-releases/contract";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/data/releases");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export default function ReleasesPage() {
  return <AppShell><HeroSection route={route} /><CandidateNotice /><DataNavigation /><section className="release-list">{listReleases().map((release) => <Link className="panel release-row" href={`/data/releases/${release.releaseId}` as Route} key={release.releaseId}><div><span className="panel-label">{release.status}</span><h2>{release.releaseId}</h2><p>Effective {release.effectiveAt.slice(0, 10)} · manifest {release.manifestHash.slice(0, 16)}…</p></div><div><strong>{release.laneCounts.latest_source_attributed}</strong><span>source-attributed</span><strong>{release.laneCounts.verified}</strong><span>verified</span></div></Link>)}</section></AppShell>;
}
