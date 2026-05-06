import type { BudgetHint, ContextLedgerEntry, MemoryUpdateProposal, VerificationEvidence } from "@ai-ide-agent/protocol";
import { getProviderModelPresets, providerModelPresets, type ModelPresetProviderId } from "@ai-ide-agent/providers";
import type { CodeApprovalMode, PreWriteCodeReview } from "./codeReview.js";

export interface PanelViewModel {
  state: string;
  taskGoal: string;
  contextCount: number;
  changeCapsuleCount: number;
  verificationStatus: string;
  budget?: BudgetHint;
  estimatedCostUsd?: number;
  contextLedger?: ContextLedgerEntry[];
  providerName?: string;
  providerId?: string;
  providerBaseUrl?: string;
  providerDefaultModel?: string;
  apiKeyConfigured?: boolean;
  modelName?: string;
  providerStatusMessage?: string;
  providerReady?: boolean;
  errorMessage?: string;
  proposalPath?: string;
  proposalPaths?: string[];
  riskNote?: string;
  approvalMode?: CodeApprovalMode;
  preWriteReview?: PreWriteCodeReview;
  verificationCommands?: string[];
  verificationResults?: VerificationEvidence[];
  memoryProposal?: MemoryUpdateProposal;
  memoryStatusMessage?: string;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatUsd(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatTokenLimit(value: number | undefined, label: string): string {
  return value === undefined ? `No ${label} limit` : `${value.toLocaleString("en-US")} ${label} tokens`;
}

function escapeScriptJson(value: unknown): string {
  return JSON.stringify(value).replaceAll("</", "<\\/");
}

export function renderPanelHtml(viewModel: PanelViewModel): string {
  const state = escapeHtml(viewModel.state);
  const taskGoal = escapeHtml(viewModel.taskGoal);
  const verificationStatus = escapeHtml(viewModel.verificationStatus);
  const providerName = escapeHtml(viewModel.providerName ?? "Mock");
  const providerId = viewModel.providerId ?? "mock";
  const providerBaseUrl = escapeHtml(viewModel.providerBaseUrl ?? "");
  const providerDefaultModel = escapeHtml(viewModel.providerDefaultModel ?? "");
  const modelName = escapeHtml(viewModel.modelName ?? "mock-model");
  const budget = viewModel.budget;
  const providerStatusMessage = viewModel.providerStatusMessage ? escapeHtml(viewModel.providerStatusMessage) : "";
  const errorMessage = viewModel.errorMessage ? escapeHtml(viewModel.errorMessage) : "";
  const approvalMode = viewModel.approvalMode ?? "manual";
  const proposalPaths = (viewModel.proposalPaths?.length ? viewModel.proposalPaths : viewModel.proposalPath ? [viewModel.proposalPath] : [])
    .map(escapeHtml);
  const contextLedger = viewModel.contextLedger ?? [];
  const riskNote = viewModel.riskNote ? escapeHtml(viewModel.riskNote) : "";
  const verificationCommands = (viewModel.verificationCommands ?? []).map(escapeHtml);
  const verificationResults = viewModel.verificationResults ?? [];
  const preWriteReview = viewModel.preWriteReview;
  const memoryProposal = viewModel.memoryProposal;
  const memoryStatusMessage = viewModel.memoryStatusMessage ? escapeHtml(viewModel.memoryStatusMessage) : "";
  const memoryProposalEntries = memoryProposal
    ? [
      ...memoryProposal.facts.map((value) => ({ label: "Fact", value })),
      ...memoryProposal.rules.map((value) => ({ label: "Rule", value })),
      ...memoryProposal.decisions.map((value) => ({ label: "Decision", value })),
      ...memoryProposal.pitfalls.map((value) => ({ label: "Pitfall", value }))
    ]
    : [];
  const providerOptions = [
    { value: "mock", label: "Mock" },
    { value: "openai-compatible", label: "OpenAI-compatible" },
    { value: "minimax", label: "Minimax" },
    { value: "kimi", label: "Kimi" },
    { value: "glm", label: "GLM" }
  ];
  const modelPresetProviderId: ModelPresetProviderId =
    providerId === "mock" ||
    providerId === "openai-compatible" ||
    providerId === "minimax" ||
    providerId === "kimi" ||
    providerId === "glm"
      ? providerId
      : "mock";
  const selectedModelPresets = getProviderModelPresets(modelPresetProviderId);
  const selectedModelId = viewModel.providerDefaultModel || viewModel.modelName || "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI IDE Agent</title>
    <style>
      :root {
        color-scheme: light dark;
        font-family: var(--vscode-font-family, ui-sans-serif, system-ui, sans-serif);
        font-size: var(--vscode-font-size, 13px);
        color: var(--vscode-foreground);
        background: var(--vscode-editor-background);
      }

      body {
        margin: 0;
        padding: 24px;
      }

      main {
        max-width: 880px;
        margin: 0 auto;
      }

      header {
        margin-bottom: 24px;
        border-bottom: 1px solid var(--vscode-panel-border);
        padding-bottom: 16px;
      }

      h1,
      h2,
      p {
        margin-top: 0;
      }

      h1 {
        font-size: 24px;
        font-weight: 650;
      }

      h2 {
        font-size: 15px;
        font-weight: 650;
      }

      section {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 6px;
        margin-bottom: 12px;
        padding: 16px;
        background: var(--vscode-editorWidget-background);
      }

      form {
        display: grid;
        gap: 10px;
        margin-bottom: 16px;
      }

      .settings-grid {
        display: grid;
        gap: 10px;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        margin-bottom: 12px;
      }

      label {
        display: grid;
        gap: 4px;
        color: var(--vscode-descriptionForeground);
      }

      textarea,
      input,
      select {
        box-sizing: border-box;
        width: 100%;
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        padding: 10px;
        color: var(--vscode-input-foreground);
        background: var(--vscode-input-background);
        font: inherit;
      }

      textarea {
        min-height: 96px;
        resize: vertical;
      }

      button {
        width: max-content;
        border: 1px solid var(--vscode-button-border, transparent);
        border-radius: 4px;
        padding: 8px 12px;
        color: var(--vscode-button-foreground);
        background: var(--vscode-button-background);
        font: inherit;
        font-weight: 650;
        cursor: pointer;
      }

      button:hover {
        background: var(--vscode-button-hoverBackground);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 12px;
      }

      .meta {
        color: var(--vscode-descriptionForeground);
      }

      .value {
        font-weight: 650;
      }

      .error {
        color: var(--vscode-errorForeground);
      }

      .ledger-list {
        display: grid;
        gap: 10px;
        list-style: none;
        margin: 12px 0 0;
        padding: 0;
      }

      .ledger-entry {
        border-left: 3px solid var(--vscode-panel-border);
        padding-left: 10px;
      }

      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin: 6px 0;
      }

      .badge {
        border: 1px solid var(--vscode-panel-border);
        border-radius: 4px;
        padding: 2px 6px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }

      .field-hint {
        min-height: 18px;
        color: var(--vscode-descriptionForeground);
        font-size: 12px;
      }

      pre {
        overflow-x: auto;
        border-radius: 4px;
        padding: 10px;
        background: var(--vscode-textCodeBlock-background);
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>AI IDE Agent</h1>
        <p class="meta">State: <span class="value">${state}</span></p>
        <p class="meta">Provider: <span class="value">${providerName}</span></p>
        <p class="meta">Model: <span class="value">${modelName}</span></p>
        ${providerStatusMessage ? `<p class="${viewModel.providerReady === false ? "error" : "meta"}">${providerStatusMessage}</p>` : ""}
      </header>

      <form id="task-form">
        <textarea id="task-goal" name="goal" aria-label="Task goal" placeholder="Describe what to build">${taskGoal}</textarea>
        <label for="approval-mode">Automation Mode
          <select id="approval-mode" name="approvalMode">
            <option value="manual"${approvalMode === "manual" ? " selected" : ""}>Human Approval</option>
            <option value="auto"${approvalMode === "auto" ? " selected" : ""}>Full Automation</option>
          </select>
        </label>
        <button type="submit">Run Agent Task</button>
      </form>

      ${errorMessage ? `<p class="error">${errorMessage}</p>` : ""}

      <section aria-labelledby="provider-settings-title">
        <h2 id="provider-settings-title">Provider Settings</h2>
        <form id="provider-settings-form">
          <div class="settings-grid">
            <label for="ai-provider">Provider
              <select id="ai-provider" name="provider">
                ${providerOptions
                  .map((option) => `<option value="${option.value}"${option.value === providerId ? " selected" : ""}>${option.label}</option>`)
                  .join("")}
              </select>
            </label>
            <label for="ai-model-preset">Recommended Models
              <select id="ai-model-preset" name="modelPreset">
                <option value="">Custom model</option>
                ${selectedModelPresets
                  .map((preset) => {
                    const label = `${preset.label} (${preset.id}) - ${preset.description}`;
                    return `<option value="${escapeHtml(preset.id)}"${preset.id === selectedModelId ? " selected" : ""}>${escapeHtml(label)}</option>`;
                  })
                  .join("")}
              </select>
              <span id="model-preset-hint" class="field-hint"></span>
            </label>
            <label for="ai-model">Custom Model
              <input id="ai-model" name="defaultModel" type="text" value="${providerDefaultModel}" placeholder="${modelName}">
            </label>
            <label for="ai-base-url">Base URL
              <input id="ai-base-url" name="baseUrl" type="text" value="${providerBaseUrl}" placeholder="Provider default">
            </label>
            <label for="ai-api-key">API Key
              <input id="ai-api-key" name="apiKey" type="password" placeholder="${viewModel.apiKeyConfigured ? "Configured - enter a new key to replace" : "Required for hosted providers"}">
            </label>
          </div>
          <button type="submit">Save Provider Settings</button>
        </form>
      </section>

      ${proposalPaths.length > 0
        ? `<section aria-labelledby="proposal-title">
        <h2 id="proposal-title">File Proposal</h2>
        ${riskNote ? `<p class="meta">${riskNote}</p>` : ""}
        <p>Target files:</p>
        <ul>
          ${proposalPaths.map((path) => `<li><span class="value">${path}</span></li>`).join("")}
        </ul>
        <div class="actions">
          <button type="button" id="preview-proposal">Preview Diff</button>
          <button type="button" id="apply-proposal">Approve & Apply Selected Verification</button>
          <button type="button" id="apply-without-verification">Approve & Apply Without Verification</button>
        </div>
      </section>`
        : ""}

      <section aria-labelledby="task-spec-title">
        <h2 id="task-spec-title">Task Spec</h2>
        <p>${taskGoal || "No task has run yet."}</p>
      </section>

      ${budget
        ? `<section aria-labelledby="budget-title">
        <h2 id="budget-title">Budget and Limits</h2>
        <div class="badges">
          <span class="badge">${escapeHtml(budget.mode)}</span>
          <span class="badge">${budget.maxUsd === undefined ? "No cost limit" : formatUsd(budget.maxUsd)}</span>
          <span class="badge">${escapeHtml(formatTokenLimit(budget.maxInputTokens, "input"))}</span>
          <span class="badge">${escapeHtml(formatTokenLimit(budget.maxOutputTokens, "output"))}</span>
          <span class="badge">Estimated: ${viewModel.estimatedCostUsd === undefined ? "pending" : formatUsd(viewModel.estimatedCostUsd)}</span>
        </div>
      </section>`
        : ""}

      <section aria-labelledby="context-ledger-title">
        <h2 id="context-ledger-title">Context Ledger</h2>
        <p><span class="value">${viewModel.contextCount}</span> context entries captured for this task.</p>
        ${contextLedger.length > 0
          ? `<ul class="ledger-list">
          ${contextLedger
            .map((entry) => `<li class="ledger-entry">
              <p><span class="value">${escapeHtml(entry.path)}</span></p>
              <div class="badges">
                <span class="badge">${escapeHtml(entry.source)}</span>
                <span class="badge">${entry.tokens} tokens</span>
                ${entry.pinned ? `<span class="badge">pinned</span>` : ""}
                ${entry.excluded ? `<span class="badge">excluded</span>` : ""}
              </div>
              <p class="meta">${escapeHtml(entry.reason)}</p>
            </li>`)
            .join("")}
        </ul>`
          : ""}
      </section>

      <section aria-labelledby="change-capsules-title">
        <h2 id="change-capsules-title">Change Capsules</h2>
        <p><span class="value">${viewModel.changeCapsuleCount}</span> proposed implementation capsule.</p>
      </section>

      ${preWriteReview
        ? `<section aria-labelledby="pre-write-review-title">
        <h2 id="pre-write-review-title">Pre-write Code Review</h2>
        <p>Current status: <span class="value">${escapeHtml(preWriteReview.status)}</span></p>
        <p class="meta">${escapeHtml(preWriteReview.summary)}</p>
        <ul>
          ${preWriteReview.findings
            .map((finding) => `<li>
              <p><span class="value">${escapeHtml(finding.severity)}</span>${finding.path ? ` ${escapeHtml(finding.path)}` : ""}: ${escapeHtml(finding.message)}</p>
            </li>`)
            .join("")}
        </ul>
      </section>`
        : ""}

      <section aria-labelledby="verification-gate-title">
        <h2 id="verification-gate-title">Verification Gate</h2>
        <p>Current status: <span class="value">${verificationStatus}</span></p>
        <label for="verification-commands">Verification commands
          <textarea id="verification-commands" name="verificationCommands" aria-label="Verification commands">${verificationCommands.join("\n")}</textarea>
        </label>
        ${verificationResults.length > 0
          ? `<ul>
          ${verificationResults
            .map((result) => `<li>
              <p><span class="value">${escapeHtml(result.label)}</span>: ${escapeHtml(result.status)}</p>
              ${result.output ? `<pre>${escapeHtml(result.output)}</pre>` : ""}
            </li>`)
            .join("")}
        </ul>`
          : ""}
      </section>

      ${memoryProposalEntries.length > 0
        ? `<section aria-labelledby="memory-proposal-title">
        <h2 id="memory-proposal-title">Memory Update Proposal</h2>
        ${memoryStatusMessage ? `<p class="meta">${memoryStatusMessage}</p>` : ""}
        <ul>
          ${memoryProposalEntries
            .map((entry) => `<li>
              <p><span class="value">${escapeHtml(entry.label)}</span>: ${escapeHtml(entry.value)}</p>
            </li>`)
            .join("")}
        </ul>
        <div class="actions">
          <button type="button" id="accept-memory-update">Accept Memory Update</button>
        </div>
      </section>`
        : ""}
    </main>
    <script>
      const vscode = acquireVsCodeApi();
      const providerModelPresets = ${escapeScriptJson(providerModelPresets)};
      const form = document.getElementById("task-form");
      const goal = document.getElementById("task-goal");
      const approvalMode = document.getElementById("approval-mode");
      const providerSettingsForm = document.getElementById("provider-settings-form");
      const providerSelect = document.getElementById("ai-provider");
      const modelPresetSelect = document.getElementById("ai-model-preset");
      const modelPresetHint = document.getElementById("model-preset-hint");
      const modelInput = document.getElementById("ai-model");
      const apiKeyInput = document.getElementById("ai-api-key");

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        vscode.postMessage({ type: "runTask", goal: goal.value, approvalMode: approvalMode.value });
      });

      function describeModelPreset(preset) {
        if (!preset) {
          return "Use a custom model ID from your provider.";
        }
        return preset.description;
      }

      function updateApiKeyPlaceholder(providerId, preset) {
        if (providerId === "mock" || preset?.requiresApiKey === false) {
          apiKeyInput.placeholder = "Not needed for local demo";
          return;
        }
        apiKeyInput.placeholder = ${escapeScriptJson(viewModel.apiKeyConfigured ? "Configured - enter a new key to replace" : "Required for hosted providers")};
      }

      function renderModelPresetOptions(providerId, selectedModel) {
        const presets = providerModelPresets[providerId] ?? [];
        modelPresetSelect.replaceChildren(new Option("Custom model", ""));
        for (const preset of presets) {
          const option = new Option(\`\${preset.label} (\${preset.id}) - \${preset.description}\`, preset.id);
          option.selected = preset.id === selectedModel;
          modelPresetSelect.add(option);
        }
        const selectedPreset = presets.find((preset) => preset.id === modelPresetSelect.value);
        modelPresetHint.textContent = describeModelPreset(selectedPreset);
        updateApiKeyPlaceholder(providerId, selectedPreset);
      }

      providerSelect.addEventListener("change", () => {
        const presets = providerModelPresets[providerSelect.value] ?? [];
        const firstPreset = presets[0];
        if (firstPreset) {
          modelInput.value = firstPreset.id;
        }
        renderModelPresetOptions(providerSelect.value, modelInput.value);
      });

      modelPresetSelect.addEventListener("change", () => {
        const presets = providerModelPresets[providerSelect.value] ?? [];
        const selectedPreset = presets.find((preset) => preset.id === modelPresetSelect.value);
        if (selectedPreset) {
          modelInput.value = selectedPreset.id;
        }
        modelPresetHint.textContent = describeModelPreset(selectedPreset);
        updateApiKeyPlaceholder(providerSelect.value, selectedPreset);
      });

      renderModelPresetOptions(providerSelect.value, modelInput.value);

      providerSettingsForm.addEventListener("submit", (event) => {
        event.preventDefault();
        vscode.postMessage({
          type: "saveProviderSettings",
          provider: providerSelect.value,
          defaultModel: modelInput.value,
          baseUrl: document.getElementById("ai-base-url").value,
          apiKey: apiKeyInput.value
        });
      });

      function runVerificationCommands() {
        return document.getElementById("verification-commands").value
          .split("\\n")
          .map((command) => command.trim())
          .filter(Boolean);
      }

      document.getElementById("preview-proposal")?.addEventListener("click", () => {
        vscode.postMessage({ type: "previewProposal" });
      });

      document.getElementById("apply-proposal")?.addEventListener("click", () => {
        vscode.postMessage({ type: "applyProposal", verificationCommands: runVerificationCommands() });
      });

      document.getElementById("apply-without-verification")?.addEventListener("click", () => {
        vscode.postMessage({ type: "applyWithoutVerification" });
      });

      document.getElementById("accept-memory-update")?.addEventListener("click", () => {
        vscode.postMessage({ type: "acceptMemoryUpdate" });
      });
    </script>
  </body>
</html>`;
}
