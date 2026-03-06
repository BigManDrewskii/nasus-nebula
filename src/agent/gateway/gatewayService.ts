/**
 * Gateway Service — Runtime manager for multi-gateway LLM routing.
 *
 * This is the core "brain" of the gateway abstraction. It:
 *  1. Maintains health state for each gateway (circuit breaker pattern)
 *  2. Selects the best gateway for each request
 *  3. Handles automatic failover on errors
 *  4. Injects gateway-specific headers
 *  5. Reports status events for the UI
 *
 * Usage:
 *   const gateway = new GatewayService(gateways, onEvent)
 *   const response = await gateway.completions(messages, model, tools, options)
 *
 * The service is provider-agnostic — it works with any OpenAI-compatible endpoint.
 */

import type {
  GatewayConfig,
  GatewayHealth,
  GatewayEvent,
  GatewayEventCallback,
  GatewayCallResult,
} from './gatewayTypes'
import { getActiveGateways } from './gatewayTypes'
import { getGlobalRateLimiter, type RateLimiterStats } from './rateLimiter'

// ─── Circuit Breaker Constants ──────────────────────────────────────────────

/** Number of consecutive failures before marking gateway as 'down' */
const CIRCUIT_BREAK_THRESHOLD = 3
/** How long (ms) to wait before retrying a 'down' gateway */
const CIRCUIT_BREAK_COOLDOWN_MS = 60_000 // 1 minute
/** Maximum cooldown (caps exponential backoff) */
const MAX_COOLDOWN_MS = 300_000 // 5 minutes
/** Window size for success rate calculation */
const HEALTH_WINDOW_SIZE = 20

// ─── Retryable Error Detection ──────────────────────────────────────────────

/** HTTP status codes that indicate a transient/retryable error */
const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504, 529])

/** HTTP status codes that indicate a permanent error (don't retry, don't failover) */
const PERMANENT_ERROR_CODES = new Set([401, 403])

function isAbortError(error: unknown): boolean {
  if (error instanceof Error) {
    if (error.name === 'AbortError') return true
    const msg = error.message.toLowerCase()
    if (msg.includes('aborted') || msg.includes('aborterror') || msg.includes('the operation was aborted')) return true
  }
  return false
}

function isRetryableError(error: unknown): boolean {
  // Never retry aborts — they are intentional cancellations
  if (isAbortError(error)) return false

  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    // Network errors (excluding abort which is handled above)
    if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout') || msg.includes('econnrefused')) {
      return true
    }
    // HTTP status codes embedded in error messages
    for (const code of RETRYABLE_STATUS_CODES) {
      if (msg.includes(`${code}`) || msg.includes(`http ${code}`)) return true
    }
  }
  return false
}

function isPermanentError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    for (const code of PERMANENT_ERROR_CODES) {
      if (msg.includes(`${code}`) || msg.includes(`http ${code}`)) return true
    }
    // Invalid API key errors
    if (msg.includes('invalid api key') || msg.includes('unauthorized') || msg.includes('authentication')) {
      return true
    }
  }
  return false
}

// ─── Gateway Service ────────────────────────────────────────────────────────

export class GatewayService {
  private gateways: GatewayConfig[]
  private health: Map<string, GatewayHealth> = new Map()
  private requestHistory: Map<string, boolean[]> = new Map() // true = success
  private onEvent?: GatewayEventCallback

  constructor(gateways: GatewayConfig[], onEvent?: GatewayEventCallback) {
    this.gateways = gateways
    this.onEvent = onEvent

    // Initialize health for all gateways
    for (const gw of gateways) {
      this.health.set(gw.id, {
        gatewayId: gw.id,
        status: 'unknown',
        lastChecked: 0,
        successRate: 1,
        avgLatencyMs: 0,
        consecutiveFailures: 0,
      })
      this.requestHistory.set(gw.id, [])
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Update the gateway list (e.g., when user changes settings).
   */
  updateGateways(gateways: GatewayConfig[]): void {
    this.gateways = gateways
    // Initialize health for any new gateways
    for (const gw of gateways) {
      if (!this.health.has(gw.id)) {
        this.health.set(gw.id, {
          gatewayId: gw.id,
          status: 'unknown',
          lastChecked: 0,
          successRate: 1,
          avgLatencyMs: 0,
          consecutiveFailures: 0,
        })
        this.requestHistory.set(gw.id, [])
      }
    }
  }

  /**
   * Get the current health status of all gateways.
   */
  getHealth(): GatewayHealth[] {
    return Array.from(this.health.values())
  }

  /**
   * Make an LLM completion call with automatic gateway failover.
   *
   * This is a thin wrapper — it picks the gateway and injects headers,
   * then delegates to the caller's `callFn` for the actual HTTP/streaming logic.
   * This keeps the gateway layer decoupled from streaming implementation details.
   *
   * @param callFn - Function that makes the actual LLM call given (apiBase, apiKey, headers, queryParams)
   * @returns The result from callFn, plus metadata about which gateway was used
   */
  async callWithFailover<T>(
    callFn: (
      apiBase: string,
      apiKey: string,
      extraHeaders: Record<string, string>,
      queryParams: Record<string, string>,
    ) => Promise<T>,
  ): Promise<{ result: T; meta: GatewayCallResult }> {
    // Proactive rate limiting — wait before making request if needed
    const rateLimiter = getGlobalRateLimiter()
    const rateLimitWaitMs = await rateLimiter.acquire()
    if (rateLimitWaitMs > 100) {
      // Log if we waited more than 100ms (useful for debugging)
      this.emitEvent({
        type: 'trying',
        gatewayId: '',
        gatewayLabel: '',
        message: `Rate limiting: waited ${Math.round(rateLimitWaitMs)}ms before request`,
      })
    }

    const active = this.getEligibleGateways()

    if (active.length === 0) {
      this.emitEvent({
        type: 'all_failed',
        gatewayId: '',
        gatewayLabel: '',
        message: 'No gateways available. Check your gateway configuration.',
      })
      throw new Error('No gateways available. Configure at least one LLM gateway in Settings.')
    }

    const failedGateways: string[] = []
    const startTime = Date.now()

    for (let i = 0; i < active.length; i++) {
      const gw = active[i]

      // Emit "trying" event
      this.emitEvent({
        type: i === 0 ? 'trying' : 'fallback',
        gatewayId: gw.id,
        gatewayLabel: gw.label,
        message: i === 0
          ? `Connecting to ${gw.label}…`
          : `Falling back to ${gw.label}…`,
        nextGatewayId: active[i + 1]?.id,
      })

      // Retry loop within this gateway
      let lastError: unknown = null
      let failureRecorded = false
      for (let retry = 0; retry <= gw.maxRetries; retry++) {
        try {
          const headers = this.buildHeaders(gw)
          const result = await callFn(gw.apiBase, gw.apiKey, headers, {})

          // Success — update health
          this.recordSuccess(gw.id, Date.now() - startTime)
          this.emitEvent({
            type: 'success',
            gatewayId: gw.id,
            gatewayLabel: gw.label,
            message: failedGateways.length > 0
              ? `Connected via ${gw.label} (after ${failedGateways.length} fallback${failedGateways.length > 1 ? 's' : ''})`
              : `Connected to ${gw.label}`,
          })

          return {
            result,
            meta: {
              gatewayId: gw.id,
              usedFallback: failedGateways.length > 0,
              failedGateways,
              totalLatencyMs: Date.now() - startTime,
            },
          }
          } catch (err) {
            lastError = err

              // Abort — user cancelled, propagate immediately without retry or failover
              if (isAbortError(err)) {
                throw err
              }

              // Permanent errors — don't retry, don't failover for auth errors
            if (isPermanentError(err)) {
              this.recordFailure(gw.id)
              failureRecorded = true
              this.emitEvent({
              type: 'failed',
              gatewayId: gw.id,
              gatewayLabel: gw.label,
              message: `${gw.label}: authentication failed`,
              error: err instanceof Error ? err.message : String(err),
            })
            // For auth errors on the primary gateway, still try fallbacks
            break
          }

          // Retryable errors — retry within this gateway
          if (isRetryableError(err) && retry < gw.maxRetries) {
            // Exponential backoff with jitter: 500ms, 1500ms, 3500ms...
            const backoff = Math.min(500 * Math.pow(2, retry), 8000)
            const jitter = Math.random() * backoff * 0.3
            await sleep(backoff + jitter)
            continue
          }

          // Non-retryable or retries exhausted — break to try next gateway
          break
        }
      }

      // Gateway failed — record failure only if not already recorded inside the catch block
      // (permanent auth errors call recordFailure there to avoid double-counting)
      if (!failureRecorded) {
        this.recordFailure(gw.id)
      }
      failedGateways.push(gw.id)

      this.emitEvent({
        type: 'failed',
        gatewayId: gw.id,
        gatewayLabel: gw.label,
        message: `${gw.label} failed`,
        error: lastError instanceof Error ? lastError.message : String(lastError),
        nextGatewayId: active[i + 1]?.id,
      })
    }

    // All gateways exhausted
    this.emitEvent({
      type: 'all_failed',
      gatewayId: '',
      gatewayLabel: '',
      message: `All gateways failed (tried: ${active.map((g) => g.label).join(', ')})`,
    })

    throw new Error(
      `All LLM gateways failed. Tried: ${active.map((g) => g.label).join(', ')}. ` +
      `Check your API keys and network connection.`
    )
  }

  /**
   * Quick health check — ping each gateway's /models endpoint.
   * Useful for the settings UI "Test Connection" button.
   */
  async healthCheck(gatewayId: string): Promise<{ ok: boolean; latencyMs: number; error?: string; modelCount?: number }> {
    const gw = this.gateways.find((g) => g.id === gatewayId)
    if (!gw) return { ok: false, latencyMs: 0, error: 'Gateway not found' }

    const t0 = Date.now()
    try {
      const url = `${gw.apiBase.replace(/\/+$/, '')}/models`
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (gw.apiKey) headers['Authorization'] = `Bearer ${gw.apiKey}`
      Object.assign(headers, gw.extraHeaders ?? {})

      const resp = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(10_000),
      })

      const latencyMs = Date.now() - t0

      if (!resp.ok) {
        this.recordFailure(gw.id)
        return { ok: false, latencyMs, error: `HTTP ${resp.status}` }
      }

      const data = await resp.json()
      const modelCount = Array.isArray(data?.data) ? data.data.length : undefined

      this.recordSuccess(gw.id, latencyMs)
      return { ok: true, latencyMs, modelCount }
    } catch (err) {
      this.recordFailure(gw.id)
      return {
        ok: false,
        latencyMs: Date.now() - t0,
        error: err instanceof Error ? err.message : String(err),
      }
    }
  }

  /**
   * Get current rate limiter statistics for debugging/UI display.
   */
  getRateLimiterStats(): RateLimiterStats {
    return getGlobalRateLimiter().getStats()
  }

  // ── Private: Gateway Selection ──────────────────────────────────────────────

  /**
   * Get gateways eligible for requests, excluding circuit-broken ones.
   */
  private getEligibleGateways(): GatewayConfig[] {
    const active = getActiveGateways(this.gateways)
    const now = Date.now()

    return active.filter((gw) => {
      const health = this.health.get(gw.id)
      if (!health) return true

      // If gateway is "down", check if cooldown has elapsed
      if (health.status === 'down') {
        if (health.retryAfter && now < health.retryAfter) {
          return false // Still in cooldown
        }
        // Cooldown elapsed — allow as half-open (one probe request)
        return true
      }

      return true
    })
  }

  /**
   * Build request headers for a specific gateway.
   * Injects HTTP-Referer and X-Title for OpenRouter/Requesty (required for attribution
   * and some free-tier rate limit eligibility). These are standard/allowed CORS headers.
   */
  private buildHeaders(gw: GatewayConfig): Record<string, string> {
    const headers: Record<string, string> = {}

    // Always inject OpenRouter/Requesty attribution headers — they are explicitly listed in
    // their Access-Control-Allow-Headers and do NOT cause CORS preflight issues.
    if (gw.type === 'openrouter' || gw.type === 'requesty') {
      headers['HTTP-Referer'] = 'https://nasus.app'
      headers['X-Title'] = 'Nasus'
    }

    // User-configured extra headers (from DEFAULT_GATEWAYS or user config)
    if (gw.extraHeaders) {
      Object.assign(headers, gw.extraHeaders)
    }

    return headers
  }

  // ── Public: Health Tracking ────────────────────────────────────────────────

  recordSuccess(gatewayId: string, latencyMs: number): void {
    const health = this.health.get(gatewayId)
    if (!health) return

    health.status = 'healthy'
    health.lastChecked = Date.now()
    health.consecutiveFailures = 0
    health.retryAfter = undefined

    // Update rolling success rate
    const history = this.requestHistory.get(gatewayId) ?? []
    history.push(true)
    if (history.length > HEALTH_WINDOW_SIZE) history.shift()
    this.requestHistory.set(gatewayId, history)

    health.successRate = history.filter(Boolean).length / history.length

    // Exponential moving average for latency
    health.avgLatencyMs = health.avgLatencyMs === 0
      ? latencyMs
      : health.avgLatencyMs * 0.8 + latencyMs * 0.2
  }

  recordFailure(gatewayId: string): void {
    const health = this.health.get(gatewayId)
    if (!health) return

    health.lastChecked = Date.now()
    health.consecutiveFailures++

    // Update rolling success rate
    const history = this.requestHistory.get(gatewayId) ?? []
    history.push(false)
    if (history.length > HEALTH_WINDOW_SIZE) history.shift()
    this.requestHistory.set(gatewayId, history)

    health.successRate = history.filter(Boolean).length / history.length

    // Circuit breaker: mark as 'down' after threshold
    if (health.consecutiveFailures >= CIRCUIT_BREAK_THRESHOLD) {
      health.status = 'down'
      // Exponential cooldown: 1min, 2min, 4min, capped at 5min
      const backoffMultiplier = Math.min(
        Math.pow(2, health.consecutiveFailures - CIRCUIT_BREAK_THRESHOLD),
        MAX_COOLDOWN_MS / CIRCUIT_BREAK_COOLDOWN_MS,
      )
      health.retryAfter = Date.now() + CIRCUIT_BREAK_COOLDOWN_MS * backoffMultiplier
    } else {
      health.status = 'degraded'
    }
  }

  // ── Private: Events ────────────────────────────────────────────────────────

  private emitEvent(event: GatewayEvent): void {
    this.onEvent?.(event)
  }
}

// ─── Utility ────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
