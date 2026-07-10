import { spawnSync } from "node:child_process";

const checks = [
  ["lint", ["scripts/ci/run-lint.mjs"]],
  ["typecheck", ["node_modules/typescript/bin/tsc", "--noEmit"]],
  ["test", ["--test", "tests/repository.test.mjs", "tests/runtime-scaffold.test.mjs"]],
  ["validate:data", ["scripts/ci/validate-data.mjs"]]
];

for (const [name, args] of checks) {
  console.log(`\n> ${name}`);
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("\nAll foundation checks passed.");
