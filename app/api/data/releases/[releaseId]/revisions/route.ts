import { getArtifact } from "@/src/server/data-releases/runtime";
import { apiError, artifactResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  try {
    const { releaseId } = await params;
    const name = "revisions.json";
    const artifact = await getArtifact(releaseId, name);
    return artifactResponse(request, artifact.bytes, name, artifact.descriptor.mediaType, artifact.hash);
  } catch (error) {
    return apiError(error);
  }
}
