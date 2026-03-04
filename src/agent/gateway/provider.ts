import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { type LanguageModel } from 'ai';
import { withHealthTracking } from './healthMiddleware';

export interface ProviderConfig {
  provider: 'openrouter' | 'vercel' | 'openai' | 'anthropic' | 'google' | 'mistral' | 'litellm' | 'ollama' | string;
  apiKey?: string;
  apiBase?: string;
  gatewayId?: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Get a unified LanguageModel instance for a given provider and model.
 */
export function getUnifiedModel(
  config: ProviderConfig,
  modelId: string
): LanguageModel {
  const { provider, apiKey, apiBase, extraHeaders, gatewayId } = config;

  let model: LanguageModel;

  // 1. OpenRouter (native provider for extra headers/features)
  if (provider === 'openrouter' || (apiBase && apiBase.includes('openrouter.ai'))) {
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
  } else if (provider === 'vercel' || provider === 'openai' || provider === 'litellm' || provider === 'ollama' || provider === 'custom') {
    // 2. Vercel AI Gateway / Generic OpenAI Compatible
    const openai = createOpenAI({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    model = openai(modelId);
  } else if (provider === 'anthropic') {
    // 3. Direct Providers
    const anthropic = createAnthropic({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    model = anthropic(modelId);
  } else if (provider === 'google') {
    const google = createGoogleGenerativeAI({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    model = google(modelId);
  } else if (provider === 'mistral') {
    const mistral = createMistral({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    model = mistral(modelId);
  } else {
    // Fallback to generic OpenAI for anything else
    const genericOpenAI = createOpenAI({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    model = genericOpenAI(modelId);
  }

  // Wrap with health tracking if gatewayId is provided
  if (gatewayId) {
    return withHealthTracking(model, gatewayId);
  }

  return model;
}
