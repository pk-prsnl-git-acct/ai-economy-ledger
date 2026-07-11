import { createHash } from "node:crypto";

import { calculateLedgerKpis } from "../kpi/calculations.mjs";
import { buildPublicationReadModel } from "./read-model.mjs";

export function generateSnapshot(rows, options) {
  const slug = validateSlug(options?.slug);
  const version = validateVersion(options?.version);
  const generatedAt = new Date(options?.generatedAt);
  if (Number.isNaN(generatedAt.getTime())) throw new Error("generatedAt must be a valid date");

  const methodologyVersion = options?.methodologyVersion ?? "v0.1.0";
  const readModel = buildPublicationReadModel(rows, { generatedAt: generatedAt.toISOString() });
  const kpis = calculateLedgerKpis(
    readModel.observations.map(toKpiObservation),
    { methodologyVersion, currency: options?.currency ?? "USD" },
  );
  const payload = {
    schemaVersion: "1.0.0",
    slug,
    version,
    methodologyVersion,
    generatedAt: generatedAt.toISOString(),
    kpis,
    ...readModel,
  };

  return {
    slug,
    version,
    methodologyVersionId: methodologyVersion,
    payload,
    contentSha256: sha256(payload),
    sourceCount: readModel.evidence.sourceCount,
    observationCount: readModel.evidence.observationCount,
    generatedAt: generatedAt.toISOString(),
    isSample: false,
  };
}

export function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function sha256(value) {
  return createHash("sha256").update(canonicalJson(value)).digest("hex");
}

function toKpiObservation(observation) {
  return {
    id: observation.id,
    normalizedValue: observation.value.type === "monetary" ? observation.value.decimal : null,
    normalizedCurrency: observation.value.type === "monetary" ? observation.value.unit : null,
    cashFlowType: observation.cashFlowType,
    recognitionType: observation.recognitionType,
    confidence: observation.confidence,
    reviewState: "approved",
    isSample: false,
  };
}

function validateSlug(value) {
  const slug = String(value ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid snapshot slug");
  return slug;
}

function validateVersion(value) {
  if (!Number.isSafeInteger(value) || value < 1) throw new Error("Snapshot version must be positive");
  return value;
}
