import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppShell } from "@/components/ledger";
import { CandidateCompanyPage } from "@/components/tranche4-candidate-preview";
import { getTranche4PreviewModel, tranche4PreviewEnabled } from "@/src/server/tranche4/preview-model";

export const metadata: Metadata = {
  title: "Tranche 4 Company Preview | AI Economy Ledger",
  description: "Owner-gated non-production company preview for the unpublished Tranche 4 candidate."
};

export const dynamic = "force-dynamic";

export default async function Tranche4CompanyPreviewPage({ params }: { params: Promise<{ entityKey: string }> }) {
  if (!tranche4PreviewEnabled()) notFound();
  const { entityKey } = await params;
  const model = getTranche4PreviewModel();
  const decodedEntityKey = decodeURIComponent(entityKey);
  if (!model.entities.some((entity) => entity.entityKey === decodedEntityKey)) notFound();
  return <AppShell><CandidateCompanyPage model={model} entityKey={decodedEntityKey} /></AppShell>;
}
