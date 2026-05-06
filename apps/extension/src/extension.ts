import * as vscode from "vscode";
import { initializeAgentWebview, openAgentPanel } from "./panel.js";

const chatViewId = "aiIdeAgent.chatView";
const chatContainerCommand = "workbench.view.extension.aiIdeAgent";

class SmartIdeChatViewProvider implements vscode.WebviewViewProvider {
  public constructor(private readonly vscodeApi: typeof vscode) {}

  public async resolveWebviewView(webviewView: vscode.WebviewView): Promise<void> {
    webviewView.webview.options = { enableScripts: true };
    await initializeAgentWebview(this.vscodeApi, webviewView.webview);
  }
}

async function focusSmartIdeChat(vscodeApi: typeof vscode): Promise<void> {
  await vscodeApi.commands.executeCommand(chatContainerCommand);
  await vscodeApi.commands.executeCommand(`${chatViewId}.focus`);
}

export function activate(context: vscode.ExtensionContext): void {
  const chatProvider = new SmartIdeChatViewProvider(vscode);
  const chatRegistration = vscode.window.registerWebviewViewProvider(
    chatViewId,
    chatProvider,
    { webviewOptions: { retainContextWhenHidden: true } }
  );
  const openPanelCommand = vscode.commands.registerCommand("aiIdeAgent.openPanel", async () => {
    await openAgentPanel(vscode);
  });
  const focusChatCommand = vscode.commands.registerCommand("aiIdeAgent.focusChat", async () => {
    await focusSmartIdeChat(vscode);
  });

  context.subscriptions.push(chatRegistration, openPanelCommand, focusChatCommand);

  const openOnStartup = vscode.workspace.getConfiguration("aiIdeAgent").get<boolean>("openOnStartup", true);
  if (openOnStartup) {
    setTimeout(() => {
      void focusSmartIdeChat(vscode);
    }, 250);
  }
}

export function deactivate(): void {
  return undefined;
}
