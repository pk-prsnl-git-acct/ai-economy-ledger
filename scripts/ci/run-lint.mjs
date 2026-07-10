import { spawnSync } from "node:child_process";

const checks = [
  [process.execPath, ["scripts/ci/validate-repository.mjs", "--mode=lint"]],
  [process.execPath, ["node_modules/eslint/bin/eslint.js", "."]]
];

for (const [command, args] of checks) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("Lint checks passed.");
