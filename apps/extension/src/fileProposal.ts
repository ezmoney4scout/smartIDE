import type { TaskLifecycle } from "@ai-ide-agent/protocol";

export interface FileProposal {
  relativePath: string;
  content: string;
}

export interface CreateFileProposalInput {
  taskId: string;
  lifecycle: TaskLifecycle;
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 80) || "task";
}

export function createFileProposal(input: CreateFileProposalInput): FileProposal {
  const taskId = sanitizeFileName(input.taskId);
  const plannedFiles = input.lifecycle.taskSpec.plannedFiles.length > 0
    ? input.lifecycle.taskSpec.plannedFiles.map((file) => `- ${file}`).join("\n")
    : "- No planned files captured.";
  const capsules = input.lifecycle.changeCapsules.length > 0
    ? input.lifecycle.changeCapsules
        .map((capsule) => `- ${capsule.intent}: ${capsule.reason}`)
        .join("\n")
    : "- No change capsules generated.";
  const verification = input.lifecycle.verification?.length
    ? input.lifecycle.verification.map((item) => `- ${item.label}: ${item.status}`).join("\n")
    : "- Verification has not run yet.";

  return {
    relativePath: `.ai-ide-agent/proposals/${taskId}.md`,
    content: `# smartIDE Change Proposal

## Goal

${input.lifecycle.taskSpec.goal}

## Planned Files

${plannedFiles}

## Change Capsules

${capsules}

## Verification

${verification}
`
  };
}
