"use client";

import Link from "next/link";
import type { Route } from "next";
import { useState } from "react";

import type { PublicRecord } from "@/src/server/data-releases/runtime";
import { formatExactFinancialValue, formatFinancialValue } from "@/src/ui/format-financial-value";
import { aiStackLayers, stackLayerName, stackRoleFor } from "@/src/ui/ai-stack";

function periodLabel(record: PublicRecord) {
  return record.period.replace("period:", "").toUpperCase();
}

function reviewState(record: PublicRecord) {
  return record.trustState === "human_verified" ? "Human verified" : record.trustState === "system_validated" ? "System validated" : "Source-attributed";
}

function recordFor(records: PublicRecord[], metricFamily: string) {
  return records.find((record) => record.metric.metricFamily === metricFamily) ?? null;
}

export function CompanyDirectory({ records }: { records: PublicRecord[] }) {
  const companies = [...new Map(records.map((record) => [record.entity.entityKey, record.entity])).values()];
  return <section className="company-directory" aria-label="Companies in the current release">{aiStackLayers.map((layer) => {
    const layerCompanies = companies.filter((company) => stackRoleFor(company.entityKey)?.primary === layer.key);
    return <section className="company-layer-group" key={layer.key}><div className="company-layer-heading"><p className="panel-label">Primary AI-stack layer</p><h2>{layer.name}</h2><p>{layerCompanies.length ? `${layerCompanies.length} ${layerCompanies.length === 1 ? "company" : "companies"} in the current release.` : "No production companies in this primary layer."}</p></div><div className="company-card-grid">{layerCompanies.map((company) => {
      const companyRecords = records.filter((record) => record.entity.entityKey === company.entityKey);
      const role = stackRoleFor(company.entityKey);
      const revenue = recordFor(companyRecords, "revenue");
      const capex = recordFor(companyRecords, "capital_expenditure");
      return <article className="company-card" key={company.entityKey}>
        <div className="company-card-heading"><span className="company-mark" aria-hidden="true">{company.displayName.slice(0, 1)}</span><div><h2>{company.displayName}</h2><p>{role ? stackLayerName(role.primary) : "Not classified"}</p></div></div>
        {role?.secondary.length ? <p className="secondary-roles">Also active in: {role.secondary.map(stackLayerName).join(" · ")}</p> : <p className="secondary-roles">No secondary role in this release taxonomy.</p>}
        <dl><div><dt>Observations</dt><dd>{companyRecords.length}</dd></div><div><dt>Revenue</dt><dd>{revenue ? <span aria-label={formatExactFinancialValue(revenue.value)}>{formatFinancialValue(revenue.value)}</span> : "Unavailable"}</dd></div><div><dt>Capital expenditure</dt><dd>{capex ? <span aria-label={formatExactFinancialValue(capex.value)}>{formatFinancialValue(capex.value)}</span> : "Unavailable"}</dd></div><div><dt>Current period</dt><dd>{companyRecords.length ? periodLabel(companyRecords[0]) : "Unavailable"}</dd></div></dl>
        <p className="company-review">{[...new Set(companyRecords.map(reviewState))].join(" · ")}</p>
        <Link className="source-link" href={`/companies/${encodeURIComponent(company.entityKey)}` as Route}>Company details <span aria-hidden="true">→</span></Link>
      </article>;
    })}</div></section>;
  })}</section>;
}

export function CompanyDetail({ entityKey, records, releaseId }: { entityKey: string; records: PublicRecord[]; releaseId: string }) {
  const companyRecords = records.filter((record) => record.entity.entityKey === entityKey);
  const company = companyRecords[0]?.entity;
  const role = stackRoleFor(entityKey);
  if (!company) return <section className="panel unavailable-view"><p className="panel-label">Unavailable</p><h1>Company not in the current release</h1><p>This route does not substitute a fixture or a historical private record.</p></section>;
  return <><section className="company-detail-hero"><p className="eyebrow">Company in current release</p><h1>{company.displayName}</h1><p>{role ? `Primary role: ${stackLayerName(role.primary)}.` : "No AI-stack role is available for this company."} {role?.secondary.length ? `Secondary roles: ${role.secondary.map(stackLayerName).join(", ")}.` : ""}</p><small>Published release: {releaseId}</small></section>
    <section className="panel production-observations"><div className="panel-heading"><div><p className="panel-label">Release observations</p><h2>Source-linked financial observations</h2></div><span className="availability-state state-limited">limited coverage</span></div><p className="analytics-explainer">This is not a complete financial statement. It shows only the current public release membership, with each value’s period, source and review state.</p><RecordList records={companyRecords} /></section>
    <section className="company-limitation"><h2>Coverage limitation</h2><p>The company can appear in more than one product layer, but its company-wide revenue or capital expenditure is not assigned to a specific layer without released evidence supporting that allocation.</p></section></>;
}

function RecordList({ records }: { records: PublicRecord[] }) {
  return <><div className="table-scroll"><table><thead><tr><th>Observation</th><th>Value</th><th>Period</th><th>Official source</th><th>Review state</th></tr></thead><tbody>{records.map((record) => <tr key={record.stableRecordId}><td>{record.metric.displayLabel}</td><td><strong aria-label={formatExactFinancialValue(record.value)}>{formatFinancialValue(record.value)}</strong><br /><small>{record.unit}</small></td><td>{periodLabel(record)}</td><td><a className="source-link" href={record.sources[0]?.url} rel="noreferrer">{record.sources[0]?.sourceName ?? "Official source"}</a></td><td>{reviewState(record)}<br /><small>{record.disclosure.label}</small></td></tr>)}</tbody></table></div><div className="observation-card-list">{records.map((record) => <article className="observation-card" key={record.stableRecordId}><div><strong>{record.metric.displayLabel}</strong><span>{periodLabel(record)}</span></div><dl><div><dt>Value</dt><dd aria-label={formatExactFinancialValue(record.value)}>{formatFinancialValue(record.value)} <small>{record.unit}</small></dd></div><div><dt>Review state</dt><dd>{reviewState(record)}</dd></div></dl><a className="source-link" href={record.sources[0]?.url} rel="noreferrer">{record.sources[0]?.sourceName ?? "Official source"}</a></article>)}</div></>;
}

export function ObservationLedger({ records, releaseId }: { records: PublicRecord[]; releaseId: string }) {
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("all");
  const [layer, setLayer] = useState("all");
  const [metric, setMetric] = useState("all");
  const [period, setPeriod] = useState("all");
  const [trust, setTrust] = useState("all");
  const visible = records.filter((record) => {
    const primaryLayer = stackRoleFor(record.entity.entityKey)?.primary ?? "unclassified";
    return (company === "all" || record.entity.entityKey === company)
      && (layer === "all" || primaryLayer === layer)
      && (metric === "all" || record.metric.metricFamily === metric)
      && (period === "all" || periodLabel(record) === period)
      && (trust === "all" || reviewState(record) === trust)
      && `${record.entity.displayName} ${record.metric.displayLabel}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const companies = [...new Map(records.map((record) => [record.entity.entityKey, record.entity.displayName])).entries()];
  const layers = [...new Set(records.map((record) => stackRoleFor(record.entity.entityKey)?.primary).filter(Boolean))] as string[];
  const metrics = [...new Set(records.map((record) => record.metric.metricFamily))];
  const periods = [...new Set(records.map(periodLabel))];
  const trusts = [...new Set(records.map(reviewState))];
  return <section className="panel observation-ledger" aria-labelledby="observation-ledger-heading"><div className="panel-heading"><div><p className="panel-label">Observation ledger</p><h2 id="observation-ledger-heading">Current release observations</h2></div><span className="availability-state state-limited">{visible.length} shown</span></div><p className="analytics-explainer">Search and filter the published release. Values are not aggregated across companies or layers, and technical lineage stays in the data release.</p>
    <form className="observation-filters" onSubmit={(event) => event.preventDefault()}><label>Search<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Company or metric" /></label><Filter label="Company" value={company} onChange={setCompany} options={companies.map(([value, label]) => [value, label])} /><Filter label="Primary layer" value={layer} onChange={setLayer} options={layers.map((value) => [value, stackLayerName(value as Parameters<typeof stackLayerName>[0])])} /><Filter label="Metric" value={metric} onChange={setMetric} options={metrics.map((value) => [value, value.replaceAll("_", " ")])} /><Filter label="Fiscal period" value={period} onChange={setPeriod} options={periods.map((value) => [value, value])} /><Filter label="Review state" value={trust} onChange={setTrust} options={trusts.map((value) => [value, value])} /></form>
    {visible.length ? <RecordList records={visible} /> : <p className="empty-observation-state">No published observations match these filters. Missing coverage is not represented as zero.</p>}
    <p className="observation-release-note">Published release: {releaseId}</p>
  </section>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: Array<[string, string]> }) {
  return <label>{label}<select value={value} onChange={(event) => onChange(event.target.value)}><option value="all">All</option>{options.map(([optionValue, optionLabel]) => <option value={optionValue} key={optionValue}>{optionLabel}</option>)}</select></label>;
}
