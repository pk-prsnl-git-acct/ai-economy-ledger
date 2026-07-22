import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

function presentation() {
  const code = `import * as presentation from "./src/ui/public-presentation.ts"; console.log(JSON.stringify({ fiscal: [presentation.formatFiscalPeriod("period:entity:company:amazon:FY2016"), presentation.formatFiscalPeriod("entity:company:alphabet:FY2025"), presentation.formatFiscalPeriod("Q1_FY2026")], release: presentation.formatReleaseLabel({sequence: 1, status: "published", effectiveAt: "2026-07-14T00:00:00Z"}), trust: presentation.formatTrustState("source_attributed_unverified"), source: presentation.formatSourceClass("official_public_metadata_and_structured_facts"), methodology: presentation.formatMethodologyVersion("methodology@31.0") }));`;
  return JSON.parse(execFileSync(process.execPath, ["--experimental-strip-types", "-e", code], { encoding: "utf8" }));
}

test("public presentation helpers humanize fiscal, release, methodology, source, and trust labels", () => {
  assert.deepEqual(presentation(), {
    fiscal: ["FY2016", "FY2025", "Q1 FY2026"],
    release: "Release 1 · Published Jul 14, 2026",
    trust: "Source-attributed",
    source: "Official Public Metadata And Structured Facts",
    methodology: "Methodology version 31.0",
  });
});

test("primary public renderers do not expose raw entity-period keys or raw release status", () => {
  const ledger = readFileSync("components/production-ledger.tsx", "utf8");
  const release = readFileSync("components/release-trust.tsx", "utf8");
  const index = readFileSync("app/data/releases/page.tsx", "utf8");
  const css = readFileSync("app/globals.css", "utf8");

  assert.match(ledger, /formatFiscalPeriod/);
  assert.match(ledger, /includeCompany/);
  assert.match(ledger, /<th>Company<\/th>/);
  assert.doesNotMatch(ledger, /Current period/);
  assert.match(release, /formatReleaseLabel/);
  assert.match(release, /Technical release details/);
  assert.match(index, /formatReleaseStatus/);
  assert.match(css, /font-size: clamp\(2\.9rem, 5\.5vw, 4\.35rem\)/);
  assert.match(css, /font-size: clamp\(2\.25rem, 10vw, 2\.6rem\)/);
});

test("raw values remain restricted to technical artifacts and APIs", () => {
  const contract = readFileSync("src/server/data-releases/contract.ts", "utf8");
  const artifactRoute = readFileSync("app/api/data/releases/[releaseId]/artifacts/[artifactName]/route.ts", "utf8");
  assert.match(contract, /period: string/);
  assert.match(artifactRoute, /getArtifact/);
});
