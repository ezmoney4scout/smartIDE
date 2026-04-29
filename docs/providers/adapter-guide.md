# Provider Adapter Guide

Provider adapters connect AI IDE Agent to model vendors while keeping provider-specific details out of the Agent Core. Every adapter must implement `ModelProvider` from `@ai-ide-agent/providers`.

```ts
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
```

## Adapter Rules

- Keep vendor SDK details inside the adapter.
- Declare model capabilities explicitly.
- Do not persist API keys in project files.
- Add tests that run without real provider credentials.
- Put live provider tests behind explicit environment variables.

## Capabilities

Adapters expose capabilities through `ProviderCapabilities` so routing and UI decisions can be made without guessing.

```ts
export interface ProviderCapabilities {
  chat: boolean;
  streaming: boolean;
  toolCalling: boolean;
  structuredOutput: boolean;
  vision: boolean;
  largeContext: boolean;
  localExecution: boolean;
  costEstimation: boolean;
}
```

Set each field from observed provider behavior, not marketing claims. If a provider has partial support, start with `false` and add the narrower behavior after the protocol can represent it safely.

## Phase 1 Providers

Phase 1 includes:

- Mock provider for local tests and demos
- OpenAI-compatible provider adapter
- Presets for Minimax, Kimi, and GLM using OpenAI-compatible chat completion semantics

Presets live in `packages/providers/src/providerPresets.ts`. Use a preset when a provider supports the OpenAI-compatible request and response shape but needs a known base URL, display name, default model, or documentation URL.

## Configuration And Secrets

Adapters receive provider configuration through `ProviderConfig`. API keys may be read from editor secret storage, OS secret storage, environment variables in local development, or an explicit runtime config object. They must not be written into project files, generated capsules, ledgers, or local memory.

`validateConfig` should check that required runtime fields are present and return a user-facing result. It should not make live network calls unless the caller has explicitly requested live validation.

Runtime configuration is centralized through `ProviderRuntimeConfig`:

```ts
import {
  createProviderFromRuntimeConfig,
  resolveProviderRuntimeConfig
} from "@ai-ide-agent/providers";

const config = resolveProviderRuntimeConfig(process.env);
const provider = createProviderFromRuntimeConfig(config);
```

The generic environment variables are `AI_IDE_AGENT_PROVIDER`, `AI_IDE_AGENT_API_KEY`, `AI_IDE_AGENT_BASE_URL`, and `AI_IDE_AGENT_MODEL`. Provider-specific API key fallbacks are `MINIMAX_API_KEY`, `KIMI_API_KEY`, and `GLM_API_KEY`.

## Testing

Default tests must run without real provider credentials. Prefer mock `fetch` behavior, local fixtures, or the Mock provider when validating adapter shape and registry behavior.

Live provider tests are allowed only when guarded by explicit environment variables such as `AI_IDE_AGENT_LIVE_PROVIDER_TESTS=1` plus provider-specific API key variables. These tests should be skipped by default in local development and CI.
