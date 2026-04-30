import type { TaskLifecycle } from "@ai-ide-agent/protocol";

export interface SourceChangeProposal {
  targetPath: string;
  originalContent: string;
  proposedContent: string;
}

export interface CreateSourceChangeProposalInput {
  originalContent: string;
  lifecycle: TaskLifecycle;
}

function assertSafeTargetPath(targetPath: string): void {
  if (
    !targetPath ||
    targetPath.startsWith("/") ||
    targetPath.includes("\\") ||
    targetPath.split("/").includes("..")
  ) {
    throw new Error(`Unsafe target path: ${targetPath}`);
  }
}

function commentBlockForPath(targetPath: string, content: string): string {
  if (targetPath.endsWith(".md") || targetPath.endsWith(".mdx")) {
    return `\n\n<!--\n${content}\n-->\n`;
  }

  if (
    targetPath.endsWith(".ts") ||
    targetPath.endsWith(".tsx") ||
    targetPath.endsWith(".js") ||
    targetPath.endsWith(".jsx") ||
    targetPath.endsWith(".css") ||
    targetPath.endsWith(".json")
  ) {
    return `\n/*\n${content}\n*/\n`;
  }

  return `\n#\n# ${content.replaceAll("\n", "\n# ")}\n#\n`;
}

export function createSourceChangeProposal(input: CreateSourceChangeProposalInput): SourceChangeProposal {
  const targetPath = input.lifecycle.taskSpec.plannedFiles[0] ?? "";
  assertSafeTargetPath(targetPath);

  const capsuleSummary = input.lifecycle.changeCapsules.length
    ? input.lifecycle.changeCapsules.map((capsule) => `${capsule.intent}: ${capsule.reason}`).join("\n")
    : "No change capsule summary was generated.";
  const proposalNote = [
    "smartIDE source change proposal",
    `Goal: ${input.lifecycle.taskSpec.goal}`,
    capsuleSummary
  ].join("\n");

  return {
    targetPath,
    originalContent: input.originalContent,
    proposedContent: `${input.originalContent}${commentBlockForPath(targetPath, proposalNote)}`
  };
}
