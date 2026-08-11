import type { Metadata } from "next";

import { ReleaseUnavailablePanel } from "@/components/data-release";
import { AppShell, HeroSection } from "@/components/ledger";
import { ObservationLedger } from "@/components/production-ledger";
import { CandidateObservations } from "@/components/tranche4-candidate-preview";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseRecords } from "@/src/server/data-releases/runtime";
import { getTranche4ProductionModelIfActive } from "@/src/server/tranche4/production-model";
import { routeMetadata } from "@/src/ui/metadata";
import { findPublicRoute } from "@/src/ui/site-map";

const route = findPublicRoute("/observations");
export const metadata: Metadata = routeMetadata(route.title, route.description, route.href);
export const dynamic = "force-dynamic";

export default async function ObservationsPage() {
  const tranche4 = await getTranche4ProductionModelIfActive();
  if (tranche4) return <AppShell><HeroSection route={route} /><CandidateObservations model={tranche4.model} /></AppShell>;

  let releaseId;
  let records;
  try {
    releaseId = await currentReleaseId();
    records = await getReleaseRecords(releaseId, "latest_source_attributed");
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><HeroSection route={route} /><ReleaseUnavailablePanel surface="observation ledger" /></AppShell>;
  }
  return <AppShell><HeroSection route={route} /><ObservationLedger records={records.records} releaseId={releaseId} /></AppShell>;
}
