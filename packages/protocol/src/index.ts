export type TaskMode = "Ask" | "Edit" | "Delegate" | "Debug" | "Review";
export type RiskLevel = "low" | "medium" | "high";
export type TaskState = "Draft" | "Implemented" | "Verified" | "Needs Review" | "Blocked";
export type BudgetMode = "fast" | "balanced" | "strict";

export interface BudgetHint {
  mode: BudgetMode;
  maxUsd?: number;
  maxInputTokens?: number;
  maxOutputTokens?: number;
}

export interface TaskRequest {
  id: string;
  mode: TaskMode;
  goal: string;
  workspaceRoot: string;
  risk: RiskLevel;
  budget: BudgetHint;
}

export type ContextSource = "read" | "indexed" | "memory" | "rule" | "runtime";

export interface ContextLedgerEntry {
  id: string;
  path: string;
  reason: string;
  source: ContextSource;
  tokens: number;
  pinned: boolean;
  excluded: boolean;
}

export interface CreateContextLedgerEntryInput {
  path: string;
  reason: string;
  source: ContextSource;
  tokens?: number;
  pinned?: boolean;
  excluded?: boolean;
}

export function createContextLedgerEntry(input: CreateContextLedgerEntryInput): ContextLedgerEntry {
  return {
    id: `${input.source}:${input.path}`,
    path: input.path,
    reason: input.reason,
    source: input.source,
    tokens: input.tokens ?? 0,
    pinned: input.pinned ?? false,
    excluded: input.excluded ?? false
  };
}

export interface TaskSpec {
  taskId: string;
  goal: string;
  mode: TaskMode;
  plannedFiles: string[];
  risk: RiskLevel;
  verificationPlan: VerificationPlan;
  estimatedCostUsd?: number;
}

export interface ChangeCapsule {
  id: string;
  intent: string;
  reason: string;
  files: string[];
  risk: RiskLevel;
  verificationStatus: TaskState;
}

export interface VerificationPlan {
  commands: string[];
  evidenceRequired: boolean;
}

export interface VerificationEvidence {
  kind: "test" | "lint" | "build" | "preview" | "log" | "manual";
  label: string;
  status: "passed" | "failed" | "skipped";
  output?: string;
}

export interface MemoryUpdateProposal {
  facts: string[];
  rules: string[];
  decisions: string[];
  pitfalls: string[];
}

export interface TaskLifecycle {
  request: TaskRequest;
  contextLedger: ContextLedgerEntry[];
  taskSpec: TaskSpec;
  changeCapsules: ChangeCapsule[];
  verification: VerificationEvidence[];
  memoryProposal: MemoryUpdateProposal;
  state: TaskState;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  system?: string;
  tools?: ToolDefinition[];
  responseSchema?: Record<string, unknown>;
  contextLedgerRefs?: string[];
  budget?: BudgetHint;
  model?: string;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ChatResponse {
  id: string;
  model: string;
  content: string;
  usage?: TokenUsage;
}

export interface StructuredSourcePatch {
  targetPath: string;
  proposedContent: string;
  summary?: string;
}

function isStructuredSourcePatch(value: unknown): value is StructuredSourcePatch {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.targetPath === "string" &&
    typeof candidate.proposedContent === "string" &&
    (candidate.summary === undefined || typeof candidate.summary === "string")
  );
}

export function parseStructuredSourcePatch(content: string): StructuredSourcePatch | undefined {
  try {
    const parsed = JSON.parse(content) as unknown;
    return isStructuredSourcePatch(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

export interface ChatResponseChunk {
  contentDelta: string;
  done: boolean;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostEstimate {
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
}

export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  vision: boolean;
  largeContext: boolean;
  localExecution: boolean;
  costEstimation: boolean;
}

export interface ModelDescriptor {
  id: string;
  displayName: string;
  contextWindow: number;
  capabilities: ProviderCapabilities;
}

export interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

export interface ProviderValidationResult {
  ok: boolean;
  message: string;
}
