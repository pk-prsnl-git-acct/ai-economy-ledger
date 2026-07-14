import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const port = 8788;
const workerPath = resolve(".open-next/worker.js");
const cliPath = resolve(`node_modules/.bin/opennextjs-cloudflare${process.platform === "win32" ? ".cmd" : ""}`);

if (!existsSync(workerPath)) {
  console.error("Missing .open-next/worker.js. Run pnpm build:cloudflare before the preview smoke test.");
  process.exit(1);
}

let output = "";
const preview = spawn(cliPath, ["preview", "--env", "preview", "--port", String(port)], {
  detached: process.platform !== "win32",
  env: { ...process.env, NO_COLOR: "1" },
  stdio: ["ignore", "pipe", "pipe"]
});

preview.stdout.on("data", (chunk) => { output += chunk.toString(); });
preview.stderr.on("data", (chunk) => { output += chunk.toString(); });

const exited = new Promise((resolveExit) => preview.once("exit", (code, signal) => resolveExit({ code, signal })));

async function stopPreview() {
  if (preview.exitCode !== null) return;

  if (process.platform !== "win32" && preview.pid) {
    try {
      process.kill(-preview.pid, "SIGTERM");
    } catch {
      preview.kill("SIGTERM");
    }
  } else {
    preview.kill("SIGTERM");
  }

  await Promise.race([exited, new Promise((resolveTimeout) => setTimeout(resolveTimeout, 3000))]);
  if (preview.exitCode === null) preview.kill("SIGKILL");
}

try {
  let response;

  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (preview.exitCode !== null) throw new Error(`Cloudflare preview exited before becoming ready.\n${output}`);

    try {
      response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) break;
    } catch {
      // The local Worker is still starting.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }

  if (!response?.ok) throw new Error(`Cloudflare preview did not become healthy.\n${output}`);

  const routeChecks = [
    ["/", ["AI Economy Ledger", "fictional placeholders", "excluded from verified totals"]],
    ["/market", ["Useful analysis begins with what the data cannot say", "Limited views", "Missing values are unavailable"]],
    ["/events", ["Source-attributed metric observations", "Mixed metrics are not aggregated"]],
    ["/companies", ["Five companies, with the limits attached", "Not a complete financial statement"]],
    ["/relationships", ["No edge without evidence", "does not draw a speculative network"]],
    ["/methodology", ["Trust comes from showing the math", "Core equation"]],
    ["/admin/review-queue", ["Protected admin access", "Supabase session required"]],
    ["/data", ["Latest source-attributed", "Candidate only", "missing values are never converted to zero"]],
    ["/data/releases", ["dataset-release:1:5424bda5073c2a1a09cb", "30b8a9ccb5687695"]],
    ["/data/releases/dataset-release%3A1%3A5424bda5073c2a1a09cb", ["Trust and decisions stay separate", "Human verified"]],
    ["/data/coverage", ["Expected cells", "6.67%", "Denominator limits"]],
    ["/data/sources", ["source-manifest@34.0.0", "Official source"]],
    ["/data/revisions", ["No prior release, so no semantic delta"]],
    ["/data/corrections", ["No public corrections in this first candidate"]]
  ];

  for (const [route, expectedText] of routeChecks) {
    const routeResponse = await fetch(`http://127.0.0.1:${port}${route}`);
    const body = await routeResponse.text();
    if (!routeResponse.ok) throw new Error(`Cloudflare preview route ${route} returned HTTP ${routeResponse.status}.`);
    for (const text of expectedText) {
      if (!body.includes(text)) throw new Error(`Cloudflare preview route ${route} did not contain: ${text}`);
    }
  }

  const releaseId = "dataset-release:1:5424bda5073c2a1a09cb";
  const releasePath = encodeURIComponent(releaseId);
  const apiChecks = [
    ["/api/data/releases", "max-age=60", "public-dataset-release@34.0.0"],
    [`/api/data/releases/${releasePath}`, "immutable", releaseId],
    [`/api/data/releases/${releasePath}/records?lane=latest_source_attributed&format=json`, "immutable", "source_attributed_unverified"],
    [`/api/data/releases/${releasePath}/records?lane=verified&format=csv`, "immutable", "stableRecordId"],
    [`/api/data/releases/${releasePath}/coverage?format=json`, "immutable", '"expectedCellCount":60'],
    [`/api/data/releases/${releasePath}/sources?format=json`, "immutable", "source-manifest@34.0.0"],
    [`/api/data/releases/${releasePath}/revisions`, "immutable", '"revisions":[]'],
    ["/api/data/corrections", "max-age=60", '"corrections":[]'],
    ["/api/data/analytics", "max-age=60", "public-market-intelligence@37.0.0"],
    ["/api/data/analytics/view-catalog.json", "immutable", "available_with_limitations"]
  ];

  for (const [route, cacheFragment, expectedText] of apiChecks) {
    const routeResponse = await fetch(`http://127.0.0.1:${port}${route}`);
    const body = await routeResponse.text();
    if (!routeResponse.ok) throw new Error(`Cloudflare preview API ${route} returned HTTP ${routeResponse.status}.`);
    if (!routeResponse.headers.get("cache-control")?.includes(cacheFragment)) throw new Error(`Cloudflare preview API ${route} has the wrong cache policy.`);
    if (!body.includes(expectedText)) throw new Error(`Cloudflare preview API ${route} did not contain: ${expectedText}`);
    const etag = routeResponse.headers.get("etag");
    if (!etag) throw new Error(`Cloudflare preview API ${route} did not return an ETag.`);
    const conditional = await fetch(`http://127.0.0.1:${port}${route}`, { headers: { "If-None-Match": etag } });
    if (conditional.status !== 304) throw new Error(`Cloudflare preview API ${route} did not honor If-None-Match.`);
  }

  const rejected = await fetch(`http://127.0.0.1:${port}/api/data/releases/${releasePath}/records?lane=private&format=json`);
  if (rejected.status !== 400 || !rejected.headers.get("cache-control")?.includes("no-store")) {
    throw new Error("Cloudflare preview did not reject an unsupported record lane safely.");
  }

  const unsafeAnalytics = await fetch(`http://127.0.0.1:${port}/api/data/analytics/private.json`);
  if (unsafeAnalytics.status !== 400 || !unsafeAnalytics.headers.get("cache-control")?.includes("no-store")) {
    throw new Error("Cloudflare preview did not reject an unsafe analytics artifact path.");
  }

  console.log(`Cloudflare preview smoke passed for ${routeChecks.length} pages and ${apiChecks.length} API routes.`);
} finally {
  await stopPreview();
}
