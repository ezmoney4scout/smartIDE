import { describe, expect, it } from "vitest";
import { describeProviderConfiguration, resolveExtensionProviderRuntimeConfig } from "../src/settings.js";

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

  it("marks mock provider as ready without an API key", () => {
    expect(describeProviderConfiguration({ provider: "mock" })).toMatchObject({
      ok: true,
      providerLabel: "Mock Provider",
      modelLabel: "mock-model"
    });
  });

  it("reports missing API keys for hosted providers", () => {
    expect(describeProviderConfiguration({ provider: "kimi" })).toMatchObject({
      ok: false,
      providerLabel: "Kimi",
      message: "Kimi requires an API key."
    });
  });

  it("reports configured hosted provider model information", () => {
    expect(
      describeProviderConfiguration({
        provider: "glm",
        apiKey: "glm-key",
        defaultModel: "glm-custom"
      })
    ).toMatchObject({
      ok: true,
      providerLabel: "GLM",
      modelLabel: "glm-custom"
    });
  });
});
