import type { Metadata } from "next";

import { ReleaseUnavailablePanel } from "@/components/data-release";
import { AppShell, HeroSection } from "@/components/ledger";
import { CompanyDirectory as Release1CompanyDirectory } from "@/components/production-ledger";
import { CandidateDirectory } from "@/components/tranche4-candidate-preview";
import { ProductCompanies } from "@/components/product-reset";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseRecords } from "@/src/server/data-releases/runtime";
import { getTranche4ProductionModelIfActive } from "@/src/server/tranche4/production-model";
import { getProductResetAnalyticsIfActive } from "@/src/server/product-reset/analytics";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/companies");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";
export default async function CompaniesPage() {
  const product = await getProductResetAnalyticsIfActive();
  if (product) return <AppShell variant="product"><ProductCompanies analytics={product} /></AppShell>;
  const tranche4 = await getTranche4ProductionModelIfActive();
  if (tranche4) return <AppShell><HeroSection route={route} /><CandidateDirectory model={tranche4.model} mode="production" /></AppShell>;

  let releaseId;
  let records;
  try {
    releaseId = await currentReleaseId();
    records = await getReleaseRecords(releaseId, "latest_source_attributed");
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="company profiles" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><section className="company-intro"><p>Each company is counted once by a primary AI-stack role. Secondary roles provide context only; financial values stay company-wide unless released evidence supports an allocation.</p><small>Published release data</small></section><Release1CompanyDirectory records={records.records} /></AppShell>;
}
