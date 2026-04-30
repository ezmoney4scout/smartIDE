import { describe, expect, it } from "vitest";
import type { TaskLifecycle } from "@ai-ide-agent/protocol";
import { createSourceChangeProposal } from "../src/sourceChangeProposal.js";

describe("source change proposal", () => {
  it("creates a workspace-bounded source file proposal from lifecycle output", () => {
    const proposal = createSourceChangeProposal({
      originalContent: "export const name = 'smartIDE';\n",
      lifecycle: {
        taskSpec: {
          goal: "Add provider picker",
          plannedFiles: ["apps/extension/src/panel.ts"]
        },
        changeCapsules: [
          {
            intent: "Expose provider choices",
            reason: "Add a picker before running an agent task."
          }
        ]
      } as TaskLifecycle
    });

    expect(proposal.targetPath).toBe("apps/extension/src/panel.ts");
    expect(proposal.proposedContent).toContain("export const name = 'smartIDE';");
    expect(proposal.proposedContent).toContain("smartIDE source change proposal");
    expect(proposal.proposedContent).toContain("Add provider picker");
  });

  it("uses structured patch content when the lifecycle contains one", () => {
    const proposal = createSourceChangeProposal({
      originalContent: "old\n",
      lifecycle: {
        taskSpec: {
          goal: "Replace file",
          plannedFiles: ["src/example.ts"]
        },
        changeCapsules: [
          {
            intent: "Replace file",
            reason: JSON.stringify({
              targetPath: "src/example.ts",
              proposedContent: "new\n"
            })
          }
        ]
      } as TaskLifecycle
    });

    expect(proposal.targetPath).toBe("src/example.ts");
    expect(proposal.originalContent).toBe("old\n");
    expect(proposal.proposedContent).toBe("new\n");
  });

  it("rejects unsafe target paths", () => {
    expect(() =>
      createSourceChangeProposal({
        originalContent: "",
        lifecycle: {
          taskSpec: {
            goal: "Escape workspace",
            plannedFiles: ["../secrets.txt"]
          },
          changeCapsules: []
        } as unknown as TaskLifecycle
      })
    ).toThrow("Unsafe target path");
  });
});
