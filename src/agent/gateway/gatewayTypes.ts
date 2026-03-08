/**
 * Gateway Types — Core abstraction for multi-provider LLM routing.
 *
 * A "Gateway" is any OpenAI-compatible endpoint (OpenRouter, LiteLLM, direct provider, Ollama).
 * The gateway layer sits between Nasus and the LLM, handling:
 *  - Provider selection (which endpoint to hit)
 *  - Automatic failover (try next gateway on error)
 *  - Model ID translation (same model, different ID per gateway)
 *  - Budget routing (free vs paid model selection)
 *
 * This file defines types only — no runtime logic, no side effects.
 */

// ─── Gateway Configuration ─────────────────────────────────────────────────

export type GatewayType = 'openrouter' | 'requesty' | 'ollama' | 'deepseek' | 'custom'

export interface GatewayConfig {
  /** Unique identifier for this gateway instance */
  id: string
  /** Gateway type — determines header injection and model ID format */
  type: GatewayType
  /** Display name for the settings UI */
  label: string
  /** OpenAI-compatible base URL (e.g., https://openrouter.ai/api/v1) */
  apiBase: string
  /** API key (empty string for keyless gateways like Ollama) */
  apiKey: string
  /** Priority order — lower number = tried first (0 = primary) */
  priority: number
  /** Whether this gateway is currently enabled */
  enabled: boolean
  /** Whether to use the gateway's native routing (e.g., openrouter/auto) */
  nativeRouting: boolean
  /** Maximum retry attempts before failing over to next gateway */
  maxRetries: number
  /** Request timeout in milliseconds */
  timeoutMs: number
  /** Provider-specific headers to inject */
  extraHeaders?: Record<string, string>
}

// ─── Routing Configuration ──────────────────────────────────────────────────

export type RoutingMode = 'auto-free' | 'auto-paid' | 'manual'

export interface RoutingConfig {
  /** How to select models */
  mode: RoutingMode
  /** For manual mode: the exact model ID to use */
  manualModelId?: string
  /** Preferred model family for auto modes (e.g., 'claude', 'gpt', 'gemini') */
  preferredFamily?: string
}

// ─── Model Registry ─────────────────────────────────────────────────────────

export interface GatewayModel {
  /** Canonical display name (e.g., "Claude Sonnet 4") */
  canonicalName: string
  /** Model IDs per gateway type */
  ids: Partial<Record<GatewayType, string>>
  /** Whether this model is free on each gateway */
  freeOn: Partial<Record<GatewayType, boolean>>
  /** Capability tier: reasoning, coding, general, fast */
  tier: 'reasoning' | 'coding' | 'general' | 'fast'
  /** Context window size in tokens */
  contextWindow: number
  /** Cost per million input tokens (0 = free) */
  inputCostPer1M: number
  /** Cost per million output tokens (0 = free) */
  outputCostPer1M: number
  /** Provider (Anthropic, OpenAI, etc) */
  provider?: string
  /** Description */
  description?: string
  /**
   * Whether this model supports OpenAI-style function/tool calling.
   * Models without tool support (e.g. DeepSeek R1) return 400 when tools are sent.
   * Defaults to true when not specified.
   */
  supportsTools?: boolean
}

// ─── Gateway Health ─────────────────────────────────────────────────────────

export type GatewayStatus = 'healthy' | 'degraded' | 'down' | 'unknown'

export interface GatewayHealth {
  gatewayId: string
  status: GatewayStatus
  lastChecked: number
  /** Rolling success rate (0-1) over last N requests */
  successRate: number
  /** Average response latency in ms */
  avgLatencyMs: number
  /** Number of consecutive failures */
  consecutiveFailures: number
  /** Total number of requests processed */
  requestCount?: number
  /** Timestamp when the gateway will be retried after being marked down */
  retryAfter?: number
}

// ─── Call Result ────────────────────────────────────────────────────────────

export interface GatewayCallResult {
  /** Which gateway actually handled the request */
  gatewayId: string
  /** Whether fallback was needed */
  usedFallback: boolean
  /** Gateways that were tried and failed (in order) */
  failedGateways: string[]
  /** Total time including retries/fallbacks */
  totalLatencyMs: number
}

// ─── Events (for UI status reporting) ───────────────────────────────────────

export interface GatewayEvent {
  type: 'trying' | 'success' | 'failed' | 'fallback' | 'all_failed'
  gatewayId: string
  gatewayLabel: string
  message: string
  /** For 'failed': the error that caused the failure */
  error?: string
  /** For 'fallback': which gateway we're trying next */
  nextGatewayId?: string
}

export type GatewayEventCallback = (event: GatewayEvent) => void

// ─── Defaults ───────────────────────────────────────────────────────────────

export const DEFAULT_GATEWAYS: GatewayConfig[] = [
  {
    id: 'openrouter',
    type: 'openrouter',
    label: 'OpenRouter',
    apiBase: 'https://openrouter.ai/api/v1',
    apiKey: '',
    priority: 0,
    enabled: true,
    nativeRouting: true,
    maxRetries: 2,
    timeoutMs: 180_000,
    extraHeaders: {
      'HTTP-Referer': 'https://nasus.app',
      'X-Title': 'Nasus',
    },
  },
  {
    id: 'requesty',
    type: 'requesty',
    label: 'Requesty',
    apiBase: 'https://router.requesty.ai/v1',
    apiKey: '',
    priority: 1,
    enabled: false,
    nativeRouting: true,
    maxRetries: 2,
    timeoutMs: 180_000,
    extraHeaders: {
      'HTTP-Referer': 'https://nasus.app',
      'X-Title': 'Nasus',
    },
  },
  {
    id: 'ollama',
    type: 'ollama',
    label: 'Ollama (Local)',
    apiBase: 'http://localhost:11434/v1',
    apiKey: '',
    priority: 10,
    enabled: false,
    nativeRouting: false,
    maxRetries: 1,
    timeoutMs: 300_000, // Local models can be slow
  },
  {
    id: 'deepseek',
    type: 'deepseek',
    label: 'DeepSeek (Direct)',
    apiBase: 'https://api.deepseek.com/v1',
    apiKey: '',
    priority: 5,
    enabled: false,
    nativeRouting: false,
    maxRetries: 2,
    timeoutMs: 180_000,
  },
  {
    id: 'custom',
    type: 'custom',
    label: 'Custom',
    apiBase: '',
    apiKey: '',
    priority: 20,
    enabled: false,
    nativeRouting: false,
    maxRetries: 2,
    timeoutMs: 180_000,
  },
]

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Get active gateways sorted by priority (lowest first) */
export function getActiveGateways(gateways: GatewayConfig[]): GatewayConfig[] {
  return gateways
    .filter((g) => g.enabled && g.apiBase)
    .sort((a, b) => a.priority - b.priority)
}

/** Check if a gateway type needs an API key */
export function requiresApiKey(type: GatewayType): boolean {
  return type !== 'ollama'
}

/** Get the model ID for a specific gateway, with fallback to canonical */
export function resolveModelId(
  model: GatewayModel,
  gatewayType: GatewayType,
): string | undefined {
  return model.ids[gatewayType]
}
