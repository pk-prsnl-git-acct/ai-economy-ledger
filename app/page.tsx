import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { ReleaseUnavailablePanel } from "@/components/data-release";
import { FiveLayerStack, LatestObservations, ReleaseSummary, ScopeLimitations } from "@/components/five-layer-overview";
import { CandidatePreviewHome } from "@/components/tranche4-candidate-preview";
import { ProductOverview } from "@/components/product-reset";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseManifest, getReleaseRecords, getSources } from "@/src/server/data-releases/runtime";
import { getTranche4ProductionModelIfActive } from "@/src/server/tranche4/production-model";
import { getProductResetAnalyticsIfActive } from "@/src/server/product-reset/analytics";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/");

export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const product = await getProductResetAnalyticsIfActive();
  if (product) return <AppShell variant="product"><ProductOverview analytics={product} /></AppShell>;
  const tranche4 = await getTranche4ProductionModelIfActive();
  if (tranche4) return <AppShell><CandidatePreviewHome model={tranche4.model} mode="production" /></AppShell>;

  let manifest;
  let latest;
  let sourceManifest;
  try {
    const releaseId = await currentReleaseId();
    manifest = await getReleaseManifest(releaseId);
    latest = await getReleaseRecords(releaseId, "latest_source_attributed");
    sourceManifest = await getSources(releaseId);
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
