import { getArtifact, getReleaseManifest } from "@/src/server/data-releases/contract";
import { apiError, jsonResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  try {
    const { releaseId } = await params;
    const manifest = getReleaseManifest(releaseId);
    const artifact = getArtifact(releaseId, "manifest.json");
    return jsonResponse(request, manifest, artifact.hash, true);
  } catch (error) {
    return apiError(error);
  }
}
