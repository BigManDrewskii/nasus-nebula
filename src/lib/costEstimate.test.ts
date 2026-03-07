import { describe, it, expect } from 'vitest'
import { estimateCost, RATES_PER_MILLION } from './costEstimate'

describe('estimateCost', () => {
  it('should calculate cost for a known model', () => {
    const cost = estimateCost('openai/gpt-4o', 1_000_000)
    expect(cost).toBe('$7.500')
  })

  it('should use a default rate for an unknown model', () => {
    const cost = estimateCost('unknown/model', 1_000_000)
    expect(cost).toBe('$5.000') // Default rate is 5
  })

  it('should format small costs with 4 decimal places', () => {
    const cost = estimateCost('openai/gpt-4o-mini', 1000)
    // (1000 / 1,000,000) * 0.3 = 0.0003
    expect(cost).toBe('$0.0003')
  })

  it('should format very small costs as <$0.001', () => {
    const cost = estimateCost('openai/gpt-4o-mini', 100)
    // (100 / 1,000,000) * 0.3 = 0.00003
    expect(cost).toBe('<$0.001')
  })

  it('should format larger costs with 3 decimal places', () => {
    const cost = estimateCost('openai/o1', 500_000)
    // (500,000 / 1,000,000) * 30 = 15
    expect(cost).toBe('$15.000')
  })
})
