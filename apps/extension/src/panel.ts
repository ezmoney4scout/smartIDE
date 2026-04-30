import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createProviderFromRuntimeConfig, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import type * as vscode from "vscode";
import { createFileProposal, type FileProposal } from "./fileProposal.js";
import { renderPanelHtml } from "./panelHtml.js";
import { resolveExtensionProviderRuntimeConfig } from "./settings.js";
import { createSourceChangeProposal, type SourceChangeProposal } from "./sourceChangeProposal.js";
import { runVerificationCommands } from "./verificationRunner.js";
import type { TaskLifecycle, VerificationEvidence } from "@ai-ide-agent/protocol";

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

interface ApplyWithoutVerificationMessage {
  type: "applyWithoutVerification";
}

type PanelMessage = RunTaskMessage | PreviewProposalMessage | ApplyProposalMessage | ApplyWithoutVerificationMessage;

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
      (message.type === "previewProposal" ||
        message.type === "applyProposal" ||
        message.type === "applyWithoutVerification"))
  );
}

function proposalUri(vscodeApi: typeof vscode, workspaceRootUri: vscode.Uri, proposal: FileProposal): vscode.Uri {
  return vscodeApi.Uri.joinPath(workspaceRootUri, ...proposal.relativePath.split("/"));
}

function sourceUri(vscodeApi: typeof vscode, workspaceRootUri: vscode.Uri, proposal: SourceChangeProposal): vscode.Uri {
  return vscodeApi.Uri.joinPath(workspaceRootUri, ...proposal.targetPath.split("/"));
}

export async function openAgentPanel(vscodeApi: typeof vscode): Promise<void> {
  const workspaceRoot = vscodeApi.workspace.workspaceFolders?.[0]?.uri.fsPath ?? process.cwd();
  const workspaceRootUri = vscodeApi.workspace.workspaceFolders?.[0]?.uri ?? vscodeApi.Uri.file(workspaceRoot);
  const providerConfig = resolveExtensionProviderRuntimeConfig(
    vscodeApi.workspace.getConfiguration("aiIdeAgent")
  );
  const provider = createProviderFromRuntimeConfig(providerConfig);
  let pendingProposal: FileProposal | undefined;
  let pendingSourceChanges: SourceChangeProposal[] = [];
  let currentLifecycle: TaskLifecycle | undefined;
  let verificationResults: VerificationEvidence[] = [];

  function renderCurrentPanel(errorMessage?: string): void {
    panel.webview.html = renderPanelHtml({
      state: currentLifecycle?.state ?? "Draft",
      taskGoal: currentLifecycle?.taskSpec.goal ?? "",
      contextCount: currentLifecycle?.contextLedger.length ?? 0,
      changeCapsuleCount: currentLifecycle?.changeCapsules.length ?? 0,
      verificationStatus: verificationResults[0]?.status ?? currentLifecycle?.verification[0]?.status ?? "skipped",
      providerName: provider.displayName,
      errorMessage,
      proposalPath: pendingSourceChanges[0]?.targetPath ?? pendingProposal?.relativePath,
      proposalPaths: pendingSourceChanges.length > 0
        ? pendingSourceChanges.map((sourceChange) => sourceChange.targetPath)
        : pendingProposal
          ? [pendingProposal.relativePath]
          : undefined,
      riskNote: pendingSourceChanges.length > 0 || pendingProposal
        ? `Review ${pendingSourceChanges.length || 1} file(s) before applying.`
        : undefined,
      verificationCommands: currentLifecycle?.taskSpec.verificationPlan.commands,
      verificationResults
    });
  }

  async function applyPendingChanges(): Promise<boolean> {
    if (pendingSourceChanges.length === 0 && !pendingProposal) {
      await vscodeApi.window.showWarningMessage("No smartIDE proposal is ready to apply.");
      return false;
    }

    if (pendingSourceChanges.length > 0) {
      for (const sourceChange of pendingSourceChanges) {
        const targetUri = sourceUri(vscodeApi, workspaceRootUri, sourceChange);
        await vscodeApi.workspace.fs.writeFile(targetUri, new TextEncoder().encode(sourceChange.proposedContent));
      }
      await vscodeApi.window.showInformationMessage(`smartIDE updated ${pendingSourceChanges.length} file(s).`);
      return true;
    }

    const markdownProposal = pendingProposal;
    if (!markdownProposal) {
      await vscodeApi.window.showWarningMessage("No smartIDE proposal is ready to apply.");
      return false;
    }

    const targetUri = proposalUri(vscodeApi, workspaceRootUri, markdownProposal);
    const targetDirectoryUri = vscodeApi.Uri.joinPath(workspaceRootUri, ".ai-ide-agent", "proposals");
    await vscodeApi.workspace.fs.createDirectory(targetDirectoryUri);
    await vscodeApi.workspace.fs.writeFile(targetUri, new TextEncoder().encode(markdownProposal.content));
    await vscodeApi.window.showInformationMessage(`smartIDE wrote ${markdownProposal.relativePath}`);
    return true;
  }

  async function runVerificationPlan(): Promise<void> {
    if (!currentLifecycle) {
      return;
    }

    verificationResults = await runVerificationCommands({
      commands: currentLifecycle.taskSpec.verificationPlan.commands,
      cwd: workspaceRoot
    });
    currentLifecycle = {
      ...currentLifecycle,
      verification: verificationResults,
      state: verificationResults.every((result) => result.status === "passed") ? "Verified" : "Needs Review"
    };
    renderCurrentPanel();
  }

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
      if (pendingSourceChanges.length === 0 && !pendingProposal) {
        await vscodeApi.window.showWarningMessage("No smartIDE proposal is ready to preview.");
        return;
      }

      if (pendingSourceChanges.length > 0) {
        for (const sourceChange of pendingSourceChanges) {
          const targetUri = sourceUri(vscodeApi, workspaceRootUri, sourceChange);
          const after = await vscodeApi.workspace.openTextDocument({
            content: sourceChange.proposedContent
          });
          await vscodeApi.commands.executeCommand(
            "vscode.diff",
            targetUri,
            after.uri,
            `smartIDE Preview: ${sourceChange.targetPath}`
          );
        }
        return;
      }

      const before = await vscodeApi.workspace.openTextDocument({ content: "", language: "markdown" });
      const after = await vscodeApi.workspace.openTextDocument({
        content: pendingProposal?.content ?? "",
        language: "markdown"
      });
      await vscodeApi.commands.executeCommand(
        "vscode.diff",
        before.uri,
        after.uri,
        `smartIDE Preview: ${pendingProposal?.relativePath ?? "proposal"}`
      );
      return;
    }

    if (message.type === "applyProposal") {
      if (await applyPendingChanges()) {
        await runVerificationPlan();
      }
      return;
    }

    if (message.type === "applyWithoutVerification") {
      if (await applyPendingChanges()) {
        verificationResults = [
          {
            kind: "manual",
            label: "Verification skipped",
            status: "skipped",
            output: "User applied changes without running verification commands."
          }
        ];
        if (currentLifecycle) {
          currentLifecycle = {
            ...currentLifecycle,
            verification: verificationResults,
            state: "Needs Review"
          };
        }
        renderCurrentPanel();
      }
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
      currentLifecycle = lifecycle;
      verificationResults = [];
      pendingProposal = createFileProposal({
        taskId: lifecycle.taskSpec.taskId,
        lifecycle
      });
      pendingSourceChanges = [];
      for (const targetPath of lifecycle.taskSpec.plannedFiles) {
        const targetUri = vscodeApi.Uri.joinPath(workspaceRootUri, ...targetPath.split("/"));
        const originalContent = new TextDecoder().decode(await vscodeApi.workspace.fs.readFile(targetUri));
        pendingSourceChanges.push(createSourceChangeProposal({
          targetPath,
          originalContent,
          lifecycle
        }));
      }

      renderCurrentPanel();
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
