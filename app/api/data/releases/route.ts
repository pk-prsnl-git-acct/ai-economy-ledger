import { listReleases, releaseIndexHash } from "@/src/server/data-releases/contract";
import { apiError, jsonResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request) {
  try {
    return jsonResponse(request, { contractVersion: "public-dataset-release@34.0.0", releases: listReleases() }, releaseIndexHash());
  } catch (error) {
    return apiError(error);
  }
}
