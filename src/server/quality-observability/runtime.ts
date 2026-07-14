import "server-only";

import { getAdminQualitySummary as embeddedAdminSummary, getPublicQualitySummary as embeddedPublicSummary } from "./contract";
import type { PublicQualitySummary } from "./contract";
import { getProductionReleaseTransport } from "../data-releases/production-transport";

type LiveQualityReport = {
  releaseId: string;
  qualityReportVersion: string;
  overallStatus: string;
  measurableSloCount: number;
  insufficientSampleCount: number;
  unmeasurableCount: number;
  materialBreachCount: number;
  criticalBreachCount: number;
  freshnessSummary: { status: string };
  coverageSummary: { expectedCells: number; reconciledCells: number; fixtureOnly: boolean };
  knownLimitations: string[];
  reportHash: string;
  releaseManifestHash: string;
  activeSloCount: number;
  connectorHealthSummary: { status: string };
  reviewBacklogSummary: { status: string };
  driftSummary: Record<string, string>;
  certificationSummary: { status: string };
  releaseIntegritySummary: { status: string };
};

async function liveReport() {
  const transport = await getProductionReleaseTransport();
  if (!transport) return null;
  const [index, artifact] = await Promise.all([transport.index(), transport.artifact("quality/report.json")]);
  const report = JSON.parse(artifact.bytes.toString("utf8")) as LiveQualityReport;
  if (report.releaseId !== index.releaseId || report.releaseManifestHash !== index.manifestHash || report.reportHash !== index.qualityReportHash || report.criticalBreachCount !== 0 || report.coverageSummary.fixtureOnly) throw new Error("Production quality binding rejected");
  return report;
}

export async function getPublicQualitySummary(): Promise<PublicQualitySummary> {
  const report = await liveReport();
  if (!report) return embeddedPublicSummary();
  return {
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
    reportHash: report.reportHash,
  };
}

export async function getAdminQualitySummary() {
  const report = await liveReport();
  if (!report) return embeddedAdminSummary();
  return {
    ...(await getPublicQualitySummary()),
    activeSloCount: report.activeSloCount,
    connectorHealth: report.connectorHealthSummary,
    reviewBacklog: report.reviewBacklogSummary,
    drift: report.driftSummary,
    certification: report.certificationSummary,
    releaseIntegrity: report.releaseIntegritySummary,
    recommendedActions: ["Keep source-attributed records review-required", "Collect a defensible production window before enabling stronger autonomy"],
  };
}
