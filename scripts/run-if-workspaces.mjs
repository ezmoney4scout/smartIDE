import { spawn } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const workspaceDirs = ["apps", "packages"];

const hasWorkspaces = workspaceDirs.some((dir) => {
  if (!existsSync(dir)) {
    return false;
  }

  return readdirSync(dir, { withFileTypes: true }).some((entry) => {
    return entry.isDirectory() && existsSync(join(dir, entry.name, "package.json"));
  });
});

if (!hasWorkspaces) {
  console.log("No workspace packages found; skipping workspace command.");
  process.exit(0);
}

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Missing command to run.");
  process.exit(1);
}

const child = spawn(command, args, {
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
