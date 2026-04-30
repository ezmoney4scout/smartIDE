import { describe, expect, it } from "vitest";
import type { TaskRequest, TaskState } from "../src/index.js";
import { createContextLedgerEntry, parseStructuredSourcePatch } from "../src/index.js";

describe("protocol contracts", () => {
  it("creates a readable context ledger entry", () => {
    const entry = createContextLedgerEntry({
      path: "src/auth/session.ts",
      reason: "matched user request",
      source: "read",
      tokens: 512
    });

    expect(entry.id).toBe("read:src/auth/session.ts");
    expect(entry.path).toBe("src/auth/session.ts");
    expect(entry.source).toBe("read");
    expect(entry.tokens).toBe(512);
  });

  it("allows a typed edit task request", () => {
    const task: TaskRequest = {
      id: "task-1",
      mode: "Edit",
      goal: "Add provider registry",
      workspaceRoot: "/tmp/project",
      risk: "medium",
      budget: { mode: "balanced", maxUsd: 1.5 }
    };

    const state: TaskState = "Draft";

    expect(task.mode).toBe("Edit");
    expect(state).toBe("Draft");
  });

  it("parses structured source patch output", () => {
    const patch = parseStructuredSourcePatch(
      JSON.stringify({
        targetPath: "src/example.ts",
        proposedContent: "export const ok = true;\n",
        summary: "Update example"
      })
    );

    expect(patch).toEqual({
      targetPath: "src/example.ts",
      proposedContent: "export const ok = true;\n",
      summary: "Update example"
    });
    expect(parseStructuredSourcePatch("not json")).toBeUndefined();
  });
});
