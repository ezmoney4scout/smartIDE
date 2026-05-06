import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const manifest = JSON.parse(
  readFileSync(resolve("apps/extension/package.json"), "utf8")
) as {
  activationEvents: string[];
  contributes: {
    commands: Array<{ command: string; title: string }>;
    configuration: { properties: Record<string, unknown> };
    views: Record<string, Array<{ id: string; name: string; type?: string }>>;
    viewsContainers: { activitybar: Array<{ id: string; title: string; icon: string }> };
  };
  capabilities: { untrustedWorkspaces: { supported: boolean } };
};

describe("extension manifest", () => {
  it("contributes a smartIDE chat sidebar that can auto-open on startup", () => {
    expect(manifest.activationEvents).toContain("onStartupFinished");
    expect(manifest.activationEvents).toContain("*");
    expect(manifest.activationEvents).toContain("onView:aiIdeAgent.chatView");
    expect(manifest.contributes.viewsContainers.activitybar).toContainEqual({
      id: "aiIdeAgent",
      title: "smartIDE",
      icon: "media/smartide.svg"
    });
    expect(manifest.contributes.views.aiIdeAgent).toContainEqual({
      id: "aiIdeAgent.chatView",
      name: "Chat",
      type: "webview"
    });
    expect(manifest.contributes.commands).toContainEqual({
      command: "aiIdeAgent.focusChat",
      title: "AI IDE Agent: Focus Chat"
    });
    expect(manifest.contributes.configuration.properties).toHaveProperty("aiIdeAgent.openOnStartup");
    expect(manifest.capabilities.untrustedWorkspaces.supported).toBe(true);
  });
});
