#!/usr/bin/env node
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createMockProvider, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";

export async function runDemo(workspaceRoot = process.cwd()): Promise<string> {
  const providers = new ProviderRegistry();
  providers.register(createMockProvider({ id: "mock", response: "Create a transparent task lifecycle." }));

  const lifecycle = await createTaskLifecycle({
    request: {
      id: "demo-task",
      mode: "Edit",
      goal: "Demonstrate the AI IDE Agent lifecycle",
      workspaceRoot,
      risk: "low",
      budget: { mode: "balanced", maxUsd: 0 }
    },
    providerId: "mock",
    providers,
    store: new LocalProjectStore(workspaceRoot)
  });

  return JSON.stringify(lifecycle, null, 2);
}

export function isCliEntrypoint(moduleUrl: string, argvPath = process.argv[1]): boolean {
  if (!argvPath) {
    return false;
  }

  return fileURLToPath(moduleUrl) === resolve(argvPath);
}

if (isCliEntrypoint(import.meta.url)) {
  runDemo()
    .then((output) => {
      console.log(output);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
