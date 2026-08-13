"use client";

import Link from "next/link";
import { useState } from "react";

import type { ProductCompany } from "@/src/server/product-reset/analytics";

const metricOptions = [["revenue", "Revenue"], ["capital_expenditure", "Capex"], ["research_and_development", "R&D"]] as const;
function compact(value: string | null | undefined) {
  if (value == null) return "Unavailable";
  const numeric = Number(value);
  const absolute = Math.abs(numeric);
  const [divisor, suffix] = absolute >= 1e12 ? [1e12, "T"] : absolute >= 1e9 ? [1e9, "B"] : absolute >= 1e6 ? [1e6, "M"] : absolute >= 1e3 ? [1e3, "K"] : [1, ""];
  const scaled = numeric / divisor;
  const digits = Math.abs(scaled) >= 100 ? 0 : Math.abs(scaled) >= 10 ? 1 : 2;
  const amount = scaled.toFixed(digits).replace(/\.0+$|(?<=\.[0-9])0+$/, "");
  return numeric < 0 ? `-$${Math.abs(Number(amount))}${suffix}` : `$${amount}${suffix}`;
}
function percent(value: number | undefined) { return value == null ? "Unavailable" : `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`; }

export function ProductTrendExplorer({ companies, commonQuarter }: { companies: ProductCompany[]; commonQuarter: string }) {
  const [metric, setMetric] = useState<(typeof metricOptions)[number][0]>("revenue");
  const years = ["2021", "2022", "2023", "2024", "2025"];
  const values = years.map((year) => companies.reduce((sum, company) => sum + Number(company.annualHistory[metric]?.find((entry) => entry.fiscalYear === year)?.value ?? 0), 0));
  const ttmKey = metric === "revenue" ? "ttmRevenue" : metric === "capital_expenditure" ? "ttmCapex" : "ttmResearchAndDevelopment";
  values.push(companies.reduce((sum, company) => sum + Number(company.metrics[ttmKey].value ?? 0), 0));
  const max = Math.max(...values, 1);
  const points = values.map((value, index) => ({ x: 56 + index * 168, y: 292 - (value / max) * 222, value }));
  const label = metricOptions.find(([key]) => key === metric)?.[1];
  return <div className="pr-chart-shell"><div className="pr-chart-toolbar"><div><strong>2021 → {commonQuarter} TTM</strong><span>Company-wide tracked cohort</span></div><div className="pr-tabs" role="group" aria-label="Select trend metric">{metricOptions.map(([key, text]) => <button aria-pressed={metric === key} className={metric === key ? "active" : ""} key={key} onClick={() => setMetric(key)}>{text}</button>)}</div></div><div className="pr-chart-scroll" tabIndex={0} aria-label={`${label} cohort trend chart; horizontally scrollable on narrow screens`}><svg viewBox="0 0 960 350" role="img" aria-label={`${label} annual company-wide totals followed by TTM at the common comparison window`}>{[80, 150, 220, 290].map((y) => <line key={y} x1="48" x2="930" y1={y} y2={y} />)}<polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />{points.map((point, index) => <g key={index}><circle cx={point.x} cy={point.y} r="5" /><text x={point.x} y={point.y - 16}>{compact(String(point.value))}</text><text x={point.x} y="326">{index < years.length ? years[index] : `${commonQuarter} TTM`}</text></g>)}</svg></div><p className="pr-chart-note">{metric === "capital_expenditure" ? "Company-wide Capex, not AI-specific spending. TTM uses the versioned annual-plus-YTD method only where valid." : `Unavailable ${label} values stay outside totals; no zero fill.`}</p></div>;
}

export function ProductCompanyComparison({ companies }: { companies: ProductCompany[] }) {
  const defaults = companies.slice().sort((a, b) => Number(b.metrics.ttmRevenue.value ?? 0) - Number(a.metrics.ttmRevenue.value ?? 0)).slice(0, 4).map((item) => item.entityKey);
  const [selected, setSelected] = useState(defaults);
  const toggle = (key: string) => setSelected((current) => current.includes(key) ? current.filter((item) => item !== key) : current.length < 4 ? [...current, key] : current);
  const active = selected.map((key) => companies.find((item) => item.entityKey === key)).filter(Boolean) as ProductCompany[];
  return <><fieldset className="pr-company-picker"><legend>Select up to four companies</legend>{companies.map((company) => <label key={company.entityKey}><input type="checkbox" checked={selected.includes(company.entityKey)} disabled={!selected.includes(company.entityKey) && selected.length >= 4} onChange={() => toggle(company.entityKey)} />{company.displayName}</label>)}</fieldset><div className="pr-table-scroll" tabIndex={0} aria-label="Selected company comparison; horizontally scrollable on narrow screens"><table className="pr-comparison-table"><thead><tr><th>Metric</th>{active.map((company) => <th key={company.entityKey}>{company.displayName}</th>)}</tr></thead><tbody><tr><th>Primary layer</th>{active.map((company) => <td key={company.entityKey}>{company.primaryLayer.replaceAll("_", " ")}</td>)}</tr><tr><th>TTM Revenue</th>{active.map((company) => <td key={company.entityKey}>{compact(company.metrics.ttmRevenue.value)}</td>)}</tr><tr><th>Revenue growth</th>{active.map((company) => <td key={company.entityKey}>{percent(company.metrics.revenueYoyGrowth.percent)}</td>)}</tr><tr><th>TTM Capex</th>{active.map((company) => <td key={company.entityKey}>{compact(company.metrics.ttmCapex.value)}</td>)}</tr><tr><th>Capex intensity</th>{active.map((company) => <td key={company.entityKey}>{percent(company.metrics.ttmCapexIntensity.percent)}</td>)}</tr><tr><th>TTM R&D</th>{active.map((company) => <td key={company.entityKey}>{compact(company.metrics.ttmResearchAndDevelopment.value)}</td>)}</tr><tr><th>R&D intensity</th>{active.map((company) => <td key={company.entityKey}>{percent(company.metrics.ttmResearchAndDevelopmentIntensity.percent)}</td>)}</tr><tr><th>Profile</th>{active.map((company) => <td key={company.entityKey}><Link href={`/companies/${encodeURIComponent(company.entityKey)}`}>Open →</Link></td>)}</tr></tbody></table></div></>;
}
