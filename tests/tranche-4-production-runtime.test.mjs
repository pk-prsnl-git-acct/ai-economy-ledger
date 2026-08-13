import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";

const port = 3013;

async function waitForPage(url, output) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.status !== 503) return response;
    } catch {
      // The local server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Candidate runtime did not become ready.\n${output()}`);
}

test("Candidate 8 production model loader renders through the server runtime", async () => {
  let output = "";
  const server = spawn("./node_modules/.bin/next", ["dev", "--port", String(port)], {
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", TRANCHE4_CANDIDATE_PREVIEW_ENABLED: "true" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => { output += chunk; });
  server.stderr.on("data", (chunk) => { output += chunk; });

  try {
    const response = await waitForPage(`http://127.0.0.1:${port}/tranche-4-candidate-preview`, () => output);
    const body = await response.text();
    assert.equal(response.status, 200, output);
    assert.match(body, /Track the public-company money flows behind the AI stack\./);
    assert.match(body, /17 companies/);
    assert.doesNotMatch(body, /compatibility contract version mismatch/);
  } finally {
    server.kill("SIGTERM");
  }
});
