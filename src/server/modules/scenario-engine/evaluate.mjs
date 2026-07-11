import { formatScaledDecimal, parseDecimalToScaled } from "../kpi/calculations.mjs";
import { analyzeCircularity } from "../circularity/analysis.mjs";

export function evaluateScenario(observations, relationships, assumptions, options = {}) {
  validateAssumptions(assumptions);
  const ordered = [...assumptions].sort((a, b) => String(a.key).localeCompare(String(b.key)));
  const scenarioObservations = observations.map((observation) => applyAssumptions(observation, ordered));
  const baseline = analyzeCircularity(observations, relationships, options);
  const scenario = analyzeCircularity(scenarioObservations.filter(Boolean), relationships, options);

  return {
    scenarioKey: options.scenarioKey ?? "unnamed-scenario",
    methodologyVersion: options.methodologyVersion ?? "v0.1.0",
    baseline,
    scenario,
    delta: {
      grossFlow: decimalDelta(scenario.totals.grossFlow.decimal, baseline.totals.grossFlow.decimal),
      adjustedExternalFlow: decimalDelta(
        scenario.totals.adjustedExternalFlow.decimal,
        baseline.totals.adjustedExternalFlow.decimal,
      ),
    },
    assumptions: ordered.map(({ key, operator, value, targetObservationId = null }) => ({
      key, operator, value: String(value), targetObservationId,
    })),
  };
}

function applyAssumptions(observation, assumptions) {
  let value = parseDecimalToScaled(observation.normalizedValue ?? observation.normalized_value ?? "0");
  for (const assumption of assumptions) {
    if (assumption.targetObservationId && String(assumption.targetObservationId) !== String(observation.id)) continue;
    if (assumption.operator === "exclude") return null;
    const operand = parseDecimalToScaled(assumption.value);
    if (assumption.operator === "add") value += operand;
    if (assumption.operator === "multiply") value = (value * operand) / 100000000n;
  }
  return { ...observation, normalizedValue: formatScaledDecimal(value), normalized_value: undefined };
}

function validateAssumptions(assumptions) {
  const keys = new Set();
  for (const assumption of assumptions) {
    if (!assumption.key || keys.has(assumption.key)) throw new Error("Scenario assumption keys must be unique");
    keys.add(assumption.key);
    if (!["add", "multiply", "exclude"].includes(assumption.operator)) throw new Error("Unsupported scenario operator");
    if (assumption.operator !== "exclude") parseDecimalToScaled(assumption.value);
    if (assumption.operator === "exclude" && !assumption.targetObservationId) {
      throw new Error("Exclude assumptions require a target observation");
    }
  }
}

function decimalDelta(left, right) {
  return formatScaledDecimal(parseDecimalToScaled(left) - parseDecimalToScaled(right));
}
