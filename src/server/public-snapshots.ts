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

const SNAPSHOT_RPC_TIMEOUT_MS = 8_000;

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

  let response: Response;
  try {
    response = await fetch(`${url}/rest/v1/rpc/${functionName}`, {
      method: "POST",
      headers: { apikey: key, "content-type": "application/json", "accept-profile": "api", "content-profile": "api" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(SNAPSHOT_RPC_TIMEOUT_MS),
    });
  } catch {
    throw new PublicSnapshotError(503, "Public snapshot database is temporarily unavailable");
  }
  if (!response.ok) throw new PublicSnapshotError(502, "Public snapshot data is unavailable");
  try {
    return (await response.json()) as T;
  } catch {
    throw new PublicSnapshotError(502, "Public snapshot data returned an invalid response");
  }
}
