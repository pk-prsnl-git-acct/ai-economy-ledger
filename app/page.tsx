import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { ReleaseUnavailablePanel } from "@/components/data-release";
import { FiveLayerStack, LatestObservations, ReleaseSummary, ScopeLimitations } from "@/components/five-layer-overview";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseManifest, getReleaseRecords, getSources } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/");

export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let manifest;
  let latest;
  let sourceManifest;
  try {
    const releaseId = await currentReleaseId();
    [manifest, latest, sourceManifest] = await Promise.all([getReleaseManifest(releaseId), getReleaseRecords(releaseId, "latest_source_attributed"), getSources(releaseId)]);
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="overview data" /></AppShell>;
  }
  return (
    <AppShell>
      <HeroSection route={route} />
      <ReleaseSummary manifest={manifest} records={latest.records} sources={sourceManifest.sources} />
      <FiveLayerStack records={latest.records} />
      <LatestObservations records={latest.records} />
      <ScopeLimitations />
    </AppShell>
  );
}
