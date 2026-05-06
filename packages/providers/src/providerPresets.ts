import type { ProviderConfig } from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider.js";

export type ProviderPresetId = "minimax" | "kimi" | "glm";
export type ModelPresetProviderId = ProviderPresetId | "mock" | "openai-compatible";

export type ModelPresetTier = "local-free" | "free-quota" | "hosted";

export interface ProviderPreset {
  id: ProviderPresetId;
  displayName: string;
  baseUrl: string;
  defaultModel: string;
  docsUrl: string;
}

export interface ProviderModelPreset {
  id: string;
  label: string;
  tier: ModelPresetTier;
  requiresApiKey: boolean;
  description: string;
}

export const providerPresets: ProviderPreset[] = [
  {
    id: "minimax",
    displayName: "Minimax",
    baseUrl: "https://api.minimax.io/v1",
    defaultModel: "MiniMax-M2.7",
    docsUrl: "https://platform.minimax.io/docs/api-reference/text-openai-api"
  },
  {
    id: "kimi",
    displayName: "Kimi",
    baseUrl: "https://api.moonshot.ai/v1",
    defaultModel: "kimi-k2.6",
    docsUrl: "https://platform.kimi.ai/docs/api/overview"
  },
  {
    id: "glm",
    displayName: "GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-4.7-flash",
    docsUrl: "https://docs.bigmodel.cn/cn/guide/models/free/glm-4.7-flash"
  }
];

export const providerModelPresets: Record<ModelPresetProviderId, ProviderModelPreset[]> = {
  mock: [
    {
      id: "mock-model",
      label: "Mock Model",
      tier: "local-free",
      requiresApiKey: false,
      description: "Local demo - no API key needed"
    }
  ],
  "openai-compatible": [],
  minimax: [
    {
      id: "MiniMax-M2.7",
      label: "MiniMax M2.7",
      tier: "hosted",
      requiresApiKey: true,
      description: "Hosted model - provider API key required"
    },
    {
      id: "MiniMax-M2.7-highspeed",
      label: "MiniMax M2.7 Highspeed",
      tier: "hosted",
      requiresApiKey: true,
      description: "Hosted model - provider API key required"
    },
    {
      id: "MiniMax-M2.5",
      label: "MiniMax M2.5",
      tier: "hosted",
      requiresApiKey: true,
      description: "Hosted model - provider API key required"
    }
  ],
  kimi: [
    {
      id: "kimi-k2.6",
      label: "Kimi K2.6",
      tier: "hosted",
      requiresApiKey: true,
      description: "Hosted model - provider API key required"
    },
    {
      id: "kimi-k2.5",
      label: "Kimi K2.5",
      tier: "hosted",
      requiresApiKey: true,
      description: "Hosted model - provider API key required"
    }
  ],
  glm: [
    {
      id: "glm-4.7-flash",
      label: "GLM 4.7 Flash",
      tier: "free-quota",
      requiresApiKey: true,
      description: "Free model - provider API key required"
    },
    {
      id: "glm-4-flash-250414",
      label: "GLM 4 Flash",
      tier: "free-quota",
      requiresApiKey: true,
      description: "Free model - provider API key required"
    },
    {
      id: "glm-4.6v-flash",
      label: "GLM 4.6V Flash",
      tier: "free-quota",
      requiresApiKey: true,
      description: "Free model - provider API key required"
    }
  ]
};

export function getProviderModelPresets(providerId: ModelPresetProviderId): ProviderModelPreset[] {
  return providerModelPresets[providerId];
}

export function createProviderFromPreset(id: ProviderPresetId, config: ProviderConfig): ModelProvider {
  const preset = providerPresets.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`Provider preset not found: ${id}`);
  }

  return createOpenAiCompatibleProvider({
    id: preset.id,
    displayName: preset.displayName,
    baseUrl: config.baseUrl ?? preset.baseUrl,
    apiKey: config.apiKey,
    defaultModel: config.defaultModel ?? preset.defaultModel
  });
}
