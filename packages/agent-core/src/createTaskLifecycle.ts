import {
  createContextLedgerEntry,
  parseStructuredSourcePatches,
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

const structuredPatchSystemPrompt = `You are smartIDE's source patch planner.
Return only JSON with this shape:
{
  "summary": "short task summary",
  "patches": [
    {
      "targetPath": "relative/path/inside/workspace",
      "proposedContent": "complete replacement file content",
      "summary": "optional per-file summary"
    }
  ]
}
Do not wrap the JSON in Markdown.`;

export async function createTaskLifecycle(input: CreateTaskLifecycleInput): Promise<TaskLifecycle> {
  const provider = input.providers.require(input.providerId);
  const memory = await input.store.readMemory();
  const archivedContext = await input.store.searchContextArchive(input.request.goal, 3);
  const archivedMemory = archivedContext
    .map((record) => [
      `Previous task: ${record.goal}`,
      `Summary: ${record.summary}`,
      record.facts.length > 0 ? `Facts: ${record.facts.join("; ")}` : "",
      record.rules.length > 0 ? `Rules: ${record.rules.join("; ")}` : "",
      record.decisions.length > 0 ? `Decisions: ${record.decisions.join("; ")}` : "",
      record.pitfalls.length > 0 ? `Pitfalls: ${record.pitfalls.join("; ")}` : ""
    ].filter(Boolean).join("\n"))
    .join("\n\n");
  const providerResponse = await provider.complete({
    system: structuredPatchSystemPrompt,
    messages: [
      {
        role: "user",
        content: archivedMemory
          ? `${input.request.goal}\n\nRelevant archived project memory:\n${archivedMemory}`
          : input.request.goal
      }
    ],
    budget: input.request.budget
  });
  const structuredPatches = parseStructuredSourcePatches(providerResponse.content);

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
    }),
    ...archivedContext.map((record) => createContextLedgerEntry({
      path: `context-archive/${record.taskId}`,
      source: "memory" as const,
      reason: "retrieved archived memory for this task",
      tokens: record.summary.length + record.facts.join(" ").length + record.rules.join(" ").length,
      pinned: true
    }))
  ];

  const taskSpec: TaskSpec = {
    taskId: input.request.id,
    goal: input.request.goal,
    mode: input.request.mode,
    plannedFiles: structuredPatches.length > 0
      ? structuredPatches.map((patch) => patch.targetPath)
      : ["packages/providers/src/index.ts", "packages/providers/src/mockProvider.ts"],
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
      intent: structuredPatches[0]?.summary ?? "Establish provider abstraction",
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
  await input.store.appendContextArchive({
    taskId: input.request.id,
    goal: input.request.goal,
    summary: changeCapsules[0]?.intent ?? input.request.goal,
    paths: taskSpec.plannedFiles,
    facts: memoryProposal.facts,
    rules: memoryProposal.rules,
    decisions: memoryProposal.decisions,
    pitfalls: memoryProposal.pitfalls
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
