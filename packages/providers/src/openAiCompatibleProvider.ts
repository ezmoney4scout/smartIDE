import type {
  ChatRequest,
  ChatResponse,
  ModelDescriptor,
  ProviderConfig,
  ProviderValidationResult
} from "@ai-ide-agent/protocol";
import type { ModelProvider } from "./index.js";
import { baselineCapabilities } from "./index.js";

export interface OpenAiCompatibleOptions {
  id: string;
  displayName: string;
  baseUrl: string;
  apiKey?: string;
  defaultModel: string;
}

export function createOpenAiCompatibleProvider(options: OpenAiCompatibleOptions): ModelProvider {
  const capabilities = {
    ...baselineCapabilities,
    streaming: true,
    structuredOutput: true,
    costEstimation: true
  };

  return {
    id: options.id,
    displayName: options.displayName,
    capabilities,
    async listModels(): Promise<ModelDescriptor[]> {
      return [
        {
          id: options.defaultModel,
          displayName: options.defaultModel,
          contextWindow: 128000,
          capabilities
        }
      ];
    },
    async complete(request: ChatRequest): Promise<ChatResponse> {
      const response = await fetch(`${options.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {})
        },
        body: JSON.stringify({
          model: request.model ?? options.defaultModel,
          messages: [
            ...(request.system ? [{ role: "system", content: request.system }] : []),
            ...request.messages
          ],
          temperature: request.temperature ?? 0.2,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI-compatible provider failed: ${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as {
        id?: string;
        model?: string;
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      return {
        id: payload.id ?? "openai-compatible-response",
        model: payload.model ?? options.defaultModel,
        content: payload.choices?.[0]?.message?.content ?? "",
        usage: payload.usage
          ? {
              inputTokens: payload.usage.prompt_tokens ?? 0,
              outputTokens: payload.usage.completion_tokens ?? 0
            }
          : undefined
      };
    },
    async *stream(request: ChatRequest) {
      const response = await this.complete(request);
      yield { contentDelta: response.content, done: true };
    },
    async estimateCost(request: ChatRequest) {
      const inputTokens = request.messages.reduce((sum, message) => sum + Math.ceil(message.content.length / 4), 0);
      const outputTokens = request.budget?.maxOutputTokens ?? 1024;
      return {
        inputTokens,
        outputTokens,
        estimatedUsd: 0
      };
    },
    async validateConfig(config: ProviderConfig): Promise<ProviderValidationResult> {
      if (!config.baseUrl && !options.baseUrl) {
        return { ok: false, message: "Missing baseUrl for OpenAI-compatible provider." };
      }
      if (!config.apiKey && !options.apiKey) {
        return { ok: false, message: "Missing apiKey for OpenAI-compatible provider." };
      }
      return { ok: true, message: "Provider configuration is valid." };
    }
  };
}
