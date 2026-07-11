const DEFAULT_MAX_SNAPSHOT_AGE_DAYS = 45;

export async function evaluateReadiness(options = {}) {
  const now = options.now ?? new Date();
  const env = options.env ?? process.env;
  const maxSnapshotAgeDays = options.maxSnapshotAgeDays ?? DEFAULT_MAX_SNAPSHOT_AGE_DAYS;
  const checks = [
    checkRequiredRuntimeEnv(env),
    checkHealthcheckToken(env),
  ];

  let snapshots = [];
  if (checks.some((check) => check.name === "runtime_env" && check.status === "fail")) {
    checks.push(fail("public_snapshot_rpc", "Public snapshot RPC cannot run until Supabase public env is configured."));
  } else {
    try {
      snapshots = await options.listSnapshots();
      checks.push(pass("public_snapshot_rpc", "Public snapshot RPC responded."));
    } catch {
      checks.push(fail("public_snapshot_rpc", "Public snapshot RPC is unavailable."));
    }
  }

  checks.push(...evaluateSnapshotFreshness(snapshots, now, maxSnapshotAgeDays));

  const status = checks.some((check) => check.status === "fail")
    ? "down"
    : checks.some((check) => check.status === "warn")
      ? "degraded"
      : "ok";

  return {
    status,
    checkedAt: now.toISOString(),
    maxSnapshotAgeDays,
    summary: summarizeSnapshots(snapshots, now),
    checks,
  };
}

export function summarizeReadiness(report) {
  return {
    status: report.status,
    checkedAt: report.checkedAt,
    checks: report.checks.map((check) => ({
      name: check.name,
      status: check.status,
    })),
  };
}

function checkRequiredRuntimeEnv(env) {
  const missing = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"].filter((name) => !env[name]);
  if (missing.length > 0) {
    return fail("runtime_env", `Missing required public data environment: ${missing.join(", ")}.`);
  }
  return pass("runtime_env", "Required public data environment is configured.");
}

function checkHealthcheckToken(env) {
  if (!env.HEALTHCHECK_TOKEN) return fail("healthcheck_token", "HEALTHCHECK_TOKEN is not configured.");
  return pass("healthcheck_token", "Healthcheck token is configured.");
}

function evaluateSnapshotFreshness(snapshots, now, maxSnapshotAgeDays) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) {
    return [
      warn("published_snapshot_presence", "No published snapshots are available yet."),
      warn("published_snapshot_freshness", "Freshness cannot be evaluated until a snapshot is published."),
    ];
  }

  const latest = latestSnapshot(snapshots);
  if (!latest?.published_at) {
    return [fail("published_snapshot_freshness", "Latest published snapshot is missing a published_at timestamp.")];
  }

  const ageDays = ageInDays(latest.published_at, now);
  if (!Number.isFinite(ageDays)) {
    return [fail("published_snapshot_freshness", "Latest published snapshot has an invalid published_at timestamp.")];
  }

  const freshnessCheck = ageDays > maxSnapshotAgeDays
    ? warn("published_snapshot_freshness", `Latest published snapshot is ${ageDays} days old.`, { ageDays })
    : pass("published_snapshot_freshness", `Latest published snapshot is ${ageDays} days old.`, { ageDays });

  return [
    pass("published_snapshot_presence", `${snapshots.length} published snapshot record(s) are visible.`),
    freshnessCheck,
  ];
}

function summarizeSnapshots(snapshots, now) {
  const latest = Array.isArray(snapshots) ? latestSnapshot(snapshots) : undefined;
  const ageDays = latest?.published_at ? ageInDays(latest.published_at, now) : null;
  return {
    publishedSnapshotCount: Array.isArray(snapshots) ? snapshots.length : 0,
    latestPublishedAt: latest?.published_at ?? null,
    latestSnapshotSlug: latest?.slug ?? null,
    latestSnapshotVersion: latest?.version ?? null,
    latestSnapshotAgeDays: Number.isFinite(ageDays) ? ageDays : null,
  };
}

function latestSnapshot(snapshots) {
  return snapshots
    .filter((snapshot) => snapshot?.published_at)
    .sort((left, right) => String(right.published_at).localeCompare(String(left.published_at)))[0];
}

function ageInDays(value, now) {
  const publishedAt = new Date(value);
  const milliseconds = now.getTime() - publishedAt.getTime();
  if (!Number.isFinite(milliseconds)) return Number.NaN;
  return Math.max(0, Math.floor(milliseconds / 86_400_000));
}

function pass(name, message, details = {}) {
  return { name, status: "pass", severity: "info", message, ...details };
}

function warn(name, message, details = {}) {
  return { name, status: "warn", severity: "warning", message, ...details };
}

function fail(name, message, details = {}) {
  return { name, status: "fail", severity: "critical", message, ...details };
}
