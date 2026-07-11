const SCALE = 100000000n;

const CAPITAL_IN_CASH_FLOWS = new Set([
  "equity",
  "debt",
  "grant",
  "project_finance",
  "cloud_credit",
  "customer_prepayment",
]);

const CAPITAL_IN_RECOGNITION = new Set([
  "announced",
  "committed",
  "received",
  "cash_equivalent",
  "face_value",
]);

const OBLIGATION_CASH_FLOWS = new Set([
  "debt",
  "lease",
  "capex",
  "power_obligation",
  "vendor_financing",
  "cloud_credit",
]);

const OBLIGATION_RECOGNITION = new Set(["announced", "committed", "face_value"]);
const REVENUE_CASH_FLOWS = new Set(["recognized_revenue", "run_rate_revenue"]);
const REVENUE_RECOGNITION = new Set(["recognized", "run_rate", "estimated"]);
const NET_REVENUE_EXCLUDED_CONFIDENCE = new Set(["low", "unscored"]);

const ZERO_AMOUNT = {
  decimal: "0",
  units: "USD",
};

export function calculateLedgerKpis(observations, options = {}) {
  const normalized = observations.map(normalizeObservation);
  const excluded = {
    sample: 0,
    unapproved: 0,
    nonNumeric: 0,
  };

  const included = [];
  for (const observation of normalized) {
    if (observation.isSample) {
      excluded.sample += 1;
      continue;
    }
    if (observation.reviewState !== "approved") {
      excluded.unapproved += 1;
      continue;
    }
    if (observation.amount === null) {
      excluded.nonNumeric += 1;
      continue;
    }
    included.push(observation);
  }

  const totalCapitalIn = sumMatching(included, isCapitalInObservation);
  const totalObligations = sumMatching(included, isObligationObservation);
  const grossRevenueObservations = included.filter(isRevenueObservation);
  const grossAiEconomicFlow = sumAmounts(grossRevenueObservations);
  const revenueExclusions = grossRevenueObservations.filter((observation) =>
    shouldExcludeFromNetRevenue(observation, options),
  );
  const netExternalAiRevenue = subtractAmounts(grossAiEconomicFlow, sumAmounts(revenueExclusions));

  return {
    methodologyVersion: options.methodologyVersion ?? "v0.1.0",
    currency: options.currency ?? "USD",
    totals: {
      totalCapitalIn: formatAmount(totalCapitalIn, options.currency),
      totalObligations: formatAmount(totalObligations, options.currency),
      grossAiEconomicFlow: formatAmount(grossAiEconomicFlow, options.currency),
      netExternalAiRevenue: formatAmount(netExternalAiRevenue, options.currency),
    },
    diagnostics: {
      inputObservationCount: observations.length,
      includedObservationCount: included.length,
      excludedObservationCount: excluded,
      confidenceBreakdown: confidenceBreakdown(included),
      netRevenueExclusionCount: revenueExclusions.length,
    },
  };
}

export function isCapitalInObservation(observation) {
  const normalized = normalizeObservation(observation);
  return (
    CAPITAL_IN_CASH_FLOWS.has(normalized.cashFlowType) &&
    CAPITAL_IN_RECOGNITION.has(normalized.recognitionType)
  );
}

export function isObligationObservation(observation) {
  const normalized = normalizeObservation(observation);
  return (
    OBLIGATION_CASH_FLOWS.has(normalized.cashFlowType) &&
    OBLIGATION_RECOGNITION.has(normalized.recognitionType)
  );
}

export function isRevenueObservation(observation) {
  const normalized = normalizeObservation(observation);
  return (
    REVENUE_CASH_FLOWS.has(normalized.cashFlowType) ||
    REVENUE_RECOGNITION.has(normalized.recognitionType)
  );
}

export function shouldExcludeFromNetRevenue(observation, options = {}) {
  const normalized = normalizeObservation(observation);
  const excludeLowConfidence = options.excludeLowConfidenceFromNetRevenue ?? true;

  return Boolean(
    normalized.isRelatedParty ||
      normalized.isInternalTransfer ||
      normalized.isVendorFinancedCircular ||
      normalized.excludeFromNetRevenue ||
      normalized.isLowConfidenceExcluded ||
      (excludeLowConfidence && NET_REVENUE_EXCLUDED_CONFIDENCE.has(normalized.confidence)),
  );
}

export function normalizeObservation(observation) {
  const amountText = firstPresent(
    observation.normalizedValue,
    observation.normalized_value,
    observation.numericValue,
    observation.numeric_value,
  );

  return {
    id: firstPresent(observation.id, observation.observationKey, observation.observation_key) ?? "",
    metricKey: firstPresent(observation.metricKey, observation.metric_key) ?? "",
    amount: amountText === undefined || amountText === "" ? null : parseDecimalToScaled(amountText),
    units: firstPresent(observation.normalizedCurrency, observation.normalized_currency, observation.unit) ?? "USD",
    cashFlowType: firstPresent(observation.cashFlowType, observation.cash_flow_type) ?? "",
    recognitionType: firstPresent(observation.recognitionType, observation.recognition_type) ?? "",
    confidence: firstPresent(observation.confidence, "unscored"),
    reviewState: firstPresent(observation.reviewState, observation.review_state, "pending"),
    methodologyVersionId: firstPresent(
      observation.methodologyVersionId,
      observation.methodology_version_id,
      "v0.1.0",
    ),
    isSample: parseBoolean(firstPresent(observation.isSample, observation.is_sample, false)),
    isRelatedParty: parseBoolean(firstPresent(observation.isRelatedParty, observation.is_related_party, false)),
    isInternalTransfer: parseBoolean(
      firstPresent(observation.isInternalTransfer, observation.is_internal_transfer, false),
    ),
    isVendorFinancedCircular: parseBoolean(
      firstPresent(
        observation.isVendorFinancedCircular,
        observation.is_vendor_financed_circular,
        false,
      ),
    ),
    excludeFromNetRevenue: parseBoolean(
      firstPresent(observation.excludeFromNetRevenue, observation.exclude_from_net_revenue, false),
    ),
    isLowConfidenceExcluded: parseBoolean(
      firstPresent(
        observation.isLowConfidenceExcluded,
        observation.is_low_confidence_excluded,
        false,
      ),
    ),
  };
}

export function parseDecimalToScaled(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      throw new Error("Amount must be finite");
    }
    return parseDecimalToScaled(String(value));
  }

  const text = String(value).trim();
  const match = /^(-?)(\d+)(?:\.(\d{1,8})?)?$/.exec(text);
  if (!match) {
    throw new Error(`Invalid decimal amount: ${text}`);
  }

  const [, sign, whole, fraction = ""] = match;
  const scaled = BigInt(whole) * SCALE + BigInt(fraction.padEnd(8, "0"));
  return sign ? -scaled : scaled;
}

export function formatScaledDecimal(value) {
  const negative = value < 0n;
  const absolute = negative ? -value : value;
  const whole = absolute / SCALE;
  const fraction = absolute % SCALE;
  const fractionText = fraction.toString().padStart(8, "0").replace(/0+$/, "");
  const decimal = fractionText ? `${whole}.${fractionText}` : String(whole);
  return negative ? `-${decimal}` : decimal;
}

function sumMatching(observations, predicate) {
  return sumAmounts(observations.filter(predicate));
}

function sumAmounts(observations) {
  return observations.reduce((total, observation) => total + (observation.amount ?? 0n), 0n);
}

function subtractAmounts(left, right) {
  return left - right;
}

function formatAmount(amount, currency = "USD") {
  if (amount === 0n) {
    return { ...ZERO_AMOUNT, units: currency };
  }
  return {
    decimal: formatScaledDecimal(amount),
    units: currency,
  };
}

function confidenceBreakdown(observations) {
  return observations.reduce(
    (counts, observation) => {
      counts[observation.confidence] = (counts[observation.confidence] ?? 0) + 1;
      return counts;
    },
    { high: 0, medium: 0, low: 0, unscored: 0 },
  );
}

function parseBoolean(value) {
  if (value === true || value === "true") {
    return true;
  }
  if (value === false || value === "false") {
    return false;
  }
  throw new Error(`Boolean value must be true or false: ${value}`);
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null);
}
