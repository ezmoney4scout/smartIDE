import { describe, expect, it } from "vitest";
import { runVerificationCommands } from "../src/verificationRunner.js";

describe("verification runner", () => {
  it("returns passed evidence for successful commands", async () => {
    const results = await runVerificationCommands({
      commands: ["npm test"],
      cwd: "/workspace",
      runCommand: async (command, cwd) => ({
        command,
        cwd,
        exitCode: 0,
        output: "tests passed"
      })
    });

    expect(results).toEqual([
      {
        kind: "test",
        label: "npm test",
        status: "passed",
        output: "Exit code: 0\ntests passed"
      }
    ]);
  });

  it("returns failed evidence and truncates long output", async () => {
    const results = await runVerificationCommands({
      commands: ["npm run typecheck"],
      cwd: "/workspace",
      maxOutputLength: 12,
      runCommand: async () => ({
        command: "npm run typecheck",
        cwd: "/workspace",
        exitCode: 2,
        output: "typecheck failed with a long compiler output"
      })
    });

    expect(results[0]).toMatchObject({
      kind: "build",
      label: "npm run typecheck",
      status: "failed",
      output: "Exit code: 2..."
    });
  });
});
