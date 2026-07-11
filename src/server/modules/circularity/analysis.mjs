import { formatScaledDecimal, parseDecimalToScaled } from "../kpi/calculations.mjs";

export function analyzeCircularity(observations, relationships, options = {}) {
  const eligibleObservations = new Map(
    observations.filter(isEligible).map((observation) => [String(observation.id), observation]),
  );
  const eligibleRelationships = relationships.filter(isEligible);
  const adjustedObservationIds = new Set();
  const reasonsByObservation = new Map();

  for (const relationship of eligibleRelationships) {
    if (!isAdjustmentRelationship(relationship)) continue;
    const observationId = String(relationship.observationId ?? relationship.observation_id ?? "");
    if (!eligibleObservations.has(observationId)) continue;
    adjustedObservationIds.add(observationId);
    const reasons = reasonsByObservation.get(observationId) ?? new Set();
    if (booleanValue(relationship.isRelatedParty ?? relationship.is_related_party)) reasons.add("related_party");
    if (booleanValue(relationship.isCircular ?? relationship.is_circular)) reasons.add("circular");
    if (booleanValue(relationship.isVendorFinanced ?? relationship.is_vendor_financed)) reasons.add("vendor_financed");
    reasonsByObservation.set(observationId, reasons);
  }

  const gross = sum([...eligibleObservations.values()]);
  const adjustment = sum([...adjustedObservationIds].map((id) => eligibleObservations.get(id)));
  const adjusted = gross - adjustment;
  const loops = findDirectedCycles(eligibleRelationships);

  return {
    currency: options.currency ?? "USD",
    totals: {
      grossFlow: amount(gross, options.currency),
      circularityAdjustment: amount(adjustment, options.currency),
      adjustedExternalFlow: amount(adjusted, options.currency),
      circularityRatio: ratio(adjustment, gross),
    },
    adjustedObservations: [...adjustedObservationIds].sort().map((observationId) => ({
      observationId,
      reasons: [...reasonsByObservation.get(observationId)].sort(),
    })),
    relationshipCount: eligibleRelationships.length,
    loops,
  };
}

function findDirectedCycles(relationships) {
  const graph = new Map();
  for (const edge of relationships) {
    const from = String(edge.fromCompanyId ?? edge.from_company_id ?? "");
    const to = String(edge.toCompanyId ?? edge.to_company_id ?? "");
    if (!from || !to) continue;
    if (!graph.has(from)) graph.set(from, new Set());
    graph.get(from).add(to);
  }
  const nodes = [...new Set([...graph.keys(), ...[...graph.values()].flatMap((set) => [...set])])].sort();
  const loops = [];
  for (const start of nodes) {
    const visit = (node, path, seen) => {
      for (const next of [...(graph.get(node) ?? [])].sort()) {
        if (next === start && path.length > 1) loops.push([...path, start]);
        else if (!seen.has(next) && next >= start) visit(next, [...path, next], new Set([...seen, next]));
      }
    };
    visit(start, [start], new Set([start]));
  }
  return deduplicateLoops(loops);
}

function deduplicateLoops(loops) {
  const unique = new Map();
  for (const loop of loops) {
    const body = loop.slice(0, -1);
    const rotations = body.map((_, index) => [...body.slice(index), ...body.slice(0, index)]);
    const canonical = rotations.map((item) => item.join("|")).sort()[0];
    unique.set(canonical, [...canonical.split("|"), canonical.split("|")[0]]);
  }
  return [...unique.values()].sort((a, b) => a.join("|").localeCompare(b.join("|")));
}

function isEligible(record) {
  return (record.reviewState ?? record.review_state) === "approved" &&
    !booleanValue(record.isSample ?? record.is_sample ?? false);
}

function isAdjustmentRelationship(record) {
  return booleanValue(record.isRelatedParty ?? record.is_related_party ?? false) ||
    booleanValue(record.isCircular ?? record.is_circular ?? false) ||
    booleanValue(record.isVendorFinanced ?? record.is_vendor_financed ?? false);
}

function sum(records) {
  return records.reduce((total, record) => total + parseDecimalToScaled(
    record?.normalizedValue ?? record?.normalized_value ?? record?.amount ?? "0",
  ), 0n);
}

function amount(value, currency = "USD") {
  return { decimal: formatScaledDecimal(value), units: currency ?? "USD" };
}

function ratio(numerator, denominator) {
  if (denominator === 0n) return null;
  return formatScaledDecimal((numerator * 100000000n) / denominator);
}

function booleanValue(value) {
  return value === true || value === "true";
}
