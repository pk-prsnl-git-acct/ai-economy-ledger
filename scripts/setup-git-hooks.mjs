import { execFileSync } from "node:child_process";

try {
  execFileSync("git", ["rev-parse", "--is-inside-work-tree"], { stdio: "ignore" });
  execFileSync("git", ["config", "--local", "core.hooksPath", ".githooks"], { stdio: "inherit" });
  execFileSync("git", ["config", "--local", "ael.nodePath", process.execPath], { stdio: "inherit" });
  console.log("Repository Git hooks enabled via .githooks.");
} catch {
  console.log("Git hooks were not configured because this is not a Git working tree.");
}
