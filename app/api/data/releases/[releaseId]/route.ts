import { getArtifact, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { apiError, jsonResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  try {
    const { releaseId } = await params;
    // Avoid parsing the same manifest concurrently in one Worker invocation.
    const manifest = await getReleaseManifest(releaseId);
    const artifact = await getArtifact(releaseId, "manifest.json");
    return jsonResponse(request, manifest, artifact.hash, true);
  } catch (error) {
    return apiError(error);
  }
}
