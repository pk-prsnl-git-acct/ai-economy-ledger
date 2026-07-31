import "server-only";

import {
  getTranche4CandidateArtifact,
  getTranche4CandidateManifest,
  getTranche4CandidateObservations,
  getTranche4CandidateViewCatalog,
  tranche4CandidateIndexHash
} from "@/src/server/tranche4/candidate-contract";

export const TRANCHE4_PREVIEW_FLAG = "TRANCHE4_CANDIDATE_PREVIEW_ENABLED";

export function tranche4PreviewEnabled() {
  return process.env[TRANCHE4_PREVIEW_FLAG] === "true";
}

export function label(value: string) {
  return value.replaceAll("_", " ").replaceAll("-", " ");
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

export function getTranche4PreviewModel() {
  const manifest = getTranche4CandidateManifest();
  const catalog = getTranche4CandidateViewCatalog();
  const observations = getTranche4CandidateObservations();
  const annual = artifactJson<ChartArtifact>("latest-annual-company-comparison.json");
  const interim = artifactJson<ChartArtifact>("latest-interim-observations.json");
  const histories = artifactJson<ChartArtifact>("recent-annual-company-histories.json");
  const capexIntensity = artifactJson<ChartArtifact>("company-wide-capex-intensity.json");
  const coverage = artifactJson<ChartArtifact>("ecosystem-coverage-map.json");
  const readiness = artifactJson<ChartArtifact>("coverage-freshness-readiness-matrix.json");
  const trustEvidence = artifactJson<ChartArtifact>("trust-evidence-matrix.json");
  const releaseChange = artifactJson<ChartArtifact>("release-change-view.json");
  const unavailable = catalog.views.filter((view) => view.eligibilityState === "unavailable");
  const entities = [...new Map(observations.map((observation) => [observation.entityKey, observation])).values()]
    .map((observation) => ({
      entityKey: observation.entityKey,
      displayName: observation.displayName ?? label(observation.entityKey.split(":").at(-1) ?? observation.entityKey)
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
  return {
    manifest,
    catalog,
    observations,
    entities,
    annual,
    interim,
    histories,
    capexIntensity,
    coverage,
    readiness,
    trustEvidence,
    releaseChange,
    unavailable,
    indexHash: tranche4CandidateIndexHash()
  };
}

export type Tranche4PreviewModel = ReturnType<typeof getTranche4PreviewModel>;
