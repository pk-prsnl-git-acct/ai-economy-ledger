import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const candidateDirectory = "data/releases/tranche4_set1_candidate";
const analyticsDirectory = "data/analytics/tranche4_set1_candidate";
const compatibilityPath = "data/contracts/tranche4/set1_candidate_public_compatibility.json";
const outputDirectory = "public/release11-presentation";
const releaseInputSetHash = "e0466b671f316b7642db9409f243630c8149f8f064b55dd641b5da9f05aa9686";
const pageSize = 50;

const readJson = (path) => JSON.parse(readFileSync(path, "utf8"));
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const canonicalJson = (value) => `${JSON.stringify(value)}\n`;

const manifest = readJson(join(candidateDirectory, "candidate-manifest.json"));
const observations = readJson(join(candidateDirectory, "candidate-observations.json")).observations;
const compatibility = readJson(compatibilityPath);
const catalog = readJson(join(analyticsDirectory, "view-catalog.json"));
const artifact = (name) => readJson(join(analyticsDirectory, name));

if (manifest.candidateId !== compatibility.candidateId || manifest.manifestHash !== compatibility.candidateManifestHash) {
  throw new Error("Release 11 presentation rejected: Candidate 8 trust root mismatch");
}
if (observations.length !== manifest.counts.observationCount || observations.length !== 1402) {
  throw new Error("Release 11 presentation rejected: observation count mismatch");
}

const displayName = (entityKey, fallback) => compatibility.canonicalDisplayNames[entityKey] ?? fallback ?? entityKey;
const normalizeChart = (value) => ({ ...value, displayName: displayName(value.entityKey, value.displayName) });
const normalizeArtifact = (value) => ({ ...value, chartReadyValues: value.chartReadyValues.map(normalizeChart) });
const normalizedObservations = observations.map((value) => ({ ...value, displayName: displayName(value.entityKey, value.displayName) }));
const numberValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const eligibleAnnual = (value) => value.periodClass === "annual"
  && ["directly_comparable", "company_wide_structured_sec_fact"].includes(value.comparability)
  && value.financialScope === "company_wide_consolidated"
  && numberValue(value.value) !== null;

function latestAnnualByEntity(values) {
  const latest = new Map();
  for (const value of values.filter(eligibleAnnual)) {
    const key = value.entityKey ?? "entity";
    const current = latest.get(key);
    if (!current || Number(value.fiscalYear ?? 0) > Number(current.fiscalYear ?? 0)
      || (value.fiscalYear === current.fiscalYear && `${value.periodEnd ?? ""}` > `${current.periodEnd ?? ""}`)) {
      latest.set(key, value);
    }
  }
  return [...latest.values()].sort((left, right) => (numberValue(right.value) ?? 0) - (numberValue(left.value) ?? 0));
}

function byEntityYearMetric(values) {
  const grouped = new Map();
  for (const value of values.filter(eligibleAnnual)) {
    const key = `${value.entityKey ?? "entity"}:${value.fiscalYear ?? "year"}`;
    grouped.set(key, { ...(grouped.get(key) ?? {}), [value.metricKey ?? "metric"]: value });
  }
  return grouped;
}

function ratioArtifact(annual) {
  const chartReadyValues = [];
  for (const metrics of byEntityYearMetric(annual.chartReadyValues).values()) {
    const revenue = metrics.revenue;
    const rd = metrics.research_and_development;
    const revenueValue = numberValue(revenue?.value);
    const rdValue = numberValue(rd?.value);
    if (!revenue || !rd || revenueValue === null || rdValue === null || revenueValue === 0) continue;
    chartReadyValues.push({
      displayName: revenue.displayName, entityKey: revenue.entityKey, metricKey: "company_wide_rd_intensity",
      observationId: rd.observationId, value: (rdValue / revenueValue).toFixed(6), unit: "ratio", currency: null,
      fiscalYear: revenue.fiscalYear, fiscalPeriod: revenue.fiscalPeriod, periodClass: "annual", periodEnd: revenue.periodEnd,
      trustState: "system_validated", comparability: "directly_comparable", financialScope: "company_wide_consolidated",
      evidenceSetKey: `${revenue.evidenceSetKey ?? revenue.observationId}|${rd.evidenceSetKey ?? rd.observationId}`,
      sourceCount: Math.max(revenue.sourceCount ?? 0, rd.sourceCount ?? 0)
    });
  }
  return {
    analyticalQuestion: "How much company-wide R&D is reported relative to company-wide revenue for the same annual fiscal year?",
    chartReadyValues: latestAnnualByEntity(chartReadyValues), candidateId: manifest.candidateId, taxonomyVersion: manifest.taxonomyVersion
  };
}

function investmentArtifact(annual) {
  const chartReadyValues = [];
  for (const metrics of byEntityYearMetric(annual.chartReadyValues).values()) {
    const revenue = metrics.revenue;
    const capex = metrics.capital_expenditure;
    const rd = metrics.research_and_development;
    const revenueValue = numberValue(revenue?.value);
    const capexValue = numberValue(capex?.value);
    const rdValue = numberValue(rd?.value);
    if (!revenue || !capex || !rd || revenueValue === null || capexValue === null || rdValue === null) continue;
    chartReadyValues.push({
      displayName: revenue.displayName, entityKey: revenue.entityKey, metricKey: "scale_vs_investment",
      observationId: revenue.observationId, value: String(capexValue + rdValue), unit: "USD", currency: "USD",
      fiscalYear: revenue.fiscalYear, fiscalPeriod: revenue.fiscalPeriod, periodClass: "annual", periodEnd: revenue.periodEnd,
      trustState: "system_validated", comparability: "directly_comparable", financialScope: "company_wide_consolidated",
      evidenceSetKey: `${revenue.evidenceSetKey ?? revenue.observationId}|${capex.evidenceSetKey ?? capex.observationId}|${rd.evidenceSetKey ?? rd.observationId}`,
      sourceCount: Math.max(revenue.sourceCount ?? 0, capex.sourceCount ?? 0, rd.sourceCount ?? 0)
    });
  }
  return {
    analyticalQuestion: "Which companies show the largest company-wide Capex plus R&D investment against annual scale?",
    chartReadyValues: latestAnnualByEntity(chartReadyValues), candidateId: manifest.candidateId, taxonomyVersion: manifest.taxonomyVersion
  };
}

const annual = normalizeArtifact(artifact("latest-annual-company-comparison.json"));
const interim = normalizeArtifact(artifact("latest-interim-observations.json"));
const histories = normalizeArtifact(artifact("recent-annual-company-histories.json"));
const capexIntensityHistory = normalizeArtifact(artifact("company-wide-capex-intensity.json"));
const capexIntensity = { ...capexIntensityHistory, chartReadyValues: latestAnnualByEntity(capexIntensityHistory.chartReadyValues) };
const coverage = normalizeArtifact(artifact("ecosystem-coverage-map.json"));
const readiness = normalizeArtifact(artifact("coverage-freshness-readiness-matrix.json"));
const trustEvidence = normalizeArtifact(artifact("trust-evidence-matrix.json"));
const releaseChange = normalizeArtifact(artifact("release-change-view.json"));
const rdIntensity = ratioArtifact(annual);
const scaleVsInvestment = investmentArtifact(annual);
const currentAnnual = Object.fromEntries(["revenue", "capital_expenditure", "research_and_development"]
  .map((metricKey) => [metricKey, latestAnnualByEntity(annual.chartReadyValues.filter((value) => value.metricKey === metricKey))]));
const entities = [...new Map(normalizedObservations.map((value) => [value.entityKey, value])).values()]
  .map((value) => ({ entityKey: value.entityKey, displayName: displayName(value.entityKey, value.displayName) }))
  .sort((left, right) => left.displayName.localeCompare(right.displayName));
const spotlights = {
  latestRevenue: [...annual.chartReadyValues].filter((value) => value.metricKey === "revenue").sort((a, b) => (numberValue(b.value) ?? 0) - (numberValue(a.value) ?? 0))[0],
  highestCapexIntensity: capexIntensity.chartReadyValues[0],
  highestRdIntensity: rdIntensity.chartReadyValues[0],
  newEntities: releaseChange.chartReadyValues.filter((value) => value.metricKey === "new_entity").map((value) => displayName(value.entityKey, value.displayName)).sort()
};
const trustCounts = {
  systemValidated: manifest.trustStateCounts.system_validated ?? 0,
  humanVerified: manifest.trustStateCounts.human_verified ?? 0,
  sourceAttributed: manifest.trustStateCounts.source_attributed_unverified ?? 0
};
const unavailable = catalog.views.filter((view) => view.eligibilityState === "unavailable");
const binding = {
  releaseInputSetHash,
  candidateId: manifest.candidateId,
  candidateManifestHash: manifest.manifestHash,
  observationCount: observations.length
};

const summaryModel = {
  manifest, catalog, entities, annual, currentAnnual, interim,
  histories: { ...histories, chartReadyValues: [] },
  interimHistory: [], observations: [], capexIntensity, rdIntensity, scaleVsInvestment,
  coverage, readiness: { ...readiness, chartReadyValues: [] }, trustEvidence: { ...trustEvidence, chartReadyValues: [] },
  releaseChange, spotlights, trustCounts, unavailable,
  indexHash: sha256(JSON.stringify({ candidateManifestHash: manifest.manifestHash, views: catalog.views }))
};

function writeArtifact(path, payload) {
  const body = canonicalJson({ binding, payload });
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, body);
  return { path: path.slice(outputDirectory.length + 1), byteLength: Buffer.byteLength(body), sha256: sha256(body) };
}

rmSync(outputDirectory, { recursive: true, force: true });
const descriptors = [];
descriptors.push(writeArtifact(join(outputDirectory, "summary.json"), summaryModel));
descriptors.push(writeArtifact(join(outputDirectory, "trends.json"), {
  histories,
  interimHistory: normalizedObservations.filter((value) => value.periodClass !== "annual")
}));

for (const entity of entities) {
  const entityKey = entity.entityKey;
  descriptors.push(writeArtifact(join(outputDirectory, "companies", `${encodeURIComponent(entityKey)}.json`), {
    observations: normalizedObservations.filter((value) => value.entityKey === entityKey),
    interimHistory: normalizedObservations.filter((value) => value.entityKey === entityKey && value.periodClass !== "annual"),
    histories: { ...histories, chartReadyValues: histories.chartReadyValues.filter((value) => value.entityKey === entityKey) }
  }));
}

const observationPages = [];
for (let index = 0; index < normalizedObservations.length; index += pageSize) {
  const page = Math.floor(index / pageSize) + 1;
  const rows = normalizedObservations.slice(index, index + pageSize);
  const descriptor = writeArtifact(join(outputDirectory, "observations", `page-${String(page).padStart(2, "0")}.json`), rows);
  descriptors.push(descriptor);
  observationPages.push({ page, path: descriptor.path, start: index, end: index + rows.length });
}
descriptors.push(writeArtifact(join(outputDirectory, "observations", "search-index.json"), normalizedObservations.map((value, index) => ({
  index,
  search: `${value.displayName} ${value.metricKey.replaceAll("_", " ")} ${value.fiscalPeriod} ${value.periodClass}`.toLowerCase()
}))));

const indexBody = canonicalJson({
  binding,
  pageSize,
  pages: observationPages,
  artifacts: descriptors,
  generatedFrom: {
    candidateManifest: "data/releases/tranche4_set1_candidate/candidate-manifest.json",
    observations: "data/releases/tranche4_set1_candidate/candidate-observations.json",
    analytics: "data/analytics/tranche4_set1_candidate"
  }
});
writeFileSync(join(outputDirectory, "index.json"), indexBody);
console.log(`Generated ${descriptors.length + 1} Release 11 presentation assets for ${observations.length} immutable observations.`);
