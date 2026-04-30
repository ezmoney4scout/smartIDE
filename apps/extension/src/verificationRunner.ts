import { exec } from "node:child_process";
import type { VerificationEvidence } from "@ai-ide-agent/protocol";

export interface CommandResult {
  command: string;
  cwd: string;
  exitCode: number;
  output: string;
}

export type RunCommand = (command: string, cwd: string) => Promise<CommandResult>;

export interface RunVerificationCommandsInput {
  commands: string[];
  cwd: string;
  maxOutputLength?: number;
  runCommand?: RunCommand;
}

function defaultRunCommand(command: string, cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    exec(command, { cwd, timeout: 120000 }, (error, stdout, stderr) => {
      resolve({
        command,
        cwd,
        exitCode: typeof error?.code === "number" ? error.code : 0,
        output: `${stdout}${stderr}`.trim()
      });
    });
  });
}

function verificationKind(command: string): VerificationEvidence["kind"] {
  if (command.includes("test")) {
    return "test";
  }
  if (command.includes("typecheck") || command.includes("build")) {
    return "build";
  }
  if (command.includes("lint")) {
    return "lint";
  }
  return "log";
}

function truncateOutput(output: string, maxLength: number): string {
  return output.length > maxLength ? `${output.slice(0, maxLength)}...` : output;
}

export async function runVerificationCommands(input: RunVerificationCommandsInput): Promise<VerificationEvidence[]> {
  const runCommand = input.runCommand ?? defaultRunCommand;
  const maxOutputLength = input.maxOutputLength ?? 4000;
  const results: VerificationEvidence[] = [];

  for (const command of input.commands) {
    const result = await runCommand(command, input.cwd);
    results.push({
      kind: verificationKind(command),
      label: command,
      status: result.exitCode === 0 ? "passed" : "failed",
      output: truncateOutput(result.output, maxOutputLength)
    });
  }

  return results;
}
