import { describe, expect, it } from "vitest";
import type { TaskLifecycle } from "@ai-ide-agent/protocol";
import { createFileProposal } from "../src/fileProposal.js";

describe("file proposal", () => {
  it("creates a safe proposal file path and markdown content", () => {
    const proposal = createFileProposal({
      taskId: "extension-task-123",
      lifecycle: {
        taskSpec: {
          goal: "Add a provider picker",
          plannedFiles: ["apps/extension/src/panel.ts"]
        },
        changeCapsules: [
          {
            intent: "Expose provider choices",
            reason: "User should see the active provider."
          }
        ]
      } as TaskLifecycle
    });

    expect(proposal.relativePath).toBe(".ai-ide-agent/proposals/extension-task-123.md");
    expect(proposal.content).toContain("# smartIDE Change Proposal");
    expect(proposal.content).toContain("Add a provider picker");
    expect(proposal.content).toContain("apps/extension/src/panel.ts");
  });
});
