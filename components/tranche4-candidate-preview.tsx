import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { label, type Tranche4PreviewModel } from "@/src/server/tranche4/preview-model";
import { formatExactFinancialValue, formatFinancialValue } from "@/src/ui/format-financial-value";
import { publicMetricLabel } from "@/src/ui/public-labels";
import { stackLayerName, stackRoleFor } from "@/src/ui/ai-stack";

type ChartValue = Tranche4PreviewModel["annual"]["chartReadyValues"][number];
type CandidateSurfaceMode = "preview" | "production";

function numeric(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function currencyCode(unit: string | null | undefined, currency: string | null | undefined) {
  if (currency) return currency;
  return unit === "USD" ? "USD" : null;
}

function money(value: string | null | undefined, unit: string | null | undefined, currency?: string | null) {
  const parsed = numeric(value);
  if (parsed === null) return value ?? "Unavailable";
  if (unit === "ratio") return `${(parsed * 100).toFixed(1)}%`;
  return formatFinancialValue(parsed, {
    currency: currencyCode(unit, currency),
    maximumFractionDigits: Math.abs(parsed) >= 1_000_000_000 ? 2 : 1
  });
}

function exactMoney(value: string | null | undefined, unit: string | null | undefined, currency?: string | null) {
  const parsed = numeric(value);
  if (parsed === null) return "Unavailable";
  if (unit === "ratio") return `${(parsed * 100).toFixed(4)}%`;
  return formatExactFinancialValue(parsed, currencyCode(unit, currency) ?? "USD");
}

function humanMetricLabel(metricKey: string | null | undefined) {
  return publicMetricLabel(metricKey);
}

function downloadLinks(view: Tranche4PreviewModel["catalog"]["views"][number], mode: CandidateSurfaceMode = "preview", includeProductionLink = true) {
  const jsonHref = `/tranche-4-candidate-preview/artifacts/${encodeURIComponent(view.downloads.json)}` as Route;
  const csvHref = `/tranche-4-candidate-preview/artifacts/${encodeURIComponent(view.downloads.csv)}` as Route;
  return (
    <div className="candidate-downloads" aria-label={`${label(view.viewId)} downloads`}>
      <span>{view.eligibilityState === "unavailable" ? "Unavailable contract" : "Downloadable contract"}</span>
      {mode === "production"
        ? includeProductionLink ? <Link href={"/observations" as Route}>Open Data Explorer</Link> : <span>Availability recorded above</span>
        : <><Link href={jsonHref}>{view.downloads.json}</Link><Link href={csvHref}>{view.downloads.csv}</Link></>}
    </div>
  );
}

function Table({ values, columns }: { values: ChartValue[]; columns: Array<keyof ChartValue> }) {
  return (
    <div className="table-scroll">
      <table className="candidate-table">
        <thead>
          <tr>{columns.map((column) => <th key={String(column)}>{label(String(column))}</th>)}</tr>
        </thead>
        <tbody>
          {values.map((value, index) => (
            <tr key={`${value.observationId ?? value.entityKey ?? "row"}-${index}`}>
              {columns.map((column) => {
                const cell = value[column];
                if (column === "value") {
                  const formatted = money(value.value, value.unit, value.currency);
                  return <td key={String(column)}><strong aria-label={exactMoney(value.value, value.unit, value.currency)} title={exactMoney(value.value, value.unit, value.currency)}>{formatted}</strong></td>;
                }
                return <td key={String(column)}>{Array.isArray(cell) ? (cell as string[]).map(label).join(", ") : label(String(cell ?? "Unavailable"))}</td>;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CandidatePreviewHome({ model, mode = "preview" }: { model: Tranche4PreviewModel; mode?: CandidateSurfaceMode }) {
  const capex = model.currentAnnual.capital_expenditure.slice(0, 8);
  const rdIntensity = sortValues(model.rdIntensity.chartReadyValues).slice(0, 8);
  const scaleVsInvestment = model.scaleVsInvestment.chartReadyValues.slice(0, 8);
  const annualView = model.catalog.views.find((view) => view.viewId === "latest-annual-company-comparison");
  const historyView = model.catalog.views.find((view) => view.viewId === "recent-annual-company-histories");
  const changeView = model.catalog.views.find((view) => view.viewId === "release-change-view");

  return (
    <>
      <section className="candidate-hero" aria-labelledby="candidate-title">
        <p className="eyebrow">{mode === "production" ? "AI economy intelligence" : "AI economy intelligence preview"}</p>
        <h1 id="candidate-title">Track the public-company money flows behind the AI stack.</h1>
        <p className="lede">This release follows 17 public companies across revenue, company-wide capex, and R&D. The view is evidence-gated, annual and interim periods stay separate, and unavailable metrics stay visible.</p>
        <div className="candidate-facts" aria-label="Candidate summary">
          <span><strong>{model.manifest.counts.entityCount}</strong> companies</span>
          <span><strong>{model.manifest.counts.latestAnnualIncludedCount}</strong> current annual slots</span>
          <span><strong>{model.manifest.counts.withheldMetricCount}</strong> withheld metrics</span>
          <span><strong>{model.trustCounts.systemValidated}</strong> system validated values</span>
        </div>
      </section>

      {mode === "preview" ? <section className="candidate-warning panel">
        <strong>Preview only.</strong>
        <span>These pages use the approved Candidate 7 artifact bytes, but they do not publish, promote, or reinterpret the current live release.</span>
      </section> : null}

      <section className="candidate-grid" aria-label="Coverage summary">
        <PreviewStat label="Coverage" value="17 companies" detail="Set 1 spans the approved Taxonomy v2 public-company cohort." />
        <PreviewStat label="Current data" value="48 included" detail="Revenue, capex, and R&D current annual slots; three remain withheld." />
        <PreviewStat label="Trust state" value="System validated" detail={`${model.trustCounts.systemValidated} values passed system validation. Human verification is a separate, optional review state.`} />
        <PreviewStat label="Downloads" value="Exact values retained" detail="JSON and CSV remain available in Data Explorer and Release details." />
      </section>

      <PreviewSection title="Latest Filing Pulse" question="Newest reported interim periods remain separate from annual comparisons." view={annualView} mode={mode}>
        <LatestFilingPulse model={model} />
      </PreviewSection>

      <PreviewSection title="Company-wide Capex Leaders" question="Latest eligible annual company-wide capex; not AI-specific capex." view={historyView} mode={mode}>
        <BarList values={capex} valueLabel="Latest annual company-wide capex" />
      </PreviewSection>

      <PreviewSection title="R&D Intensity" question="Company-wide R&D divided by company-wide revenue for the same annual fiscal year." view={annualView} mode={mode}>
        <BarList values={rdIntensity} valueLabel="R&D intensity" />
      </PreviewSection>

      <PreviewSection title="Scale vs Capex + R&D" question="Latest eligible annual revenue compared with same-year company-wide capex plus R&D." view={annualView} mode={mode}>
        <InvestmentScatter values={scaleVsInvestment} annualValues={model.annual.chartReadyValues} />
      </PreviewSection>

      <PreviewSection title="AI Stack and release changes" question="Layer coverage is contextual only; no layer-wide financial totals are calculated." view={changeView} mode={mode}>
        <div className="candidate-spotlight-grid">
          <article>
            <span>Newly added companies</span>
            <strong>{model.spotlights.newEntities.length}</strong>
            <p>{model.spotlights.newEntities.join(", ")}</p>
          </article>
          <article>
            <span>Largest latest annual scale</span>
            <strong>{model.spotlights.latestRevenue?.displayName ?? "Unavailable"}</strong>
            <p>{money(model.spotlights.latestRevenue?.value, model.spotlights.latestRevenue?.unit, model.spotlights.latestRevenue?.currency)} · FY{model.spotlights.latestRevenue?.fiscalYear}</p>
          </article>
          <article>
            <span>Highest capex intensity</span>
            <strong>{model.spotlights.highestCapexIntensity?.displayName ?? "Unavailable"}</strong>
            <p>{money(model.spotlights.highestCapexIntensity?.value, "ratio")} · FY{model.spotlights.highestCapexIntensity?.fiscalYear}</p>
          </article>
          <article>
            <span>Highest R&D intensity</span>
            <strong>{model.spotlights.highestRdIntensity?.displayName ?? "Unavailable"}</strong>
            <p>{money(model.spotlights.highestRdIntensity?.value, "ratio")} · FY{model.spotlights.highestRdIntensity?.fiscalYear}</p>
          </article>
        </div>
      </PreviewSection>

      <CandidateDataPathways model={model} mode={mode} />
    </>
  );
}

function PreviewStat({ label: title, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="panel candidate-stat"><span>{title}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function PreviewSection({ title, question, view, children, mode = "preview" }: { title: string; question: string; view?: Tranche4PreviewModel["catalog"]["views"][number]; children: ReactNode; mode?: CandidateSurfaceMode }) {
  return (
    <section className="panel candidate-section">
      <div className="panel-heading">
        <div><p className="panel-label">{question}</p><h2>{title}</h2></div>
        {view ? <span className="availability-state state-limited">{label(view.eligibilityState)}</span> : null}
      </div>
      {view ? downloadLinks(view, mode) : null}
      {children}
    </section>
  );
}

function sortValues(values: ChartValue[]) {
  return [...values].sort((a, b) => (numeric(b.value) ?? 0) - (numeric(a.value) ?? 0));
}

function metricByEntityYear(values: ChartValue[], entityKey: string | undefined, metricKey: string, fiscalYear: string | null | undefined) {
  return values.find((value) => value.entityKey === entityKey && value.metricKey === metricKey && value.fiscalYear === fiscalYear);
}

function BarList({ values, valueLabel }: { values: ChartValue[]; valueLabel: string }) {
  const max = Math.max(...values.map((value) => numeric(value.value) ?? 0), 1);
  return (
    <div className="candidate-bars" role="list" aria-label={valueLabel}>
      {values.map((value) => {
        const width = `${Math.max(((numeric(value.value) ?? 0) / max) * 100, 2)}%`;
        return (
          <article role="listitem" key={value.observationId ?? `${value.entityKey}-${value.metricKey}`}>
            <div><strong>{value.displayName}</strong><span aria-label={exactMoney(value.value, value.unit, value.currency)} title={exactMoney(value.value, value.unit, value.currency)}>{money(value.value, value.unit, value.currency)}</span></div>
            <i style={{ width }} aria-hidden="true" />
            <small>{label(value.periodClass ?? "period")} · {value.fiscalPeriod} · period end {value.periodEnd ?? "n/a"} · {label(value.trustState ?? "unknown trust")}</small>
          </article>
        );
      })}
    </div>
  );
}

function LatestFilingPulse({ model }: { model: Tranche4PreviewModel }) {
  return <div className="candidate-filing-pulse" role="list" aria-label="Latest filing pulse by company">{model.entities.map((entity) => {
    const records = model.interimHistory.filter((value) => value.entityKey === entity.entityKey);
    const latest = [...records].sort((a, b) => `${b.periodEnd}:${b.fiscalPeriod}`.localeCompare(`${a.periodEnd}:${a.fiscalPeriod}`))[0];
    const metrics = latest ? records.filter((value) => value.periodEnd === latest.periodEnd && value.fiscalPeriod === latest.fiscalPeriod) : [];
    return <article role="listitem" key={entity.entityKey}><strong>{entity.displayName}</strong>{latest ? <><span>{latest.fiscalPeriod} · period end {latest.periodEnd}</span><small>{metrics.map((item) => `${humanMetricLabel(item.metricKey)} ${item.periodClass === "ytd_interim" ? "YTD" : "quarter"}`).join("; ")}</small></> : <span>Interim history unavailable</span>}</article>;
  })}</div>;
}

function InvestmentComparison({ values, annualValues }: { values: ChartValue[]; annualValues: ChartValue[] }) {
  return (
    <div className="investment-comparison" role="list" aria-label="Scale versus investment">
      {values.map((value) => {
        const revenue = metricByEntityYear(annualValues, value.entityKey, "revenue", value.fiscalYear);
        return (
          <article role="listitem" key={`${value.entityKey}-${value.fiscalYear}`}>
            <div>
              <strong>{value.displayName}</strong>
              <span>{money(value.value, value.unit, value.currency)} investment</span>
            </div>
            <dl>
              <div><dt>Revenue scale</dt><dd title={exactMoney(revenue?.value, revenue?.unit, revenue?.currency)}>{money(revenue?.value, revenue?.unit, revenue?.currency)}</dd></div>
              <div><dt>Capex + R&D</dt><dd title={exactMoney(value.value, value.unit, value.currency)}>{money(value.value, value.unit, value.currency)}</dd></div>
              <div><dt>Fiscal period</dt><dd>FY{value.fiscalYear} · {value.periodEnd}</dd></div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}

function InvestmentScatter({ values, annualValues }: { values: ChartValue[]; annualValues: ChartValue[] }) {
  const points = values.map((value) => {
    const revenue = metricByEntityYear(annualValues, value.entityKey, "revenue", value.fiscalYear);
    return { value, revenue, x: numeric(revenue?.value) ?? 0, y: numeric(value.value) ?? 0 };
  }).filter((point) => point.x > 0 && point.y > 0);
  const maxX = Math.max(...points.map((point) => point.x), 1);
  const maxY = Math.max(...points.map((point) => point.y), 1);
  return (
    <div className="candidate-scatter" role="img" aria-label="Scale versus company-wide capex plus R&D scatter plot. Chart labels remain horizontally scrollable on narrow screens.">
      <div className="candidate-scatter-chart-scroll">
      <svg viewBox="0 0 760 360" aria-hidden="true">
        <line x1="70" y1="306" x2="718" y2="306" />
        <line x1="70" y1="34" x2="70" y2="306" />
        {points.map((point) => {
          const x = 70 + (point.x / maxX) * 620;
          const y = 306 - (point.y / maxY) * 250;
          return (
            <g key={`${point.value.entityKey}-${point.value.fiscalYear}`}>
              <circle cx={x} cy={y} r="5" />
              <text x={Math.min(x + 9, 690)} y={Math.max(y - 8, 22)}>{point.value.displayName}</text>
            </g>
          );
        })}
      </svg>
      </div>
      <div className="candidate-scatter-legend">
        <span>Horizontal: annual revenue scale</span>
        <span>Vertical: same-year company-wide capex + R&D</span>
      </div>
      <InvestmentComparison values={values.slice(0, 5)} annualValues={annualValues} />
    </div>
  );
}

export function CandidateDirectory({ model, mode = "preview" }: { model: Tranche4PreviewModel; mode?: CandidateSurfaceMode }) {
  return (
    <section className="panel candidate-section" id="companies">
      <div className="panel-heading"><div><p className="panel-label">Company pages</p><h2>Canonical Set 1 company directory</h2></div><span className="availability-state state-limited">{model.entities.length} canonical companies</span></div>
      <div className="candidate-company-grid">
        {model.entities.map((entity) => {
          const latest = model.annual.chartReadyValues.filter((value) => value.entityKey === entity.entityKey);
          const metrics = ["revenue", "capital_expenditure", "research_and_development"].map((metricKey) => latest.find((value) => value.metricKey === metricKey));
          const interim = model.interimHistory.filter((value) => value.entityKey === entity.entityKey);
          const latestPeriod = [...interim].sort((a, b) => `${b.periodEnd}:${b.fiscalPeriod}`.localeCompare(`${a.periodEnd}:${a.fiscalPeriod}`))[0];
          const role = stackRoleFor(entity.entityKey);
          return (
            <article key={entity.entityKey} className="candidate-company-card">
              <h3>{entity.displayName}</h3>
              <p>{role ? stackLayerName(role.primary) : "Taxonomy classification unavailable"}</p>
              <dl>
                {metrics.map((value, index) => <div key={value?.metricKey ?? index}><dt>{humanMetricLabel(value?.metricKey)}</dt><dd title={exactMoney(value?.value, value?.unit, value?.currency)}>{money(value?.value, value?.unit, value?.currency)}</dd></div>)}
                <div><dt>Latest reporting period</dt><dd>{latestPeriod ? `${latestPeriod.fiscalPeriod} · ${latestPeriod.periodEnd}` : "Unavailable"}</dd></div>
              </dl>
              <Link className="download-action" href={`/${mode === "production" ? "companies" : "tranche-4-candidate-preview/companies"}/${encodeURIComponent(entity.entityKey)}` as Route}>Open company details</Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function CandidateAiStack({ model, mode = "preview" }: { model: Tranche4PreviewModel; mode?: CandidateSurfaceMode }) {
  const coverageView = model.catalog.views.find((view) => view.viewId === "ecosystem-coverage-map");
  return (
    <>
      <PreviewSection title="AI Stack Map" question={model.coverage.analyticalQuestion} view={coverageView} mode={mode}>
        <div className="taxonomy-preview-grid">
          {model.coverage.chartReadyValues.map((layer, index) => (
            <article className="taxonomy-preview-card" key={layer.entityKey}>
              <span>Layer {index + 1} · {layer.value} tracked</span>
              <h2>{index === 4 ? "Users and outcomes" : label(layer.displayName ?? layer.entityKey ?? "Layer")}</h2>
              <p>{(layer.coveredSubLayers ?? []).map(label).join(", ") || "Coverage gap remains explicit."}</p>
              {index < 4 ? <small>{model.entities.filter((entity) => stackRoleFor(entity.entityKey)?.primary === ["hardware", "infrastructure", "platforms", "applications"][index]).map((entity) => entity.displayName).join(" · ") || "No companies classified in this presentation layer."}</small> : null}
              <small>{index === 4 ? "Layer 5 is not a company-financial total." : "No layer financial totals are calculated."}</small>
            </article>
          ))}
        </div>
      </PreviewSection>
    </>
  );
}

export function CandidateTrends({ model, mode = "preview" }: { model: Tranche4PreviewModel; mode?: CandidateSurfaceMode }) {
  const annualView = model.catalog.views.find((view) => view.viewId === "latest-annual-company-comparison");
  const intensityView = model.catalog.views.find((view) => view.viewId === "company-wide-capex-intensity");
  const historyView = model.catalog.views.find((view) => view.viewId === "recent-annual-company-histories");
  const capex = model.currentAnnual.capital_expenditure.slice(0, 12);
  const rdIntensity = sortValues(model.rdIntensity.chartReadyValues).slice(0, 12);
  const intensity = sortValues(model.capexIntensity.chartReadyValues).slice(0, 12);
  const scaleVsInvestment = model.scaleVsInvestment.chartReadyValues.slice(0, 12);
  return (
    <>
      <PreviewSection title="Five-year company trends" question="Revenue, company-wide capex, and R&D stay separate by company and fiscal year; no unsupported cross-company totals are created." view={historyView} mode={mode}>
        <div className="candidate-trend-workspace">
          {model.entities.map((entity) => {
            const values = model.histories.chartReadyValues.filter((value) => value.entityKey === entity.entityKey);
            return <details className="candidate-disclosure" key={entity.entityKey}>
              <summary><span>{entity.displayName}</span><small>Revenue, capex, and R&D histories</small></summary>
              <div className="candidate-disclosure-body">
                <CompanyTrend values={values} metricKey="revenue" />
                <CompanyTrend values={values} metricKey="capital_expenditure" />
                <CompanyTrend values={values} metricKey="research_and_development" />
              </div>
            </details>;
          })}
        </div>
      </PreviewSection>
      <PreviewSection title="Quarterly revenue and R&D history" question="Standalone quarterly Revenue and R&D facts remain separate from YTD interim facts. Capex is not derived from cumulative cash-flow values.">
        <div className="candidate-trend-workspace">
          {model.entities.map((entity) => {
            const values = model.interimHistory.filter((value) => value.entityKey === entity.entityKey && value.periodClass === "quarter");
            return <details className="candidate-disclosure" key={entity.entityKey}>
              <summary><span>{entity.displayName}</span><small>{values.length} reported standalone-quarter observations</small></summary>
              <div className="candidate-disclosure-body">
                <CompanyInterimTrend values={values} metricKey="revenue" />
                <CompanyInterimTrend values={values} metricKey="research_and_development" />
                <p className="candidate-note">YTD interim facts, including most capex facts, are preserved in Data & evidence and are not ranked or treated as discrete quarters.</p>
              </div>
            </details>;
          })}
        </div>
      </PreviewSection>
      <PreviewSection title="Company-wide Capex Leaders" question="Latest eligible annual company-wide capex; not AI-specific capex." view={historyView} mode={mode}>
        <BarList values={capex} valueLabel="Latest annual company-wide capex" />
      </PreviewSection>
      <PreviewSection title="R&D Intensity" question="Company-wide R&D divided by company-wide revenue for the same annual fiscal year." view={annualView} mode={mode}>
        <BarList values={rdIntensity} valueLabel="R&D intensity" />
      </PreviewSection>
      <PreviewSection title="Scale vs Capex + R&D" question="Latest eligible annual revenue compared with same-year company-wide capex plus R&D." view={annualView} mode={mode}>
        <InvestmentScatter values={scaleVsInvestment} annualValues={model.annual.chartReadyValues} />
      </PreviewSection>
      <PreviewSection title="Capex Intensity" question={model.capexIntensity.analyticalQuestion} view={intensityView} mode={mode}>
        <BarList values={intensity} valueLabel="Company-wide capex intensity" />
      </PreviewSection>
    </>
  );
}

export function CandidateObservations({ model }: { model: Tranche4PreviewModel }) {
  const rows = model.observations;
  return (
    <section className="panel candidate-section" id="observations">
      <div className="panel-heading"><div><p className="panel-label">Data Explorer</p><h2>Observations with exact periods and sources</h2></div><span className="availability-state state-limited">{rows.length} current release records</span></div>
      <p className="candidate-note">Every metric keeps its own period class, fiscal period, period end, source accession, trust state, comparability state, and safe evidence reference.</p>
      <div className="table-scroll">
        <table className="candidate-table candidate-wide-table">
          <thead><tr><th>Company</th><th>Metric</th><th>Value</th><th>Period</th><th>Source</th><th>Trust</th><th>Evidence</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.observationId}>
            <td>{row.displayName}</td>
            <td>{label(row.metricKey)}</td>
            <td><strong aria-label={exactMoney(row.value, row.unit)} title={exactMoney(row.value, row.unit)}>{money(row.value, row.unit)}</strong><small>{row.unit}</small></td>
            <td>{label(row.periodClass)}<small>{row.fiscalPeriod} · {row.periodEnd}</small></td>
            <td>{row.source.sourceName}<small>{row.source.form} · {row.source.accession}</small></td>
            <td>{label(row.trustState)}<small>{label(row.comparability)}</small></td>
            <td><code>{row.evidence.evidenceSetKey}</code></td>
          </tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

// The published Set 1 explorer uses the immutable, cached release model. Only
// the selected server-rendered page crosses the Worker/browser boundary.
export function CandidateObservationExplorer({ model, page = 1, query = "" }: { model: Tranche4PreviewModel; page?: number; query?: string }) {
  const pageSize = 50;
  const normalizedQuery = query.trim().toLowerCase();
  const matched = normalizedQuery
    ? model.observations.filter((row) => `${row.displayName} ${humanMetricLabel(row.metricKey)} ${row.fiscalPeriod} ${row.periodClass}`.toLowerCase().includes(normalizedQuery))
    : model.observations;
  const pageCount = Math.max(1, Math.ceil(matched.length / pageSize));
  const activePage = Math.min(Math.max(page, 1), pageCount);
  const rows = matched.slice((activePage - 1) * pageSize, activePage * pageSize);
  const pageHref = (targetPage: number) => `/observations?page=${targetPage}${query ? `&q=${encodeURIComponent(query)}` : ""}` as Route;
  return (
    <section className="panel observation-ledger" aria-labelledby="observation-ledger-heading">
      <div className="panel-heading"><div><p className="panel-label">Data Explorer</p><h2 id="observation-ledger-heading">Current release observations</h2></div><span className="availability-state state-limited">{matched.length} matched</span></div>
      <p className="analytics-explainer">Search the current release without loading all {model.observations.length} observations into the browser. Values remain exact, source-linked, and separate by reported period class.</p>
      <form className="observation-filters" action="/observations"><label>Search<input name="q" defaultValue={query} placeholder="Company, metric, or fiscal period" /></label><button type="submit">Search</button></form>
      {rows.length ? <><div className="table-scroll"><table><thead><tr><th>Company</th><th>Observation</th><th>Value</th><th>Fiscal period</th><th>Official source</th><th>Trust</th></tr></thead><tbody>{rows.map((row) => <tr key={row.observationId}><td>{row.displayName}</td><td>{humanMetricLabel(row.metricKey)}</td><td><strong aria-label={exactMoney(row.value, row.unit)} title={exactMoney(row.value, row.unit)}>{money(row.value, row.unit)}</strong><br /><small>{row.unit}</small></td><td>{label(row.periodClass)}<br /><small>{row.fiscalPeriod} · {row.periodEnd}</small></td><td><a className="source-link" href={row.source.lawfulSourceUrl} rel="noreferrer">{row.source.sourceName}</a><br /><small>{row.source.form} · {row.source.accession}</small></td><td>{label(row.trustState)}<br /><small>{label(row.comparability)}</small></td></tr>)}</tbody></table></div><nav className="observation-pagination" aria-label="Observation results pages"><span>Showing {(activePage - 1) * pageSize + 1}-{Math.min(activePage * pageSize, matched.length)} of {matched.length}</span>{activePage > 1 ? <Link href={pageHref(activePage - 1)}>Previous</Link> : <span aria-hidden="true" />}{activePage < pageCount ? <Link href={pageHref(activePage + 1)}>Next</Link> : <span aria-hidden="true" />}</nav></> : <p className="empty-observation-state">No published observations match this search. Missing coverage is not represented as zero.</p>}
    </section>
  );
}

export function CandidateDataCenter({ model }: { model: Tranche4PreviewModel }) {
  return (
    <section className="panel candidate-section" id="data">
      <div className="panel-heading"><div><p className="panel-label">Data and Release Details</p><h2>Downloads, hashes, identifiers and unavailable views</h2></div><span className="availability-state state-limited">release-bound</span></div>
      <div className="candidate-data-grid">
        <PreviewStat label="Published dataset" value="Release-bound data" detail={label(model.manifest.taxonomyVersion)} />
        <PreviewStat label="Compatibility manifest" value={model.manifest.manifestHash.slice(0, 20)} detail="Immutable dataset compatibility contract" />
        <PreviewStat label="Analytics catalog" value={model.catalog.contractVersion} detail="Release-bound analytics view contract" />
        <PreviewStat label="Withheld metrics" value={`${model.manifest.counts.withheldMetricCount}`} detail="Missing remains unavailable, never zero" />
      </div>
      <div className="candidate-unavailable-grid">
        {model.unavailable.map((view) => <article key={view.viewId}><h3>{label(view.viewId)}</h3><p>{view.withholdingReason}</p>{downloadLinks(view, "production", false)}</article>)}
      </div>
    </section>
  );
}

function CandidateDataPathways({ model, mode = "preview" }: { model: Tranche4PreviewModel; mode?: CandidateSurfaceMode }) {
  const annualView = model.catalog.views.find((view) => view.viewId === "latest-annual-company-comparison");
  return (
    <section className="panel candidate-section" id="data">
      <div className="panel-heading">
        <div><p className="panel-label">Data</p><h2>Underlying records and release details stay available.</h2></div>
        <Link className="download-action" href={"/data" as Route}>Open Data</Link>
      </div>
      <p className="candidate-note">The homepage keeps the analytical story up front. Exact observations, downloads, source links, release details, unavailable views, and advanced identifiers remain in Data and company-level evidence sections.</p>
      <div className="candidate-data-actions">
        <Link href={"/observations" as Route}>Data Explorer</Link>
        <Link href={"/data/releases" as Route}>Release details</Link>
        <Link href={"/sources" as Route}>Sources</Link>
        {annualView && mode === "preview" ? <Link href={`/tranche-4-candidate-preview/artifacts/${encodeURIComponent(annualView.downloads.csv)}` as Route}>Candidate CSV</Link> : null}
      </div>
    </section>
  );
}

export function CandidateMethodology({ model }: { model: Tranche4PreviewModel }) {
  return (
    <section className="panel candidate-section" id="methodology">
      <div className="panel-heading"><div><p className="panel-label">Methodology and sources</p><h2>Structured-source-first, recent-first, evidence-gated</h2></div><span className="availability-state state-limited">{model.manifest.methodologyVersion}</span></div>
      <ul className="candidate-method-list">
        <li>Up to five eligible completed annual fiscal years are shown from a 2021 floor; annual, quarter, and YTD interim observations remain separate.</li>
        <li>Company-wide financial facts are not AI-specific allocations and are never summed into market-wide AI totals.</li>
        <li>Layer 5 is an actor/outcome layer; ordinary company financial observations stay in Layers 1-4 taxonomy metadata.</li>
        <li>Unsupported views are explicit unavailable contracts, not empty charts or zero values.</li>
        <li>Release 1 remains unchanged until owner approval and atomic promotion.</li>
      </ul>
    </section>
  );
}

export function CandidateCompanyPage({ model, entityKey }: { model: Tranche4PreviewModel; entityKey: string }) {
  const entity = model.entities.find((candidate) => candidate.entityKey === entityKey);
  if (!entity) return null;
  const annual = model.annual.chartReadyValues.filter((value) => value.entityKey === entityKey);
  const interim = model.interim.chartReadyValues.filter((value) => value.entityKey === entityKey);
  const histories = model.histories.chartReadyValues.filter((value) => value.entityKey === entityKey);
  const observations = model.observations.filter((value) => value.entityKey === entityKey);
  const interimHistory = model.interimHistory.filter((value) => value.entityKey === entityKey);
  const capexIntensity = latestFiscalYearValue(model.capexIntensity.chartReadyValues.filter((value) => value.entityKey === entityKey));
  const rdIntensity = latestFiscalYearValue(model.rdIntensity.chartReadyValues.filter((value) => value.entityKey === entityKey));
  const annualMetricCards = ["revenue", "capital_expenditure", "research_and_development"].map((metricKey) => annual.find((value) => value.metricKey === metricKey));
  const peerInvestment = model.scaleVsInvestment.chartReadyValues.find((value) => value.entityKey === entityKey);
  const investmentRank = model.scaleVsInvestment.chartReadyValues.findIndex((value) => value.entityKey === entityKey) + 1;
  return (
    <>
      <section className="candidate-hero">
        <p className="eyebrow">Company intelligence</p>
        <h1>{entity.displayName}</h1>
        <p className="lede">Latest annual scale, investment, and research metrics come first. Exact observations, source links, trust states, and evidence references stay below for auditability.</p>
      </section>

      <section className="candidate-metric-strip" aria-label={`${entity.displayName} latest annual metrics`}>
        {annualMetricCards.map((value, index) => (
          <article className="panel candidate-metric-card" key={value?.metricKey ?? index}>
            <span>{humanMetricLabel(value?.metricKey)}</span>
            <strong title={exactMoney(value?.value, value?.unit, value?.currency)}>{money(value?.value, value?.unit, value?.currency)}</strong>
            <small>{value ? `FY${value.fiscalYear} · period end ${value.periodEnd} · ${label(value.trustState ?? "Unavailable")}` : "Withheld or unavailable, never zero-filled"}</small>
          </article>
        ))}
      </section>

      <PreviewSection title="Latest reported interim" question="Newest valid reported interim values are shown separately and never ranked with annual values.">
        <Table values={interim} columns={["metricKey", "value", "unit", "fiscalPeriod", "periodClass", "periodEnd", "trustState"]} />
      </PreviewSection>

      <PreviewSection title="Annual metric trends" question="Up to five completed fiscal years render only where eligible annual history exists.">
        <CompanyTrend values={histories} metricKey="revenue" />
        <CompanyTrend values={histories} metricKey="capital_expenditure" />
        <CompanyTrend values={histories} metricKey="research_and_development" />
      </PreviewSection>

      <PreviewSection title="Investment Intensity" question="Ratios use same-company, same-fiscal-year annual observations only.">
        <div className="candidate-grid candidate-two">
          <PreviewStat label="Capex intensity" value={money(capexIntensity?.value, "ratio")} detail={capexIntensity ? `FY${capexIntensity.fiscalYear} · ${label(capexIntensity.comparability ?? "Unavailable")}` : "Insufficient compatible annual data"} />
          <PreviewStat label="R&D intensity" value={money(rdIntensity?.value, "ratio")} detail={rdIntensity ? `FY${rdIntensity.fiscalYear} · ${label(rdIntensity.comparability ?? "Unavailable")}` : "Insufficient compatible annual data"} />
          <PreviewStat label="Comparison context" value={investmentRank > 0 ? `#${investmentRank}` : "Unavailable"} detail={peerInvestment ? `${money(peerInvestment.value, peerInvestment.unit, peerInvestment.currency)} same-year capex + R&D` : "Insufficient compatible annual data"} />
          <PreviewStat label="Capex definition" value="Company-wide" detail="This is not AI-specific spending." />
        </div>
      </PreviewSection>

      <CompanyDataEvidence annual={annual} interim={interim} interimHistory={interimHistory} histories={histories} observations={observations} />
    </>
  );
}

function CompanyDataEvidence({ annual, interim, interimHistory, histories, observations }: { annual: ChartValue[]; interim: ChartValue[]; interimHistory: Tranche4PreviewModel["interimHistory"]; histories: ChartValue[]; observations: Tranche4PreviewModel["observations"] }) {
  return (
    <section className="panel candidate-section">
      <details className="candidate-disclosure">
        <summary>
          <span>Data & evidence</span>
          <small>Exact annual, interim, history, source and evidence records</small>
        </summary>
        <div className="candidate-disclosure-body">
          <h3>Latest annual values</h3>
          <Table values={annual} columns={["metricKey", "value", "unit", "fiscalYear", "periodEnd", "trustState", "comparability"]} />
          <h3>Latest interim values</h3>
          <Table values={interim} columns={["metricKey", "value", "unit", "fiscalPeriod", "periodClass", "periodEnd", "trustState"]} />
          <h3>Recent annual histories</h3>
          <Table values={histories} columns={["metricKey", "value", "unit", "fiscalYear", "periodEnd", "comparability"]} />
          <h3>Interim history</h3>
          <p className="candidate-note">Standalone quarters and YTD facts are reported in distinct rows. No quarterly capex is derived from YTD values.</p>
          <Table values={interimHistory} columns={["metricKey", "value", "unit", "fiscalPeriod", "periodClass", "periodEnd", "comparability"]} />
          <h3>Evidence references and source links</h3>
          <div className="table-scroll">
            <table className="candidate-table candidate-wide-table">
              <thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Official source</th><th>Evidence reference</th><th>Trust</th></tr></thead>
              <tbody>{observations.map((row) => <tr key={row.observationId}>
                <td>{humanMetricLabel(row.metricKey)}</td>
                <td><strong aria-label={exactMoney(row.value, row.unit)} title={exactMoney(row.value, row.unit)}>{money(row.value, row.unit)}</strong><small>{row.unit}</small></td>
                <td>{label(row.periodClass)}<small>{row.fiscalPeriod} · {row.periodEnd}</small></td>
                <td><a className="source-link" href={row.source.lawfulSourceUrl} rel="noreferrer">{row.source.sourceName}</a><small>{row.source.form} · {row.source.accession}</small></td>
                <td><code>{row.evidence.evidenceSetKey}</code></td>
                <td>{label(row.trustState)}<small>{label(row.comparability)}</small></td>
              </tr>)}</tbody>
            </table>
          </div>
        </div>
      </details>
    </section>
  );
}

function CompanyTrend({ values, metricKey }: { values: ChartValue[]; metricKey: string }) {
  const metricValues = values
    .filter((value) => value.metricKey === metricKey)
    .sort((a, b) => Number(a.fiscalYear ?? 0) - Number(b.fiscalYear ?? 0))
    .slice(-5);
  if (metricValues.length === 0) {
    return <article className="candidate-trend-card"><h3>{humanMetricLabel(metricKey)}</h3><p>Recent comparable data unavailable for this company.</p></article>;
  }
  const parsed = metricValues.map((value) => numeric(value.value) ?? 0);
  const min = Math.min(...parsed);
  const max = Math.max(...parsed, 1);
  const range = Math.max(max - min, 1);
  const points = metricValues.map((value, index) => {
    const x = 34 + index * (252 / Math.max(metricValues.length - 1, 1));
    const y = 126 - (((numeric(value.value) ?? 0) - min) / range) * 84;
    return { value, x, y };
  });
  return (
    <article className="candidate-trend-card">
      <div><h3>{humanMetricLabel(metricKey)}</h3><span>{metricValues.length >= 5 ? "5-year history" : "Shorter available history"}</span></div>
      <svg className="candidate-line-chart" viewBox="0 0 320 150" role="img" aria-label={`${humanMetricLabel(metricKey)} line chart`}>
        <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        {points.map((point) => (
          <g key={point.value.observationId}>
            <circle cx={point.x} cy={point.y} r="4" />
            <text x={point.x} y={point.y - 10}>{money(point.value.value, point.value.unit, point.value.currency)}</text>
            <text x={point.x} y="143">FY{point.value.fiscalYear}</text>
          </g>
        ))}
      </svg>
      <p>{metricValues.length >= 5 ? "Five eligible annual observations." : "Only eligible completed fiscal years are shown."}</p>
    </article>
  );
}

function CompanyInterimTrend({ values, metricKey }: { values: Tranche4PreviewModel["interimHistory"]; metricKey: string }) {
  const metricValues = values
    .filter((value) => value.metricKey === metricKey)
    .sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
  if (metricValues.length === 0) {
    return <article className="candidate-trend-card"><h3>{humanMetricLabel(metricKey)}</h3><p>No comparable standalone-quarter facts are available.</p></article>;
  }
  const displayed = metricValues.slice(-12);
  const parsed = displayed.map((value) => numeric(value.value) ?? 0);
  const min = Math.min(...parsed);
  const max = Math.max(...parsed, 1);
  const range = Math.max(max - min, 1);
  const points = displayed.map((value, index) => ({
    value,
    x: 34 + index * (252 / Math.max(displayed.length - 1, 1)),
    y: 126 - (((numeric(value.value) ?? 0) - min) / range) * 84
  }));
  return (
    <article className="candidate-trend-card">
      <div><h3>{humanMetricLabel(metricKey)}</h3><span>Standalone quarterly history</span></div>
      <svg className="candidate-line-chart" viewBox="0 0 320 150" role="img" aria-label={`${humanMetricLabel(metricKey)} quarterly line chart`}>
        <polyline points={points.map((point) => `${point.x},${point.y}`).join(" ")} />
        {points.map((point) => <g key={point.value.observationId}><circle cx={point.x} cy={point.y} r="4" /><text x={point.x} y={point.y - 10}>{money(point.value.value, point.value.unit)}</text><text x={point.x} y="143">{point.value.fiscalPeriod}</text></g>)}
      </svg>
      <p>Only reported standalone-quarter facts are charted; YTD facts remain separate.</p>
    </article>
  );
}

function latestFiscalYearValue(values: ChartValue[]) {
  return [...values].sort((a, b) => Number(b.fiscalYear ?? 0) - Number(a.fiscalYear ?? 0))[0];
}
