import { existsSync, readdirSync } from "node:fs";

if (!existsSync("data")) {
  console.log("No data directory yet; data validation activates with the import-template PR.");
  process.exit(0);
}

const entries = readdirSync("data", { recursive: true });
const forbidden = entries.filter((entry) => /(^|\/)\.env|private|secret/i.test(String(entry)));
if (forbidden.length) {
  console.error(`Potential private files under data/: ${forbidden.join(", ")}`);
  process.exit(1);
}

console.log("Data directory safety checks passed.");
