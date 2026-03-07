import { describe, it, expect } from 'vitest'
import type { RouterConfig } from './routing'
import { isPaidRoute, getRouteLabel, resolveModelLocally } from './routing'

describe('routing utilities', () => {
  const freeConfig: RouterConfig = { mode: 'auto', budget: 'free', modelOverrides: {} }
  const paidConfig: RouterConfig = { mode: 'auto', budget: 'paid', modelOverrides: {} }
  const manualConfig: RouterConfig = { mode: 'manual', budget: 'paid', modelOverrides: {} }

  // isPaidRoute
  it('should correctly identify paid routes', () => {
    expect(isPaidRoute('ollama', freeConfig)).toBe(false)
    expect(isPaidRoute('openrouter', freeConfig)).toBe(false)
    expect(isPaidRoute('openrouter', paidConfig)).toBe(true)
    expect(isPaidRoute('openrouter', manualConfig, 'some/model')).toBe(true)
    expect(isPaidRoute('openrouter', manualConfig, 'some/model:free')).toBe(false)
    expect(isPaidRoute('some-other-provider', freeConfig)).toBe(true)
  })

  // getRouteLabel
  it('should return correct route labels', () => {
    expect(getRouteLabel('ollama')).toBe('FREE LOCAL')
    expect(getRouteLabel('openrouter', freeConfig)).toBe('FREE CLOUD')
    expect(getRouteLabel('openrouter', paidConfig)).toBe('PAID CLOUD')
    expect(getRouteLabel('some-other-provider', paidConfig)).toBe('PAID')
  })

  // resolveModelLocally
  it('should resolve to manual model when mode is manual', () => {
    const decision = resolveModelLocally('test', manualConfig, 'manual/model')
    expect(decision.modelId).toBe('manual/model')
  })

  it('should resolve to a free model when budget is free', () => {
    const decision = resolveModelLocally('test', freeConfig, '')
    expect(decision.modelId).toContain(':free')
  })

  it('should resolve to a paid model for coding tasks', () => {
    const decision = resolveModelLocally('write a python script', paidConfig, '')
    expect(decision.modelId).toBe('anthropic/claude-3.7-sonnet')
  })

  it('should resolve to a paid model for reasoning tasks', () => {
    const decision = resolveModelLocally('analyze this complex data', paidConfig, '')
    expect(decision.modelId).toBe('anthropic/claude-3.7-sonnet:thinking')
  })

  it('should resolve to a fast model for simple tasks', () => {
    const decision = resolveModelLocally('summarize this', paidConfig, '')
    expect(decision.modelId).toBe('anthropic/claude-3.5-haiku')
  })

  it('should resolve to the default paid model for other tasks', () => {
    const decision = resolveModelLocally('tell me a joke', paidConfig, '')
    expect(decision.modelId).toBe('anthropic/claude-3.7-sonnet')
  })
})
