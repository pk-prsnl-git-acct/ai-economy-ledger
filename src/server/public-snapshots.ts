import "server-only";

type SnapshotSummary = {
  slug: string;
  version: number;
  methodology_version_id: string;
  source_count: number;
  observation_count: number;
  published_at: string;
  content_sha256: string;
};

export async function listPublishedSnapshots(): Promise<SnapshotSummary[]> {
  return callSnapshotRpc<SnapshotSummary[]>("list_published_snapshots", {});
}

export async function getPublishedSnapshot(slug: string, version?: number): Promise<unknown | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new PublicSnapshotError(400, "Invalid snapshot slug");
  if (version !== undefined && (!Number.isSafeInteger(version) || version < 1)) {
    throw new PublicSnapshotError(400, "Invalid snapshot version");
  }
  return callSnapshotRpc<unknown | null>("get_published_snapshot", {
    requested_slug: slug,
    requested_version: version ?? null,
  });
}

export class PublicSnapshotError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

async function callSnapshotRpc<T>(functionName: string, body: object): Promise<T> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new PublicSnapshotError(503, "Public snapshot data is not configured");

  const response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
    method: "POST",
    headers: { apikey: key, "content-type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) throw new PublicSnapshotError(502, "Public snapshot data is unavailable");
  return (await response.json()) as T;
}
