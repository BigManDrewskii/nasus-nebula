/**
 * Rate Limiter — Token bucket algorithm for preventing API rate limit errors.
 *
 * Unlike reactive backoff (which waits AFTER a 429), this prevents hitting limits
 * by proactively throttling requests before they're sent.
 *
 * Token bucket works like this:
 * - Bucket has maxCapacity tokens
 * - Tokens refill at refillRate per interval (e.g., 60 tokens/minute)
 * - Each request consumes 1 token
 * - If bucket is empty, request waits until a token is available
 *
 * This allows short bursts while respecting long-term rate limits.
 */

export interface RateLimiterConfig {
  /** Maximum requests allowed per time window */
  maxRequests: number
  /** Time window in milliseconds (default: 60000 = 1 minute) */
  windowMs: number
  /** Enable/disable rate limiting (useful for testing) */
  enabled: boolean
}

export interface RateLimiterStats {
  availableTokens: number
  maxCapacity: number
  waitTimeMs: number
  requestsInWindow: number
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxRequests: 60,  // Conservative default for most free-tier APIs
  windowMs: 60000,  // 1 minute
  enabled: true,
}

/**
 * Rate limiter using token bucket algorithm.
 *
 * The bucket starts full and refills continuously. Requests consume tokens.
 * When empty, requests wait for tokens to refill.
 */
export class RateLimiter {
  private config: RateLimiterConfig
  private tokens: number
  private lastRefill: number
  private requestTimestamps: number[] = []

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.tokens = this.config.maxRequests
    this.lastRefill = Date.now()
  }

  /**
   * Update configuration (e.g., when user changes settings).
   */
  updateConfig(config: Partial<RateLimiterConfig>): void {
    const oldMax = this.config.maxRequests
    this.config = { ...this.config, ...config }

    // If capacity increased, add the delta tokens so the bucket reflects the new max
    if (this.config.maxRequests > oldMax) {
      this.tokens = Math.min(this.config.maxRequests, this.tokens + (this.config.maxRequests - oldMax))
    }
  }

  /**
   * Get current statistics for debugging/UI display.
   */
  getStats(): RateLimiterStats {
    this.refill()

    return {
      availableTokens: Math.floor(this.tokens),
      maxCapacity: this.config.maxRequests,
      waitTimeMs: this.estimateWaitTime(),
      requestsInWindow: this.requestTimestamps.filter(
        t => Date.now() - t < this.config.windowMs
      ).length,
    }
  }

  /**
   * Acquire a token, waiting if necessary.
   * Returns the time spent waiting (in ms).
   */
  async acquire(): Promise<number> {
    if (!this.config.enabled) {
      return 0
    }

    const startTime = Date.now()
    this.refill()

    // Wait until a token is available.
    // Using `while` instead of `if` ensures concurrent callers that both wake
    // from sleep re-check availability rather than racing to consume the same token.
    while (this.tokens < 1) {
      const waitTime = this.estimateWaitTime()
      await sleep(Math.max(waitTime, 10)) // minimum 10ms to avoid busy-spin
      this.refill()
    }

    // Consume token
    this.tokens = Math.max(0, this.tokens - 1)
    this.requestTimestamps.push(Date.now())

    // Clean old timestamps (older than 2x window to keep array small)
    const cutoff = Date.now() - this.config.windowMs * 2
    this.requestTimestamps = this.requestTimestamps.filter(t => t > cutoff)

    return Date.now() - startTime
  }

  /**
   * Refill tokens based on time elapsed since last refill.
   */
  private refill(): void {
    const now = Date.now()
    const elapsed = now - this.lastRefill

    if (elapsed <= 0) {
      return
    }

    // Calculate tokens to add: (elapsed / window) * maxRequests
    const tokensToAdd = (elapsed / this.config.windowMs) * this.config.maxRequests
    this.tokens = Math.min(this.config.maxRequests, this.tokens + tokensToAdd)
    this.lastRefill = now
  }

  /**
   * Estimate how long to wait for the next token.
   */
  private estimateWaitTime(): number {
    if (this.tokens >= 1) return 0

    // Time for 1 token to refill: (1 / maxRequests) * windowMs
    const tokensNeeded = 1 - this.tokens
    const msPerToken = this.config.windowMs / this.config.maxRequests
    return Math.ceil(tokensNeeded * msPerToken)
  }

  /**
   * Reset the rate limiter (clear all state).
   * Useful for testing or when changing tiers.
   */
  reset(): void {
    this.tokens = this.config.maxRequests
    this.lastRefill = Date.now()
    this.requestTimestamps = []
  }
}

/**
 * Global rate limiter shared across all gateway requests.
 * This ensures total request rate stays within limits even with
 * multiple concurrent agents or tools.
 */
let globalRateLimiter: RateLimiter | null = null

export function getGlobalRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter()
  }
  return globalRateLimiter
}

export function updateGlobalRateLimiterConfig(config: Partial<RateLimiterConfig>): void {
  const limiter = getGlobalRateLimiter()
  limiter.updateConfig(config)
}

export function getRateLimiterStats(): RateLimiterStats {
  return getGlobalRateLimiter().getStats()
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
