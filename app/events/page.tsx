import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { AnalyticsNav, AnalyticsNotice, EventLedger } from "@/components/market-intelligence";
import { getAnalyticsManifest, getEconomicEventLedger } from "@/src/server/market-intelligence/contract";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/events");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export default function EventsPage() {
  const manifest = getAnalyticsManifest();
  const ledger = getEconomicEventLedger();
  return <AppShell><HeroSection route={route} /><AnalyticsNav /><AnalyticsNotice releaseId={manifest.releaseId} /><EventLedger records={ledger.records} /></AppShell>;
}
