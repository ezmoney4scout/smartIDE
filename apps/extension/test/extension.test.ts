import { describe, expect, it } from "vitest";
import { renderPanelHtml } from "../src/panelHtml.js";

describe("extension panel HTML", () => {
  it("renders task lifecycle sections", () => {
    const html = renderPanelHtml({
      state: "Draft",
      taskGoal: "Demonstrate lifecycle",
      contextCount: 2,
      changeCapsuleCount: 1,
      verificationStatus: "skipped"
    });

    expect(html).toContain("AI IDE Agent");
    expect(html).toContain("Context Ledger");
    expect(html).toContain("Task Spec");
    expect(html).toContain("Change Capsules");
    expect(html).toContain("Verification Gate");
  });
});
