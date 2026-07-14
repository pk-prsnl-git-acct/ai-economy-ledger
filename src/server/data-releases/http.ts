import "server-only";

import { INDEX_CACHE_CONTROL, RELEASE_CACHE_CONTROL } from "./contract";

export function quotedEtag(hash: string) {
  return `"${hash}"`;
}

export function notModified(request: Request, etag: string, cacheControl: string) {
  if (request.headers.get("if-none-match") !== etag) return null;
  return new Response(null, { status: 304, headers: { ETag: etag, "Cache-Control": cacheControl } });
}

export function jsonResponse(request: Request, body: unknown, hash: string, immutable = false) {
  const etag = quotedEtag(hash);
  const cacheControl = immutable ? RELEASE_CACHE_CONTROL : INDEX_CACHE_CONTROL;
  return notModified(request, etag, cacheControl) ?? Response.json(body, {
    headers: { ETag: etag, "Cache-Control": cacheControl, "X-Content-Type-Options": "nosniff" }
  });
}

export function artifactResponse(request: Request, bytes: Buffer, name: string, mediaType: string, hash: string) {
  const etag = quotedEtag(hash);
  const cached = notModified(request, etag, RELEASE_CACHE_CONTROL);
  if (cached) return cached;
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Cache-Control": RELEASE_CACHE_CONTROL,
      "Content-Disposition": `attachment; filename="${name}"`,
      "Content-Type": mediaType,
      ETag: etag,
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown release error";
  return Response.json({ error: { code: "release_contract_rejected", message } }, {
    status: 400,
    headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" }
  });
}
