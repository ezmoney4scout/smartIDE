import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LocalProjectStore } from "../src/index.js";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("LocalProjectStore", () => {
  it("persists task history locally", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-ide-agent-"));
    const store = new LocalProjectStore(tempDir);

    await store.appendTaskHistory({
      taskId: "task-1",
      goal: "Create provider registry",
      state: "Draft"
    });

    const history = await store.readTaskHistory();
    const raw = await readFile(join(tempDir, ".ai-ide-agent", "task-history.json"), "utf8");

    expect(history).toHaveLength(1);
    expect(history[0]?.goal).toBe("Create provider registry");
    expect(JSON.parse(raw)).toMatchObject([{ taskId: "task-1" }]);
  });

  it("archives task context and retrieves related memories by query", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-ide-agent-"));
    const store = new LocalProjectStore(tempDir);

    await store.appendContextArchive({
      taskId: "task-provider",
      goal: "Add provider registry",
      summary: "Use provider adapters for model routing.",
      paths: ["packages/providers/src/index.ts"],
      facts: ["Provider-specific code stays behind adapters."],
      rules: ["Never bind Agent Core directly to vendor SDKs."],
      decisions: ["Use provider adapters for model routing."],
      pitfalls: []
    });
    await store.appendContextArchive({
      taskId: "task-readme",
      goal: "Update README",
      summary: "Document the install flow.",
      paths: ["README.md"],
      facts: [],
      rules: [],
      decisions: [],
      pitfalls: ["Keep release notes concise."]
    });

    const related = await store.searchContextArchive("provider adapter model routing", 1);
    const raw = await readFile(join(tempDir, ".ai-ide-agent", "context-archive.jsonl"), "utf8");

    expect(related).toHaveLength(1);
    expect(related[0]?.taskId).toBe("task-provider");
    expect(related[0]?.score).toBeGreaterThan(0);
    expect(raw.trim().split("\n")).toHaveLength(2);
  });
});
