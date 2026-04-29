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
});
