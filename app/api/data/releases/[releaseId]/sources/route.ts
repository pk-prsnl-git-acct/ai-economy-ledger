import { getArtifact } from "@/src/server/data-releases/contract";
import { apiError, artifactResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  try {
    const { releaseId } = await params;
    const format = new URL(request.url).searchParams.get("format") ?? "json";
    if (!new Set(["json", "csv"]).has(format)) throw new Error("Unsupported source format");
    const name = `sources.${format}`;
    const artifact = getArtifact(releaseId, name);
    return artifactResponse(request, artifact.bytes, name, artifact.descriptor.mediaType, artifact.hash);
  } catch (error) {
    return apiError(error);
  }
}
