const baseUrl = new URL(process.env.BASE_URL ?? "https://aieconomyledger.com");
const releaseId = process.env.RELEASE_ID ?? "dataset-release:1:5afe53aac50ebf946fe2";
const requireClean = process.env.REQUIRE_CLEAN === "true";
const encodedReleaseId = encodeURIComponent(releaseId);
const companyIds = ["alphabet", "amazon", "meta", "microsoft", "nvidia"].map((company) => `entity%3Acompany%3A${company}`);
const routes = ["/", "/ai-stack", "/market", "/events", "/relationships", "/companies", "/funding", "/revenue-debt", "/compute-infra", "/circularity", "/methodology", "/sources", "/downloads", "/data", "/data/releases", "/data/coverage", "/data/quality", "/data/sources", "/data/revisions", "/data/corrections", `/data/releases/${encodedReleaseId}`, ...companyIds.map((id) => `/companies/${id}`)];
const forbidden = /Sample interface only|Registry preview|Core equation · preview|private note|service_role|authorization|candidate 2/i;

function sameOrigin(url) { return url.origin === baseUrl.origin; }

async function fetchPage(path) {
  const response = await fetch(new URL(path, baseUrl));
  const body = await response.text();
  if (!response.ok) throw new Error(`${path} returned ${response.status}`);
  if (forbidden.test(body)) throw new Error(`${path} exposed forbidden production content`);
  if (!/<title>|AI Economy Ledger/i.test(body)) throw new Error(`${path} did not render an expected public page title`);
  return body;
}

const discovered = new Set();
const findings = [];
for (const route of routes) {
  let body;
  try { body = await fetchPage(route); }
  catch (error) {
    if (requireClean) throw error;
    findings.push(error instanceof Error ? error.message : String(error));
    continue;
  }
  for (const rawHref of body.matchAll(/href="([^"]+)"/g)) {
    const url = new URL(rawHref[1], baseUrl);
    if (sameOrigin(url) && url.pathname.startsWith("/") && !url.pathname.startsWith("/admin")) discovered.add(`${url.pathname}${url.search}`);
  }
}

for (const route of discovered) {
  const response = await fetch(new URL(route, baseUrl), { redirect: "manual" });
  if (!(response.ok || [301, 302, 307, 308].includes(response.status))) {
    const message = `internal link ${route} returned ${response.status}`;
    if (requireClean) throw new Error(message);
    findings.push(message);
  }
}

for (const artifact of ["manifest.json", "records-latest-source-attributed.json", "records-latest-source-attributed.csv", "coverage.json", "sources.json", "revisions.json"]) {
  const response = await fetch(new URL(`/api/data/releases/${encodedReleaseId}/artifacts/${artifact}`, baseUrl));
  if (!response.ok || !response.headers.get("etag") || !response.headers.get("cache-control")?.includes("immutable")) throw new Error(`artifact ${artifact} lacks expected integrity cache headers`);
  if (!(await response.arrayBuffer()).byteLength) throw new Error(`artifact ${artifact} is empty`);
}

console.log(JSON.stringify({ baseUrl: baseUrl.origin, routes: routes.length, internalLinks: discovered.size, releaseId, findings }, null, 2));
