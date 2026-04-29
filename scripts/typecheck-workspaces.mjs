import { spawn } from "node:child_process";
import { existsSync } from "node:fs";

const tsconfigPaths = [
  "packages/protocol/tsconfig.json",
  "packages/providers/tsconfig.json",
  "packages/storage/tsconfig.json",
  "packages/agent-core/tsconfig.json",
  "packages/cli/tsconfig.json",
  "apps/extension/tsconfig.json",
];

const existingTsconfigs = tsconfigPaths.filter((path) => existsSync(path));

if (existingTsconfigs.length === 0) {
  console.log("No workspace tsconfig files found; skipping typecheck.");
  process.exit(0);
}

const child = spawn("tsc", ["-b", ...existingTsconfigs, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
