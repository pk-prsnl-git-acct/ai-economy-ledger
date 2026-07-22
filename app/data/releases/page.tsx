import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation, ReleaseUnavailablePanel } from "@/components/data-release";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { listReleases } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/data/releases");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export const dynamic = "force-dynamic";

export default async function ReleasesPage() {
  let releases;
  try {
    releases = await listReleases();
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><DataNavigation /><ReleaseUnavailablePanel surface="release index" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><CandidateNotice /><DataNavigation /><section className="release-list">{releases.map((release) => <Link className="panel release-row" href={`/data/releases/${encodeURIComponent(release.releaseId)}` as Route} key={release.releaseId}><div><span className="panel-label">{release.status}</span><h2>{release.releaseId}</h2><p>Effective {release.effectiveAt.slice(0, 10)} · manifest {release.manifestHash.slice(0, 16)}…</p></div><div><strong>{release.laneCounts.latest_source_attributed}</strong><span>source-attributed</span><strong>{release.laneCounts.verified}</strong><span>verified</span></div></Link>)}</section></AppShell>;
}
