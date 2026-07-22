import type { Metadata } from "next";
import { AppShell, HeroSection } from "@/components/ledger";
import { ReleaseUnavailablePanel } from "@/components/data-release";
import { SourceManifest } from "@/components/release-trust";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseRecords, getSources } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";
const route = findPublicRoute("/sources");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default async function SourcesPage() {
  let releaseId;
  let records;
  let sources;
  try {
    releaseId = await currentReleaseId();
    [records, sources] = await Promise.all([getReleaseRecords(releaseId, "latest_source_attributed").then((result) => result.records), getSources(releaseId).then((result) => result.sources)]);
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="source manifest" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><section className="source-page-intro"><p>Official-source metadata and released observation links for the current release. Raw filings, PDFs, and other source payloads are not republished.</p><small>Published release data</small></section><SourceManifest records={records} sources={sources} /></AppShell>;
}
