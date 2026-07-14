import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { AnalyticsNav, AnalyticsNotice, UnavailableView } from "@/components/market-intelligence";
import { getAnalyticsManifest, getRelationshipGraph } from "@/src/server/market-intelligence/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/relationships");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default async function RelationshipsPage() {
  const [manifest, graph] = await Promise.all([getAnalyticsManifest(), getRelationshipGraph()]);
  return <AppShell><HeroSection route={route} /><AnalyticsNav /><AnalyticsNotice releaseId={manifest.releaseId} /><UnavailableView availability={graph.availability}>No public evidence-bound relationship edges are present in this release. Parent/subsidiary identity and source corroboration are not economic-flow evidence, so the application does not draw a speculative network.</UnavailableView></AppShell>;
}
