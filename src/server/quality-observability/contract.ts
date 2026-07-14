import "server-only";

import { createHash } from "node:crypto";

import compatibility from "@/data/contracts/quality/pr36_public_compatibility.json";
import contract from "@/data/contracts/quality/pr36_observability_contract.json";
import report from "@/data/quality/pr36_release_quality_report.json";
import { listReleases } from "@/src/server/data-releases/contract";

const blocked = /credential|stack|private note|reviewer|prompt|response|storage|filesystem|authorization|cookie/i;

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function hash(value: unknown) {
  return createHash("sha256").update(canonical(value)).digest("hex");
}

function validate() {
  if (contract.contractVersion !== compatibility.privateContractVersion || report.qualityReportVersion !== compatibility.qualityReportVersion) throw new Error("PR36 quality contract mismatch");
  if (hash(contract) !== compatibility.contractSemanticHash) throw new Error("PR36 quality contract hash mismatch");
  if (compatibility.browserPolicyRecomputationAllowed || compatibility.liveTransportEnabled || compatibility.publicationEnabled) throw new Error("PR36 public boundary mismatch");
  const { reportHash, ...semanticReport } = report;
  if (hash(semanticReport) !== reportHash || reportHash !== compatibility.reportSemanticHash) throw new Error("PR36 quality report hash mismatch");
  const release = listReleases().find((item) => item.releaseId === report.releaseId);
  if (!release || release.manifestHash !== report.releaseManifestHash) throw new Error("PR36 release binding mismatch");
  if (report.productionHistoryClaimed || report.publicationEnabled || report.externalAlertDeliveryEnabled) throw new Error("PR36 production claim rejected");
  return true;
}

export type PublicQualitySummary = {
  releaseId: string;
  qualityReportVersion: string;
  overallStatus: string;
  measurableSloCount: number;
  insufficientSampleCount: number;
  unmeasurableCount: number;
  openMaterialOrCriticalIssueCount: number;
  freshnessStatus: string;
  coverageSummary: { expectedCells: number; reconciledCells: number; fixtureOnly: boolean };
  knownLimitations: string[];
  reportHash: string;
};

export function getPublicQualitySummary(): PublicQualitySummary {
  validate();
  const safe = {
    releaseId: report.releaseId,
    qualityReportVersion: report.qualityReportVersion,
    overallStatus: report.overallStatus,
    measurableSloCount: report.measurableSloCount,
    insufficientSampleCount: report.insufficientSampleCount,
    unmeasurableCount: report.unmeasurableCount,
    openMaterialOrCriticalIssueCount: report.materialBreachCount + report.criticalBreachCount,
    freshnessStatus: report.freshnessSummary.status,
    coverageSummary: report.coverageSummary,
    knownLimitations: report.knownLimitations,
    reportHash: report.reportHash
  };
  if (blocked.test(canonical(safe))) throw new Error("PR36 unsafe public quality summary");
  return safe;
}

export function getAdminQualitySummary() {
  validate();
  return {
    ...getPublicQualitySummary(),
    activeSloCount: report.activeSloCount,
    connectorHealth: report.connectorHealthSummary,
    reviewBacklog: report.reviewBacklogSummary,
    drift: report.driftSummary,
    certification: report.certificationSummary,
    releaseIntegrity: report.releaseIntegritySummary,
    recommendedActions: ["Keep production enforcement and publication disabled", "Collect a defensible production window before activating SLOs"]
  };
}
