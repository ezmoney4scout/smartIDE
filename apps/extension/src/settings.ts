import {
  providerPresets,
  resolveProviderRuntimeConfig,
  type ProviderRuntimeConfig,
  type RuntimeProviderId
} from "@ai-ide-agent/providers";

export interface ExtensionConfiguration {
  get<T>(key: string): T | undefined;
}

export interface ProviderConfigurationStatus {
  ok: boolean;
  providerLabel: string;
  modelLabel: string;
  message: string;
}

function settingValue<T>(configuration: ExtensionConfiguration, key: string): T | undefined {
  const value = configuration.get<T>(key);
  return value === "" ? undefined : value;
}

function isRuntimeProviderId(value: unknown): value is RuntimeProviderId {
  return value === "mock" || value === "openai-compatible" || value === "minimax" || value === "kimi" || value === "glm";
}

export function resolveExtensionProviderRuntimeConfig(
  configuration: ExtensionConfiguration,
  env?: Record<string, string | undefined>
): ProviderRuntimeConfig {
  const envConfig = resolveProviderRuntimeConfig(env);
  const providerSetting = settingValue<string>(configuration, "provider");

  return {
    ...envConfig,
    provider: isRuntimeProviderId(providerSetting) ? providerSetting : envConfig.provider,
    apiKey: settingValue<string>(configuration, "apiKey") ?? envConfig.apiKey,
    baseUrl: settingValue<string>(configuration, "baseUrl") ?? envConfig.baseUrl,
    defaultModel: settingValue<string>(configuration, "defaultModel") ?? envConfig.defaultModel
  };
}

export function describeProviderConfiguration(config: ProviderRuntimeConfig): ProviderConfigurationStatus {
  if (config.provider === "mock") {
    return {
      ok: true,
      providerLabel: "Mock Provider",
      modelLabel: "mock-model",
      message: "Mock provider is ready."
    };
  }

  if (config.provider === "openai-compatible") {
    const modelLabel = config.defaultModel ?? "gpt-4.1-mini";
    return {
      ok: Boolean(config.apiKey),
      providerLabel: "OpenAI Compatible",
      modelLabel,
      message: config.apiKey ? "OpenAI-compatible provider is ready." : "OpenAI Compatible requires an API key."
    };
  }

  const preset = providerPresets.find((candidate) => candidate.id === config.provider);
  const providerLabel = preset?.displayName ?? config.provider;
  const modelLabel = config.defaultModel ?? preset?.defaultModel ?? "default";

  return {
    ok: Boolean(config.apiKey),
    providerLabel,
    modelLabel,
    message: config.apiKey ? `${providerLabel} is ready.` : `${providerLabel} requires an API key.`
  };
}
