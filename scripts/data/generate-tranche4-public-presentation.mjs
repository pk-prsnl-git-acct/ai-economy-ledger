import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const json = (value) => `${JSON.stringify(value)}\n`;
const csv = (rows) => `${rows.map((row) => row.map((value) => `"${String(value ?? "").replaceAll('"', '""')}"`).join(",")).join("\n")}\n`;
const key = (record) => `${record.entityKey}:${record.metricKey}`;
const newest = (records) => [...records].sort((a, b) => `${b.periodEnd}:${b.source.filingDate}`.localeCompare(`${a.periodEnd}:${a.source.filingDate}`))[0];
const chart = (record) => ({ displayName: record.displayName, entityKey: record.entityKey, metricKey: record.metricKey, observationId: record.observationId, value: record.value, unit: record.unit, currency: "USD", fiscalYear: record.fiscalYear, fiscalPeriod: record.fiscalPeriod, periodClass: record.periodClass, periodEnd: record.periodEnd, trustState: record.trustState, comparability: record.comparability, financialScope: record.financialScope, evidenceSetKey: record.evidence.evidenceSetKey, sourceCount: 1 });

export function generateTranche4PublicPresentation({ candidateDirectory = "data/releases/tranche4_set1_candidate", analyticsDirectory = "data/analytics/tranche4_set1_candidate" } = {}) {
  const manifest = JSON.parse(readFileSync(join(candidateDirectory, "candidate-manifest.json"), "utf8"));
  const observations = JSON.parse(readFileSync(join(candidateDirectory, "candidate-observations.json"), "utf8")).observations;
  const annual = observations.filter((record) => record.periodClass === "annual");
  const interim = observations.filter((record) => record.periodClass !== "annual");
  const latestAnnual = Object.values(Object.groupBy(annual, key)).map(newest).map(chart);
  const latestInterim = Object.values(Object.groupBy(interim, key)).map(newest).map(chart);
  const byEntityMetricYear = new Map(annual.map((record) => [`${record.entityKey}:${record.metricKey}:${record.fiscalYear}`, record]));
  const capexIntensity = annual.filter((record) => record.metricKey === "capital_expenditure").flatMap((record) => {
    const revenue = byEntityMetricYear.get(`${record.entityKey}:revenue:${record.fiscalYear}`); if (!revenue || Number(revenue.value) === 0) return [];
    return [{ ...chart(record), metricKey: "company_wide_capex_intensity", value: (Number(record.value) / Number(revenue.value)).toFixed(6), unit: "ratio", currency: null, comparability: "directly_comparable" }];
  });
  const slotStates = JSON.parse(readFileSync(join(candidateDirectory, "coverage-readiness-summary.json"), "utf8")).slotStates;
  const layerRows = [
    ["resources_silicon_physical_assets", "Resources, silicon & physical assets", ["Digital Realty", "Intel"]],
    ["ai_infrastructure", "AI infrastructure", ["AMD", "Amazon", "Broadcom", "Nvidia", "Oracle"]],
    ["ai_platforms", "AI platforms", ["Datadog", "Google", "Meta", "Microsoft", "MongoDB", "Palantir", "Snowflake"]],
    ["ai_applications", "AI applications", ["Adobe", "Salesforce", "ServiceNow"]],
    ["users_economic_outcomes", "Users & economic outcomes", []]
  ].map(([entityKey, displayName, companies]) => ({ entityKey, displayName, value: String(companies.length), unit: "companies", metricKey: "company_count", periodClass: "not_applicable", fiscalYear: null, fiscalPeriod: null, periodEnd: null, trustState: "not_applicable", comparability: "taxonomy_metadata_only", coveredSubLayers: companies.map((company) => company.toLowerCase().replaceAll(" ", "_")), subLayers: companies.map((company) => company.toLowerCase().replaceAll(" ", "_")), uncoveredSubLayers: entityKey === "users_economic_outcomes" ? ["users", "economic_outcomes"] : [] }));
  const base = { candidateId: manifest.candidateId, candidateManifestHash: manifest.manifestHash, taxonomyVersion: manifest.taxonomyVersion, methodologyVersion: manifest.methodologyVersion, publicationEnabled: false, releasePointerChanged: false, release1Changed: false, candidate2Changed: false, set2OrSet3Started: false, generatedAt: "2026-08-12T00:00:00.000Z" };
  const views = {
    "latest-annual-company-comparison": { analyticalQuestion: "What are the latest eligible annual company-wide values?", chartReadyValues: latestAnnual },
    "latest-interim-observations": { analyticalQuestion: "What are the latest reported interim observations by company and metric?", chartReadyValues: latestInterim },
    "recent-annual-company-histories": { analyticalQuestion: "What annual history is available from 2021 onward?", chartReadyValues: annual.map(chart) },
    "company-wide-capex-intensity": { analyticalQuestion: "What is company-wide capex relative to same-year revenue?", chartReadyValues: capexIntensity },
    "ecosystem-coverage-map": { analyticalQuestion: "Which Taxonomy V2 layers and sub-layers are covered by Set 1?", chartReadyValues: layerRows },
    "coverage-freshness-readiness-matrix": { analyticalQuestion: "Which core metric slots are included or withheld?", chartReadyValues: slotStates.map((slot) => ({ entityKey: slot.entityKey, displayName: slot.entityKey.split(":").at(-1), metricKey: slot.metricKey, value: slot.latestAnnualState, unit: "state", periodClass: "annual_slot", fiscalYear: null, fiscalPeriod: null, periodEnd: null, trustState: "not_applicable", comparability: "coverage_state", limitation: slot.limitation })) },
    "trust-evidence-matrix": { analyticalQuestion: "How are records trusted and evidence-bound?", chartReadyValues: observations.map((record) => ({ ...chart(record), metricKey: "trust_evidence", value: record.trustState })) },
    "release-change-view": { analyticalQuestion: "What changed in this forward fix?", chartReadyValues: ["entity:company:meta", "entity:company:digital-realty"].map((entityKey) => ({ entityKey, displayName: entityKey.split(":").at(-1), metricKey: "filing_freshness_corrected", value: "included", unit: "state", periodClass: "not_applicable", fiscalYear: "2026", fiscalPeriod: "Q2", periodEnd: "2026-06-30", trustState: "system_validated", comparability: "filing_specific" })) },
    "company-revision-history": { analyticalQuestion: "Are public revision events available?", chartReadyValues: [], unavailable: "No separately published amendment, restatement, or supersession timeline is available." },
    "evidence-backed-event-timeline": { analyticalQuestion: "Are separate evidence-backed events available?", chartReadyValues: [], unavailable: "This release contains financial observations only." }
  };
  rmSync(analyticsDirectory, { recursive: true, force: true }); mkdirSync(analyticsDirectory, { recursive: true });
  const artifacts = {};
  for (const [viewId, view] of Object.entries(views)) { artifacts[`${viewId}.json`] = json({ ...base, viewId, eligibilityState: view.unavailable ? "unavailable" : "available_with_limitations", withholdingReason: view.unavailable ?? null, downloads: { json: `${viewId}.json`, csv: `${viewId}.csv` }, ...view }); artifacts[`${viewId}.csv`] = csv([["entityKey", "metricKey", "value", "fiscalYear", "fiscalPeriod", "periodClass", "periodEnd"], ...view.chartReadyValues.map((row) => [row.entityKey, row.metricKey, row.value, row.fiscalYear, row.fiscalPeriod, row.periodClass, row.periodEnd])]); }
  artifacts["analytics-data-dictionary.json"] = json({ contractVersion: "tranche-4-release-bound-analytics@1.0.0", fields: { periodClass: "Annual, discrete quarter, and YTD interim values remain distinct.", trustState: "System validation is not human verification." }, ...base });
  const viewCatalog = { ...base, contractVersion: "tranche-4-release-bound-analytics@1.0.0", views: Object.entries(views).map(([viewId, view]) => ({ viewId, eligibilityState: view.unavailable ? "unavailable" : "available_with_limitations", observationCount: view.chartReadyValues.length, withholdingReason: view.unavailable ?? null, downloads: { json: `${viewId}.json`, csv: `${viewId}.csv` } })) };
  artifacts["view-catalog.json"] = json(viewCatalog);
  artifacts["analytics-checksums.json"] = json({ algorithm: "sha256", artifacts: Object.fromEntries(Object.entries(artifacts).map(([name, bytes]) => [name, hash(bytes)]).sort()) });
  const allDescriptors = Object.entries(artifacts).map(([name, bytes]) => ({ name, byteLength: Buffer.byteLength(bytes), sha256: hash(bytes) })).sort((a, b) => a.name.localeCompare(b.name));
  const analyticsManifest = { ...base, buildVersion: "tranche-4-analytical-build@1.0.0", contractVersion: "tranche-4-release-bound-analytics@1.0.0", descriptors: allDescriptors, artifactNames: ["analytics-manifest.json", ...allDescriptors.map((item) => item.name)] };
  analyticsManifest.manifestHash = hash(json(analyticsManifest));
  artifacts["analytics-manifest.json"] = json(analyticsManifest);
  for (const [name, bytes] of Object.entries(artifacts)) writeFileSync(join(analyticsDirectory, name), bytes);
  return analyticsManifest;
}

if (process.argv[1]?.endsWith("generate-tranche4-public-presentation.mjs")) console.log(JSON.stringify(generateTranche4PublicPresentation()));
