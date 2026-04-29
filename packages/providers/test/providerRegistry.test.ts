import { describe, expect, it } from "vitest";
import { createMockProvider, createProviderFromPreset, ProviderRegistry, providerPresets } from "../src/index.js";

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
      expect.arrayContaining([expect.objectContaining({ id: "glm-5.1" })])
    );
  });
});
