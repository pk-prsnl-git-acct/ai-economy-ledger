import assert from "node:assert/strict";
import test from "node:test";
import { analyzeCircularity } from "../src/server/modules/circularity/analysis.mjs";
import { evaluateScenario } from "../src/server/modules/scenario-engine/evaluate.mjs";

const observation = (id, value) => ({ id, normalizedValue: value, reviewState: "approved", isSample: false });
const relationship = (id, from, to, observationId, flags = {}) => ({
  id, fromCompanyId: from, toCompanyId: to, observationId,
  reviewState: "approved", isSample: false, ...flags,
});

test("circularity keeps gross visible and adjusts each linked observation once", () => {
  const result = analyzeCircularity(
    [observation("o1", "100"), observation("o2", "40")],
    [
      relationship("r1", "a", "b", "o2", { isCircular: true }),
      relationship("r2", "b", "a", "o2", { isRelatedParty: true }),
    ],
  );
  assert.equal(result.totals.grossFlow.decimal, "140");
  assert.equal(result.totals.circularityAdjustment.decimal, "40");
  assert.equal(result.totals.adjustedExternalFlow.decimal, "100");
  assert.equal(result.totals.circularityRatio, "0.28571428");
  assert.deepEqual(result.loops, [["a", "b", "a"]]);
  assert.deepEqual(result.adjustedObservations, [{ observationId: "o2", reasons: ["circular", "related_party"] }]);
});

test("unapproved and sample edges cannot alter adjusted totals", () => {
  const result = analyzeCircularity(
    [observation("o1", "10")],
    [
      { ...relationship("r1", "a", "b", "o1", { isCircular: true }), reviewState: "pending" },
      { ...relationship("r2", "b", "a", "o1", { isCircular: true }), isSample: true },
    ],
  );
  assert.equal(result.totals.grossFlow.decimal, "10");
  assert.equal(result.totals.adjustedExternalFlow.decimal, "10");
  assert.equal(result.totals.circularityRatio, "0");
});

test("zero gross flow has an explicit null circularity ratio", () => {
  assert.equal(analyzeCircularity([], []).totals.circularityRatio, null);
});

test("scenario evaluation is deterministic and preserves its baseline", () => {
  const observations = [observation("o1", "100"), observation("o2", "20")];
  const edges = [relationship("r1", "a", "b", "o2", { isVendorFinanced: true })];
  const assumptions = [
    { key: "growth", operator: "multiply", value: "1.1" },
    { key: "remove-o2", operator: "exclude", value: "0", targetObservationId: "o2" },
  ];
  const result = evaluateScenario(observations, edges, assumptions, { scenarioKey: "downside" });
  assert.equal(result.baseline.totals.grossFlow.decimal, "120");
  assert.equal(result.baseline.totals.adjustedExternalFlow.decimal, "100");
  assert.equal(result.scenario.totals.grossFlow.decimal, "110");
  assert.equal(result.delta.adjustedExternalFlow, "10");
  assert.deepEqual(result.assumptions.map((item) => item.key), ["growth", "remove-o2"]);
});

test("scenario assumptions reject duplicates, unsupported operators, and broad excludes", () => {
  assert.throws(() => evaluateScenario([], [], [{ key: "x", operator: "divide", value: "2" }]), /Unsupported/);
  assert.throws(() => evaluateScenario([], [], [{ key: "x", operator: "exclude", value: "0" }]), /target/);
  assert.throws(() => evaluateScenario([], [], [
    { key: "x", operator: "add", value: "1" },
    { key: "x", operator: "add", value: "2" },
  ]), /unique/);
});
