import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const releaseDirectory = "data/releases/tranche4_set1_candidate";
const analyticsDirectory = "data/analytics/tranche4_set1_candidate";
const releaseOutputPath = "src/server/tranche4/generated/set1-candidate-release-artifacts.json";
const analyticsOutputPath = "src/server/tranche4/generated/set1-candidate-analytics-artifacts.json";
const compatibilityOutputPath = "src/server/tranche4/generated/set1-candidate-compatibility-source.json";
const compatibilityPath = "data/contracts/tranche4/set1_candidate_public_compatibility.json";

const releaseManifest = JSON.parse(readFileSync(join(releaseDirectory, "candidate-manifest.json"), "utf8"));
const analyticsManifest = JSON.parse(readFileSync(join(analyticsDirectory, "analytics-manifest.json"), "utf8"));
const compatibilityBytes = readFileSync(compatibilityPath);
const compatibility = JSON.parse(compatibilityBytes);

if (releaseManifest.candidateId !== compatibility.candidateId) throw new Error("Tranche 4 candidate ID mismatch during embed");
if (releaseManifest.manifestHash !== compatibility.candidateManifestHash) throw new Error("Tranche 4 candidate manifest mismatch during embed");
if (analyticsManifest.candidateId !== compatibility.candidateId) throw new Error("Tranche 4 analytics candidate ID mismatch during embed");
if (analyticsManifest.manifestHash !== compatibility.analyticsManifestHash) throw new Error("Tranche 4 analytics manifest mismatch during embed");

const encodeArtifacts = (directory, names) =>
  Object.fromEntries([...names].sort().map((name) => [name, readFileSync(join(directory, name)).toString("base64")]));

const releaseArtifacts = encodeArtifacts(releaseDirectory, releaseManifest.artifacts.map((artifact) => artifact.name).concat("candidate-manifest.json"));
const analyticsArtifacts = encodeArtifacts(analyticsDirectory, analyticsManifest.descriptors.map((artifact) => artifact.name).concat("analytics-manifest.json"));

mkdirSync(dirname(releaseOutputPath), { recursive: true });
writeFileSync(releaseOutputPath, `${JSON.stringify(releaseArtifacts)}\n`, "utf8");
writeFileSync(analyticsOutputPath, `${JSON.stringify(analyticsArtifacts)}\n`, "utf8");
writeFileSync(compatibilityOutputPath, `${JSON.stringify({ base64: compatibilityBytes.toString("base64") })}\n`, "utf8");
console.log(`Generated Tranche 4 candidate modules from ${Object.keys(releaseArtifacts).length} release and ${Object.keys(analyticsArtifacts).length} analytics artifacts.`);
