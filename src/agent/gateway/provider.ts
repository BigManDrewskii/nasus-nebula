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

const OR_DEFAULT_BASE = 'https://openrouter.ai/api/v1';
const OR_ATTRIBUTION = {
  'HTTP-Referer': 'https://nasus.app',
  'X-Title': 'Nasus',
};

/**
 * Get a unified LanguageModel instance for a given provider and model.
 *
 * OpenRouter:
 *   - If apiBase is the default openrouter.ai URL (or not overridden), use the native
 *     @openrouter/ai-sdk-provider so we get OR-specific features (include_reasoning, etc.)
 *   - If apiBase is overridden to a custom URL, fall through to the OpenAI-compatible path.
 *
 * Requesty:
 *   - Uses an OpenAI-compatible endpoint at router.requesty.ai — must use createOpenAI,
 *     NOT createOpenRouter (which ignores baseURL and always routes to openrouter.ai).
 *
 * DeepSeek Direct:
 *   - OpenAI-compatible at api.deepseek.com/v1 — createOpenAI.
 *
 * Ollama / Custom:
 *   - Generic OpenAI-compatible fallback.
 */
export function getUnifiedModel(
  config: ProviderConfig,
  modelId: string
): LanguageModel {
  const { provider, apiKey, apiBase, extraHeaders, gatewayId } = config;

  let model: LanguageModel;

  const isNativeOpenRouter =
    provider === 'openrouter' &&
    (!apiBase || apiBase === OR_DEFAULT_BASE || apiBase.includes('openrouter.ai'));

  if (isNativeOpenRouter) {
    // Use the native OR SDK — it handles include_reasoning, provider routing, etc.
    // Do NOT pass baseURL here: the SDK hardcodes openrouter.ai and ignores it anyway.
    const openrouter = createOpenRouter({
      apiKey,
      // Pass attribution headers + any extra headers at the provider level
      headers: {
        ...OR_ATTRIBUTION,
        ...extraHeaders,
      },
    });
    model = openrouter(modelId);
  } else if (provider === 'deepseek' || (apiBase && apiBase.includes('api.deepseek.com'))) {
    // DeepSeek Direct — OpenAI-compatible, no special headers needed
    const deepseek = createOpenAI({
      apiKey,
      baseURL: apiBase ?? 'https://api.deepseek.com/v1',
      headers: extraHeaders,
    });
    model = deepseek(modelId);
  } else {
    // OpenAI-compatible fallback: Requesty, custom OpenRouter base URL, Ollama, custom endpoints.
    // Requesty is intentionally handled here — it uses a different base URL from openrouter.ai
    // and the @openrouter/ai-sdk-provider ignores baseURL overrides.
    const headers: Record<string, string> = { ...extraHeaders };
    // Inject attribution for Requesty (required for their attribution tracking)
    if (provider === 'requesty' || (apiBase && apiBase.includes('requesty.ai'))) {
      Object.assign(headers, OR_ATTRIBUTION);
    }
    const openai = createOpenAI({
      apiKey,
      baseURL: apiBase,
      headers,
    });
    model = openai(modelId);
  }

  // Wrap with health tracking if gatewayId is provided
  if (gatewayId) {
    return withHealthTracking(model, gatewayId);
  }

  return model;
}
