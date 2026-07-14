import { getArtifact } from "@/src/server/data-releases/contract";
import { apiError, artifactResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string; artifactName: string }> }) {
  try {
    const { releaseId, artifactName } = await params;
    const artifact = getArtifact(releaseId, artifactName);
    return artifactResponse(request, artifact.bytes, artifactName, artifact.descriptor.mediaType, artifact.hash);
  } catch (error) {
    return apiError(error);
  }
}
