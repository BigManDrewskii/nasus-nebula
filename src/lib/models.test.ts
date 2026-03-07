import { describe, it, expect } from 'vitest'
import { familyLabel, shortModelLabel } from './models'

describe('model utilities', () => {
  it('should return correct family labels', () => {
    expect(familyLabel('anthropic/claude-3.7-sonnet')).toBe('Anthropic')
    expect(familyLabel('google/gemini-2.0-pro')).toBe('Google')
    expect(familyLabel('openai/gpt-4.1-turbo')).toBe('OpenAI')
    expect(familyLabel('meta-llama/llama-3.3-70b-instruct')).toBe('Meta')
    expect(familyLabel('unknown/model')).toBe('unknown')
  })

  it('should return correct short model labels', () => {
    expect(shortModelLabel('anthropic/claude-3.7-sonnet')).toBe('claude-3.7-sonnet')
    expect(shortModelLabel('google/gemini-2.0-pro')).toBe('gemini-2.0-pro')
    expect(shortModelLabel('openai/gpt-4.1-turbo')).toBe('gpt-4.1-turbo')
    expect(shortModelLabel('just-a-model-id')).toBe('just-a-model-id')
  })
})
