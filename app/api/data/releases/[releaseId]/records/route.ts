import { getArtifact } from "@/src/server/data-releases/contract";
import { apiError, artifactResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request, { params }: { params: Promise<{ releaseId: string }> }) {
  try {
    const { releaseId } = await params;
    const url = new URL(request.url);
    const lane = url.searchParams.get("lane") ?? "latest_source_attributed";
    const format = url.searchParams.get("format") ?? "json";
    if (!new Set(["latest_source_attributed", "verified"]).has(lane)) throw new Error("Unsupported record lane");
    if (!new Set(["json", "csv"]).has(format)) throw new Error("Unsupported record format");
    const laneName = lane === "verified" ? "verified" : "latest-source-attributed";
    const name = `records-${laneName}.${format}`;
    const artifact = getArtifact(releaseId, name);
    return artifactResponse(request, artifact.bytes, name, artifact.descriptor.mediaType, artifact.hash);
  } catch (error) {
    return apiError(error);
  }
}
