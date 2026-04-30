import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createProviderFromRuntimeConfig, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import type * as vscode from "vscode";
import { renderPanelHtml } from "./panelHtml.js";
import { resolveExtensionProviderRuntimeConfig } from "./settings.js";

interface RunTaskMessage {
  type: "runTask";
  goal: string;
}

function isRunTaskMessage(message: unknown): message is RunTaskMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    "goal" in message &&
    message.type === "runTask" &&
    typeof message.goal === "string"
  );
}

export async function openAgentPanel(vscodeApi: typeof vscode): Promise<void> {
  const workspaceRoot = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const providerConfig = resolveExtensionProviderRuntimeConfig(
    vscodeApi.workspace.getConfiguration("aiIdeAgent")
  );
  const provider = createProviderFromRuntimeConfig(providerConfig);

  const panel = vscodeApi.window.createWebviewPanel(
    "aiIdeAgent",
    "smartIDE",
    vscodeApi.ViewColumn.Beside,
    { enableScripts: true }
  );

  panel.webview.html = renderPanelHtml({
    state: "Draft",
    taskGoal: "",
    contextCount: 0,
    changeCapsuleCount: 0,
    verificationStatus: "skipped",
    providerName: provider.displayName
  });

  panel.webview.onDidReceiveMessage(async (message) => {
    if (!isRunTaskMessage(message)) {
      return;
    }

    const goal = message.goal.trim();
    if (!goal) {
      panel.webview.html = renderPanelHtml({
        state: "Blocked",
        taskGoal: "",
        contextCount: 0,
        changeCapsuleCount: 0,
        verificationStatus: "skipped",
        providerName: provider.displayName,
        errorMessage: "Enter a task goal before running the agent."
      });
      return;
    }

    try {
      const providers = new ProviderRegistry();
      providers.register(provider);
      const lifecycle = await createTaskLifecycle({
        request: {
          id: `extension-task-${Date.now()}`,
          mode: "Edit",
          goal,
          workspaceRoot,
          risk: "low",
          budget: { mode: "balanced", maxUsd: 0 }
        },
        providerId: provider.id,
        providers,
        store: new LocalProjectStore(workspaceRoot)
      });

      panel.webview.html = renderPanelHtml({
        state: lifecycle.state,
        taskGoal: lifecycle.taskSpec.goal,
        contextCount: lifecycle.contextLedger.length,
        changeCapsuleCount: lifecycle.changeCapsules.length,
        verificationStatus: lifecycle.verification[0]?.status ?? "skipped",
        providerName: provider.displayName
      });
    } catch (error) {
      panel.webview.html = renderPanelHtml({
        state: "Blocked",
        taskGoal: goal,
        contextCount: 0,
        changeCapsuleCount: 0,
        verificationStatus: "failed",
        providerName: provider.displayName,
        errorMessage: error instanceof Error ? error.message : "Agent task failed."
      });
    }
  });
}
