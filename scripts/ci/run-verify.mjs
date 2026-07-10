import { spawnSync } from "node:child_process";

const checks = [
  ["lint", ["scripts/ci/validate-repository.mjs", "--mode=lint"]],
  ["typecheck", ["scripts/ci/validate-repository.mjs", "--mode=typecheck"]],
  ["test", ["--test", "tests/repository.test.mjs"]],
  ["validate:data", ["scripts/ci/validate-data.mjs"]]
];

for (const [name, args] of checks) {
  console.log(`\n> ${name}`);
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("\nAll foundation checks passed.");
