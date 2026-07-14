import { apiError, jsonResponse } from "@/src/server/data-releases/http";
import { analyticsIndexHash, getAnalyticsManifest, getViewCatalog } from "@/src/server/market-intelligence/runtime";

export async function GET(request: Request) {
  try {
    const [manifest, catalog, hash] = await Promise.all([getAnalyticsManifest(), getViewCatalog(), analyticsIndexHash()]);
    return jsonResponse(request, { contractVersion: "public-market-intelligence@37.0.0", manifest, views: catalog.views }, hash);
  } catch (error) { return apiError(error); }
}
