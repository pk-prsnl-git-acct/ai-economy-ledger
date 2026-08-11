import type { Metadata } from "next";

import { ReleaseUnavailablePanel } from "@/components/data-release";
import { AppShell, HeroSection } from "@/components/ledger";
import { MarketScope } from "@/components/release-trust";
import { CandidateTrends } from "@/components/tranche4-candidate-preview";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseManifest, getReleaseRecords, getSources } from "@/src/server/data-releases/runtime";
import { getTranche4ProductionModelIfActive } from "@/src/server/tranche4/production-model";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/market");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const tranche4 = await getTranche4ProductionModelIfActive();
  if (tranche4) return <AppShell><HeroSection route={route} /><CandidateTrends model={tranche4.model} mode="production" /></AppShell>;

  let manifest;
  let records;
  let sources;
  try {
    const releaseId = await currentReleaseId();
    [manifest, records, sources] = await Promise.all([getReleaseManifest(releaseId), getReleaseRecords(releaseId, "latest_source_attributed").then((result) => result.records), getSources(releaseId).then((result) => result.sources)]);
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="market scope" /></AppShell>;
  }
  return <AppShell><MarketScope manifest={manifest} records={records} sources={sources} /></AppShell>;
}
