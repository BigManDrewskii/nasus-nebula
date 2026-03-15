import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GatewayService } from './gatewayService'
import type { GatewayConfig } from './gatewayTypes'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeGateway(overrides: Partial<GatewayConfig> = {}): GatewayConfig {
  return {
    id: 'test-gw',
    type: 'deepseek',
    label: 'Test Gateway',
    apiBase: 'https://api.example.com/v1',
    apiKey: 'sk-test',
    priority: 0,
    enabled: true,
    nativeRouting: false,
    maxRetries: 0, // no retries — keeps tests fast
    timeoutMs: 10_000,
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GatewayService — health tracking', () => {
  let service: GatewayService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new GatewayService([makeGateway()])
  })

  // ── recordFailure ───────────────────────────────────────────────────────────

  it('increments consecutiveFailures and sets status to degraded on first failure', () => {
    service.recordFailure('test-gw')
    const [health] = service.getHealth()
    expect(health.consecutiveFailures).toBe(1)
    expect(health.status).toBe('degraded')
  })

  it('marks gateway as down after 3 consecutive failures', () => {
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    const [health] = service.getHealth()
    expect(health.status).toBe('down')
    expect(health.retryAfter).toBeGreaterThan(Date.now())
  })

  it('applies exponential backoff: retryAfter grows with each failure beyond threshold', () => {
    // 3 failures → down, backoffMultiplier = 2^0 = 1 → retryAfter ≈ now + 60s
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    const retryAfter3 = service.getHealth()[0].retryAfter!

    // 4th failure → backoffMultiplier = 2^1 = 2 → retryAfter ≈ now + 120s
    service.recordFailure('test-gw')
    const retryAfter4 = service.getHealth()[0].retryAfter!

    expect(retryAfter4).toBeGreaterThan(retryAfter3)
  })

  it('caps exponential backoff at MAX_COOLDOWN_MS (5 minutes)', () => {
    // 20 failures — backoffMultiplier would be 2^17 = 131072 without cap
    for (let i = 0; i < 20; i++) service.recordFailure('test-gw')
    const { retryAfter } = service.getHealth()[0]
    const fiveMinutesFromNow = Date.now() + 5 * 60_000
    expect(retryAfter!).toBeLessThanOrEqual(fiveMinutesFromNow + 500) // 500ms tolerance
  })

  it('is a no-op for unknown gateway IDs', () => {
    expect(() => service.recordFailure('unknown-id')).not.toThrow()
    expect(service.getHealth()).toHaveLength(1)
  })

  it('updates rolling success rate (false entry)', () => {
    service.recordFailure('test-gw')
    const [health] = service.getHealth()
    expect(health.successRate).toBeLessThan(1)
  })

  // ── recordSuccess ───────────────────────────────────────────────────────────

  it('resets consecutiveFailures and marks gateway healthy', () => {
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    service.recordSuccess('test-gw', 100)
    const [health] = service.getHealth()
    expect(health.status).toBe('healthy')
    expect(health.consecutiveFailures).toBe(0)
    expect(health.retryAfter).toBeUndefined()
  })

  it('sets avgLatencyMs directly on first call (no prior avg)', () => {
    service.recordSuccess('test-gw', 200)
    expect(service.getHealth()[0].avgLatencyMs).toBe(200)
  })

  it('blends avgLatencyMs via EMA on subsequent calls (0.8/0.2 weights)', () => {
    service.recordSuccess('test-gw', 200)
    service.recordSuccess('test-gw', 100)
    // EMA: 200 * 0.8 + 100 * 0.2 = 180
    expect(service.getHealth()[0].avgLatencyMs).toBeCloseTo(180)
  })

  it('updates rolling success rate (true entry)', () => {
    service.recordFailure('test-gw')
    service.recordSuccess('test-gw', 50)
    const { successRate } = service.getHealth()[0]
    expect(successRate).toBeGreaterThan(0)
    expect(successRate).toBeLessThan(1)
  })
})

// ── updateGateways — Fix E2 ───────────────────────────────────────────────────

describe('GatewayService.updateGateways — health state pruning (Fix E2)', () => {
  it('removes health and requestHistory entries for removed gateways', () => {
    const gw2 = makeGateway({ id: 'gw-2', label: 'Second' })
    const service = new GatewayService([makeGateway(), gw2])

    service.recordFailure('test-gw')
    service.recordFailure('gw-2')
    expect(service.getHealth()).toHaveLength(2)

    // Remove gw-2 — health for gw-2 should be pruned
    service.updateGateways([makeGateway()])
    const health = service.getHealth()
    expect(health).toHaveLength(1)
    expect(health[0].gatewayId).toBe('test-gw')
  })

  it('preserves health state (including failure count) for retained gateways', () => {
    const service = new GatewayService([makeGateway()])
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')

    service.updateGateways([makeGateway({ label: 'Updated Label' })])
    expect(service.getHealth()[0].consecutiveFailures).toBe(2)
  })

  it('initializes fresh health for newly added gateways', () => {
    const service = new GatewayService([makeGateway()])
    const newGw = makeGateway({ id: 'new-gw', label: 'New' })

    service.updateGateways([makeGateway(), newGw])

    const newHealth = service.getHealth().find((h) => h.gatewayId === 'new-gw')
    expect(newHealth?.status).toBe('unknown')
    expect(newHealth?.consecutiveFailures).toBe(0)
    expect(newHealth?.successRate).toBe(1)
  })

  it('handles removing all gateways then re-adding them', () => {
    const service = new GatewayService([makeGateway()])
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    service.recordFailure('test-gw') // → down

    service.updateGateways([])
    expect(service.getHealth()).toHaveLength(0)

    service.updateGateways([makeGateway()])
    // Re-added gateway gets fresh health state
    expect(service.getHealth()[0].status).toBe('unknown')
    expect(service.getHealth()[0].consecutiveFailures).toBe(0)
  })
})

// ── getHealthyGateways ────────────────────────────────────────────────────────

describe('GatewayService.getHealthyGateways', () => {
  it('returns all enabled gateways when none are in cooldown', () => {
    const service = new GatewayService([makeGateway()])
    expect(service.getHealthyGateways()).toHaveLength(1)
  })

  it('excludes disabled gateways', () => {
    const service = new GatewayService([makeGateway({ enabled: false })])
    expect(service.getHealthyGateways()).toHaveLength(0)
  })

  it('excludes gateways still within circuit-breaker cooldown', () => {
    const service = new GatewayService([makeGateway()])
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    service.recordFailure('test-gw') // trips breaker
    expect(service.getHealthyGateways()).toHaveLength(0)
  })

  it('includes a down gateway once its cooldown has elapsed (half-open probe)', () => {
    const service = new GatewayService([makeGateway()])
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')

    // Wind retryAfter back to the past
    const health = service.getHealth()[0]
    // @ts-expect-error — direct state manipulation for test
    health.retryAfter = Date.now() - 1

    expect(service.getHealthyGateways()).toHaveLength(1)
  })

  it('returns sorted by priority when multiple gateways are healthy', () => {
    const gw1 = makeGateway({ id: 'gw-1', priority: 10 })
    const gw2 = makeGateway({ id: 'gw-2', priority: 0 })
    const service = new GatewayService([gw1, gw2])
    const result = service.getHealthyGateways()
    expect(result[0].id).toBe('gw-2') // lower priority number = tried first
    expect(result[1].id).toBe('gw-1')
  })
})

// ── callWithFailover ──────────────────────────────────────────────────────────

describe('GatewayService.callWithFailover', () => {
  it('throws "No gateways available" when all gateways are disabled', async () => {
    const service = new GatewayService([makeGateway({ enabled: false })])
    await expect(service.callWithFailover(vi.fn())).rejects.toThrow('No gateways available')
  })

  it('calls callFn with the gateway apiBase, apiKey, headers, and queryParams', async () => {
    const service = new GatewayService([makeGateway()])
    const callFn = vi.fn().mockResolvedValue('ok')

    await service.callWithFailover(callFn)

    expect(callFn).toHaveBeenCalledWith(
      'https://api.example.com/v1',
      'sk-test',
      expect.any(Object), // headers
      expect.any(Object), // queryParams
    )
  })

  it('returns the result and meta on success', async () => {
    const service = new GatewayService([makeGateway()])
    const { result, meta } = await service.callWithFailover(vi.fn().mockResolvedValue('payload'))
    expect(result).toBe('payload')
    expect(meta.usedFallback).toBe(false)
    expect(meta.failedGateways).toHaveLength(0)
  })

  it('records success health after a successful call', async () => {
    const service = new GatewayService([makeGateway()])
    await service.callWithFailover(vi.fn().mockResolvedValue('ok'))
    expect(service.getHealth()[0].status).toBe('healthy')
    expect(service.getHealth()[0].consecutiveFailures).toBe(0)
  })

  it('records failure and throws "All LLM gateways failed" when all gateways fail', async () => {
    const service = new GatewayService([makeGateway()])
    const callFn = vi.fn().mockRejectedValue(new Error('timeout'))
    await expect(service.callWithFailover(callFn)).rejects.toThrow('All LLM gateways failed')
    expect(service.getHealth()[0].consecutiveFailures).toBeGreaterThan(0)
  })

  it('re-throws AbortError immediately without retrying or failing over', async () => {
    const gw2 = makeGateway({ id: 'gw-2', priority: 5 })
    const service = new GatewayService([makeGateway(), gw2])
    const err = new Error('The operation was aborted')
    err.name = 'AbortError'
    const callFn = vi.fn().mockRejectedValue(err)

    await expect(service.callWithFailover(callFn)).rejects.toThrow('aborted')
    expect(callFn).toHaveBeenCalledTimes(1) // no retry, no fallback
  })

  it('falls back to the next gateway when the primary fails with a permanent error (401)', async () => {
    const gw2 = makeGateway({ id: 'gw-2', label: 'Fallback', priority: 5 })
    const service = new GatewayService([makeGateway(), gw2])
    const authErr = new Error('HTTP 401 Unauthorized')
    const callFn = vi.fn()
      .mockRejectedValueOnce(authErr)   // primary → auth failure → break to next
      .mockResolvedValueOnce('fallback') // secondary → success

    const { result, meta } = await service.callWithFailover(callFn)
    expect(result).toBe('fallback')
    expect(meta.usedFallback).toBe(true)
    expect(meta.failedGateways).toContain('test-gw')
  })

  it('skips a gateway whose circuit is broken (still in cooldown)', async () => {
    const gw2 = makeGateway({ id: 'gw-2', priority: 5, label: 'Second' })
    const service = new GatewayService([makeGateway(), gw2])

    // Trip the breaker on the primary
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')
    service.recordFailure('test-gw')

    const callFn = vi.fn().mockResolvedValue('from-fallback')
    const { result } = await service.callWithFailover(callFn)

    expect(result).toBe('from-fallback')
    expect(callFn).toHaveBeenCalledTimes(1)
    // Should have been called with gw-2's base, not test-gw's
    expect(callFn).toHaveBeenCalledWith(
      gw2.apiBase,
      expect.any(String),
      expect.any(Object),
      expect.any(Object),
    )
  })

  it('injects extraHeaders from gateway config into the headers arg', async () => {
    const service = new GatewayService([makeGateway({
      extraHeaders: { 'X-Custom-Header': 'value123' },
    })])
    const callFn = vi.fn().mockResolvedValue('ok')
    await service.callWithFailover(callFn)

    const [, , headers] = callFn.mock.calls[0]
    expect(headers['X-Custom-Header']).toBe('value123')
  })
})
