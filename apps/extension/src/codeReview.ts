import type { SourceChangeProposal } from "./sourceChangeProposal.js";

export type CodeApprovalMode = "manual" | "auto";
export type PreWriteReviewStatus = "approved" | "needs-human-approval" | "blocked";
export type PreWriteReviewSeverity = "info" | "warning" | "blocker";

export interface PreWriteReviewFinding {
  severity: PreWriteReviewSeverity;
  message: string;
  path?: string;
}

export interface PreWriteCodeReview {
  approvalMode: CodeApprovalMode;
  status: PreWriteReviewStatus;
  canAutoApply: boolean;
  summary: string;
  findings: PreWriteReviewFinding[];
}

export interface CreatePreWriteCodeReviewInput {
  approvalMode: CodeApprovalMode;
  changes: SourceChangeProposal[];
  verificationCommands: string[];
}

function isSensitivePath(path: string): boolean {
  const lowerPath = path.toLowerCase();
  return (
    lowerPath === ".env" ||
    lowerPath.startsWith(".env.") ||
    lowerPath.includes("/.env") ||
    lowerPath.includes("secret") ||
    lowerPath.includes("credential")
  );
}

function hasSeverity(findings: PreWriteReviewFinding[], severity: PreWriteReviewSeverity): boolean {
  return findings.some((finding) => finding.severity === severity);
}

export function createPreWriteCodeReview(input: CreatePreWriteCodeReviewInput): PreWriteCodeReview {
  const findings: PreWriteReviewFinding[] = [];

  if (input.changes.length === 0) {
    findings.push({
      severity: "blocker",
      message: "No proposed file changes are available to write."
    });
  }

  for (const change of input.changes) {
    if (isSensitivePath(change.targetPath)) {
      findings.push({
        severity: "blocker",
        path: change.targetPath,
        message: "Proposed change targets a sensitive path and requires a separate human decision."
      });
      continue;
    }

    if (change.originalContent === change.proposedContent) {
      findings.push({
        severity: "warning",
        path: change.targetPath,
        message: "Proposed content matches the current file, so writing may be unnecessary."
      });
      continue;
    }

    findings.push({
      severity: "info",
      path: change.targetPath,
      message: "Proposed change is ready for user review before writing."
    });
  }

  if (input.verificationCommands.length === 0) {
    findings.push({
      severity: "warning",
      message: "No verification command is selected, so automatic write is paused."
    });
  }

  const hasBlocker = hasSeverity(findings, "blocker");
  const hasWarning = hasSeverity(findings, "warning");
  const status: PreWriteReviewStatus = hasBlocker
    ? "blocked"
    : input.approvalMode === "manual" || hasWarning
      ? "needs-human-approval"
      : "approved";

  const canAutoApply = input.approvalMode === "auto" && status === "approved";
  const summary = hasBlocker
    ? "Code write is blocked until the risky proposal is changed."
    : canAutoApply
      ? "Full automation is enabled and the pre-write review approved this change."
      : "Code write is waiting for human approval before any file is modified.";

  return {
    approvalMode: input.approvalMode,
    status,
    canAutoApply,
    summary,
    findings
  };
}
