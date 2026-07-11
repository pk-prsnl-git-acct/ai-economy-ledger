import { NextRequest, NextResponse } from "next/server";

import { getPublishedSnapshot, PublicSnapshotError } from "@/src/server/public-snapshots";

export async function GET(request: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await context.params;
    const rawVersion = request.nextUrl.searchParams.get("version");
    const version = rawVersion === null ? undefined : Number(rawVersion);
    const snapshot = await getPublishedSnapshot(slug, version);
    if (snapshot === null) return NextResponse.json({ error: { message: "Snapshot not found" } }, { status: 404 });
    return NextResponse.json({ data: snapshot });
  } catch (error) {
    const status = error instanceof PublicSnapshotError ? error.status : 500;
    const message = error instanceof PublicSnapshotError ? error.message : "Unexpected snapshot error";
    return NextResponse.json({ error: { message } }, { status });
  }
}
