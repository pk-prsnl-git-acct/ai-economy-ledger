import { notFound } from "next/navigation";

import { getTranche4CandidateArtifact } from "@/src/server/tranche4/candidate-contract";
import { tranche4PreviewEnabled } from "@/src/server/tranche4/preview-model";

export const dynamic = "force-dynamic";

function mediaType(name: string) {
  if (name.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (name.endsWith(".md")) return "text/markdown; charset=utf-8";
  return "application/json; charset=utf-8";
}

export async function GET(_request: Request, { params }: { params: Promise<{ artifactName: string }> }) {
  if (!tranche4PreviewEnabled()) notFound();
  const { artifactName } = await params;
  const decodedName = decodeURIComponent(artifactName);
  const artifact = getTranche4CandidateArtifact(decodedName);
  return new Response(artifact.bytes, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${artifact.name}"`,
      "Content-Type": mediaType(artifact.name),
      "X-Content-Type-Options": "nosniff",
      "X-Tranche-4-Artifact-Hash": artifact.hash
    }
  });
}
