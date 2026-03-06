import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { type LanguageModel } from 'ai';
import { withHealthTracking } from './healthMiddleware';

export interface ProviderConfig {
  provider: 'openrouter' | 'requesty' | 'ollama' | 'deepseek' | 'custom';
  apiKey?: string;
  apiBase?: string;
  gatewayId?: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Get a unified LanguageModel instance for a given provider and model.
 * Requesty uses the same OpenAI-compatible API as OpenRouter (same model IDs, headers).
 * DeepSeek uses a direct OpenAI-compatible endpoint (https://api.deepseek.com/v1).
 */
export function getUnifiedModel(
  config: ProviderConfig,
  modelId: string
): LanguageModel {
  const { provider, apiKey, apiBase, extraHeaders, gatewayId } = config;

  let model: LanguageModel;

  // 1. OpenRouter/Requesty (native provider for extra headers/features)
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
  } else if (provider === 'deepseek' || (apiBase && apiBase.includes('api.deepseek.com'))) {
    // 2. DeepSeek Direct — OpenAI-compatible, no special headers needed
    const deepseek = createOpenAI({
      apiKey,
      baseURL: apiBase ?? 'https://api.deepseek.com/v1',
      headers: extraHeaders,
    });
    model = deepseek(modelId);
  } else {
    // 3. OpenAI-Compatible fallback (Ollama, Custom, and any other OpenAI-compatible endpoint)
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
