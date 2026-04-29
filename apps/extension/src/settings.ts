import {
  resolveProviderRuntimeConfig,
  type ProviderRuntimeConfig,
  type RuntimeProviderId
} from "@ai-ide-agent/providers";

export interface ExtensionConfiguration {
  get<T>(key: string): T | undefined;
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
