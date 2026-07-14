import { apiError, artifactResponse } from "@/src/server/data-releases/http";
import { getAnalyticsArtifact } from "@/src/server/market-intelligence/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ artifact: string }> }) {
  try {
    const { artifact } = await params;
    const result = await getAnalyticsArtifact(artifact);
    return artifactResponse(request, result.bytes, result.name, result.mediaType, result.hash);
  } catch (error) { return apiError(error); }
}
