export interface PanelViewModel {
  state: string;
  taskGoal: string;
  contextCount: number;
  changeCapsuleCount: number;
  verificationStatus: string;
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

      .meta {
        color: var(--vscode-descriptionForeground);
      }

      .value {
        font-weight: 650;
      }
    </style>
  </head>
  <body>
    <main>
      <header>
        <h1>AI IDE Agent</h1>
        <p class="meta">State: <span class="value">${state}</span></p>
      </header>

      <section aria-labelledby="task-spec-title">
        <h2 id="task-spec-title">Task Spec</h2>
        <p>${taskGoal}</p>
      </section>

      <section aria-labelledby="context-ledger-title">
        <h2 id="context-ledger-title">Context Ledger</h2>
        <p><span class="value">${viewModel.contextCount}</span> context entries captured for this task.</p>
      </section>

      <section aria-labelledby="change-capsules-title">
        <h2 id="change-capsules-title">Change Capsules</h2>
        <p><span class="value">${viewModel.changeCapsuleCount}</span> proposed implementation capsule.</p>
      </section>

      <section aria-labelledby="verification-gate-title">
        <h2 id="verification-gate-title">Verification Gate</h2>
        <p>Current status: <span class="value">${verificationStatus}</span></p>
      </section>
    </main>
  </body>
</html>`;
}
