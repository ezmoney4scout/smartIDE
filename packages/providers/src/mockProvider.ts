import type {
  ChatRequest,
  ChatResponse,
  ModelDescriptor,
  ProviderConfig,
  ProviderValidationResult
} from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { baselineCapabilities } from "./index.js";

export interface MockProviderOptions {
  id: string;
  response: string;
}

export function createMockProvider(options: MockProviderOptions): ModelProvider {
  return {
    id: options.id,
    displayName: "Mock Provider",
    capabilities: baselineCapabilities,
    async listModels(): Promise<ModelDescriptor[]> {
      return [
        {
          id: "mock-model",
          displayName: "Mock Model",
          contextWindow: 8192,
          capabilities: baselineCapabilities
        }
      ];
    },
    async complete(_request: ChatRequest): Promise<ChatResponse> {
      return {
        id: "mock-response",
        model: "mock-model",
        content: options.response,
        usage: {
          inputTokens: 1,
          outputTokens: options.response.length
        }
      };
    },
    async *stream(): AsyncIterable<{ contentDelta: string; done: boolean }> {
      yield { contentDelta: options.response, done: true };
    },
    async estimateCost() {
      return {
        inputTokens: 1,
        outputTokens: options.response.length,
        estimatedUsd: 0
      };
    },
    async validateConfig(_config: ProviderConfig): Promise<ProviderValidationResult> {
      return { ok: true, message: "Mock provider is always valid." };
    }
  };
}
