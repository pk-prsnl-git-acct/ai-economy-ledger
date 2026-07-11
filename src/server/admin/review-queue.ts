import "server-only";

import postgres from "postgres";

export type ReviewQueueItem = {
  id: string;
  subjectType: "claim" | "observation" | "snapshot";
  subjectLabel: string;
  priority: "low" | "normal" | "high" | "critical";
  state: "pending" | "approved" | "rejected" | "needs_revision" | "superseded" | "stale" | "sample";
  dueAt: string | null;
  createdAt: string;
  notes: string | null;
};

function databaseUrl() {
  const value = process.env.DATABASE_URL;
  if (!value || value.startsWith("replace_")) {
    throw new Error("DATABASE_URL is required to read the admin review queue");
  }
  return value;
}

export async function listReviewQueueItems(limit = 25): Promise<ReviewQueueItem[]> {
  const sql = postgres(databaseUrl(), { max: 1, prepare: false, ssl: "require" });

  try {
    const rows = await sql<ReviewQueueItem[]>`
      select
        queue.id::text as "id",
        queue.subject_type as "subjectType",
        coalesce(claims.statement, observations.metric_key, snapshots.slug, queue.subject_type::text) as "subjectLabel",
        queue.priority,
        queue.state,
        queue.due_at::text as "dueAt",
        queue.created_at::text as "createdAt",
        queue.notes
      from ledger.review_queue as queue
      left join ledger.claims as claims on claims.id = queue.claim_id
      left join ledger.metric_observations as observations on observations.id = queue.observation_id
      left join ledger.published_snapshots as snapshots on snapshots.id = queue.snapshot_id
      where queue.state in ('pending', 'needs_revision')
      order by
        case queue.priority
          when 'critical' then 1
          when 'high' then 2
          when 'normal' then 3
          else 4
        end,
        queue.created_at asc
      limit ${limit}
    `;

    return rows;
  } finally {
    await sql.end();
  }
}
