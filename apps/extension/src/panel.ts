import { createTaskLifecycle } from "@ai-ide-agent/agent-core";
import { createProviderFromRuntimeConfig, ProviderRegistry } from "@ai-ide-agent/providers";
import { LocalProjectStore } from "@ai-ide-agent/storage";
import type * as vscode from "vscode";
import { createPreWriteCodeReview, type CodeApprovalMode, type PreWriteCodeReview } from "./codeReview.js";
import { createFileProposal, type FileProposal } from "./fileProposal.js";
import { mergeMemoryProposal } from "./memoryProposal.js";
import { renderPanelHtml } from "./panelHtml.js";
import {
  describeProviderConfiguration,
  isRuntimeProviderId,
  resolveExtensionProviderRuntimeConfig
} from "./settings.js";
import { createSourceChangeProposal, type SourceChangeProposal } from "./sourceChangeProposal.js";
import { runVerificationCommands } from "./verificationRunner.js";
import type { TaskLifecycle, VerificationEvidence } from "@ai-ide-agent/protocol";

interface RunTaskMessage {
  type: "runTask";
  goal: string;
  approvalMode?: string;
}

interface PreviewProposalMessage {
  type: "previewProposal";
}

interface ApplyProposalMessage {
  type: "applyProposal";
  verificationCommands?: string[];
}

interface ApplyWithoutVerificationMessage {
  type: "applyWithoutVerification";
}

interface AcceptMemoryUpdateMessage {
  type: "acceptMemoryUpdate";
}

interface SaveProviderSettingsMessage {
  type: "saveProviderSettings";
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModel?: string;
}

type PanelMessage =
  | RunTaskMessage
  | PreviewProposalMessage
  | ApplyProposalMessage
  | ApplyWithoutVerificationMessage
  | AcceptMemoryUpdateMessage
  | SaveProviderSettingsMessage;

function isRunTaskMessage(message: unknown): message is RunTaskMessage {
  return (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    "goal" in message &&
    message.type === "runTask" &&
    typeof message.goal === "string" &&
    (!("approvalMode" in message) || typeof message.approvalMode === "string")
  );
}

function normalizeApprovalMode(value: string | undefined): CodeApprovalMode {
  return value === "auto" ? "auto" : "manual";
}

function isPanelMessage(message: unknown): message is PanelMessage {
  return (
    isRunTaskMessage(message) ||
    (typeof message === "object" &&
      message !== null &&
      "type" in message &&
      (message.type === "previewProposal" ||
        message.type === "applyProposal" ||
        message.type === "applyWithoutVerification" ||
        message.type === "acceptMemoryUpdate" ||
        message.type === "saveProviderSettings"))
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
  let providerConfig = resolveExtensionProviderRuntimeConfig(
    vscodeApi.workspace.getConfiguration("aiIdeAgent")
  );
  let providerStatus = describeProviderConfiguration(providerConfig);
  let provider = createProviderFromRuntimeConfig(providerConfig);
  const store = new LocalProjectStore(workspaceRoot);
  let pendingProposal: FileProposal | undefined;
  let pendingSourceChanges: SourceChangeProposal[] = [];
  let currentLifecycle: TaskLifecycle | undefined;
  let verificationResults: VerificationEvidence[] = [];
  let approvalMode: CodeApprovalMode = "manual";
  let preWriteReview: PreWriteCodeReview | undefined;
  let memoryStatusMessage = "Review before writing to project memory.";

  function reloadProviderRuntimeConfig(): void {
    providerConfig = resolveExtensionProviderRuntimeConfig(
      vscodeApi.workspace.getConfiguration("aiIdeAgent")
    );
    providerStatus = describeProviderConfiguration(providerConfig);
    provider = createProviderFromRuntimeConfig(providerConfig);
  }

  function providerSettingsViewModel() {
    return {
      providerName: providerStatus.providerLabel,
      providerId: providerConfig.provider,
      providerBaseUrl: providerConfig.baseUrl,
      providerDefaultModel: providerConfig.defaultModel,
      apiKeyConfigured: Boolean(providerConfig.apiKey),
      modelName: providerStatus.modelLabel,
      providerStatusMessage: providerStatus.message,
      providerReady: providerStatus.ok
    };
  }

  function renderCurrentPanel(errorMessage?: string): void {
    panel.webview.html = renderPanelHtml({
      state: currentLifecycle?.state ?? "Draft",
      taskGoal: currentLifecycle?.taskSpec.goal ?? "",
      contextCount: currentLifecycle?.contextLedger.length ?? 0,
      contextLedger: currentLifecycle?.contextLedger,
      changeCapsuleCount: currentLifecycle?.changeCapsules.length ?? 0,
      verificationStatus: verificationResults[0]?.status ?? currentLifecycle?.verification[0]?.status ?? "skipped",
      budget: currentLifecycle?.request.budget,
      estimatedCostUsd: currentLifecycle?.taskSpec.estimatedCostUsd,
      ...providerSettingsViewModel(),
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
      approvalMode,
      preWriteReview,
      verificationCommands: currentLifecycle?.taskSpec.verificationPlan.commands,
      verificationResults,
      memoryProposal: currentLifecycle?.memoryProposal,
      memoryStatusMessage: currentLifecycle ? memoryStatusMessage : undefined
    });
  }

  function refreshPreWriteReview(commands?: string[]): PreWriteCodeReview {
    preWriteReview = createPreWriteCodeReview({
      approvalMode,
      changes: pendingSourceChanges,
      verificationCommands: normalizeVerificationCommands(commands)
    });
    return preWriteReview;
  }

  async function applyPendingChanges(): Promise<boolean> {
    if (pendingSourceChanges.length === 0 && !pendingProposal) {
      await vscodeApi.window.showWarningMessage("No smartIDE proposal is ready to apply.");
      return false;
    }

    const review = preWriteReview ?? refreshPreWriteReview();
    if (review.status === "blocked") {
      await vscodeApi.window.showWarningMessage("smartIDE pre-write review blocked this proposal.");
      renderCurrentPanel();
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

  function normalizeVerificationCommands(commands: string[] | undefined): string[] {
    const normalized = (commands ?? currentLifecycle?.taskSpec.verificationPlan.commands ?? [])
      .map((command) => command.trim())
      .filter(Boolean);
    return normalized.length > 0 ? normalized : currentLifecycle?.taskSpec.verificationPlan.commands ?? [];
  }

  async function runVerificationPlan(commands?: string[]): Promise<void> {
    if (!currentLifecycle) {
      return;
    }

    const selectedCommands = normalizeVerificationCommands(commands);
    verificationResults = await runVerificationCommands({
      commands: selectedCommands,
      cwd: workspaceRoot
    });
    currentLifecycle = {
      ...currentLifecycle,
      taskSpec: {
        ...currentLifecycle.taskSpec,
        verificationPlan: {
          ...currentLifecycle.taskSpec.verificationPlan,
          commands: selectedCommands
        }
      },
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
    approvalMode,
    ...providerSettingsViewModel()
  });

  panel.webview.onDidReceiveMessage(async (message) => {
    if (!isPanelMessage(message)) {
      return;
    }

    if (message.type === "saveProviderSettings") {
      if (!isRuntimeProviderId(message.provider)) {
        await vscodeApi.window.showWarningMessage("Choose a supported smartIDE provider.");
        return;
      }

      const configuration = vscodeApi.workspace.getConfiguration("aiIdeAgent");
      const target = vscodeApi.ConfigurationTarget.Workspace;
      await configuration.update("provider", message.provider, target);
      await configuration.update("baseUrl", message.baseUrl?.trim() ?? "", target);
      await configuration.update("defaultModel", message.defaultModel?.trim() ?? "", target);
      if (message.apiKey?.trim()) {
        await configuration.update("apiKey", message.apiKey.trim(), target);
      }
      reloadProviderRuntimeConfig();
      await vscodeApi.window.showInformationMessage("smartIDE provider settings saved.");
      renderCurrentPanel();
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
      refreshPreWriteReview(message.verificationCommands);
      if (await applyPendingChanges()) {
        await runVerificationPlan(message.verificationCommands);
      }
      return;
    }

    if (message.type === "applyWithoutVerification") {
      refreshPreWriteReview();
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

    if (message.type === "acceptMemoryUpdate") {
      if (!currentLifecycle) {
        await vscodeApi.window.showWarningMessage("No smartIDE memory proposal is ready to apply.");
        return;
      }

      const currentMemory = await store.readMemory();
      await store.writeMemory(mergeMemoryProposal(currentMemory, currentLifecycle.memoryProposal));
      memoryStatusMessage = "Project memory updated.";
      await vscodeApi.window.showInformationMessage("smartIDE updated project memory.");
      renderCurrentPanel();
      return;
    }

    const goal = message.goal.trim();
    approvalMode = normalizeApprovalMode(message.approvalMode);
    if (!goal) {
      panel.webview.html = renderPanelHtml({
        state: "Blocked",
        taskGoal: "",
        contextCount: 0,
        changeCapsuleCount: 0,
        verificationStatus: "skipped",
        approvalMode,
        ...providerSettingsViewModel(),
        errorMessage: "Enter a task goal before running the agent."
      });
      return;
    }

    if (!providerStatus.ok) {
      panel.webview.html = renderPanelHtml({
        state: "Blocked",
        taskGoal: goal,
        contextCount: 0,
        changeCapsuleCount: 0,
        verificationStatus: "skipped",
        approvalMode,
        ...providerSettingsViewModel(),
        errorMessage: providerStatus.message
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
        store
      });
      currentLifecycle = lifecycle;
      verificationResults = [];
      preWriteReview = undefined;
      memoryStatusMessage = "Review before writing to project memory.";
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

      const review = refreshPreWriteReview();
      renderCurrentPanel();
      if (review.canAutoApply && await applyPendingChanges()) {
        await runVerificationPlan();
      }
    } catch (error) {
      panel.webview.html = renderPanelHtml({
        state: "Blocked",
        taskGoal: goal,
        contextCount: 0,
        changeCapsuleCount: 0,
        verificationStatus: "failed",
        approvalMode,
        ...providerSettingsViewModel(),
        errorMessage: error instanceof Error ? error.message : "Agent task failed."
      });
    }
  });
}
