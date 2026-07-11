const PUBLIC_CONFIDENCE = new Set(["high", "medium", "low", "unscored"]);

export function buildPublicationReadModel(rows, { generatedAt }) {
  const now = parseDate(generatedAt, "generatedAt");
  const included = rows.filter(isPublishableRow).sort(compareRows);
  const sources = new Map();

  const observations = included.map((row) => {
    const source = publicSource(row);
    sources.set(source.documentId, source);

    return {
      id: requiredText(row.observationId, "observationId"),
      company: {
        slug: requiredText(row.companySlug, "companySlug"),
        name: requiredText(row.companyName, "companyName"),
      },
      metricKey: requiredText(row.metricKey, "metricKey"),
      value: publicValue(row),
      period: {
        type: row.periodType ?? "unspecified",
        start: row.periodStart ?? null,
        end: row.periodEnd ?? null,
        asOf: row.asOfDate ?? null,
      },
      recognitionType: requiredText(row.recognitionType, "recognitionType"),
      cashFlowType: row.cashFlowType ?? null,
      confidence: PUBLIC_CONFIDENCE.has(row.confidence) ? row.confidence : "unscored",
      claim: {
        id: requiredText(row.claimId, "claimId"),
        kind: requiredText(row.claimKind, "claimKind"),
        text: requiredText(row.claimText, "claimText"),
      },
      sourceDocumentId: source.documentId,
    };
  });

  const publicSources = [...sources.values()].sort((left, right) =>
    left.documentId.localeCompare(right.documentId),
  );
  const newestAccess = publicSources.reduce((latest, source) => {
    const accessed = parseDate(source.accessedAt, "source accessedAt");
    return accessed > latest ? accessed : latest;
  }, new Date(0));
  const ageDays = publicSources.length
    ? Math.max(0, Math.floor((now.getTime() - newestAccess.getTime()) / 86_400_000))
    : null;

  return {
    observations,
    sources: publicSources,
    evidence: {
      observationCount: observations.length,
      sourceCount: publicSources.length,
      confidence: confidenceCounts(observations),
      freshness: {
        newestSourceAccessedAt: publicSources.length ? newestAccess.toISOString() : null,
        ageDays,
        state: freshnessState(ageDays),
      },
    },
  };
}

export function isPublishableRow(row) {
  return Boolean(
    row &&
      row.observationReviewState === "approved" &&
      row.claimReviewState === "approved" &&
      !asBoolean(row.observationIsSample) &&
      !asBoolean(row.claimIsSample) &&
      !asBoolean(row.companyIsSample) &&
      !asBoolean(row.sourceRegistryIsSample) &&
      !asBoolean(row.sourceDocumentIsSample) &&
      row.supersededByObservationId == null,
  );
}

function publicSource(row) {
  return {
    documentId: requiredText(row.sourceDocumentId, "sourceDocumentId"),
    publisher: requiredText(row.publisher, "publisher"),
    sourceType: requiredText(row.sourceType, "sourceType"),
    title: requiredText(row.sourceTitle, "sourceTitle"),
    url: requiredText(row.sourceUrl, "sourceUrl"),
    publishedAt: row.sourcePublishedAt ?? null,
    accessedAt: requiredText(row.sourceAccessedAt, "sourceAccessedAt"),
    redistributionAllowed: asBoolean(row.redistributionAllowed),
  };
}

function publicValue(row) {
  const values = [row.normalizedValue ?? row.numericValue, row.textValue, row.booleanValue];
  const present = values.filter((value) => value !== null && value !== undefined);
  if (present.length !== 1) throw new Error("A publication observation must contain exactly one value");

  if (row.normalizedValue != null || row.numericValue != null) {
    return {
      type: "monetary",
      decimal: String(row.normalizedValue ?? row.numericValue),
      unit: row.normalizedCurrency ?? row.unit ?? null,
    };
  }
  if (row.textValue != null) return { type: "text", value: String(row.textValue), unit: row.unit ?? null };
  return { type: "boolean", value: asBoolean(row.booleanValue), unit: null };
}

function confidenceCounts(observations) {
  return observations.reduce(
    (counts, observation) => {
      counts[observation.confidence] += 1;
      return counts;
    },
    { high: 0, medium: 0, low: 0, unscored: 0 },
  );
}

function freshnessState(ageDays) {
  if (ageDays === null) return "unknown";
  if (ageDays <= 30) return "current";
  if (ageDays <= 90) return "aging";
  return "stale";
}

function compareRows(left, right) {
  return String(left.observationId).localeCompare(String(right.observationId));
}

function requiredText(value, field) {
  if (value === null || value === undefined || String(value).trim() === "") {
    throw new Error(`Publishable row is missing ${field}`);
  }
  return String(value);
}

function parseDate(value, field) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error(`Invalid ${field}`);
  return parsed;
}

function asBoolean(value) {
  return value === true || value === "true";
}
