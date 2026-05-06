const assert = require("node:assert/strict");
const vscode = require("vscode");

const extensionId = "ai-ide-agent.ai-ide-agent-extension";
const openPanelCommandId = "aiIdeAgent.openPanel";
const focusChatCommandId = "aiIdeAgent.focusChat";
const chatViewId = "aiIdeAgent.chatView";

async function run() {
  const extension = vscode.extensions.getExtension(extensionId);
  assert.ok(extension, `Expected ${extensionId} to be available in the Extension Host.`);

  const commandIds = extension.packageJSON.contributes.commands.map((command) => command.command);
  assert.ok(commandIds.includes(openPanelCommandId));
  assert.ok(commandIds.includes(focusChatCommandId));
  assert.equal(extension.packageJSON.contributes.views.aiIdeAgent[0].id, chatViewId);

  await vscode.commands.executeCommand(openPanelCommandId);
  assert.equal(extension.isActive, true, "Expected the panel command to activate the extension.");
}

module.exports = { run };
