import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { type LanguageModel } from 'ai';

export interface ProviderConfig {
  provider: 'openrouter' | 'vercel' | 'openai' | 'anthropic' | 'google' | 'mistral' | 'litellm' | 'ollama' | string;
  apiKey?: string;
  apiBase?: string;
  extraHeaders?: Record<string, string>;
}

/**
 * Get a unified LanguageModel instance for a given provider and model.
 */
export function getUnifiedModel(
  config: ProviderConfig,
  modelId: string
): LanguageModel {
  const { provider, apiKey, apiBase, extraHeaders } = config;

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
    return openrouter(modelId);
  }

  // 2. Vercel AI Gateway / Generic OpenAI Compatible
  if (provider === 'vercel' || provider === 'openai' || provider === 'litellm' || provider === 'ollama' || provider === 'custom') {
    const openai = createOpenAI({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    return openai(modelId);
  }

  // 3. Direct Providers
  if (provider === 'anthropic') {
    const anthropic = createAnthropic({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    return anthropic(modelId);
  }

  if (provider === 'google') {
    const google = createGoogleGenerativeAI({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    return google(modelId);
  }

  if (provider === 'mistral') {
    const mistral = createMistral({
      apiKey,
      baseURL: apiBase,
      headers: extraHeaders,
    });
    return mistral(modelId);
  }

  // Fallback to generic OpenAI for anything else
  const genericOpenAI = createOpenAI({
    apiKey,
    baseURL: apiBase,
    headers: extraHeaders,
  });
  return genericOpenAI(modelId);
}
