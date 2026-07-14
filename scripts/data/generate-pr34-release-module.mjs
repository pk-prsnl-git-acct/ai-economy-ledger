import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const sourceDirectory = "data/releases/pr34_release_candidate";
const outputPath = "src/server/data-releases/generated/pr34-release-artifacts.json";
const contract = JSON.parse(readFileSync("data/contracts/release/pr34_public_dataset_release_contract.json", "utf8"));
const artifacts = Object.fromEntries(
  [...contract.requiredArtifacts].sort().map((name) => [name, readFileSync(join(sourceDirectory, name)).toString("base64")]),
);

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(artifacts)}\n`, "utf8");
console.log(`Generated ${outputPath} from ${Object.keys(artifacts).length} hash-bound artifacts.`);
