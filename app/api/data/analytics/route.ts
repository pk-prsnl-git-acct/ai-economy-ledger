import { apiError, jsonResponse } from "@/src/server/data-releases/http";
import { analyticsIndexHash, getAnalyticsManifest, getViewCatalog } from "@/src/server/market-intelligence/contract";

export async function GET(request: Request) {
  try {
    return jsonResponse(request, { contractVersion: "public-market-intelligence@37.0.0", manifest: getAnalyticsManifest(), views: getViewCatalog().views }, analyticsIndexHash());
  } catch (error) { return apiError(error); }
}
