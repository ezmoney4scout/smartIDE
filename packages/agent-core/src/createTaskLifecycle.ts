import {
  createContextLedgerEntry,
  type ChangeCapsule,
  type TaskLifecycle,
  type TaskRequest,
  type TaskSpec,
  type VerificationEvidence
} from "@ai-ide-agent/protocol";
import type { ProviderRegistry } from "@ai-ide-agent/providers";
import type { LocalProjectStore } from "@ai-ide-agent/storage";

export interface CreateTaskLifecycleInput {
  request: TaskRequest;
  providerId: string;
  providers: ProviderRegistry;
  store: LocalProjectStore;
}

export async function createTaskLifecycle(input: CreateTaskLifecycleInput): Promise<TaskLifecycle> {
  const provider = input.providers.require(input.providerId);
  const memory = await input.store.readMemory();
  const providerResponse = await provider.complete({
    messages: [{ role: "user", content: input.request.goal }],
    budget: input.request.budget
  });

  const contextLedger = [
    createContextLedgerEntry({
      path: "project-memory",
      source: "memory",
      reason: memory.facts.length > 0 ? "loaded project memory" : "memory store initialized",
      tokens: memory.facts.join(" ").length
    }),
    createContextLedgerEntry({
      path: "packages/providers/src/index.ts",
      source: "indexed",
      reason: "planned provider registry work",
      tokens: 0,
      pinned: true
    })
  ];

  const taskSpec: TaskSpec = {
    taskId: input.request.id,
    goal: input.request.goal,
    mode: input.request.mode,
    plannedFiles: ["packages/providers/src/index.ts", "packages/providers/src/mockProvider.ts"],
    risk: input.request.risk,
    verificationPlan: {
      commands: ["npm test", "npm run typecheck"],
      evidenceRequired: true
    },
    estimatedCostUsd: providerResponse.usage ? 0 : undefined
  };

  const changeCapsules: ChangeCapsule[] = [
    {
      id: "capsule-provider-abstraction",
      intent: "Establish provider abstraction",
      reason: providerResponse.content,
      files: taskSpec.plannedFiles,
      risk: input.request.risk,
      verificationStatus: "Draft"
    }
  ];

  const verification: VerificationEvidence[] = [
    {
      kind: "test",
      label: "npm test",
      status: "skipped",
      output: "Verification is planned but not executed in Phase 1 lifecycle creation."
    }
  ];

  const memoryProposal = {
    facts: ["The project uses a local-first Agent Core package."],
    rules: ["Provider-specific code must stay behind provider adapters."],
    decisions: ["Use provider adapters instead of binding Agent Core to vendor SDKs."],
    pitfalls: ["Do not mark tasks as Verified without verification evidence."]
  };

  await input.store.appendTaskHistory({
    taskId: input.request.id,
    goal: input.request.goal,
    state: "Draft"
  });

  return {
    request: input.request,
    contextLedger,
    taskSpec,
    changeCapsules,
    verification,
    memoryProposal,
    state: "Draft"
  };
}
