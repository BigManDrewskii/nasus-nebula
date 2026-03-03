/**
 * Model Registry — Maps canonical models to gateway-specific IDs and metadata.
 *
 * This is the single source of truth for "what models are available on which gateway".
 * When the user selects "Claude Sonnet 4" in the UI, this registry tells us:
 *  - OpenRouter: "anthropic/claude-sonnet-4-20250514"
 *  - Direct Anthropic: "claude-sonnet-4-20250514"
 *  - Ollama: not available
 *  - LiteLLM: "anthropic/claude-sonnet-4-20250514" (or whatever the proxy is configured with)
 *
 * For auto-free mode, we filter to models where freeOn[gatewayType] === true.
 * For auto-paid mode, we pick the best model for the task tier.
 */

import type { GatewayModel, GatewayType, RoutingMode } from './gatewayTypes'

// ─── Registry ───────────────────────────────────────────────────────────────

export const MODEL_REGISTRY: GatewayModel[] = [
  // ── Frontier Reasoning ──────────────────────────────────────────────────
  {
    canonicalName: 'Claude Sonnet 4',
    ids: {
      openrouter: 'anthropic/claude-sonnet-4-20250514',
      vercel: 'anthropic/claude-sonnet-4-20250514',
      direct: 'claude-sonnet-4-20250514',
      litellm: 'anthropic/claude-sonnet-4-20250514',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 200_000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  },
  {
    canonicalName: 'Claude Opus 4',
    ids: {
      openrouter: 'anthropic/claude-opus-4-20250514',
      vercel: 'anthropic/claude-opus-4-20250514',
      direct: 'claude-opus-4-20250514',
      litellm: 'anthropic/claude-opus-4-20250514',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 200_000,
    inputCostPer1M: 15.0,
    outputCostPer1M: 75.0,
  },
  {
    canonicalName: 'GPT-4.1',
    ids: {
      openrouter: 'openai/gpt-4.1',
      vercel: 'openai/gpt-4.1',
      direct: 'gpt-4.1',
      litellm: 'openai/gpt-4.1',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 1_000_000,
    inputCostPer1M: 2.0,
    outputCostPer1M: 8.0,
  },
  {
    canonicalName: 'Gemini 2.5 Pro',
    ids: {
      openrouter: 'google/gemini-2.5-pro-preview',
      vercel: 'google/gemini-2.5-pro-preview',
      direct: 'gemini-2.5-pro-preview',
      litellm: 'google/gemini-2.5-pro-preview',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 1_048_576,
    inputCostPer1M: 1.25,
    outputCostPer1M: 10.0,
  },

  // ── Coding / Balanced ───────────────────────────────────────────────────
  {
    canonicalName: 'DeepSeek V3',
    ids: {
      openrouter: 'deepseek/deepseek-chat-v3-0324',
      vercel: 'deepseek/deepseek-chat-v3-0324',
      direct: 'deepseek-chat',
      litellm: 'deepseek/deepseek-chat-v3-0324',
    },
    freeOn: { openrouter: true },
    tier: 'coding',
    contextWindow: 128_000,
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.10,
  },
  {
    canonicalName: 'DeepSeek R1',
    ids: {
      openrouter: 'deepseek/deepseek-r1',
      vercel: 'deepseek/deepseek-r1',
      direct: 'deepseek-reasoner',
      litellm: 'deepseek/deepseek-r1',
    },
    freeOn: { openrouter: true },
    tier: 'reasoning',
    contextWindow: 128_000,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    supportsTools: false, // DeepSeek R1 does not support function calling → 400
  },
  {
    canonicalName: 'Qwen QwQ 32B',
    ids: {
      openrouter: 'qwen/qwq-32b',
      vercel: 'qwen/qwq-32b',
      litellm: 'qwen/qwq-32b',
      ollama: 'qwq:32b',
    },
    freeOn: { openrouter: true },
    tier: 'reasoning',
    contextWindow: 131_072,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    supportsTools: false, // QwQ 32B does not reliably support function calling
  },

  // ── Fast / Cheap ────────────────────────────────────────────────────────
  {
    canonicalName: 'Claude 3.5 Haiku',
    ids: {
      openrouter: 'anthropic/claude-3.5-haiku',
      vercel: 'anthropic/claude-3.5-haiku',
      direct: 'claude-3-5-haiku-20241022',
      litellm: 'anthropic/claude-3.5-haiku',
    },
    freeOn: {},
    tier: 'fast',
    contextWindow: 200_000,
    inputCostPer1M: 0.8,
    outputCostPer1M: 4.0,
  },
  {
    canonicalName: 'GPT-4.1 Mini',
    ids: {
      openrouter: 'openai/gpt-4.1-mini',
      vercel: 'openai/gpt-4.1-mini',
      direct: 'gpt-4.1-mini',
      litellm: 'openai/gpt-4.1-mini',
    },
    freeOn: {},
    tier: 'fast',
    contextWindow: 1_000_000,
    inputCostPer1M: 0.4,
    outputCostPer1M: 1.6,
  },
  {
    canonicalName: 'Gemini 2.5 Flash',
    ids: {
      openrouter: 'google/gemini-2.5-flash-preview',
      vercel: 'google/gemini-2.5-flash-preview',
      direct: 'gemini-2.5-flash-preview',
      litellm: 'google/gemini-2.5-flash-preview',
    },
    freeOn: { openrouter: true },
    tier: 'fast',
    contextWindow: 1_048_576,
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
  },
  {
    canonicalName: 'Gemini 2.0 Flash',
    ids: {
      openrouter: 'google/gemini-2.0-flash-001',
      vercel: 'google/gemini-2.0-flash-001',
      direct: 'gemini-2.0-flash',
      litellm: 'google/gemini-2.0-flash-001',
    },
    freeOn: { openrouter: true },
    tier: 'fast',
    contextWindow: 1_048_576,
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
  },
  {
    canonicalName: 'Llama 3.3 70B',
    ids: {
      openrouter: 'meta-llama/llama-3.3-70b-instruct',
      vercel: 'meta-llama/llama-3.3-70b-instruct',
      litellm: 'meta-llama/llama-3.3-70b-instruct',
      ollama: 'llama3.3:70b',
    },
    freeOn: { openrouter: true },
    tier: 'general',
    contextWindow: 128_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  {
    canonicalName: 'Mistral Large',
    ids: {
      openrouter: 'mistralai/mistral-large',
      vercel: 'mistralai/mistral-large',
      direct: 'mistral-large-latest',
      litellm: 'mistralai/mistral-large',
    },
    freeOn: {},
    tier: 'general',
    contextWindow: 128_000,
    inputCostPer1M: 2.0,
    outputCostPer1M: 6.0,
  },

  // ── Local-only (Ollama) ─────────────────────────────────────────────────
  {
    canonicalName: 'Llama 3.2 3B',
    ids: {
      ollama: 'llama3.2:3b',
    },
    freeOn: { ollama: true },
    tier: 'fast',
    contextWindow: 128_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  {
    canonicalName: 'Qwen 2.5 Coder 7B',
    ids: {
      ollama: 'qwen2.5-coder:7b',
    },
    freeOn: { ollama: true },
    tier: 'coding',
    contextWindow: 131_072,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
]

// ─── Query Functions ────────────────────────────────────────────────────────

/**
 * Get all models available on a specific gateway.
 */
export function getModelsForGateway(gatewayType: GatewayType): GatewayModel[] {
  return MODEL_REGISTRY.filter((m) => m.ids[gatewayType] != null)
}

/**
 * Get free models available on a specific gateway.
 */
export function getFreeModels(gatewayType: GatewayType): GatewayModel[] {
  return MODEL_REGISTRY.filter((m) => m.freeOn[gatewayType] === true)
}

/**
 * Find a model by its gateway-specific ID (e.g., "anthropic/claude-sonnet-4-20250514").
 * Searches across all gateways.
 */
export function findModelById(modelId: string): GatewayModel | undefined {
  return MODEL_REGISTRY.find((m) =>
    Object.values(m.ids).some((id) => id === modelId),
  )
}

/**
 * Find a model by canonical name (e.g., "Claude Sonnet 4").
 */
export function findModelByName(name: string): GatewayModel | undefined {
  return MODEL_REGISTRY.find(
    (m) => m.canonicalName.toLowerCase() === name.toLowerCase(),
  )
}

/**
 * Select the best model for the given routing mode and gateway.
 *
 * - auto-free: Pick the best free model on this gateway (prefer reasoning > coding > general > fast)
 * - auto-paid: Pick the best paid model (reasoning tier, lowest cost)
 * - manual: Return the specific model ID
 */
export function selectModel(
  mode: RoutingMode,
  gatewayType: GatewayType,
  manualModelId?: string,
): { modelId: string; model: GatewayModel } | undefined {
  if (mode === 'manual' && manualModelId) {
    const model = findModelById(manualModelId)
    if (model) return { modelId: manualModelId, model }
    // If not found in registry, pass through as-is (custom model)
    return undefined
  }

  // For auto modes, only consider models that support tool calling
  // (models with supportsTools === false return 400 when tools array is sent)
  const available = getModelsForGateway(gatewayType).filter(
    (m) => m.supportsTools !== false,
  )
  if (available.length === 0) return undefined

  if (mode === 'auto-free') {
    // Get free models for this gateway
    const free = available.filter((m) => m.freeOn[gatewayType] === true)
    if (free.length === 0) {
      // No free tool-capable models on this gateway — fall back to cheapest tool-capable
      const cheapest = [...available].sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)
      const pick = cheapest[0]
      return { modelId: pick.ids[gatewayType]!, model: pick }
    }
    // Prefer reasoning tier, then coding, then general, then fast
    const tierOrder: GatewayModel['tier'][] = ['reasoning', 'coding', 'general', 'fast']
    for (const tier of tierOrder) {
      const match = free.find((m) => m.tier === tier)
      if (match) return { modelId: match.ids[gatewayType]!, model: match }
    }
    // Fallback: first free tool-capable model
    return { modelId: free[0].ids[gatewayType]!, model: free[0] }
  }

  if (mode === 'auto-paid') {
    // Pick the best reasoning model, preferring larger context windows and lower cost
    const reasoning = available
      .filter((m) => m.tier === 'reasoning')
      .sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)

    if (reasoning.length > 0) {
      const pick = reasoning[0]
      return { modelId: pick.ids[gatewayType]!, model: pick }
    }

    // No reasoning models — pick cheapest coding model
    const coding = available
      .filter((m) => m.tier === 'coding')
      .sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)

    if (coding.length > 0) {
      const pick = coding[0]
      return { modelId: pick.ids[gatewayType]!, model: pick }
    }

    // Fallback: cheapest available
    const cheapest = [...available].sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)
    return { modelId: cheapest[0].ids[gatewayType]!, model: cheapest[0] }
  }

  return undefined
}

/**
 * Resolve a model ID from one gateway format to another.
 * e.g., "anthropic/claude-sonnet-4-20250514" (openrouter) → "claude-sonnet-4-20250514" (direct)
 */
export function translateModelId(
  modelId: string,
  fromGateway: GatewayType,
  toGateway: GatewayType,
): string {
  const model = MODEL_REGISTRY.find((m) => m.ids[fromGateway] === modelId)
  if (!model) return modelId // Unknown model — pass through
  return model.ids[toGateway] ?? modelId // No mapping — pass through
}
