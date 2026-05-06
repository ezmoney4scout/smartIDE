import { describe, expect, it } from "vitest";
import { createPreWriteCodeReview } from "../src/codeReview.js";

describe("pre-write code review", () => {
  it("requires human approval in manual mode before code is written", () => {
    const review = createPreWriteCodeReview({
      approvalMode: "manual",
      changes: [
        {
          targetPath: "src/index.ts",
          originalContent: "export const value = 1;\n",
          proposedContent: "export const value = 2;\n"
        }
      ],
      verificationCommands: ["npm test"]
    });

    expect(review.status).toBe("needs-human-approval");
    expect(review.canAutoApply).toBe(false);
    expect(review.summary).toContain("waiting for human approval");
    expect(review.findings).toContainEqual({
      severity: "info",
      path: "src/index.ts",
      message: "Proposed change is ready for user review before writing."
    });
  });

  it("allows full automation only when the pre-write review has no blockers or warnings", () => {
    const review = createPreWriteCodeReview({
      approvalMode: "auto",
      changes: [
        {
          targetPath: "src/index.ts",
          originalContent: "export const value = 1;\n",
          proposedContent: "export const value = 2;\n"
        }
      ],
      verificationCommands: ["npm test", "npm run typecheck"]
    });

    expect(review.status).toBe("approved");
    expect(review.canAutoApply).toBe(true);
    expect(review.summary).toContain("Full automation is enabled");
  });

  it("blocks auto-apply when verification commands are missing", () => {
    const review = createPreWriteCodeReview({
      approvalMode: "auto",
      changes: [
        {
          targetPath: "src/index.ts",
          originalContent: "export const value = 1;\n",
          proposedContent: "export const value = 2;\n"
        }
      ],
      verificationCommands: []
    });

    expect(review.status).toBe("needs-human-approval");
    expect(review.canAutoApply).toBe(false);
    expect(review.findings).toContainEqual({
      severity: "warning",
      message: "No verification command is selected, so automatic write is paused."
    });
  });
});
