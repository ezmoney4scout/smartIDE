const assert = require("node:assert/strict");
const vscode = require("vscode");

const extensionId = "ai-ide-agent.ai-ide-agent-extension";
const commandId = "aiIdeAgent.openPanel";

async function run() {
  const extension = vscode.extensions.getExtension(extensionId);
  assert.ok(extension, `Expected ${extensionId} to be available in the Extension Host.`);

  assert.deepEqual(
    extension.packageJSON.contributes.commands.map((command) => command.command),
    [commandId]
  );

  await vscode.commands.executeCommand(commandId);
  assert.equal(extension.isActive, true, "Expected the panel command to activate the extension.");
}

module.exports = { run };
