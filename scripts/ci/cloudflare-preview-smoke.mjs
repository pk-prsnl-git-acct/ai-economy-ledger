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
const preview = spawn(cliPath, ["preview", "--port", String(port)], {
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
    ["/companies", ["Company comparison preview", "Sample interface only"]],
    ["/methodology", ["Trust comes from showing the math", "Core equation"]],
    ["/admin/review-queue", ["Static admin preview", "Review unavailable"]]
  ];

  for (const [route, expectedText] of routeChecks) {
    const routeResponse = await fetch(`http://127.0.0.1:${port}${route}`);
    const body = await routeResponse.text();
    if (!routeResponse.ok) throw new Error(`Cloudflare preview route ${route} returned HTTP ${routeResponse.status}.`);
    for (const text of expectedText) {
      if (!body.includes(text)) throw new Error(`Cloudflare preview route ${route} did not contain: ${text}`);
    }
  }

  console.log(`Cloudflare preview smoke passed for ${routeChecks.length} representative routes.`);
} finally {
  await stopPreview();
}
