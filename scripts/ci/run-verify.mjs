import { spawnSync } from "node:child_process";

const checks = [
  ["lint", ["scripts/ci/run-lint.mjs"]],
  ["typecheck", ["node_modules/typescript/bin/tsc", "--noEmit"]],
  ["migration-check", ["node_modules/drizzle-kit/bin.cjs", "check"]],
  [
    "test",
    [
      "--test",
      "tests/repository.test.mjs",
      "tests/runtime-scaffold.test.mjs",
      "tests/database-foundation.test.mjs",
      "tests/ux-shell.test.mjs",
      "tests/import-templates.test.mjs",
      "tests/kpi-calculations.test.mjs",
      "tests/publication-runtime.test.mjs",
      "tests/admin-runtime.test.mjs"
    ]
  ],
  ["validate:data", ["scripts/ci/validate-data.mjs"]]
];

for (const [name, args] of checks) {
  console.log(`\n> ${name}`);
  const result = spawnSync(process.execPath, args, { stdio: "inherit" });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

console.log("\nAll foundation checks passed.");
