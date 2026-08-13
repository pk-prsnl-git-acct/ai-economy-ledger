import type { Tranche4PreviewModel } from "@/src/server/tranche4/preview-model";
import { formatExactFinancialValue, formatFinancialValue } from "@/src/ui/format-financial-value";
import { publicMetricLabel } from "@/src/ui/public-labels";

type ChartValue = Tranche4PreviewModel["annual"]["chartReadyValues"][number];

function value(row: ChartValue) {
  const numeric = Number(row.value);
  return Number.isFinite(numeric)
    ? formatFinancialValue(numeric, { currency: row.currency ?? "USD", maximumFractionDigits: 2 })
    : "Unavailable";
}

function exact(row: ChartValue) {
  const numeric = Number(row.value);
  return Number.isFinite(numeric) ? formatExactFinancialValue(numeric, row.currency ?? "USD") : "Unavailable";
}

function periodClass(value: string | null | undefined) {
  if (value === "ytd_interim") return "Year-to-date";
  if (value === "quarter") return "Standalone quarter";
  if (value === "annual") return "Annual";
  return value?.replaceAll("_", " ") ?? "Unavailable";
}

function trust(value: string | null | undefined) {
  return value === "system_validated" ? "System validated" : value?.replaceAll("_", " ") ?? "Unavailable";
}

function ValuesTable({ rows }: { rows: ChartValue[] }) {
  return <div className="table-scroll"><table className="candidate-table"><thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Trust</th></tr></thead><tbody>{rows.map((row) => <tr key={row.observationId ?? `${row.entityKey}:${row.metricKey}:${row.periodEnd}`}><td>{publicMetricLabel(row.metricKey)}</td><td><strong title={exact(row)}>{value(row)}</strong><small>{row.unit}</small></td><td>{periodClass(row.periodClass)}<small>{row.fiscalPeriod} · {row.periodEnd}</small></td><td>{trust(row.trustState)}<small>{row.comparability?.replaceAll("_", " ")}</small></td></tr>)}</tbody></table></div>;
}

export function ProductCompanyEvidence({ annual, interim, interimHistory, histories, observations }: {
  annual: ChartValue[];
  interim: ChartValue[];
  interimHistory: Tranche4PreviewModel["interimHistory"];
  histories: ChartValue[];
  observations: Tranche4PreviewModel["observations"];
}) {
  return <section className="candidate-section"><details className="candidate-disclosure"><summary><span>Data & evidence</span><small>Exact annual, interim, history, source and evidence records</small></summary><div className="candidate-disclosure-body"><h3>Latest annual values</h3><ValuesTable rows={annual} /><h3>Latest interim values</h3><ValuesTable rows={interim} /><h3>Recent annual histories</h3><ValuesTable rows={histories} /><h3>Interim history</h3><p className="candidate-note">Standalone quarters and YTD facts remain distinct. No quarterly Capex is derived from YTD values.</p><ValuesTable rows={interimHistory} /><h3>Evidence references and source links</h3><div className="table-scroll"><table className="candidate-table candidate-wide-table"><thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Official source</th><th>Evidence reference</th><th>Trust</th></tr></thead><tbody>{observations.map((row) => {
    const currency = row.unit === "USD" ? "USD" : undefined;
    return <tr key={row.observationId}><td>{publicMetricLabel(row.metricKey)}</td><td><strong title={formatExactFinancialValue(Number(row.value), currency)}>{formatFinancialValue(Number(row.value), { currency: currency ?? null, maximumFractionDigits: 2 })}</strong><small>{row.unit}</small></td><td>{periodClass(row.periodClass)}<small>{row.fiscalPeriod} · {row.periodEnd}</small></td><td><a className="source-link" href={row.source.lawfulSourceUrl} rel="noreferrer">{row.source.sourceName}</a><small>{row.source.form} · {row.source.accession}</small></td><td><code>{row.evidence.evidenceSetKey}</code></td><td>{trust(row.trustState)}<small>{row.comparability.replaceAll("_", " ")}</small></td></tr>;
  })}</tbody></table></div></div></details></section>;
}
