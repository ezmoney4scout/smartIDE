import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createMockProvider, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import { createTaskLifecycle } from "../src/index.js";

let tempDir: string | undefined;

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
});

describe("createTaskLifecycle", () => {
  it("creates a draft lifecycle with ledger, spec, capsules, verification, and memory proposal", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-ide-agent-core-"));
    const registry = new ProviderRegistry();
    registry.register(createMockProvider({ id: "mock", response: "Use a provider registry." }));

    const lifecycle = await createTaskLifecycle({
      request: {
        id: "task-1",
        mode: "Edit",
        goal: "Add provider registry",
        workspaceRoot: tempDir,
        risk: "medium",
        budget: { mode: "balanced", maxUsd: 1 }
      },
      providerId: "mock",
      providers: registry,
      store: new LocalProjectStore(tempDir)
    });

    expect(lifecycle.state).toBe("Draft");
    expect(lifecycle.contextLedger.map((entry) => entry.source)).toContain("memory");
    expect(lifecycle.taskSpec.plannedFiles).toContain("packages/providers/src/index.ts");
    expect(lifecycle.changeCapsules[0]?.intent).toBe("Establish provider abstraction");
    expect(lifecycle.verification[0]?.status).toBe("skipped");
    expect(lifecycle.memoryProposal.decisions).toContain(
      "Use provider adapters instead of binding Agent Core to vendor SDKs."
    );
  });

  it("uses structured patch output for planned files and change capsule intent", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-ide-agent-core-"));
    const registry = new ProviderRegistry();
    registry.register(
      createMockProvider({
        id: "mock",
        response: JSON.stringify({
          targetPath: "apps/extension/src/panel.ts",
          proposedContent: "export const changed = true;\n",
          summary: "Update extension panel"
        })
      })
    );

    const lifecycle = await createTaskLifecycle({
      request: {
        id: "task-structured-patch",
        mode: "Edit",
        goal: "Update panel",
        workspaceRoot: tempDir,
        risk: "low",
        budget: { mode: "balanced" }
      },
      providerId: "mock",
      providers: registry,
      store: new LocalProjectStore(tempDir)
    });

    expect(lifecycle.taskSpec.plannedFiles).toEqual(["apps/extension/src/panel.ts"]);
    expect(lifecycle.changeCapsules[0]?.intent).toBe("Update extension panel");
  });

  it("uses multi-file structured patch output for planned files", async () => {
    tempDir = await mkdtemp(join(tmpdir(), "ai-ide-agent-core-"));
    const registry = new ProviderRegistry();
    registry.register(
      createMockProvider({
        id: "mock",
        response: JSON.stringify({
          summary: "Update panel and tests",
          patches: [
            { targetPath: "apps/extension/src/panel.ts", proposedContent: "panel\n" },
            { targetPath: "apps/extension/test/extension.test.ts", proposedContent: "test\n" }
          ]
        })
      })
    );

    const lifecycle = await createTaskLifecycle({
      request: {
        id: "task-multi-patch",
        mode: "Edit",
        goal: "Update panel and tests",
        workspaceRoot: tempDir,
        risk: "medium",
        budget: { mode: "balanced" }
      },
      providerId: "mock",
      providers: registry,
      store: new LocalProjectStore(tempDir)
    });

    expect(lifecycle.taskSpec.plannedFiles).toEqual([
      "apps/extension/src/panel.ts",
      "apps/extension/test/extension.test.ts"
    ]);
    expect(lifecycle.changeCapsules[0]?.intent).toBe("Update panel and tests");
  });
});
