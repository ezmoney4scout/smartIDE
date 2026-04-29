import { describe, expect, it } from "vitest";
import { resolveExtensionProviderRuntimeConfig } from "../src/settings.js";

describe("extension settings", () => {
  it("uses env config when editor settings are empty", () => {
    const config = resolveExtensionProviderRuntimeConfig(
      {
        get: () => undefined
      },
      {
        AI_IDE_AGENT_PROVIDER: "kimi",
        KIMI_API_KEY: "kimi-key"
      }
    );

    expect(config).toMatchObject({
      provider: "kimi",
      apiKey: "kimi-key"
    });
  });

  it("lets editor settings override env config", () => {
    const values = new Map<string, unknown>([
      ["provider", "glm"],
      ["apiKey", "settings-key"],
      ["defaultModel", "glm-custom"]
    ]);
    const config = resolveExtensionProviderRuntimeConfig(
      {
        get: <T>(key: string) => values.get(key) as T | undefined
      },
      {
        AI_IDE_AGENT_PROVIDER: "mock"
      }
    );

    expect(config).toMatchObject({
      provider: "glm",
      apiKey: "settings-key",
      defaultModel: "glm-custom"
    });
  });
});
