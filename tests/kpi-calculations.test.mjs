import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateLedgerKpis,
  formatScaledDecimal,
  isCapitalInObservation,
  isObligationObservation,
  isRevenueObservation,
  parseDecimalToScaled,
} from "../src/server/modules/kpi/calculations.mjs";

const baseObservation = {
  review_state: "approved",
  is_sample: "false",
  confidence: "high",
  methodology_version_id: "v0.1.0",
  normalized_currency: "USD",
};

test("decimal parser preserves fixed-scale monetary precision", () => {
  const total = parseDecimalToScaled("0.10") + parseDecimalToScaled("0.20");
  assert.equal(formatScaledDecimal(total), "0.3");
  assert.equal(formatScaledDecimal(parseDecimalToScaled("123.45678901")), "123.45678901");
  assert.throws(() => parseDecimalToScaled("1.123456789"), /Invalid decimal amount/);
});

test("capital and obligations follow cash-flow and recognition rules", () => {
  const debt = {
    ...baseObservation,
    cash_flow_type: "debt",
    recognition_type: "face_value",
    normalized_value: "100",
  };
  const lease = {
    ...baseObservation,
    cash_flow_type: "lease",
    recognition_type: "committed",
    normalized_value: "40",
  };

  assert.equal(isCapitalInObservation(debt), true);
  assert.equal(isObligationObservation(debt), true);
  assert.equal(isCapitalInObservation(lease), false);
  assert.equal(isObligationObservation(lease), true);
});

test("ledger KPIs include approved non-sample observations only", () => {
  const result = calculateLedgerKpis([
    {
      ...baseObservation,
      cash_flow_type: "equity",
      recognition_type: "received",
      normalized_value: "125.50",
    },
    {
      ...baseObservation,
      cash_flow_type: "grant",
      recognition_type: "received",
      normalized_value: "25.25",
      is_sample: "true",
      review_state: "sample",
    },
    {
      ...baseObservation,
      cash_flow_type: "customer_prepayment",
      recognition_type: "received",
      normalized_value: "10",
      review_state: "pending",
    },
  ]);

  assert.equal(result.totals.totalCapitalIn.decimal, "125.5");
  assert.equal(result.diagnostics.includedObservationCount, 1);
  assert.deepEqual(result.diagnostics.excludedObservationCount, {
    sample: 1,
    unapproved: 1,
    nonNumeric: 0,
  });
});

test("gross revenue and net external revenue expose circularity and confidence exclusions", () => {
  const result = calculateLedgerKpis([
    {
      ...baseObservation,
      cash_flow_type: "recognized_revenue",
      recognition_type: "recognized",
      normalized_value: "100",
      confidence: "high",
    },
    {
      ...baseObservation,
      cash_flow_type: "recognized_revenue",
      recognition_type: "recognized",
      normalized_value: "20",
      confidence: "medium",
      is_related_party: "true",
    },
    {
      ...baseObservation,
      cash_flow_type: "run_rate_revenue",
      recognition_type: "run_rate",
      normalized_value: "15",
      confidence: "low",
    },
    {
      ...baseObservation,
      cash_flow_type: "recognized_revenue",
      recognition_type: "recognized",
      normalized_value: "5",
      confidence: "high",
      is_vendor_financed_circular: "true",
    },
  ]);

  assert.equal(result.totals.grossAiEconomicFlow.decimal, "140");
  assert.equal(result.totals.netExternalAiRevenue.decimal, "100");
  assert.equal(result.diagnostics.netRevenueExclusionCount, 3);
  assert.deepEqual(result.diagnostics.confidenceBreakdown, {
    high: 2,
    medium: 1,
    low: 1,
    unscored: 0,
  });
});

test("low-confidence revenue can be retained in net revenue by explicit option", () => {
  const result = calculateLedgerKpis(
    [
      {
        ...baseObservation,
        cash_flow_type: "run_rate_revenue",
        recognition_type: "run_rate",
        normalized_value: "15",
        confidence: "low",
      },
    ],
    { excludeLowConfidenceFromNetRevenue: false },
  );

  assert.equal(isRevenueObservation({ cash_flow_type: "run_rate_revenue", recognition_type: "run_rate" }), true);
  assert.equal(result.totals.grossAiEconomicFlow.decimal, "15");
  assert.equal(result.totals.netExternalAiRevenue.decimal, "15");
});
