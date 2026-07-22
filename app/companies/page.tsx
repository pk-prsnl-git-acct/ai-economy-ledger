import type { Metadata } from "next";

import { ReleaseUnavailablePanel } from "@/components/data-release";
import { AppShell, HeroSection } from "@/components/ledger";
import { CompanyDirectory } from "@/components/production-ledger";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseRecords } from "@/src/server/data-releases/runtime";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/companies");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default async function CompaniesPage() {
  let releaseId;
  let records;
  try {
    releaseId = await currentReleaseId();
    records = await getReleaseRecords(releaseId, "latest_source_attributed");
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="company profiles" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><section className="company-intro"><p>Each company is counted once by a primary AI-stack role. Secondary roles provide context only; financial values stay company-wide unless released evidence supports an allocation.</p><small>Published release data</small></section><CompanyDirectory records={records.records} /></AppShell>;
}
