import { createOpenAI } from '@ai-sdk/openai';
import { type LanguageModel } from 'ai';
import { withHealthTracking } from './healthMiddleware';

export interface ProviderConfig {
  provider: 'ollama' | 'deepseek' | 'litellm' | 'direct' | 'custom';
  apiKey?: string;
  apiBase?: string;
  gatewayId?: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Get a unified LanguageModel instance for a given provider and model.
 *
 * DeepSeek Direct:
 *   - OpenAI-compatible at api.deepseek.com/v1 — createOpenAI with .chat().
 *     Must use .chat() — @ai-sdk/openai v3+ defaults to the Responses API (/responses)
 *     which DeepSeek does not support (returns 404).
 *
 * Ollama / LiteLLM / Custom:
 *   - Generic OpenAI-compatible fallback via createOpenAI with .chat().
 */
export function getUnifiedModel(
  config: ProviderConfig,
  modelId: string
): LanguageModel {
  const { provider, apiKey, apiBase, extraHeaders, gatewayId } = config;

  let model: LanguageModel;

  if (provider === 'deepseek' || (apiBase && apiBase.includes('api.deepseek.com'))) {
    const deepseek = createOpenAI({
      apiKey,
      baseURL: apiBase ?? 'https://api.deepseek.com/v1',
      headers: extraHeaders,
    });
    model = deepseek.chat(modelId);
  } else {
    const openai = createOpenAI({
      apiKey,
      baseURL: apiBase,
      headers: { ...extraHeaders },
    });
    model = openai.chat(modelId);
  }

  if (gatewayId) {
    return withHealthTracking(model, gatewayId);
  }

  return model;
}
