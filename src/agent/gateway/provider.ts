import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { type LanguageModel } from 'ai';
import { withHealthTracking } from './healthMiddleware';

export interface ProviderConfig {
  provider: 'openrouter' | 'requesty' | 'ollama' | 'custom';
  apiKey?: string;
  apiBase?: string;
  gatewayId?: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Get a unified LanguageModel instance for a given provider and model.
 * Requesty uses the same OpenAI-compatible API as OpenRouter (same model IDs, headers).
 */
export function getUnifiedModel(
  config: ProviderConfig,
  modelId: string
): LanguageModel {
  const { provider, apiKey, apiBase, extraHeaders, gatewayId } = config;

  let model: LanguageModel;

  // 1. OpenRouter/Requesty (native provider for extra headers/features)
  // Requesty uses the same API format and model IDs as OpenRouter
  if (provider === 'openrouter' || provider === 'requesty' ||
      (apiBase && (apiBase.includes('openrouter.ai') || apiBase.includes('requesty.ai')))) {
    const openrouter = createOpenRouter({
      apiKey,
      baseURL: apiBase,
      headers: {
        'HTTP-Referer': 'https://nasus.app',
        'X-Title': 'Nasus',
        ...extraHeaders,
      },
    });
    model = openrouter(modelId);
  } else {
    // 2. OpenAI-Compatible (Ollama, Custom, and any other OpenAI-compatible endpoint)
    const openai = createOpenAI({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    model = openai(modelId);
  }

  // Wrap with health tracking if gatewayId is provided
  if (gatewayId) {
    return withHealthTracking(model, gatewayId);
  }

  return model;
}
