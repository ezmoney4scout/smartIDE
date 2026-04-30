import type { MemoryUpdateProposal } from "@ai-ide-agent/protocol";
import type { ProjectMemory } from "@ai-ide-agent/storage";

function mergeList(existing: string[], proposed: string[]): string[] {
  return Array.from(new Set([...existing, ...proposed]));
}

export function mergeMemoryProposal(
  memory: ProjectMemory,
  proposal: MemoryUpdateProposal
): ProjectMemory {
  return {
    facts: mergeList(memory.facts, proposal.facts),
    rules: mergeList(memory.rules, proposal.rules),
    decisions: mergeList(memory.decisions, proposal.decisions),
    pitfalls: mergeList(memory.pitfalls, proposal.pitfalls)
  };
}
