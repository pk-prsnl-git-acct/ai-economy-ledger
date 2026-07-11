import { NextResponse } from "next/server";

import { listPublishedSnapshots, PublicSnapshotError } from "@/src/server/public-snapshots";

export async function GET() {
  try {
    return NextResponse.json({ data: await listPublishedSnapshots() });
  } catch (error) {
    return apiError(error);
  }
}

function apiError(error: unknown) {
  const status = error instanceof PublicSnapshotError ? error.status : 500;
  const message = error instanceof PublicSnapshotError ? error.message : "Unexpected snapshot error";
  return NextResponse.json({ error: { message } }, { status });
}
