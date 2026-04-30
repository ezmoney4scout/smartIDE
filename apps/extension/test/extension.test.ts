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
      budget: {
        mode: "strict",
        maxUsd: 0.25,
        maxInputTokens: 2000,
        maxOutputTokens: 800
      },
      estimatedCostUsd: 0.02,
      providerName: "Kimi",
      modelName: "kimi-k2.5",
      providerId: "kimi",
      providerBaseUrl: "https://api.moonshot.ai/v1",
      providerDefaultModel: "kimi-k2.5",
      apiKeyConfigured: false,
      providerStatusMessage: "Kimi requires an API key.",
      providerReady: false,
      contextLedger: [
        {
          id: "memory:project-memory",
          path: "project-memory",
          reason: "loaded project memory",
          source: "memory",
          tokens: 128,
          pinned: false,
          excluded: false
        },
        {
          id: "indexed:src/legacy.ts",
          path: "src/legacy.ts",
          reason: "ignored by task scope",
          source: "indexed",
          tokens: 0,
          pinned: true,
          excluded: true
        }
      ],
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
      ],
      memoryProposal: {
        facts: ["The project uses local-first storage."],
        rules: ["Never write secrets into project memory."],
        decisions: ["Use user-approved memory updates."],
        pitfalls: ["Avoid storing transient task details."]
      },
      memoryStatusMessage: "Review before writing to project memory."
    });

    expect(html).toContain("AI IDE Agent");
    expect(html).toContain("Kimi");
    expect(html).toContain("kimi-k2.5");
    expect(html).toContain("Kimi requires an API key.");
    expect(html).toContain("Provider Settings");
    expect(html).toContain("ai-provider");
    expect(html).toContain("openai-compatible");
    expect(html).toContain("minimax");
    expect(html).toContain("glm");
    expect(html).toContain("https://api.moonshot.ai/v1");
    expect(html).toContain("Save Provider Settings");
    expect(html).toContain("saveProviderSettings");
    expect(html).toContain("textarea");
    expect(html).toContain("runTask");
    expect(html).toContain("Context Ledger");
    expect(html).toContain("project-memory");
    expect(html).toContain("loaded project memory");
    expect(html).toContain("memory");
    expect(html).toContain("128 tokens");
    expect(html).toContain("pinned");
    expect(html).toContain("excluded");
    expect(html).toContain("Task Spec");
    expect(html).toContain("Budget and Limits");
    expect(html).toContain("strict");
    expect(html).toContain("$0.25");
    expect(html).toContain("2,000 input tokens");
    expect(html).toContain("800 output tokens");
    expect(html).toContain("$0.02");
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
    expect(html).toContain("Memory Update Proposal");
    expect(html).toContain("The project uses local-first storage.");
    expect(html).toContain("Never write secrets into project memory.");
    expect(html).toContain("Use user-approved memory updates.");
    expect(html).toContain("Avoid storing transient task details.");
    expect(html).toContain("Review before writing to project memory.");
    expect(html).toContain("Accept Memory Update");
    expect(html).toContain("acceptMemoryUpdate");
  });
});
