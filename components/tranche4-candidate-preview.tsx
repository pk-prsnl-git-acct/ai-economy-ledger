import Link from "next/link";
import type { Route } from "next";
import type { ReactNode } from "react";

import { label, type Tranche4PreviewModel } from "@/src/server/tranche4/preview-model";

type ChartValue = Tranche4PreviewModel["annual"]["chartReadyValues"][number];

const formatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

function numeric(value: string | null | undefined) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: string | null | undefined, unit: string | null | undefined) {
  const parsed = numeric(value);
  if (parsed === null) return value ?? "Unavailable";
  return unit === "ratio" ? `${(parsed * 100).toFixed(1)}%` : formatter.format(parsed);
}

function humanMetricLabel(metricKey: string | null | undefined) {
  const value = label(metricKey ?? "metric");
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function downloadLinks(view: Tranche4PreviewModel["catalog"]["views"][number]) {
  const jsonHref = `/tranche-4-candidate-preview/artifacts/${encodeURIComponent(view.downloads.json)}` as Route;
  const csvHref = `/tranche-4-candidate-preview/artifacts/${encodeURIComponent(view.downloads.csv)}` as Route;
  return (
    <div className="candidate-downloads" aria-label={`${label(view.viewId)} downloads`}>
      <span>{view.eligibilityState === "unavailable" ? "Unavailable contract" : "Downloadable contract"}</span>
      <Link href={jsonHref}>{view.downloads.json}</Link>
      <Link href={csvHref}>{view.downloads.csv}</Link>
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
              {columns.map((column) => <td key={String(column)}>{Array.isArray(value[column]) ? (value[column] as string[]).map(label).join(", ") : label(String(value[column] ?? "Unavailable"))}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CandidatePreviewHome({ model }: { model: Tranche4PreviewModel }) {
  const annualRevenue = model.annual.chartReadyValues.filter((value) => value.metricKey === "revenue").slice(0, 8);
  const capex = model.annual.chartReadyValues.filter((value) => value.metricKey === "capital_expenditure").slice(0, 8);
  const intensity = model.capexIntensity.chartReadyValues.slice(0, 8);
  const coverageView = model.catalog.views.find((view) => view.viewId === "ecosystem-coverage-map");
  const annualView = model.catalog.views.find((view) => view.viewId === "latest-annual-company-comparison");
  const intensityView = model.catalog.views.find((view) => view.viewId === "company-wide-capex-intensity");

  return (
    <>
      <section className="candidate-hero" aria-labelledby="candidate-title">
        <p className="eyebrow">Owner-gated candidate preview</p>
        <h1 id="candidate-title">Set 1 candidate, rendered without publishing it.</h1>
        <p className="lede">This preview uses immutable Tranche 4 Contract D artifacts. It is intentionally unavailable unless a non-production preview flag is set, and it does not change Release 1, Candidate 2, production routes, or the public release pointer.</p>
        <div className="candidate-facts" aria-label="Candidate summary">
          <span><strong>{model.manifest.counts.entityCount}</strong> companies</span>
          <span><strong>{model.manifest.counts.observationCount}</strong> observations</span>
          <span><strong>{model.manifest.counts.annualObservationCount}</strong> annual</span>
          <span><strong>{model.manifest.counts.interimObservationCount}</strong> interim</span>
        </div>
      </section>

      <section className="candidate-warning panel">
        <strong>Not production data.</strong>
        <span>Publication is disabled, owner approval is required, and every chart below keeps exact table/download equivalents.</span>
      </section>

      <section className="candidate-grid" aria-label="Candidate state">
        <PreviewStat label="Candidate" value={model.manifest.candidateId} detail={model.manifest.taxonomyVersion} />
        <PreviewStat label="Trust mix" value={`${model.trustCounts.systemValidated} system validated`} detail={`${model.trustCounts.humanVerified} human verified, ${model.trustCounts.sourceAttributed} source-attributed`} />
        <PreviewStat label="Supported views" value={`${model.catalog.views.filter((view) => view.eligibilityState === "available_with_limitations").length} limited`} detail={`${model.unavailable.length} withheld views remain explicit`} />
        <PreviewStat label="Manifest hash" value={model.manifest.manifestHash.slice(0, 16)} detail={model.indexHash.slice(0, 24)} />
      </section>

      <PreviewSection title="Taxonomy coverage map" question={model.coverage.analyticalQuestion} view={coverageView}>
        <div className="taxonomy-preview-grid">
          {model.coverage.chartReadyValues.map((layer) => (
            <article className="taxonomy-preview-card" key={layer.entityKey}>
              <span>{layer.value} tracked</span>
              <h2>{label(layer.displayName ?? layer.entityKey ?? "Layer")}</h2>
              <p>Covered sub-layers: {(layer.coveredSubLayers ?? []).map(label).join(", ") || "none yet"}</p>
              <small>Layer financial totals are intentionally absent.</small>
            </article>
          ))}
        </div>
      </PreviewSection>

      <PreviewSection title="Latest annual revenue" question={model.annual.analyticalQuestion} view={annualView}>
        <BarList values={annualRevenue} valueLabel="Revenue" />
        <Table values={annualRevenue} columns={["displayName", "metricKey", "value", "fiscalPeriod", "periodEnd", "trustState", "comparability"]} />
      </PreviewSection>

      <PreviewSection title="Latest annual capital expenditure" question={model.annual.analyticalQuestion} view={annualView}>
        <BarList values={capex} valueLabel="Capex" />
        <Table values={capex} columns={["displayName", "metricKey", "value", "fiscalPeriod", "periodEnd", "trustState", "comparability"]} />
      </PreviewSection>

      <PreviewSection title="Company-wide capex intensity" question={model.capexIntensity.analyticalQuestion} view={intensityView}>
        <BarList values={intensity} valueLabel="Company-wide capex intensity" />
        <Table values={intensity} columns={["displayName", "value", "unit", "fiscalYear", "financialScope", "trustState", "comparability"]} />
      </PreviewSection>

      <CandidateDirectory model={model} />
      <CandidateObservations model={model} />
      <CandidateDataCenter model={model} />
      <CandidateMethodology model={model} />
    </>
  );
}

function PreviewStat({ label: title, value, detail }: { label: string; value: string; detail: string }) {
  return <article className="panel candidate-stat"><span>{title}</span><strong>{value}</strong><small>{detail}</small></article>;
}

function PreviewSection({ title, question, view, children }: { title: string; question: string; view?: Tranche4PreviewModel["catalog"]["views"][number]; children: ReactNode }) {
  return (
    <section className="panel candidate-section">
      <div className="panel-heading">
        <div><p className="panel-label">{question}</p><h2>{title}</h2></div>
        {view ? <span className="availability-state state-limited">{label(view.eligibilityState)}</span> : null}
      </div>
      {view ? downloadLinks(view) : null}
      {children}
    </section>
  );
}

function BarList({ values, valueLabel }: { values: ChartValue[]; valueLabel: string }) {
  const max = Math.max(...values.map((value) => numeric(value.value) ?? 0), 1);
  return (
    <div className="candidate-bars" role="list" aria-label={valueLabel}>
      {values.map((value) => {
        const width = `${Math.max(((numeric(value.value) ?? 0) / max) * 100, 2)}%`;
        return (
          <article role="listitem" key={value.observationId ?? `${value.entityKey}-${value.metricKey}`}>
            <div><strong>{value.displayName}</strong><span>{money(value.value, value.unit)} {value.currency ?? value.unit ?? ""}</span></div>
            <i style={{ width }} aria-hidden="true" />
            <small>{label(value.periodClass ?? "period")} · {value.fiscalPeriod} · period end {value.periodEnd ?? "n/a"} · {label(value.trustState ?? "unknown trust")}</small>
          </article>
        );
      })}
    </div>
  );
}

export function CandidateDirectory({ model }: { model: Tranche4PreviewModel }) {
  return (
    <section className="panel candidate-section" id="companies">
      <div className="panel-heading"><div><p className="panel-label">Company pages</p><h2>Canonical Set 1 company directory</h2></div><span className="availability-state state-limited">{model.entities.length} canonical previews</span></div>
      <div className="candidate-company-grid">
        {model.entities.map((entity) => {
          const latest = model.annual.chartReadyValues.filter((value) => value.entityKey === entity.entityKey);
          return (
            <article key={entity.entityKey} className="candidate-company-card">
              <h3>{entity.displayName}</h3>
              <p>{label(entity.entityKey)}</p>
              <dl>
                <div><dt>Latest annual metrics</dt><dd>{latest.length}</dd></div>
                <div><dt>Interim observations</dt><dd>{model.interim.chartReadyValues.filter((value) => value.entityKey === entity.entityKey).length}</dd></div>
              </dl>
              <Link className="download-action" href={`/tranche-4-candidate-preview/companies/${encodeURIComponent(entity.entityKey)}` as Route}>Open company preview</Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function CandidateObservations({ model }: { model: Tranche4PreviewModel }) {
  const rows = model.observations.slice(0, 40);
  return (
    <section className="panel candidate-section" id="observations">
      <div className="panel-heading"><div><p className="panel-label">Observation ledger</p><h2>Exact values with individual periods</h2></div><span className="availability-state state-limited">first 40 shown</span></div>
      <p className="candidate-note">Every metric keeps its own period class, fiscal period, period end, source accession, trust state, comparability state, and safe evidence reference.</p>
      <div className="table-scroll">
        <table className="candidate-table candidate-wide-table">
          <thead><tr><th>Company</th><th>Metric</th><th>Value</th><th>Period</th><th>Source</th><th>Trust</th><th>Evidence</th></tr></thead>
          <tbody>{rows.map((row) => <tr key={row.observationId}>
            <td>{row.displayName}</td>
            <td>{label(row.metricKey)}</td>
            <td><strong>{money(row.value, row.unit)}</strong><small>{row.unit}</small></td>
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

export function CandidateDataCenter({ model }: { model: Tranche4PreviewModel }) {
  return (
    <section className="panel candidate-section" id="data">
      <div className="panel-heading"><div><p className="panel-label">Data center</p><h2>Candidate artifacts, hashes and unavailable views</h2></div><span className="availability-state state-empty">not published</span></div>
      <div className="candidate-data-grid">
        <PreviewStat label="Candidate manifest" value={model.manifest.manifestHash.slice(0, 20)} detail={model.manifest.contractVersion} />
        <PreviewStat label="Analytics manifest" value={model.catalog.candidateManifestHash.slice(0, 20)} detail={model.catalog.contractVersion} />
        <PreviewStat label="Withheld metrics" value={`${model.manifest.counts.withheldMetricCount}`} detail="Missing remains unavailable, never zero" />
      </div>
      <div className="candidate-unavailable-grid">
        {model.unavailable.map((view) => <article key={view.viewId}><h3>{label(view.viewId)}</h3><p>{view.withholdingReason}</p>{downloadLinks(view)}</article>)}
      </div>
    </section>
  );
}

export function CandidateMethodology({ model }: { model: Tranche4PreviewModel }) {
  return (
    <section className="panel candidate-section" id="methodology">
      <div className="panel-heading"><div><p className="panel-label">Methodology and sources</p><h2>Structured-source-first, recent-first, evidence-gated</h2></div><span className="availability-state state-limited">{model.manifest.methodologyVersion}</span></div>
      <ul className="candidate-method-list">
        <li>FY2023+ recent-first policy; annual, quarter, and YTD interim observations remain separate.</li>
        <li>Company-wide financial facts are not AI-specific allocations and are never summed into market-wide AI totals.</li>
        <li>Layer 5 is an actor/outcome layer; ordinary company financial observations stay in Layers 1-4 taxonomy metadata.</li>
        <li>Unsupported views are explicit unavailable contracts, not empty charts or zero values.</li>
        <li>Release 1 and Candidate 2 remain unchanged until owner approval and atomic promotion.</li>
      </ul>
    </section>
  );
}

export function CandidateCompanyPage({ model, entityKey }: { model: Tranche4PreviewModel; entityKey: string }) {
  const entity = model.entities.find((candidate) => candidate.entityKey === entityKey);
  if (!entity) return null;
  const annual = model.annual.chartReadyValues.filter((value) => value.entityKey === entityKey);
  const annualCards = annual.map((value) => ({
    ...value,
    displayName: humanMetricLabel(value.metricKey)
  }));
  const interim = model.interim.chartReadyValues.filter((value) => value.entityKey === entityKey);
  const histories = model.histories.chartReadyValues.filter((value) => value.entityKey === entityKey);
  const observations = model.observations.filter((value) => value.entityKey === entityKey);
  return (
    <>
      <section className="candidate-hero">
        <p className="eyebrow">Company candidate preview</p>
        <h1>{entity.displayName}</h1>
        <p className="lede">Canonical company page for the unpublished Set 1 candidate. Latest annual values, interim observations, histories, evidence links, trust states, and limitations are shown separately.</p>
      </section>
      <PreviewSection title="Latest annual metrics" question="Each metric carries its own fiscal year and period end.">
        <BarList values={annualCards} valueLabel={`${entity.displayName} annual metrics`} />
        <Table values={annual} columns={["metricKey", "value", "unit", "fiscalYear", "periodEnd", "trustState", "comparability"]} />
      </PreviewSection>
      <PreviewSection title="Latest interim metrics" question="Standalone quarter and YTD observations are not compared as equivalent.">
        <Table values={interim} columns={["metricKey", "value", "unit", "fiscalPeriod", "periodClass", "periodEnd", "trustState"]} />
      </PreviewSection>
      <PreviewSection title="Recent annual histories" question="Histories render only from eligible Contract D values.">
        <Table values={histories.slice(0, 24)} columns={["metricKey", "value", "unit", "fiscalYear", "periodEnd", "comparability"]} />
      </PreviewSection>
      <section className="panel candidate-section">
        <div className="panel-heading"><div><p className="panel-label">Evidence references and source links</p><h2>{observations.length} candidate observations</h2></div><Link className="download-action" href={"/tranche-4-candidate-preview#observations" as Route}>Back to ledger</Link></div>
        <div className="table-scroll">
          <table className="candidate-table candidate-wide-table">
            <thead><tr><th>Metric</th><th>Value</th><th>Period</th><th>Official source</th><th>Evidence reference</th><th>Trust</th></tr></thead>
            <tbody>{observations.slice(0, 30).map((row) => <tr key={row.observationId}>
              <td>{humanMetricLabel(row.metricKey)}</td>
              <td><strong>{money(row.value, row.unit)}</strong><small>{row.unit}</small></td>
              <td>{label(row.periodClass)}<small>{row.fiscalPeriod} · {row.periodEnd}</small></td>
              <td><a className="source-link" href={row.source.lawfulSourceUrl} rel="noreferrer">{row.source.sourceName}</a><small>{row.source.form} · {row.source.accession}</small></td>
              <td><code>{row.evidence.evidenceSetKey}</code></td>
              <td>{label(row.trustState)}<small>{label(row.comparability)}</small></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </>
  );
}
