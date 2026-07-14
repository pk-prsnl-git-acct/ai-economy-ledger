import type { ReactNode } from "react";

import { AppShell, AutonomyBadge, ConfidenceBadge, DataQualityPanel, HeroSection, RouteDirectory, TrustDecisionSummary, TrustStateBadge } from "@/components/ledger";
import { getAdminSession, type AdminSession } from "@/src/server/admin/session";
import { submitTrustReviewDecision } from "@/src/server/admin/public-trust/actions";
import {
  getGroupedObservations,
  getTrustReviewCase,
  getVisibilityPolicy,
  listTrustReviewCases,
  validatePublicTrustContract,
  type TrustReviewCase,
} from "@/src/server/admin/public-trust/contract";
import { listReviewQueueItems, type ReviewQueueItem } from "@/src/server/admin/review-queue";
import { evaluateReadiness } from "@/src/server/modules/health/readiness.mjs";
import { listPublishedSnapshots } from "@/src/server/public-snapshots";
import { adminRoutes, type RouteDefinition } from "@/src/ui/site-map";

function roleLabel(session: Extract<AdminSession, { status: "authorized" }>) {
  return session.roles.includes("admin") ? "Admin" : "Reviewer";
}

function AccessRequired({ session }: { session: Exclude<AdminSession, { status: "authorized" }> }) {
  return (
    <section className="panel admin-state-panel">
      <p className="panel-label">{session.status.replace("_", " ")}</p>
      <h2>Protected admin access</h2>
      <p>{session.reason}</p>
      <dl>
        <div><dt>Authentication</dt><dd>Supabase session required</dd></div>
        <div><dt>Authorization</dt><dd><code>private.app_user_roles</code></dd></div>
        <div><dt>Data path</dt><dd>Server-only database boundary</dd></div>
      </dl>
    </section>
  );
}

function AdminStatus({ session }: { session: Extract<AdminSession, { status: "authorized" }> }) {
  return (
    <section className="warning-banner admin-authorized" aria-label="Admin authorization state">
      <strong>{roleLabel(session)} session</strong>
      <span>{session.user.email ?? session.user.id} is authorized through the private role table.</span>
    </section>
  );
}

export async function ProtectedAdminPage({ route, children }: { route: RouteDefinition; children: ReactNode }) {
  const session = await getAdminSession("reviewer");

  return (
    <AppShell admin>
      <HeroSection route={route} aside={<DataQualityPanel />} />
      {session.status === "authorized" ? <><AdminStatus session={session} />{children}</> : <AccessRequired session={session} />}
      <RouteDirectory routes={adminRoutes} admin />
    </AppShell>
  );
}

function MetricList({ title, values }: { title: string; values: Record<string, number> }) {
  return (
    <article className="panel compact-panel">
      <p className="panel-label">{title}</p>
      <dl className="metric-list">
        {Object.entries(values).map(([label, value]) => <div key={label}><dt>{label.replaceAll("_", " ")}</dt><dd>{value}</dd></div>)}
      </dl>
    </article>
  );
}

function ReviewCaseCard({ reviewCase }: { reviewCase: TrustReviewCase }) {
  const record = reviewCase.currentRecord;
  return (
    <article className="queue-item review-case-card">
      <div>
        <strong>{record.entity.displayName} · {record.metric.displayLabel}</strong>
        <div className="trust-context trust-context-inline"><TrustStateBadge record={record} /><AutonomyBadge record={record} /></div>
        <p>{reviewCase.reviewPriority} · {reviewCase.queueAge} · {record.source.name}</p>
        <p>{record.disclosure.label}</p>
      </div>
      <a className="disabled-action action-link" href={`/admin/review/${encodeURIComponent(reviewCase.reviewCaseId)}`}>Open detail</a>
    </article>
  );
}

export async function TrustReviewDashboard() {
  const contract = validatePublicTrustContract();
  const queue = listTrustReviewCases({ sort: "priority", pageSize: 10 });
  return (
    <section className="trust-admin-grid" aria-labelledby="trust-review-heading">
      <div className="panel queue-panel">
        <div className="panel-heading">
          <div>
            <p className="panel-label">Progressive trust contract {contract.contractVersion}</p>
            <h2 id="trust-review-heading">Review queue</h2>
          </div>
          <ConfidenceBadge level="High" />
        </div>
        <form className="filter-grid" aria-label="Review queue filters">
          <label>Company<input name="company" placeholder="NVIDIA" /></label>
          <label>Metric<select name="metric" defaultValue=""><option value="">Any metric</option><option value="metric:ai-capex">AI capex</option><option value="metric:ai-compute-capacity">AI compute capacity</option></select></label>
          <label>Trust state<select name="trustState" defaultValue=""><option value="">Any state</option><option value="source_attributed_unverified">Source-attributed</option><option value="system_validated">System validated</option><option value="human_verified">Human verified</option></select></label>
          <label>Priority<select name="reviewPriority" defaultValue=""><option value="">Any priority</option><option value="urgent">Urgent</option><option value="normal">Normal</option></select></label>
          <label>Conflict<select name="conflict" defaultValue=""><option value="">Any conflict</option><option value="unresolved_conflict">Unresolved</option><option value="none">None</option></select></label>
          <label>Model-assisted<select name="modelAssisted" defaultValue=""><option value="">Any provenance</option><option value="true">Model assisted</option><option value="false">Deterministic</option></select></label>
        </form>
        <p className="admin-muted" role="status">Showing {queue.cases.length} of {queue.total} cases. Sort options: priority, age, confidence, and source date. Pagination is fixture-backed for CI.</p>
        {queue.cases.map((reviewCase) => <ReviewCaseCard key={reviewCase.reviewCaseId} reviewCase={reviewCase} />)}
      </div>
      <MetricList title="By trust state" values={queue.metrics.byTrustState} />
      <MetricList title="By source" values={queue.metrics.bySource} />
      <MetricList title="By priority" values={queue.metrics.byPriority} />
      <article className="panel compact-panel">
        <p className="panel-label">Backlog</p>
        <h2>{queue.metrics.unresolvedQueueCount} unresolved</h2>
        <p className="admin-muted">Oldest unresolved: {queue.metrics.oldestUnresolvedItem}. Daily inflow: {queue.metrics.dailyInflow}. Throughput: {queue.metrics.dailyAdjudicationThroughput}.</p>
      </article>
    </section>
  );
}

function DecisionForm({ reviewCase }: { reviewCase: TrustReviewCase }) {
  const actions = ["approve_human_verified", "reject", "request_more_evidence", "defer", "reopen", "supersede"] as const;
  return (
    <form action={submitTrustReviewDecision} className="decision-form">
      <input type="hidden" name="reviewCaseId" value={reviewCase.reviewCaseId} />
      <input type="hidden" name="expectedRecordVersion" value={reviewCase.currentRecord.recordVersion} />
      <input type="hidden" name="expectedEvidenceVersion" value={reviewCase.currentRecord.evidence.documentVersion} />
      <input type="hidden" name="policyVersion" value={reviewCase.currentRecord.policyVersion} />
      <input type="hidden" name="idempotencyKey" value={`ui:${reviewCase.reviewCaseId}:fixture`} />
      <label>Action<select name="action" required>{actions.map((action) => <option key={action} value={action}>{action.replaceAll("_", " ")}</option>)}</select></label>
      <label>Reason code<input name="reasonCode" required placeholder="evidence_matches_value" /></label>
      <label>Optional note<textarea name="note" placeholder="Visible only in the protected audit trail." /></label>
      <p className="admin-muted">Confirmation: this fixture-backed action sends exact record, evidence, and policy versions with an idempotency key. Stale versions fail closed.</p>
      <button className="nav-action" type="submit">Confirm protected decision</button>
    </form>
  );
}

export async function TrustReviewDetail({ reviewCaseId }: { reviewCaseId: string }) {
  const reviewCase = getTrustReviewCase(reviewCaseId);
  const record = reviewCase.currentRecord;
  const grouped = record.duplicateGroupStatus === "unique" ? [] : getGroupedObservations(record.duplicateGroupStatus);
  return (
    <section className="trust-detail-grid">
      <article className="panel queue-panel">
        <p className="panel-label">Review detail</p>
        <h2>{record.entity.displayName} · {record.metric.displayLabel}</h2>
        <dl className="detail-list">
          <div><dt>Proposed value</dt><dd>{record.value} {record.unit}</dd></div>
          <div><dt>Period</dt><dd>{record.period.label}</dd></div>
          <div><dt>Source</dt><dd><a href={record.source.url}>{record.source.name}</a> · {record.source.filingOrPublicationDate}</dd></div>
          <div><dt>Evidence</dt><dd>{reviewCase.evidenceSafeBundle.safeEvidenceRef} · {reviewCase.evidenceSafeBundle.documentVersion}</dd></div>
          <div><dt>Coordinates</dt><dd>{Object.entries(reviewCase.evidenceSafeBundle.coordinates).map(([key, value]) => `${key}: ${value}`).join(", ")}</dd></div>
          <div><dt>Trust state</dt><dd><div className="trust-context"><TrustStateBadge record={record} /><AutonomyBadge record={record} /></div></dd></div>
          <div><dt>Eligibility</dt><dd><TrustDecisionSummary record={record} /></dd></div>
          <div><dt>Certification</dt><dd>{record.certificationState}{record.certificationKey ? ` · ${record.certificationKey}` : " · no certification"}</dd></div>
          <div><dt>Autonomy decision</dt><dd>{record.autonomyDecisionKey}</dd></div>
          <div><dt>Decision reasons</dt><dd>{record.promotionReasonCodes.join(", ")}</dd></div>
          <div><dt>Conflict</dt><dd>{record.conflictStatus}</dd></div>
          <div><dt>Amendment</dt><dd>{record.amendmentStatus}</dd></div>
          <div><dt>Anomaly</dt><dd>{record.anomalyStatus}</dd></div>
          <div><dt>Provenance</dt><dd>{record.extraction.method} · {record.extraction.modelAssisted ? "model-assisted" : "deterministic"}</dd></div>
          <div><dt>Versions</dt><dd>{record.recordVersion} · {record.evidence.documentVersion} · {record.policyVersion}</dd></div>
        </dl>
        <p className="admin-muted">Raw copyrighted documents and unrestricted storage paths are not rendered. This page uses safe evidence coordinates only.</p>
      </article>
      <article className="panel queue-panel">
        <p className="panel-label">Decision history</p>
        <h2>Append-only review trail</h2>
        {reviewCase.reviewHistory.length === 0 ? <p className="admin-muted">No decisions yet.</p> : reviewCase.reviewHistory.map((event) => <p key={`${event.action}-${event.decidedAt}`}>{event.action} by {event.actor}</p>)}
        {grouped.length > 0 ? <p className="admin-muted">Grouped observations: {grouped.map((item) => item.stableRecordId).join(", ")}</p> : <p className="admin-muted">No grouped duplicate observations.</p>}
        <DecisionForm reviewCase={reviewCase} />
      </article>
    </section>
  );
}

export async function DataTrustSettingsPanel() {
  const policy = getVisibilityPolicy();
  return (
    <section className="panel queue-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-label">Visibility policy</p>
          <h2>Data trust settings</h2>
        </div>
        <ConfidenceBadge level="High" />
      </div>
      <p className="admin-muted">Changing visibility settings controls display only. It does not mutate trust state, evidence, review decisions, or certification history.</p>
      <div className="settings-grid">
        {Object.entries(policy.settings).map(([name, value]) => (
          <article className="setting-card" key={name}>
            <label><input type="checkbox" defaultChecked={value} /> {name.replaceAll("_", " ")}</label>
            <p>Default: {String(policy.defaults[name])}. Impact: display policy only; audit history remains append-only.</p>
          </article>
        ))}
      </div>
      <p className="admin-muted">Last changed by {policy.updatedBy} at {policy.updatedAt}. Policy version: {policy.policyVersion}.</p>
    </section>
  );
}

export function AdminToolPanel({ route }: { route: RouteDefinition }) {
  return (
    <section className="placeholder-grid">
      <article className="panel placeholder-panel">
        <p className="panel-label">Protected tool</p>
        <h2>{route.label}</h2>
        <p>This route now requires a Supabase user mapped to reviewer or admin in the private role table.</p>
      </article>
      <article className="panel placeholder-panel">
        <p className="panel-label">Write controls</p>
        <h2>Explicitly deferred</h2>
        <p>PR 8 wires protected reads and bootstrap verification; mutating workflows stay scoped to later reviewed actions.</p>
      </article>
    </section>
  );
}

function QueueItem({ item }: { item: ReviewQueueItem }) {
  return (
    <article className="queue-item">
      <div>
        <strong>{item.subjectLabel}</strong>
        <p>{item.subjectType} · {item.state} · due {item.dueAt ?? "not set"}</p>
      </div>
      <span className="disabled-action">{item.priority}</span>
    </article>
  );
}

export async function ReviewQueuePanel() {
  let items: ReviewQueueItem[] = [];
  let error: string | undefined;

  try {
    items = await listReviewQueueItems();
  } catch (caught) {
    error = caught instanceof Error ? caught.message : "Review queue could not be loaded.";
  }

  return (
    <section className="panel queue-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-label">Pending review</p>
          <h2>Review queue</h2>
        </div>
        <ConfidenceBadge level="High" />
      </div>
      {error ? <p className="admin-muted">{error}</p> : null}
      {!error && items.length === 0 ? <p className="admin-muted">No pending review items are visible for this reviewer.</p> : null}
      {items.map((item) => <QueueItem item={item} key={item.id} />)}
    </section>
  );
}

export async function AdminHealthPanel() {
  const report = await evaluateReadiness({
    env: process.env,
    listSnapshots: listPublishedSnapshots,
  });

  return (
    <section className="panel queue-panel">
      <div className="panel-heading">
        <div>
          <p className="panel-label">Readiness</p>
          <h2>Production health</h2>
        </div>
        <ConfidenceBadge level={report.status === "ok" ? "High" : report.status === "degraded" ? "Medium" : "Low"} />
      </div>
      <p className="admin-muted">Last checked {report.checkedAt}. Published snapshots visible: {report.summary.publishedSnapshotCount}.</p>
      {report.checks.map((check) => (
        <article className="queue-item" key={check.name}>
          <div>
            <strong>{check.name.replaceAll("_", " ")}</strong>
            <p>{check.message}</p>
          </div>
          <span className="disabled-action">{check.status}</span>
        </article>
      ))}
    </section>
  );
}
