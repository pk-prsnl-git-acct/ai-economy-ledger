import type { Metadata } from "next";

import { FiveLayerStack, ScopeLimitations } from "@/components/five-layer-overview";
import { ReleaseUnavailablePanel } from "@/components/data-release";
import { AppShell, HeroSection } from "@/components/ledger";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseRecords } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/ai-stack");

export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";

export default async function AiStackPage() {
  let records;
  try {
    const releaseId = await currentReleaseId();
    records = await getReleaseRecords(releaseId, "latest_source_attributed");
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="AI-stack coverage" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><FiveLayerStack records={records.records} /><ScopeLimitations /></AppShell>;
}
