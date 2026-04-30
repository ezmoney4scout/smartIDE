import { describe, expect, it } from "vitest";
import { mergeMemoryProposal } from "../src/memoryProposal.js";

describe("mergeMemoryProposal", () => {
  it("adds user-approved memory proposals without duplicating existing entries", () => {
    const merged = mergeMemoryProposal(
      {
        facts: ["The project uses local-first storage."],
        rules: ["Never write secrets into project memory."],
        decisions: [],
        pitfalls: []
      },
      {
        facts: ["The project uses local-first storage.", "The extension renders memory proposals."],
        rules: ["Never write secrets into project memory."],
        decisions: ["Use user-approved memory updates."],
        pitfalls: ["Avoid storing transient task details."]
      }
    );

    expect(merged).toEqual({
      facts: ["The project uses local-first storage.", "The extension renders memory proposals."],
      rules: ["Never write secrets into project memory."],
      decisions: ["Use user-approved memory updates."],
      pitfalls: ["Avoid storing transient task details."]
    });
  });
});
