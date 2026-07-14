import { correctionFeedHash, getCorrections } from "@/src/server/data-releases/contract";
import { apiError, jsonResponse } from "@/src/server/data-releases/http";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const after = url.searchParams.get("after");
    const limit = Number(url.searchParams.get("limit") ?? "100");
    return jsonResponse(request, getCorrections({ after, limit }), correctionFeedHash({ after, limit }));
  } catch (error) {
    return apiError(error);
  }
}
