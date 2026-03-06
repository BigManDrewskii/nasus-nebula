/**
 * Model Registry — Maps canonical models to gateway-specific IDs and metadata.
 *
 * This is the single source of truth for "what models are available on which gateway".
 * When the user selects "Claude Sonnet 4" in the UI, this registry tells us:
 *  - OpenRouter: "anthropic/claude-sonnet-4-20250514"
 *  - Ollama: model-specific ID (e.g., "llama3.3:70b")
 *
 * For auto-free mode, we filter to models where freeOn[gatewayType] === true.
 * For auto-paid mode, we pick the best model for the task tier.
 */

import type { GatewayModel, GatewayType, RoutingMode } from './gatewayTypes'

// ─── Registry ───────────────────────────────────────────────────────────────

export const MODEL_REGISTRY: GatewayModel[] = [
  // ── Frontier Reasoning ──────────────────────────────────────────────────
  {
    canonicalName: 'GPT-5.2',
    ids: {
      openrouter: 'openai/gpt-5.2-thinking',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 400_000,
    inputCostPer1M: 1.75,
    outputCostPer1M: 14.0,
  },
  {
    canonicalName: 'Claude 4.6 Sonnet',
    ids: {
      openrouter: 'anthropic/claude-4.6-sonnet',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 1_000_000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  },
  {
    canonicalName: 'Gemini 3.1 Pro',
    ids: {
      openrouter: 'google/gemini-3.1-pro',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 1_500_000,
    inputCostPer1M: 2.0,
    outputCostPer1M: 12.0,
  },
  {
    canonicalName: 'Claude Sonnet 4',
    ids: {
      openrouter: 'anthropic/claude-sonnet-4-20250514',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 200_000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
  },
  {
    canonicalName: 'GPT-4.1',
    ids: {
      openrouter: 'openai/gpt-4.1',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 1_000_000,
    inputCostPer1M: 2.0,
    outputCostPer1M: 8.0,
  },

  // ── Coding / Balanced ───────────────────────────────────────────────────
  {
    canonicalName: 'DeepSeek V3.2',
    ids: {
      openrouter: 'deepseek/deepseek-v3.2',
      deepseek: 'deepseek-chat',
    },
    freeOn: {},
    tier: 'coding',
    contextWindow: 163_000,
    inputCostPer1M: 0.25,
    outputCostPer1M: 0.38,
    supportsTools: true,
  },
  {
    canonicalName: 'DeepSeek V3',
    ids: {
      openrouter: 'deepseek/deepseek-chat',
      deepseek: 'deepseek-chat',
    },
    freeOn: {},
    tier: 'coding',
    contextWindow: 128_000,
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.10,
    supportsTools: true,
  },
  {
    canonicalName: 'DeepSeek V3 (Free)',
    ids: {
      openrouter: 'deepseek/deepseek-chat-v3-0324',
    },
    freeOn: { openrouter: true },
    tier: 'coding',
    contextWindow: 128_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    supportsTools: true,
  },
  {
    canonicalName: 'DeepSeek R1',
    ids: {
      openrouter: 'deepseek/deepseek-r1',
      deepseek: 'deepseek-reasoner',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 128_000,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    // Pre-0528: NO tool calling support — sending tools: [] returns HTTP 400
    supportsTools: false,
  },
  {
    canonicalName: 'DeepSeek R1 (Free)',
    ids: {
      openrouter: 'deepseek/deepseek-r1:free',
    },
    freeOn: { openrouter: true },
    tier: 'reasoning',
    contextWindow: 128_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    supportsTools: false,
  },
  {
    canonicalName: 'DeepSeek R1 0528',
    ids: {
      openrouter: 'deepseek/deepseek-r1-0528',
      deepseek: 'deepseek-reasoner',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 128_000,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    // R1-0528 added full function/tool calling support
    supportsTools: true,
  },

  // ── Fast / Cheap / Free ─────────────────────────────────────────────────
  {
    canonicalName: 'Mimo V2 Flash',
    ids: {
      openrouter: 'xiaomi/mimo-v2-flash',
    },
    freeOn: { openrouter: true },
    tier: 'fast',
    contextWindow: 256_000,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
  },
  {
    canonicalName: 'Grok 4.1 Fast',
    ids: {
      openrouter: 'xai/grok-4.1-fast',
    },
    freeOn: {},
    tier: 'fast',
    contextWindow: 2_000_000,
    inputCostPer1M: 0.20,
    outputCostPer1M: 0.50,
  },
  {
    canonicalName: 'Gemini 2.0 Flash',
    ids: {
      openrouter: 'google/gemini-2.0-flash-001',
    },
    freeOn: { openrouter: true },
    tier: 'fast',
    contextWindow: 1_048_576,
    inputCostPer1M: 0.10,
    outputCostPer1M: 0.40,
  },
  {
    canonicalName: 'GPT-4.1 Mini',
    ids: {
      openrouter: 'openai/gpt-4.1-mini',
    },
    freeOn: {},
    tier: 'fast',
    contextWindow: 1_000_000,
    inputCostPer1M: 0.4,
    outputCostPer1M: 1.6,
  },
  {
    canonicalName: 'Llama 3.3 70B',
    ids: {
      openrouter: 'meta-llama/llama-3.3-70b-instruct',
      ollama: 'llama3.3:70b',
    },
    freeOn: { openrouter: true },
    tier: 'general',
    contextWindow: 128_000,
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
  dynamicModels: any[] = [],
): { modelId: string; model: any } | undefined {
  if (mode === 'manual' && manualModelId) {
    const model = findModelById(manualModelId)
    if (model) return { modelId: manualModelId, model }
    // If not found in registry, check dynamic models
    const dynamic = dynamicModels.find(m => m.id === manualModelId)
    if (dynamic) return { modelId: manualModelId, model: dynamic }
    // Pass through as-is (custom model)
    return undefined
  }

  // Combine static and dynamic models for auto-selection
  const staticModels = getModelsForGateway(gatewayType).filter(
    (m) => m.supportsTools !== false,
  )
  
    // Map dynamic models to match GatewayModel interface roughly
    const mappedDynamic = dynamicModels
      .filter(m => {
        // OpenRouter format check
        if ((m as any).architecture?.output_modalities) {
          return (m as any).architecture.output_modalities.includes('text')
        }
        return true // Fallback
      })
      .map(m => {
        const inputPriceStr = (m as any).pricing?.prompt || (m as any).pricing?.input || '0'
        const outputPriceStr = (m as any).pricing?.completion || (m as any).pricing?.output || '0'
        const inputPrice = parseFloat(inputPriceStr)
        const outputPrice = parseFloat(outputPriceStr)
        
        return {
          canonicalName: m.name || m.id,
          ids: { [gatewayType]: m.id },
          freeOn: { [gatewayType]: inputPrice === 0 },
          tier: (m as any).tier || 'general',
          contextWindow: m.context_length || m.context_window || 128000,
          inputCostPer1M: inputPrice * 1_000_000,
          outputCostPer1M: outputPrice * 1_000_000,
          supportsTools: (m as any).tags?.includes('tool-use') ?? true, // Default to true unless tags say otherwise
        }
      })

  const available = [...staticModels, ...mappedDynamic]
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
    const tierOrder: any[] = ['reasoning', 'coding', 'general', 'fast']
    for (const tier of tierOrder) {
      const match = free.find((m) => m.tier === tier)
      if (match) return { modelId: (match.ids as any)[gatewayType]!, model: match }
    }
    // Fallback: first free tool-capable model
    return { modelId: (free[0].ids as any)[gatewayType]!, model: free[0] }
  }

  if (mode === 'auto-paid') {
    // Pick the best reasoning model, preferring larger context windows and lower cost
    const reasoning = available
      .filter((m) => m.tier === 'reasoning')
      .sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)

    if (reasoning.length > 0) {
      const pick = reasoning[0]
      return { modelId: (pick.ids as any)[gatewayType]!, model: pick }
    }

    // No reasoning models — pick cheapest coding model
    const coding = available
      .filter((m) => m.tier === 'coding')
      .sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)

    if (coding.length > 0) {
      const pick = coding[0]
      return { modelId: (pick.ids as any)[gatewayType]!, model: pick }
    }

    // Fallback: cheapest available
    const cheapest = [...available].sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)
    return { modelId: (cheapest[0].ids as any)[gatewayType]!, model: cheapest[0] }
  }

  return undefined
}

/**
 * Resolve a model ID from one gateway format to another.
 * e.g., "anthropic/claude-sonnet-4-20250514" (openrouter) → "llama3.3:70b" (ollama)
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
