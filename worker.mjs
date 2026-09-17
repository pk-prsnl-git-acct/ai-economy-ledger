import openNextWorker from "./.open-next/worker.js";

const HEALTH_PATH = "/api/internal/health";
const CANONICAL_HOST = "aieconomyledger.com";
const WWW_HOST = `www.${CANONICAL_HOST}`;

const worker = {
  async fetch(request, env, ctx) {
    const canonicalRedirect = redirectWwwToApex(request);
    if (canonicalRedirect) return canonicalRedirect;
    try {
      return await openNextWorker.fetch(request, env, ctx);
    } catch (error) {
      const requestId = request.headers.get("cf-ray") ?? crypto.randomUUID();
      console.error(JSON.stringify({
        event: "public_worker_request_failed",
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        errorType: error instanceof Error ? error.name : "UnknownError",
      }));
      return Response.json({ error: { code: "service_temporarily_unavailable", requestId } }, {
        status: 503,
        headers: { "cache-control": "no-store", "retry-after": "5" },
      });
    }
  },

  scheduled(controller, env, ctx) {
    ctx.waitUntil(runScheduledHealthcheck(controller, env, ctx));
  },
};

export default worker;

function redirectWwwToApex(request) {
  const url = new URL(request.url);
  if (url.hostname !== WWW_HOST) return undefined;

  url.hostname = CANONICAL_HOST;
  return Response.redirect(url.toString(), 308);
}

async function runScheduledHealthcheck(controller, env, ctx) {
  const startedAt = new Date().toISOString();
  const request = new Request(new URL(HEALTH_PATH, healthOrigin(env)), {
    headers: {
      "x-healthcheck-token": env.HEALTHCHECK_TOKEN ?? "",
      "x-healthcheck-source": "cloudflare-cron",
      "x-healthcheck-cron": controller.cron,
    },
  });

  try {
    const response = await openNextWorker.fetch(request, env, ctx);
    const body = await safeJson(response);
    const result = {
      event: "scheduled_readiness_check",
      cron: controller.cron,
      startedAt,
      statusCode: response.status,
      healthStatus: body?.data?.status ?? "unknown",
      checks: body?.data?.checks?.map((check) => ({ name: check.name, status: check.status })) ?? [],
    };
    const serialized = JSON.stringify(result);
    if (!response.ok || result.healthStatus === "down") console.error(serialized);
    else console.log(serialized);
  } catch (error) {
    console.error(JSON.stringify({
      event: "scheduled_readiness_check",
      cron: controller.cron,
      startedAt,
      statusCode: 0,
      healthStatus: "down",
      errorType: error instanceof Error ? error.name : "UnknownError",
    }));
  }
}

function healthOrigin(env) {
  return env.NEXT_PUBLIC_SITE_URL ?? "https://aieconomyledger.com";
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
