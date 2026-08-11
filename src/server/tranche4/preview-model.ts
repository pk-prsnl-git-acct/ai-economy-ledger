import "server-only";

import {
  getTranche4CandidateArtifact,
  getTranche4CanonicalDisplayName,
  getTranche4CandidateManifest,
  getTranche4CandidateObservations,
  getTranche4CandidateViewCatalog,
  tranche4CandidateIndexHash
} from "@/src/server/tranche4/candidate-contract";
import { publicLabel } from "@/src/ui/public-labels";

export const TRANCHE4_PREVIEW_FLAG = "TRANCHE4_CANDIDATE_PREVIEW_ENABLED";

export function tranche4PreviewEnabled() {
  return process.env[TRANCHE4_PREVIEW_FLAG] === "true";
}

export function label(value: string) {
  return publicLabel(value);
}

type ChartValue = {
  displayName?: string;
  entityKey?: string;
  metricKey?: string;
  observationId?: string;
  value?: string | null;
  unit?: string | null;
  currency?: string | null;
  fiscalYear?: string | null;
  fiscalPeriod?: string | null;
  periodClass?: string | null;
  periodEnd?: string | null;
  trustState?: string | null;
  comparability?: string | null;
  financialScope?: string | null;
  evidenceSetKey?: string | null;
  sourceCount?: number | null;
  subLayers?: string[];
  coveredSubLayers?: string[];
  uncoveredSubLayers?: string[];
  limitation?: string | null;
};

type ChartArtifact = {
  analyticalQuestion: string;
  chartReadyValues: ChartValue[];
  candidateId: string;
  taxonomyVersion: string;
};

function artifactJson<T>(name: string) {
  return JSON.parse(getTranche4CandidateArtifact(name).bytes.toString("utf8")) as T;
}

function canonicalDisplayName(entityKey: string | undefined, fallback?: string) {
  if (!entityKey) return fallback ?? "Unavailable";
  return getTranche4CanonicalDisplayName(entityKey, fallback);
}

function normalizeChartArtifact<T extends ChartArtifact>(artifact: T): T {
  return {
    ...artifact,
    chartReadyValues: artifact.chartReadyValues.map((value) => ({
      ...value,
      displayName: canonicalDisplayName(value.entityKey, value.displayName)
    }))
  };
}

function parseNumber(value: string | null | undefined) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function eligibleAnnualValue(value: ChartValue) {
  return value.periodClass === "annual" &&
    value.comparability === "directly_comparable" &&
    value.financialScope === "company_wide_consolidated" &&
    parseNumber(value.value) !== null;
}

function annualKey(value: ChartValue) {
  return `${value.entityKey ?? "entity"}:${value.fiscalYear ?? "year"}`;
}

function byEntityYearMetric(values: ChartValue[]) {
  const grouped = new Map<string, Record<string, ChartValue>>();
  for (const value of values.filter(eligibleAnnualValue)) {
    const metricKey = value.metricKey ?? "metric";
    const key = annualKey(value);
    grouped.set(key, { ...(grouped.get(key) ?? {}), [metricKey]: value });
  }
  return grouped;
}

function buildRdIntensity(values: ChartValue[]): ChartArtifact {
  const chartReadyValues: ChartValue[] = [];
  for (const metrics of byEntityYearMetric(values).values()) {
    const revenue = metrics.revenue;
    const rd = metrics.research_and_development;
    const revenueValue = parseNumber(revenue?.value);
    const rdValue = parseNumber(rd?.value);
    if (!revenue || !rd || revenueValue === null || rdValue === null || revenueValue === 0) continue;
    chartReadyValues.push({
      displayName: revenue.displayName,
      entityKey: revenue.entityKey,
      metricKey: "company_wide_rd_intensity",
      observationId: rd.observationId,
      value: (rdValue / revenueValue).toFixed(6),
      unit: "ratio",
      currency: null,
      fiscalYear: revenue.fiscalYear,
      fiscalPeriod: revenue.fiscalPeriod,
      periodClass: "annual",
      periodEnd: revenue.periodEnd,
      trustState: "system_validated",
      comparability: "directly_comparable",
      financialScope: "company_wide_consolidated",
      evidenceSetKey: `${revenue.evidenceSetKey ?? revenue.observationId}|${rd.evidenceSetKey ?? rd.observationId}`,
      sourceCount: Math.max(revenue.sourceCount ?? 0, rd.sourceCount ?? 0)
    });
  }
  chartReadyValues.sort((a, b) => (parseNumber(b.value) ?? 0) - (parseNumber(a.value) ?? 0));
  return {
    analyticalQuestion: "How much company-wide R&D is reported relative to company-wide revenue for the same annual fiscal year?",
    chartReadyValues,
    candidateId: getTranche4CandidateManifest().candidateId,
    taxonomyVersion: getTranche4CandidateManifest().taxonomyVersion
  };
}

function buildScaleVsInvestment(values: ChartValue[]): ChartArtifact {
  const chartReadyValues: ChartValue[] = [];
  for (const metrics of byEntityYearMetric(values).values()) {
    const revenue = metrics.revenue;
    const capex = metrics.capital_expenditure;
    const rd = metrics.research_and_development;
    const revenueValue = parseNumber(revenue?.value);
    const capexValue = parseNumber(capex?.value);
    const rdValue = parseNumber(rd?.value);
    if (!revenue || !capex || !rd || revenueValue === null || capexValue === null || rdValue === null) continue;
    chartReadyValues.push({
      displayName: revenue.displayName,
      entityKey: revenue.entityKey,
      metricKey: "scale_vs_investment",
      observationId: revenue.observationId,
      value: String(capexValue + rdValue),
      unit: "USD",
      currency: "USD",
      fiscalYear: revenue.fiscalYear,
      fiscalPeriod: revenue.fiscalPeriod,
      periodClass: "annual",
      periodEnd: revenue.periodEnd,
      trustState: "system_validated",
      comparability: "directly_comparable",
      financialScope: "company_wide_consolidated",
      evidenceSetKey: `${revenue.evidenceSetKey ?? revenue.observationId}|${capex.evidenceSetKey ?? capex.observationId}|${rd.evidenceSetKey ?? rd.observationId}`,
      sourceCount: Math.max(revenue.sourceCount ?? 0, capex.sourceCount ?? 0, rd.sourceCount ?? 0)
    });
  }
  chartReadyValues.sort((a, b) => (parseNumber(b.value) ?? 0) - (parseNumber(a.value) ?? 0));
  return {
    analyticalQuestion: "Which companies show the largest company-wide Capex plus R&D investment against annual scale?",
    chartReadyValues,
    candidateId: getTranche4CandidateManifest().candidateId,
    taxonomyVersion: getTranche4CandidateManifest().taxonomyVersion
  };
}

function buildSpotlights(annual: ChartArtifact, capexIntensity: ChartArtifact, rdIntensity: ChartArtifact, releaseChange: ChartArtifact) {
  const latestRevenue = annual.chartReadyValues
    .filter((value) => value.metricKey === "revenue")
    .sort((a, b) => (parseNumber(b.value) ?? 0) - (parseNumber(a.value) ?? 0))[0];
  const highestCapexIntensity = capexIntensity.chartReadyValues[0];
  const highestRdIntensity = rdIntensity.chartReadyValues[0];
  const newEntities = releaseChange.chartReadyValues
    .filter((value) => value.metricKey === "new_entity")
    .map((value) => canonicalDisplayName(value.entityKey, value.displayName))
    .sort((a, b) => a.localeCompare(b));
  return {
    latestRevenue,
    highestCapexIntensity,
    highestRdIntensity,
    newEntities
  };
}

export function getTranche4PreviewModel() {
  const manifest = getTranche4CandidateManifest();
  const catalog = getTranche4CandidateViewCatalog();
  const observations = getTranche4CandidateObservations().map((observation) => ({
    ...observation,
    displayName: canonicalDisplayName(observation.entityKey, observation.displayName)
  }));
  const annual = normalizeChartArtifact(artifactJson<ChartArtifact>("latest-annual-company-comparison.json"));
  const interim = normalizeChartArtifact(artifactJson<ChartArtifact>("latest-interim-observations.json"));
  const histories = normalizeChartArtifact(artifactJson<ChartArtifact>("recent-annual-company-histories.json"));
  const capexIntensity = normalizeChartArtifact(artifactJson<ChartArtifact>("company-wide-capex-intensity.json"));
  const coverage = normalizeChartArtifact(artifactJson<ChartArtifact>("ecosystem-coverage-map.json"));
  const readiness = normalizeChartArtifact(artifactJson<ChartArtifact>("coverage-freshness-readiness-matrix.json"));
  const trustEvidence = normalizeChartArtifact(artifactJson<ChartArtifact>("trust-evidence-matrix.json"));
  const releaseChange = normalizeChartArtifact(artifactJson<ChartArtifact>("release-change-view.json"));
  const rdIntensity = buildRdIntensity(annual.chartReadyValues);
  const scaleVsInvestment = buildScaleVsInvestment(annual.chartReadyValues);
  const spotlights = buildSpotlights(annual, capexIntensity, rdIntensity, releaseChange);
  const unavailable = catalog.views.filter((view) => view.eligibilityState === "unavailable");
  const entities = [...new Map(observations.map((observation) => [observation.entityKey, observation])).values()]
    .map((observation) => ({
      entityKey: observation.entityKey,
      displayName: canonicalDisplayName(observation.entityKey, observation.displayName ?? label(observation.entityKey.split(":").at(-1) ?? observation.entityKey))
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  const trustCounts = {
    systemValidated: manifest.trustStateCounts.system_validated ?? 0,
    humanVerified: manifest.trustStateCounts.human_verified ?? 0,
    sourceAttributed: manifest.trustStateCounts.source_attributed_unverified ?? 0
  };
  return {
    manifest,
    catalog,
    observations,
    entities,
    annual,
    interim,
    histories,
    capexIntensity,
    rdIntensity,
    scaleVsInvestment,
    coverage,
    readiness,
    trustEvidence,
    releaseChange,
    spotlights,
    trustCounts,
    unavailable,
    indexHash: tranche4CandidateIndexHash()
  };
}

export type Tranche4PreviewModel = ReturnType<typeof getTranche4PreviewModel>;
