import type { ProviderConfig } from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider.js";

export type ProviderPresetId = "minimax" | "kimi" | "glm";

export interface ProviderPreset {
  id: ProviderPresetId;
  displayName: string;
  baseUrl: string;
  defaultModel: string;
  docsUrl: string;
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
    defaultModel: "kimi-k2.5",
    docsUrl: "https://platform.kimi.ai/docs/api/overview"
  },
  {
    id: "glm",
    displayName: "GLM",
    baseUrl: "https://open.bigmodel.cn/api/paas/v4",
    defaultModel: "glm-5.1",
    docsUrl: "https://docs.bigmodel.cn/cn/guide/develop/openai/introduction"
  }
];

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
