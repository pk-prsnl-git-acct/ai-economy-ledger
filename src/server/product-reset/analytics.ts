import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { currentReleaseId, getReleaseManifest } from "@/src/server/data-releases/runtime";
import { getProductionReleaseTransport, isProductionReleaseUnavailable } from "@/src/server/data-releases/production-transport";

export const PRODUCT_RESET_RELEASE_INPUT_HASH = "e0466b671f316b7642db9409f243630c8149f8f064b55dd641b5da9f05aa9686";
export const PRODUCT_RESET_CANDIDATE_ID = "set1-candidate:8:4a293cead8f3d491c723";
export const PRODUCT_RESET_CANDIDATE_MANIFEST_HASH = "3afdae1fcd8dc76d0e54d75e256979ac8cf55e37eab414351786bb08abc0ecaf";

export type ProductMetric = { status: "available" | "unavailable" | "available_with_coverage"; value: string | null; percent?: number; reason?: string; anchorPeriodEnd?: string; method?: string };
export type ProductCompany = {
  entityKey: string; displayName: string; aliases: string[]; primaryLayer: string; primarySubLayer: string; secondaryRoles: string[];
  commonWindowAnchor: { periodEnd: string; reportingQuarter: string };
  latestReported: { periodEnd: string; reportingQuarter: string; newerThanCommonWindow: boolean };
  metrics: { ttmRevenue: ProductMetric; revenueYoyGrowth: ProductMetric; ttmCapex: ProductMetric; ttmCapexIntensity: ProductMetric; ttmResearchAndDevelopment: ProductMetric; ttmResearchAndDevelopmentIntensity: ProductMetric };
  annualHistory: Record<string, Array<{ fiscalYear: string; periodEnd: string; value: string; observationId: string }>>;
};
export type ProductRanking = { rank: number; entityKey: string; displayName: string; value: string | null; percent: number | null };
export type ProductLayer = {
  layerKey: string; taxonomyKey: string; label: string; trackedCompanyCount: number; constituents: Array<{ entityKey: string; displayName: string }>;
  ttmRevenue: ProductMetric & { validCompanyCount: number; trackedCompanyCount: number };
  ttmCapex: ProductMetric & { validCompanyCount: number; trackedCompanyCount: number };
  ttmResearchAndDevelopment: ProductMetric & { validCompanyCount: number; trackedCompanyCount: number };
  ttmCapexIntensity: ProductMetric; ttmResearchAndDevelopmentIntensity: ProductMetric;
};
export type ProductResetAnalytics = {
  contractVersion: string; methodologyVersion: string; artifactHash: string;
  candidateBinding: { candidateId: string; candidateManifestHash: string; candidateObservationsHash: string; taxonomyVersion: string };
  definitions: Record<string, string>;
  commonPeriod: { commonComparisonQuarter: string; cutoffDate: string; dataThrough: string; reconciledCompanyCount: number; totalTrackedCompanyCount: number; newerPartialQuarterCompanyCount: number };
  companies: ProductCompany[]; rankings: Record<string, ProductRanking[]>; layerRollups: ProductLayer[];
  layer5: { layerKey: string; label: string; companyFinancialRollup: null; reason: string };
};

let cached: Promise<ProductResetAnalytics> | undefined;

async function asset() {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env.ASSETS) {
      const response = await env.ASSETS.fetch(new Request("https://assets.local/product-reset/product-reset-analytics.json"));
      if (!response.ok) throw new Error(`product reset asset returned ${response.status}`);
      return response.json() as Promise<ProductResetAnalytics>;
    }
  } catch (error) {
    if (process.env.RELEASE_TRANSPORT_MODE === "production") throw error;
  }
  const { readFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  return JSON.parse(await readFile(join(process.cwd(), "public/product-reset/product-reset-analytics.json"), "utf8")) as ProductResetAnalytics;
}

async function activeInputHash() {
  try {
    const transport = await getProductionReleaseTransport();
    if (transport) return (await transport.manifest()).manifest.inputSetHash;
  } catch (error) {
    if (process.env.NODE_ENV !== "development" || !isProductionReleaseUnavailable(error)) throw error;
    return PRODUCT_RESET_RELEASE_INPUT_HASH;
  }
  return (await getReleaseManifest(await currentReleaseId())).inputSetHash;
}

async function validatedArtifact() {
  const document = await asset();
  if (document.contractVersion !== "product-reset-common-period@1.0.0" || document.candidateBinding.candidateId !== PRODUCT_RESET_CANDIDATE_ID ||
    document.candidateBinding.candidateManifestHash !== PRODUCT_RESET_CANDIDATE_MANIFEST_HASH || document.commonPeriod.totalTrackedCompanyCount !== 17 || document.companies.length !== 17) {
    throw new Error("Product reset analytics rejected: trust-root or cohort mismatch");
  }
  return document;
}

export async function getProductResetAnalyticsIfActive() {
  if (await activeInputHash() !== PRODUCT_RESET_RELEASE_INPUT_HASH) return null;
  cached ??= validatedArtifact();
  return cached;
}
