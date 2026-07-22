import { notFound } from "next/navigation";

import { AppShell } from "@/components/ledger";
import { CandidateNotice, DataNavigation, ReleaseUnavailablePanel } from "@/components/data-release";
import { ReleaseDetail } from "@/components/release-trust";
import { isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";
import { getCorrections, getReleaseManifest, getReleaseRecords, getRevisions, getSources } from "@/src/server/data-releases/runtime";

export default async function ReleaseDetailPage({ params }: { params: Promise<{ releaseId: string }> }) {
  const { releaseId } = await params;
  let manifest;
  let records;
  let sources;
  let revisions;
  let corrections;
  try {
    [manifest, records, sources, revisions, corrections] = await Promise.all([
      getReleaseManifest(releaseId),
      getReleaseRecords(releaseId, "latest_source_attributed").then((result) => result.records),
      getSources(releaseId).then((result) => result.sources),
      getRevisions(releaseId).then((result) => result.revisions),
      getCorrections(),
    ]);
  } catch (error) {
    if (isProductionReleaseUnavailable(error)) return <AppShell><DataNavigation /><ReleaseUnavailablePanel surface="release detail" /></AppShell>;
    notFound();
  }
  return <AppShell><CandidateNotice /><DataNavigation /><ReleaseDetail manifest={manifest} records={records} sources={sources} revisionCount={revisions.length} correctionCount={corrections.corrections.length} /></AppShell>;
}
