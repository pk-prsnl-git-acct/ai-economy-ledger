import type { Metadata } from "next";

import { ReleaseUnavailablePanel } from "@/components/data-release";
import { AppShell, HeroSection } from "@/components/ledger";
import { AnalyticsNav, AnalyticsNotice, EventLedger } from "@/components/market-intelligence";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { getAnalyticsManifest, getEconomicEventLedger } from "@/src/server/market-intelligence/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/events");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default async function EventsPage() {
  let manifest;
  let ledger;
  try {
    [manifest, ledger] = await Promise.all([getAnalyticsManifest(), getEconomicEventLedger()]);
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><AnalyticsNav /><ReleaseUnavailablePanel surface="event ledger" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><AnalyticsNav /><AnalyticsNotice releaseId={manifest.releaseId} /><EventLedger records={ledger.records} /></AppShell>;
}
