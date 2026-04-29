import { mkdtemp, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { isCliEntrypoint, runDemo } from "../src/index.js";

const tempRoots: string[] = [];

describe("CLI demo", () => {
  afterEach(async () => {
    await Promise.all(tempRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
  });

  it("returns lifecycle JSON for a demo task", async () => {
    const workspaceRoot = await mkdtemp(join(tmpdir(), "ai-ide-agent-demo-"));
    tempRoots.push(workspaceRoot);

    const output = await runDemo(workspaceRoot);
    const parsed = JSON.parse(output) as { state: string; taskSpec: { goal: string } };

    expect(parsed.state).toBe("Draft");
    expect(parsed.taskSpec.goal).toBe("Demonstrate the AI IDE Agent lifecycle");
  });

  it("detects relative CLI entrypoint paths", () => {
    const entrypointUrl = new URL("../src/index.ts", import.meta.url);
    const entrypointPath = fileURLToPath(entrypointUrl);

    expect(isCliEntrypoint(entrypointUrl.href, entrypointPath)).toBe(true);
    expect(isCliEntrypoint(entrypointUrl.href, "packages/cli/src/index.ts")).toBe(true);
  });
});
