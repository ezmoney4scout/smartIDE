import { describe, expect, it } from "vitest";
import {
  createMockProvider,
  createProviderFromRuntimeConfig,
  createProviderFromPreset,
  getProviderModelPresets,
  ProviderRegistry,
  providerModelPresets,
  providerPresets,
  resolveProviderRuntimeConfig
} from "../src/index.js";

describe("ProviderRegistry", () => {
  it("registers and retrieves providers by id", async () => {
    const registry = new ProviderRegistry();
    const provider = createMockProvider({ id: "mock", response: "hello from mock" });

    registry.register(provider);

    expect(registry.get("mock")).toBe(provider);
    await expect(provider.complete({ messages: [{ role: "user", content: "Hi" }] })).resolves.toMatchObject({
      content: "hello from mock",
      model: "mock-model"
    });
  });

  it("throws a readable error for unknown providers", () => {
    const registry = new ProviderRegistry();

    expect(() => registry.require("missing")).toThrow("Provider not registered: missing");
  });

  it("creates Minimax, Kimi, and GLM providers from presets", async () => {
    const minimax = createProviderFromPreset("minimax", { apiKey: "test-key" });
    const kimi = createProviderFromPreset("kimi", { apiKey: "test-key" });
    const glm = createProviderFromPreset("glm", { apiKey: "test-key" });

    expect(providerPresets.map((preset) => preset.id)).toEqual(
      expect.arrayContaining(["minimax", "kimi", "glm"])
    );
    expect(minimax.displayName).toBe("Minimax");
    expect(kimi.displayName).toBe("Kimi");
    expect(glm.displayName).toBe("GLM");
    await expect(glm.listModels()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "glm-4.7-flash" })])
    );
  });

  it("exposes onboarding model presets with API-key requirements", () => {
    expect(providerModelPresets.mock).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "mock-model",
          requiresApiKey: false,
          tier: "local-free"
        })
      ])
    );
    expect(getProviderModelPresets("glm")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "glm-4.7-flash",
          requiresApiKey: true,
          tier: "free-quota"
        })
      ])
    );
    expect(getProviderModelPresets("kimi").map((preset) => preset.id)).toContain("kimi-k2.6");
    expect(getProviderModelPresets("minimax").map((preset) => preset.id)).toContain("MiniMax-M2.7");
    expect(getProviderModelPresets("openai-compatible")).toEqual([]);
  });

  it("resolves provider runtime config from generic and provider-specific env vars", () => {
    const kimi = resolveProviderRuntimeConfig({
      AI_IDE_AGENT_PROVIDER: "kimi",
      KIMI_API_KEY: "kimi-key",
      AI_IDE_AGENT_MODEL: "kimi-custom"
    });
    const glm = resolveProviderRuntimeConfig({
      AI_IDE_AGENT_PROVIDER: "glm",
      GLM_API_KEY: "glm-key"
    });

    expect(kimi).toMatchObject({
      provider: "kimi",
      apiKey: "kimi-key",
      defaultModel: "kimi-custom"
    });
    expect(glm).toMatchObject({
      provider: "glm",
      apiKey: "glm-key"
    });
  });

  it("creates providers from runtime config", async () => {
    const provider = createProviderFromRuntimeConfig({
      provider: "minimax",
      apiKey: "minimax-key",
      defaultModel: "MiniMax-custom"
    });

    expect(provider.id).toBe("minimax");
    await expect(provider.listModels()).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "MiniMax-custom" })])
    );
  });
});
