export type ReadinessStatus = "ok" | "degraded" | "down";
export type ReadinessCheckStatus = "pass" | "warn" | "fail";

export type ReadinessCheck = {
  name: string;
  status: ReadinessCheckStatus;
  severity: "info" | "warning" | "critical";
  message: string;
  ageDays?: number;
};

export type ReadinessReport = {
  status: ReadinessStatus;
  checkedAt: string;
  maxSnapshotAgeDays: number;
  summary: {
    publishedSnapshotCount: number;
    latestPublishedAt: string | null;
    latestSnapshotSlug: string | null;
    latestSnapshotVersion: number | null;
    latestSnapshotAgeDays: number | null;
  };
  checks: ReadinessCheck[];
};

export function evaluateReadiness(options?: {
  now?: Date;
  env?: Record<string, string | undefined>;
  maxSnapshotAgeDays?: number;
  listSnapshots?: () => Promise<Array<{ slug?: string; version?: number; published_at?: string }>>;
}): Promise<ReadinessReport>;

export function summarizeReadiness(report: ReadinessReport): {
  status: ReadinessStatus;
  checkedAt: string;
  checks: Array<{ name: string; status: ReadinessCheckStatus }>;
};
