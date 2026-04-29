import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createProviderFromRuntimeConfig, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import type * as vscode from "vscode";
import { renderPanelHtml } from "./panelHtml.js";
import { resolveExtensionProviderRuntimeConfig } from "./settings.js";

export async function openAgentPanel(vscodeApi: typeof vscode): Promise<void> {
  const workspaceRoot = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const providerConfig = resolveExtensionProviderRuntimeConfig(
    vscodeApi.workspace.getConfiguration("aiIdeAgent")
  );
  const provider = createProviderFromRuntimeConfig(providerConfig);
  const providers = new ProviderRegistry();
  providers.register(provider);

  const lifecycle = await createTaskLifecycle({
    request: {
      id: "extension-demo-task",
      mode: "Edit",
      goal: "Demonstrate the AI IDE Agent lifecycle inside a VS Code-compatible panel",
      workspaceRoot,
      risk: "low",
      budget: { mode: "balanced", maxUsd: 0 }
    },
    providerId: provider.id,
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
    verificationStatus: lifecycle.verification[0]?.status ?? "skipped",
    providerName: provider.displayName
  });
}
