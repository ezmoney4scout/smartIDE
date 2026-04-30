import type { ContextLedgerEntry, VerificationEvidence } from "@ai-ide-agent/protocol";

export interface PanelViewModel {
  state: string;
  taskGoal: string;
  contextCount: number;
  changeCapsuleCount: number;
  verificationStatus: string;
  contextLedger?: ContextLedgerEntry[];
  providerName?: string;
  modelName?: string;
  providerStatusMessage?: string;
  providerReady?: boolean;
  errorMessage?: string;
  proposalPath?: string;
  proposalPaths?: string[];
  riskNote?: string;
  verificationCommands?: string[];
  verificationResults?: VerificationEvidence[];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderPanelHtml(viewModel: PanelViewModel): string {
  const state = escapeHtml(viewModel.state);
  const taskGoal = escapeHtml(viewModel.taskGoal);
  const verificationStatus = escapeHtml(viewModel.verificationStatus);
  const providerName = escapeHtml(viewModel.providerName ?? "Mock");
  const modelName = escapeHtml(viewModel.modelName ?? "mock-model");
  const providerStatusMessage = viewModel.providerStatusMessage ? escapeHtml(viewModel.providerStatusMessage) : "";
  const errorMessage = viewModel.errorMessage ? escapeHtml(viewModel.errorMessage) : "";
  const proposalPaths = (viewModel.proposalPaths?.length ? viewModel.proposalPaths : viewModel.proposalPath ? [viewModel.proposalPath] : [])
    .map(escapeHtml);
  const contextLedger = viewModel.contextLedger ?? [];
  const riskNote = viewModel.riskNote ? escapeHtml(viewModel.riskNote) : "";
  const verificationCommands = (viewModel.verificationCommands ?? []).map(escapeHtml);
  const verificationResults = viewModel.verificationResults ?? [];

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

      textarea {
        box-sizing: border-box;
        min-height: 96px;
        width: 100%;
        resize: vertical;
        border: 1px solid var(--vscode-input-border);
        border-radius: 4px;
        padding: 10px;
        color: var(--vscode-input-foreground);
        background: var(--vscode-input-background);
        font: inherit;
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
        <textarea id="task-goal" name="goal" aria-label="Task goal">${taskGoal}</textarea>
        <button type="submit">Run Agent Task</button>
      </form>

      ${errorMessage ? `<p class="error">${errorMessage}</p>` : ""}

      ${proposalPaths.length > 0
        ? `<section aria-labelledby="proposal-title">
        <h2 id="proposal-title">File Proposal</h2>
        ${riskNote ? `<p class="meta">${riskNote}</p>` : ""}
        <p>Target files:</p>
        <ul>
          ${proposalPaths.map((path) => `<li><span class="value">${path}</span></li>`).join("")}
        </ul>
        ${verificationCommands.length > 0
          ? `<p>Verification commands:</p>
        <ul>
          ${verificationCommands.map((command) => `<li><span class="value">${command}</span></li>`).join("")}
        </ul>`
          : ""}
        <div class="actions">
          <button type="button" id="preview-proposal">Preview Diff</button>
          <button type="button" id="apply-proposal">Apply & Run Verification</button>
          <button type="button" id="apply-without-verification">Apply Without Verification</button>
        </div>
      </section>`
        : ""}

      <section aria-labelledby="task-spec-title">
        <h2 id="task-spec-title">Task Spec</h2>
        <p>${taskGoal || "No task has run yet."}</p>
      </section>

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

      <section aria-labelledby="verification-gate-title">
        <h2 id="verification-gate-title">Verification Gate</h2>
        <p>Current status: <span class="value">${verificationStatus}</span></p>
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
    </main>
    <script>
      const vscode = acquireVsCodeApi();
      const form = document.getElementById("task-form");
      const goal = document.getElementById("task-goal");

      form.addEventListener("submit", (event) => {
        event.preventDefault();
        vscode.postMessage({ type: "runTask", goal: goal.value });
      });

      document.getElementById("preview-proposal")?.addEventListener("click", () => {
        vscode.postMessage({ type: "previewProposal" });
      });

      document.getElementById("apply-proposal")?.addEventListener("click", () => {
        vscode.postMessage({ type: "applyProposal" });
      });

      document.getElementById("apply-without-verification")?.addEventListener("click", () => {
        vscode.postMessage({ type: "applyWithoutVerification" });
      });
    </script>
  </body>
</html>`;
}
