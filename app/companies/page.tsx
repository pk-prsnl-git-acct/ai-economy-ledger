import type { Metadata } from "next";

import { AppShell, HeroSection } from "@/components/ledger";
import { AnalyticsNav, AnalyticsNotice } from "@/components/market-intelligence";
import { getAnalyticsManifest, getEntityProfiles } from "@/src/server/market-intelligence/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/companies");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default async function CompaniesPage() {
  const [manifest, profiles] = await Promise.all([getAnalyticsManifest(), getEntityProfiles()]);
  return <AppShell><HeroSection route={route} /><AnalyticsNav /><AnalyticsNotice releaseId={manifest.releaseId} />
    <section className="entity-profile-grid" aria-label="Limited company profiles">{profiles.entities.map((profile, index) => <article className="panel entity-profile" key={profile.entity.entityKey}>
      <span className="availability-index">{String(index + 1).padStart(2, "0")}</span><h2>{profile.entity.displayName}</h2><code>{profile.entity.entityKey}</code>
      <div className="entity-count">{profile.recordCount}<small>release records</small></div>
      <div className="truth-counts">{Object.entries(profile.truthClassCounts).map(([truth, count]) => <span key={truth}>{truth.replaceAll("_", " ")} <strong>{count}</strong></span>)}</div>
      <p>{profile.limitation}</p>
    </article>)}</section>
  </AppShell>;
}
