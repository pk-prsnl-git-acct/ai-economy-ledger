import type { ReactNode } from "react";

import { AppShell, ConfidenceBadge, DataQualityPanel, HeroSection, RouteDirectory } from "@/components/ledger";
import { getAdminSession, type AdminSession } from "@/src/server/admin/session";
import { listReviewQueueItems, type ReviewQueueItem } from "@/src/server/admin/review-queue";
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
