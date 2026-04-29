import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const workspaces = [
  "@ai-ide-agent/protocol",
  "@ai-ide-agent/providers",
  "@ai-ide-agent/storage",
  "@ai-ide-agent/agent-core",
  "@ai-ide-agent/cli",
  "ai-ide-agent-extension",
];

const hasWorkspaces = workspaces.some((workspace) => {
  const packagePath =
    workspace === "ai-ide-agent-extension"
      ? "apps/extension/package.json"
      : `packages/${workspace.replace("@ai-ide-agent/", "")}/package.json`;
  return existsSync(packagePath);
});

if (!hasWorkspaces) {
  console.log("No workspace packages found; skipping workspace build.");
  process.exit(0);
}

for (const workspace of workspaces) {
  const result = spawnSync("npm", ["run", "build", "-w", workspace], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

  if (result.signal) {
    process.kill(process.pid, result.signal);
  }
}
