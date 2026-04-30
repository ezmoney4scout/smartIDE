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
      proposalPath: ".ai-ide-agent/proposals/task.md"
    });

    expect(html).toContain("AI IDE Agent");
    expect(html).toContain("textarea");
    expect(html).toContain("runTask");
    expect(html).toContain("Context Ledger");
    expect(html).toContain("Task Spec");
    expect(html).toContain("Change Capsules");
    expect(html).toContain("Verification Gate");
    expect(html).toContain("Preview Diff");
    expect(html).toContain("Apply Change");
    expect(html).toContain("previewProposal");
    expect(html).toContain("applyProposal");
  });
});
