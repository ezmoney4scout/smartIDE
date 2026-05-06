import type {
  ChatRequest,
  ChatResponse,
  ChatResponseChunk,
  CostEstimate,
  ModelDescriptor,
  ProviderCapabilities,
  ProviderConfig,
  ProviderValidationResult
} from "@ai-ide-agent/protocol";

export interface ModelProvider {
  id: string;
  displayName: string;
  capabilities: ProviderCapabilities;
  listModels(): Promise<ModelDescriptor[]>;
  complete(request: ChatRequest): Promise<ChatResponse>;
  stream(request: ChatRequest): AsyncIterable<ChatResponseChunk>;
  estimateCost?(request: ChatRequest): Promise<CostEstimate>;
  validateConfig(config: ProviderConfig): Promise<ProviderValidationResult>;
}

export class ProviderRegistry {
  private readonly providers = new Map<string, ModelProvider>();

  register(provider: ModelProvider): void {
    this.providers.set(provider.id, provider);
  }

  get(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  require(id: string): ModelProvider {
    const provider = this.get(id);
    if (!provider) {
      throw new Error(`Provider not registered: ${id}`);
    }
    return provider;
  }

  list(): ModelProvider[] {
    return [...this.providers.values()];
  }
}

export const baselineCapabilities: ProviderCapabilities = {
  chat: true,
  streaming: false,
  toolCalling: false,
  structuredOutput: false,
  vision: false,
  largeContext: false,
  localExecution: false,
  costEstimation: false
};

export { createMockProvider } from "./mockProvider.js";
export { createOpenAiCompatibleProvider } from "./openAiCompatibleProvider.js";
export { createProviderFromPreset, getProviderModelPresets, providerModelPresets, providerPresets } from "./providerPresets.js";
export type { ModelPresetProviderId, ModelPresetTier, ProviderModelPreset, ProviderPreset, ProviderPresetId } from "./providerPresets.js";
export { createProviderFromRuntimeConfig, resolveProviderRuntimeConfig } from "./runtimeConfig.js";
export type { ProviderRuntimeConfig, RuntimeProviderId } from "./runtimeConfig.js";
