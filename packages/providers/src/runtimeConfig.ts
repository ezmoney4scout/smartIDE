import type { ProviderConfig } from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { createMockProvider } from "./mockProvider.js";
import { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider.js";
import { createProviderFromPreset, type ProviderPresetId } from "./providerPresets.js";

export type RuntimeProviderId = ProviderPresetId | "openai-compatible" | "mock";

export interface ProviderRuntimeConfig extends ProviderConfig {
  provider: RuntimeProviderId;
  displayName?: string;
  mockResponse?: string;
}

type RuntimeEnv = Record<string, string | undefined>;

const providerApiKeyEnvNames: Record<ProviderPresetId, string> = {
  minimax: "MINIMAX_API_KEY",
  kimi: "KIMI_API_KEY",
  glm: "GLM_API_KEY"
};

function isProviderPresetId(value: string): value is ProviderPresetId {
  return value === "minimax" || value === "kimi" || value === "glm";
}

function isRuntimeProviderId(value: string | undefined): value is RuntimeProviderId {
  return value === "mock" || value === "openai-compatible" || value === "minimax" || value === "kimi" || value === "glm";
}

export function resolveProviderRuntimeConfig(env: RuntimeEnv = process.env): ProviderRuntimeConfig {
  const provider = isRuntimeProviderId(env.AI_IDE_AGENT_PROVIDER) ? env.AI_IDE_AGENT_PROVIDER : "mock";
  const providerSpecificApiKey =
    isProviderPresetId(provider) ? env[providerApiKeyEnvNames[provider]] : undefined;

  return {
    provider,
    apiKey: env.AI_IDE_AGENT_API_KEY ?? providerSpecificApiKey,
    baseUrl: env.AI_IDE_AGENT_BASE_URL,
    defaultModel: env.AI_IDE_AGENT_MODEL,
    mockResponse: env.AI_IDE_AGENT_MOCK_RESPONSE
  };
}

export function createProviderFromRuntimeConfig(config: ProviderRuntimeConfig): ModelProvider {
  if (config.provider === "mock") {
    return createMockProvider({
      id: "mock",
      response: config.mockResponse ?? "Render a transparent extension task lifecycle."
    });
  }

  if (config.provider === "openai-compatible") {
    return createOpenAiCompatibleProvider({
      id: "openai-compatible",
      displayName: config.displayName ?? "OpenAI Compatible",
      baseUrl: config.baseUrl ?? "https://api.openai.com/v1",
      apiKey: config.apiKey,
      defaultModel: config.defaultModel ?? "gpt-4.1-mini"
    });
  }

  return createProviderFromPreset(config.provider, config);
}
