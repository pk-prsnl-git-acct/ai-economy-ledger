import { NextResponse } from "next/server";

import { evaluateReadiness, summarizeReadiness } from "@/src/server/modules/health/readiness.mjs";
import { listPublishedSnapshots } from "@/src/server/public-snapshots";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const expectedToken = process.env.HEALTHCHECK_TOKEN;
  if (!expectedToken) {
    return noStore({ error: { message: "Healthcheck token is not configured" } }, 503);
  }

  if (!isAuthorized(request, expectedToken)) {
    return noStore({ error: { message: "Unauthorized" } }, 401);
  }

  const report = await evaluateReadiness({
    env: process.env,
    listSnapshots: listPublishedSnapshots,
  });

  console.log(JSON.stringify({
    event: "readiness_check",
    source: request.headers.get("x-healthcheck-source") ?? "manual",
    ...summarizeReadiness(report),
  }));

  return noStore({ data: report }, report.status === "down" ? 503 : 200);
}

function isAuthorized(request: Request, expectedToken: string) {
  const headerToken = request.headers.get("x-healthcheck-token");
  const authorization = request.headers.get("authorization");
  const bearerToken = authorization?.toLowerCase().startsWith("bearer ") ? authorization.slice(7) : undefined;
  return headerToken === expectedToken || bearerToken === expectedToken;
}

function noStore(body: unknown, status: number) {
  return NextResponse.json(body, {
    status,
    headers: {
      "cache-control": "no-store",
    },
  });
}
