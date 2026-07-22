import type { Metadata } from "next";

import { ReleaseUnavailablePanel } from "@/components/data-release";
import { CompanyDetail } from "@/components/production-ledger";
import { AppShell } from "@/components/ledger";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { currentReleaseId, getReleaseRecords } from "@/src/server/data-releases/runtime";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Company details | AI Economy Ledger" };

export default async function CompanyDetailPage({ params }: { params: Promise<{ entityKey: string }> }) {
  const { entityKey } = await params;
  let releaseId;
  let records;
  try {
    releaseId = await currentReleaseId();
    records = await getReleaseRecords(releaseId, "latest_source_attributed");
  } catch (error) {
    if (!isProductionReleaseUnavailable(error)) throw error;
    return <AppShell><ReleaseUnavailablePanel surface="company details" /></AppShell>;
  }
  return <AppShell><CompanyDetail entityKey={decodeURIComponent(entityKey)} records={records.records} releaseId={releaseId} /></AppShell>;
}
