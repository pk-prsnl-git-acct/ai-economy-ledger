import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/ledger";
import { CandidatePreviewHome } from "@/components/tranche4-candidate-preview";
import { getTranche4PreviewModel, tranche4PreviewEnabled } from "@/src/server/tranche4/preview-model";

export const metadata: Metadata = {
  title: "Tranche 4 Candidate Preview | AI Economy Ledger",
  description: "Owner-gated non-production preview of the unpublished Tranche 4 Set 1 candidate."
};

export const dynamic = "force-dynamic";

export default function Tranche4CandidatePreviewPage() {
  if (!tranche4PreviewEnabled()) notFound();
  return <AppShell><CandidatePreviewHome model={getTranche4PreviewModel()} /></AppShell>;
}
