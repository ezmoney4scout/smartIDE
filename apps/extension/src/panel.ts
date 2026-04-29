import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createMockProvider, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import type * as vscode from "vscode";
import { renderPanelHtml } from "./panelHtml.js";

export async function openAgentPanel(vscodeApi: typeof vscode): Promise<void> {
  const workspaceRoot = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const providers = new ProviderRegistry();
  providers.register(createMockProvider({ id: "mock", response: "Render a transparent extension task lifecycle." }));

  const lifecycle = await createTaskLifecycle({
    request: {
      id: "extension-demo-task",
      mode: "Edit",
      goal: "Demonstrate the AI IDE Agent lifecycle inside a VS Code-compatible panel",
      workspaceRoot,
      risk: "low",
      budget: { mode: "balanced", maxUsd: 0 }
    },
    providerId: "mock",
    providers,
    store: new LocalProjectStore(workspaceRoot)
  });

  const panel = vscodeApi.window.createWebviewPanel(
    "aiIdeAgent",
    "AI IDE Agent",
    vscodeApi.ViewColumn.Beside,
    { enableScripts: false }
  );

  panel.webview.html = renderPanelHtml({
    state: lifecycle.state,
    taskGoal: lifecycle.taskSpec.goal,
    contextCount: lifecycle.contextLedger.length,
    changeCapsuleCount: lifecycle.changeCapsules.length,
    verificationStatus: lifecycle.verification[0]?.status ?? "skipped"
  });
}
