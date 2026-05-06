import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runTests } from "@vscode/test-electron";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionDevelopmentPath = path.join(root, "apps", "extension");
const extensionTestsPath = path.join(extensionDevelopmentPath, "smoke", "suite", "index.cjs");
const workspacePath = path.join(tmpdir(), "smartide-extension-smoke-workspace");

await mkdir(workspacePath, { recursive: true });

await runTests({
  extensionDevelopmentPath,
  extensionTestsPath,
  launchArgs: [
    workspacePath,
    "--disable-extensions"
  ]
});
