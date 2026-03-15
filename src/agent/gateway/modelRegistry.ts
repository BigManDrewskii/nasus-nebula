/**
 * Model Registry — Maps canonical models to gateway-specific IDs and metadata.
 *
 * This is the single source of truth for "what models are available on which gateway".
 * When the user selects "DeepSeek V3" in the UI, this registry tells us:
 *  - DeepSeek direct: "deepseek-chat"
 *  - Ollama: model-specific ID (e.g., "llama3.3:70b")
 *
 * For auto-free mode, we filter to models where freeOn[gatewayType] === true.
 * For auto-paid mode, we pick the best model for the task tier.
 */

import type { GatewayModel, GatewayType, RoutingMode } from './gatewayTypes'
import type { OpenRouterModel } from '../llm'

// ─── Registry ───────────────────────────────────────────────────────────────

export const MODEL_REGISTRY: GatewayModel[] = [
  // ── Coding / Balanced ───────────────────────────────────────────────────
  {
    canonicalName: 'DeepSeek V3',
    ids: {
      deepseek: 'deepseek-chat',
    },
    freeOn: {},
    tier: 'coding',
    contextWindow: 163_000,
    inputCostPer1M: 0.27,
    outputCostPer1M: 1.10,
    supportsTools: true,
  },
  {
    canonicalName: 'DeepSeek R1',
    ids: {
      // api.deepseek.com uses 'deepseek-reasoner' for both the base R1 and the
      // R1-0528 checkpoint — there is no distinct API ID for R1-0528 on the
      // DeepSeek gateway. supportsTools is conservatively false here because the
      // base R1 checkpoint does NOT support function calling.
      //
      // For tool-capable R1-0528 access, use the OpenRouter gateway where the
      // model has the distinct ID 'deepseek/deepseek-r1-0528'. The string-heuristic
      // fallback in modelSupportsTools() returns true for that slug.
      deepseek: 'deepseek-reasoner',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 128_000,
    inputCostPer1M: 0.55,
    outputCostPer1M: 2.19,
    supportsTools: false,
  },

  // ── Anthropic / Claude ───────────────────────────────────────────────────
  {
    canonicalName: 'Claude Sonnet 4.5',
    ids: {
      anthropic: 'claude-sonnet-4-5',
    },
    freeOn: {},
    tier: 'reasoning',
    contextWindow: 200_000,
    inputCostPer1M: 3.0,
    outputCostPer1M: 15.0,
    provider: 'Anthropic',
    description: 'Anthropic\'s best balance of intelligence and speed',
    supportsTools: true,
  },
  {
    canonicalName: 'Claude Haiku 4.5',
    ids: {
      anthropic: 'claude-haiku-4-5',
    },
    freeOn: {},
    tier: 'fast',
    contextWindow: 200_000,
    inputCostPer1M: 0.8,
    outputCostPer1M: 4.0,
    provider: 'Anthropic',
    description: 'Anthropic\'s fastest, most compact model',
    supportsTools: true,
  },

  // ── Local / Ollama ───────────────────────────────────────────────────────
  {
    canonicalName: 'Llama 3.3 70B',
    ids: {
      ollama: 'llama3.3:70b',
    },
    freeOn: {},
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
 * Find a model by its gateway-specific ID (e.g., "deepseek-chat").
 * Searches across all gateways.
 */
export function findModelById(modelId: string): GatewayModel | undefined {
  return MODEL_REGISTRY.find((m) =>
    Object.values(m.ids).some((id) => id === modelId),
  )
}

/**
 * Find a model by canonical name (e.g., "DeepSeek V3").
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
  dynamicModels: OpenRouterModel[] = [],
): { modelId: string; model: GatewayModel } | undefined {
  if (mode === 'manual' && manualModelId) {
    const model = findModelById(manualModelId)
    if (model) return { modelId: manualModelId, model }
    // If not found in registry, check dynamic models
    const dynamic = dynamicModels.find(m => m.id === manualModelId)
    if (dynamic) return { modelId: manualModelId, model: dynamic as unknown as GatewayModel }
    // Pass through as-is (custom model)
    return undefined
  }

  // Combine static and dynamic models for auto-selection
  const staticModels = getModelsForGateway(gatewayType).filter(
    (m) => m.supportsTools !== false,
  )

    // Map dynamic models to match GatewayModel interface roughly
    const mappedDynamic: GatewayModel[] = dynamicModels
      .filter(m => {
        // OpenRouter format check
        if (m.architecture?.output_modalities) {
          return m.architecture.output_modalities.includes('text')
        }
        return true // Fallback
      })
      .map(m => {
        const inputPriceStr = m.pricing?.prompt || m.pricing?.input || '0'
        const outputPriceStr = m.pricing?.completion || m.pricing?.output || '0'
        const inputPrice = parseFloat(inputPriceStr)
        const outputPrice = parseFloat(outputPriceStr)

        return {
          canonicalName: m.name || m.id,
          ids: { [gatewayType]: m.id },
          freeOn: { [gatewayType]: inputPrice === 0 },
          tier: 'general' as const,
          contextWindow: m.context_length || 128000,
          inputCostPer1M: inputPrice * 1_000_000,
          outputCostPer1M: outputPrice * 1_000_000,
          supportsTools: m.supported_parameters?.includes('tools') ?? true,
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
    const tierOrder: GatewayModel['tier'][] = ['reasoning', 'coding', 'general', 'fast']
    for (const tier of tierOrder) {
      const match = free.find((m) => m.tier === tier)
      if (match) return { modelId: match.ids[gatewayType]!, model: match }
    }
    // Fallback: first free tool-capable model
    return { modelId: free[0].ids[gatewayType]!, model: free[0] }
  }

  if (mode === 'auto-paid') {
    // Pick the best paid reasoning model. Free models (inputCostPer1M === 0) are excluded
    // so that dynamic zero-cost models don't crowd out quality paid models in auto-paid mode.
    const paidReasoning = available
      .filter((m) => m.tier === 'reasoning' && m.inputCostPer1M > 0)
      .sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)

    if (paidReasoning.length > 0) {
      const pick = paidReasoning[0]
      return { modelId: pick.ids[gatewayType]!, model: pick }
    }

    // Fall back to any reasoning model (including free ones as a last resort)
    const anyReasoning = available
      .filter((m) => m.tier === 'reasoning')
      .sort((a, b) => b.inputCostPer1M - a.inputCostPer1M) // prefer more expensive (higher quality)

    if (anyReasoning.length > 0) {
      const pick = anyReasoning[0]
      return { modelId: pick.ids[gatewayType]!, model: pick }
    }

    // No reasoning models — pick cheapest paid coding model
    const coding = available
      .filter((m) => m.tier === 'coding' && m.inputCostPer1M > 0)
      .sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)

    if (coding.length > 0) {
      const pick = coding[0]
      return { modelId: pick.ids[gatewayType]!, model: pick }
    }

    // Final fallback: cheapest available (may be free)
    const cheapest = [...available].sort((a, b) => a.inputCostPer1M - b.inputCostPer1M)
    return { modelId: cheapest[0].ids[gatewayType]!, model: cheapest[0] }
  }

  return undefined
}

/**
 * Resolve a model ID from one gateway format to another.
 * e.g., "deepseek-chat" (deepseek) → "llama3.3:70b" (ollama)
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
