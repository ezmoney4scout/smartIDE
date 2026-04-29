import * as vscode from "vscode";
import { openAgentPanel } from "./panel.js";

export function activate(context: vscode.ExtensionContext): void {
  const disposable = vscode.commands.registerCommand("aiIdeAgent.openPanel", async () => {
    await openAgentPanel(vscode);
  });

  context.subscriptions.push(disposable);
}

export function deactivate(): void {
  return undefined;
}
