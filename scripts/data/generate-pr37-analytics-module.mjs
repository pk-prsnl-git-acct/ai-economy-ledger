import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const sourceDirectory = "data/analytics/pr37_release_candidate";
const outputPath = "src/server/market-intelligence/generated/pr37-analytics-artifacts.json";
const contractPath = "data/contracts/analytics/pr37_market_intelligence_contract.json";
const contractOutputPath = "src/server/market-intelligence/generated/pr37-contract-source.json";
const contractBytes = readFileSync(contractPath);
const contract = JSON.parse(contractBytes);
const manifest = JSON.parse(readFileSync(join(sourceDirectory, "analytics-manifest.json"), "utf8"));

if (manifest.contractVersion !== contract.contractVersion) throw new Error("PR37 contract mismatch during embed");
const artifacts = Object.fromEntries(
  [...manifest.artifactNames].sort().map((name) => [name, readFileSync(join(sourceDirectory, name)).toString("base64")]),
);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(artifacts)}\n`, "utf8");
writeFileSync(contractOutputPath, `${JSON.stringify({ base64: contractBytes.toString("base64") })}\n`, "utf8");
console.log(`Generated ${outputPath} from ${Object.keys(artifacts).length} hash-bound artifacts.`);
