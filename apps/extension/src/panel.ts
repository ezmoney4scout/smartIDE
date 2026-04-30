import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createProviderFromRuntimeConfig, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import type * as vscode from "vscode";
import { createFileProposal, type FileProposal } from "./fileProposal.js";
import { renderPanelHtml } from "./panelHtml.js";
import { resolveExtensionProviderRuntimeConfig } from "./settings.js";

interface RunTaskMessage {
  type: "runTask";
  goal: string;
}

interface PreviewProposalMessage {
  type: "previewProposal";
}

interface ApplyProposalMessage {
  type: "applyProposal";
}

type PanelMessage = RunTaskMessage | PreviewProposalMessage | ApplyProposalMessage;

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

function isPanelMessage(message: unknown): message is PanelMessage {
  return (
    isRunTaskMessage(message) ||
    (typeof message === "object" &&
      message !== null &&
      "type" in message &&
      (message.type === "previewProposal" || message.type === "applyProposal"))
  );
}

function proposalUri(vscodeApi: typeof vscode, workspaceRootUri: vscode.Uri, proposal: FileProposal): vscode.Uri {
  return vscodeApi.Uri.joinPath(workspaceRootUri, ...proposal.relativePath.split("/"));
}

export async function openAgentPanel(vscodeApi: typeof vscode): Promise<void> {
  const workspaceRoot = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const workspaceRootUri = vscodeApi.workspace.workspaceFolders?.[0]?.uri ?? vscodeApi.Uri.file(workspaceRoot);
  const providerConfig = resolveExtensionProviderRuntimeConfig(
    vscodeApi.workspace.getConfiguration("aiIdeAgent")
  );
  const provider = createProviderFromRuntimeConfig(providerConfig);
  let pendingProposal: FileProposal | undefined;

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
    if (!isPanelMessage(message)) {
      return;
    }

    if (message.type === "previewProposal") {
      if (!pendingProposal) {
        await vscodeApi.window.showWarningMessage("No smartIDE proposal is ready to preview.");
        return;
      }

      const before = await vscodeApi.workspace.openTextDocument({
        content: "",
        language: "markdown"
      });
      const after = await vscodeApi.workspace.openTextDocument({
        content: pendingProposal.content,
        language: "markdown"
      });
      await vscodeApi.commands.executeCommand(
        "vscode.diff",
        before.uri,
        after.uri,
        `smartIDE Preview: ${pendingProposal.relativePath}`
      );
      return;
    }

    if (message.type === "applyProposal") {
      if (!pendingProposal) {
        await vscodeApi.window.showWarningMessage("No smartIDE proposal is ready to apply.");
        return;
      }

      const targetUri = proposalUri(vscodeApi, workspaceRootUri, pendingProposal);
      const targetDirectoryUri = vscodeApi.Uri.joinPath(workspaceRootUri, ".ai-ide-agent", "proposals");
      await vscodeApi.workspace.fs.createDirectory(targetDirectoryUri);
      await vscodeApi.workspace.fs.writeFile(targetUri, new TextEncoder().encode(pendingProposal.content));
      await vscodeApi.window.showInformationMessage(`smartIDE wrote ${pendingProposal.relativePath}`);
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
      pendingProposal = createFileProposal({
        taskId: lifecycle.taskSpec.taskId,
        lifecycle
      });

      panel.webview.html = renderPanelHtml({
        state: lifecycle.state,
        taskGoal: lifecycle.taskSpec.goal,
        contextCount: lifecycle.contextLedger.length,
        changeCapsuleCount: lifecycle.changeCapsules.length,
        verificationStatus: lifecycle.verification[0]?.status ?? "skipped",
        providerName: provider.displayName,
        proposalPath: pendingProposal.relativePath
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
