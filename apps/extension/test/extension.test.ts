import { describe, expect, it } from "vitest";
import { renderPanelHtml } from "../src/panelHtml.js";

describe("extension panel HTML", () => {
  it("renders task lifecycle sections", () => {
    const html = renderPanelHtml({
      state: "Draft",
      taskGoal: "Demonstrate lifecycle",
      contextCount: 2,
      changeCapsuleCount: 1,
      verificationStatus: "skipped",
      proposalPath: ".ai-ide-agent/proposals/task.md",
      proposalPaths: ["src/one.ts", "src/two.ts"],
      riskNote: "Review 2 files before applying.",
      verificationCommands: ["npm test", "npm run typecheck"],
      verificationResults: [
        {
          kind: "test",
          label: "npm test",
          status: "passed",
          output: "15 passed"
        }
      ]
    });

    expect(html).toContain("AI IDE Agent");
    expect(html).toContain("textarea");
    expect(html).toContain("runTask");
    expect(html).toContain("Context Ledger");
    expect(html).toContain("Task Spec");
    expect(html).toContain("Change Capsules");
    expect(html).toContain("Verification Gate");
    expect(html).toContain("npm test");
    expect(html).toContain("15 passed");
    expect(html).toContain("Preview Diff");
    expect(html).toContain("Apply & Run Verification");
    expect(html).toContain("Apply Without Verification");
    expect(html).toContain("npm run typecheck");
    expect(html).toContain("Review 2 files before applying.");
    expect(html).toContain("src/one.ts");
    expect(html).toContain("src/two.ts");
    expect(html).toContain("previewProposal");
    expect(html).toContain("applyProposal");
    expect(html).toContain("applyWithoutVerification");
  });
});
