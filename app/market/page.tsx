import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { AnalyticsNav, AnalyticsNotice, AvailabilityGrid, ScopeMetric } from "@/components/market-intelligence";
import { getAnalyticsManifest, getCoverageHeatmap, getTrustSplit, getViewCatalog } from "@/src/server/market-intelligence/runtime";
import { listReleases } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/market");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);

export const dynamic = "force-dynamic";

export default async function MarketPage() {
  const [manifest, catalog, coverage, trust, releases] = await Promise.all([getAnalyticsManifest(), getViewCatalog(), getCoverageHeatmap(), getTrustSplit(), listReleases()]);
  const limited = catalog.views.filter((view) => view.availabilityState === "available_with_limitations").length;
  const records = trust.groups.reduce((count, group) => count + group.recordCount, 0);
  const published = releases.some((release) => release.releaseId === manifest.releaseId && release.status === "published");
  return <AppShell>
    <HeroSection route={route} />
    <AnalyticsNav />
    <AnalyticsNotice releaseId={manifest.releaseId} />
    <section className="scope-metrics" aria-label="Analytical release scope">
      <ScopeMetric label="Limited views" value={`${limited} / ${catalog.views.length}`} detail="No fully available market-wide view" />
      <ScopeMetric label="Source records" value={String(records)} detail="Mixed metrics are not aggregated" />
      <ScopeMetric label="Coverage" value={`${coverage.summary.percentage ?? "undefined"}%`} detail={`${coverage.summary.covered} of ${coverage.summary.expected} named cells`} />
      <ScopeMetric label="Publication" value={published ? "Limited live" : "Off"} detail={published ? "Exact release-bound analytics only" : "Local release candidate only"} />
    </section>
    <div className="analytics-section-heading"><p className="panel-label">View registry</p><h2>What this release can and cannot say</h2><p>Availability is decided by the private engine from exact coverage, quality, methodology, and input requirements.</p></div>
    <AvailabilityGrid views={catalog.views} />
  </AppShell>;
}
