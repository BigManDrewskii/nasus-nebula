/**
 * Routing logic for determining if a request is paid or free.
 */

export interface RouterConfig {
  mode: string
  budget: string
  modelOverrides?: Record<string, boolean>
}

export interface RoutingDecision {
  modelId: string
  displayName: string
  reason: string
}

/**
 * Returns true if the current configuration results in a paid route.
 *
 * - Ollama is always free.
 * - OpenRouter:
 *   - Auto mode: paid when budget !== 'free'
 *   - Manual mode: paid when the currently selected model doesn't have a ':free' suffix.
 *     The selected model is passed separately because RouterConfig.mode is 'auto' | 'manual',
 *     not the model ID.
 */
export function isPaidRoute(
  provider: string,
  routerConfig?: RouterConfig,
  /** The currently selected model ID (only relevant for manual mode). */
  selectedModel?: string,
): boolean {
  if (provider === 'ollama') return false
  if (!routerConfig) return true

  const { mode, budget } = routerConfig

  if (mode === 'auto') {
    return budget !== 'free'
  }

  // Manual mode: free only if the selected model ends with ':free'
  if (!selectedModel) return true
  return !selectedModel.endsWith(':free')
}

/**
 * Returns a human-readable label for the current route.
 */
export function getRouteLabel(provider: string, routerConfig?: RouterConfig, selectedModel?: string): string {
  if (provider === 'ollama') return 'FREE LOCAL'

  const paid = isPaidRoute(provider, routerConfig, selectedModel)
  return paid ? 'PAID' : 'FREE'
}

// ── Client-side auto-routing heuristic ────────────────────────────────────────
// Used in browser mode where the Tauri `preview_routing` command is unavailable.

/** Free models available via OpenRouter (no credits required). */
const FREE_MODELS_PAID_PRIORITY: RoutingDecision[] = [
  // Best free models for coding / complex tasks
  { modelId: 'deepseek/deepseek-r1:free',                  displayName: 'DeepSeek R1 (free)',         reason: 'Strong reasoning, free tier' },
  { modelId: 'deepseek/deepseek-chat:free',                displayName: 'DeepSeek V3 (free)',         reason: 'Fast general purpose, free tier' },
  { modelId: 'meta-llama/llama-3.3-70b-instruct:free',     displayName: 'Llama 3.3 70B (free)',       reason: 'Strong open source model, free tier' },
  { modelId: 'google/gemini-2.0-flash-thinking-exp:free',  displayName: 'Gemini Flash Thinking (free)', reason: 'Reasoning model, free tier' },
  { modelId: 'qwen/qwq-32b:free',                         displayName: 'QwQ 32B (free)',             reason: 'Reasoning, free tier' },
  { modelId: 'google/gemini-2.0-flash-exp:free',           displayName: 'Gemini 2.0 Flash (free)',    reason: 'Fast and capable, free tier' },
  { modelId: 'microsoft/phi-4:free',                       displayName: 'Phi-4 (free)',               reason: 'Efficient, free tier' },
]

const PAID_MODELS_BY_TASK: Array<{ pattern: RegExp; decision: RoutingDecision }> = [
  {
    pattern: /code|program|script|app|build|debug|fix|implement|function|class|refactor|react|nextjs|python|javascript|typescript/i,
    decision: { modelId: 'anthropic/claude-3.7-sonnet', displayName: 'Claude 3.7 Sonnet', reason: 'Best for coding tasks' },
  },
  {
    pattern: /reason|think|math|logic|proof|analyz|research|complex|hard|difficult/i,
    decision: { modelId: 'anthropic/claude-3.7-sonnet:thinking', displayName: 'Claude 3.7 Sonnet (Thinking)', reason: 'Extended reasoning mode' },
  },
  {
    pattern: /fast|quick|simple|short|brief|summary|summarize|translate|explain/i,
    decision: { modelId: 'anthropic/claude-3.5-haiku', displayName: 'Claude 3.5 Haiku', reason: 'Fast responses for simple tasks' },
  },
]

const DEFAULT_PAID: RoutingDecision = {
  modelId: 'anthropic/claude-3.7-sonnet',
  displayName: 'Claude 3.7 Sonnet',
  reason: 'Best general purpose model',
}

const DEFAULT_FREE: RoutingDecision = FREE_MODELS_PAID_PRIORITY[0]

/**
 * Local heuristic routing decision — used in browser mode when Tauri is unavailable.
 * Returns the best model given the router config and message content.
 */
export function resolveModelLocally(
  message: string,
  routerConfig: RouterConfig,
  currentModel: string,
): RoutingDecision {
  if (routerConfig.mode !== 'auto') {
    // Manual: always use the configured model
    return {
      modelId: currentModel,
      displayName: currentModel.split('/').pop() ?? currentModel,
      reason: 'Manually selected model',
    }
  }

  if (routerConfig.budget === 'free') {
    // Pick the first enabled free model in priority order
    const overrides = routerConfig.modelOverrides ?? {}
    const chosen = FREE_MODELS_PAID_PRIORITY.find((m) => {
      // If explicitly disabled by overrides, skip
      const baseId = m.modelId.replace(/:free$/, '')
      if (overrides[m.modelId] === false || overrides[baseId] === false) return false
      return true
    })
    return chosen ?? DEFAULT_FREE
  }

  // Paid auto mode — match task heuristic
  for (const { pattern, decision } of PAID_MODELS_BY_TASK) {
    if (pattern.test(message)) return decision
  }
  return DEFAULT_PAID
}
