import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { CandidateNotice, DataNavigation, ReleaseUnavailablePanel } from "@/components/data-release";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { getCorrections } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/data/corrections");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export const dynamic = "force-dynamic";

export default async function CorrectionsPage() {
  let feed;
  try {
    feed = await getCorrections();
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><DataNavigation /><ReleaseUnavailablePanel surface="correction feed" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><CandidateNotice /><DataNavigation /><section className="panel empty-feed"><p className="panel-label">Cursor feed</p><h2>{feed.corrections.length === 0 ? "No public corrections in this first candidate" : `${feed.corrections.length} correction events`}</h2><p>Rejected internal candidates never appear here. Future public-impacting corrections, rights withdrawals, trust downgrades, visibility changes, restorations, amendments, and restatements will be append-only and cursor ordered.</p><code>schema {feed.schemaVersion} · next cursor {feed.nextCursor ?? "none"}</code></section></AppShell>;
}
