import { describe, it, expect, vi } from 'vitest'
import { ContextCompressor } from './ContextCompressor'
import type { LlmMessage } from '../llm'

describe('ContextCompressor', () => {
  const compressor = new ContextCompressor()

  // ── getContextWindow ──────────────────────────────────────────────────────

  it('returns 200_000 for claude-3.7-sonnet', () => {
    expect(compressor.getContextWindow('anthropic/claude-3.7-sonnet')).toBe(200_000)
  })

  it('returns 128_000 for gpt-4o', () => {
    expect(compressor.getContextWindow('openai/gpt-4o')).toBe(128_000)
  })

  it('returns 128_000 (default) for an unknown model', () => {
    expect(compressor.getContextWindow('unknown/model-x')).toBe(128_000)
  })

  it('returns 1_048_576 for gemini-2.5-flash', () => {
    expect(compressor.getContextWindow('google/gemini-2.5-flash')).toBe(1_048_576)
  })

  // ── getThreshold ─────────────────────────────────────────────────────────

  it('returns a value >= 20 (floor guard)', () => {
    // Tiny hypothetical model context → threshold must still be ≥ 20
    const threshold = compressor.getThreshold('unknown/tiny-model')
    expect(threshold).toBeGreaterThanOrEqual(20)
  })

  it('scales threshold to 60% of context window divided by 500', () => {
    // gpt-4o: 128_000 tokens → Math.floor(128_000 * 0.6 / 500) = 153
    expect(compressor.getThreshold('openai/gpt-4o')).toBe(153)
  })

  // ── compress ─────────────────────────────────────────────────────────────

  function makeToolBlock(n: number): LlmMessage[] {
    return [
      { role: 'assistant', content: `call ${n}`, tool_calls: [{ id: `id-${n}`, type: 'function', function: { name: 'read_file', arguments: '{}' } }] },
      { role: 'tool', content: `result ${n}`, tool_call_id: `id-${n}` },
    ]
  }

  it('returns 0 and does not mutate when there are 8 or fewer tool-call blocks', () => {
    const messages: LlmMessage[] = [
      { role: 'system', content: 'sys' },
      ...Array.from({ length: 8 }, (_, i) => makeToolBlock(i)).flat(),
    ]
    const original = messages.map(m => m.content)
    const spy = vi.fn()
    const masked = compressor.compress(messages, spy)
    expect(masked).toBe(0)
    expect(spy).not.toHaveBeenCalled()
    expect(messages.map(m => m.content)).toEqual(original)
  })

  it('masks middle blocks and keeps first 3 and last 5 intact when >8 blocks', () => {
    // 10 blocks → slice(3, -5) = indices 3 and 4 (2 blocks) get masked
    const messages: LlmMessage[] = Array.from({ length: 10 }, (_, i) => makeToolBlock(i)).flat()
    const spy = vi.fn()
    compressor.compress(messages, spy)

    // First 3 blocks (indices 0,1,2) → tool messages at positions 1,3,5
    expect(messages[1].content).toBe('result 0')
    expect(messages[3].content).toBe('result 1')
    expect(messages[5].content).toBe('result 2')

    // Middle blocks 3 & 4 (block-index 3 = message at pos 7, block-index 4 = message at pos 9)
    expect(messages[7].content).toBe('[Observation masked for brevity.]')
    expect(messages[9].content).toBe('[Observation masked for brevity.]')

    // Last 5 blocks (indices 5–9) — their tool messages are untouched
    expect(messages[11].content).toBe('result 5')
    expect(messages[13].content).toBe('result 6')
    expect(messages[15].content).toBe('result 7')
    expect(messages[17].content).toBe('result 8')
    expect(messages[19].content).toBe('result 9')
  })

  it('calls onCompressed with the number of masked observations', () => {
    // 10 blocks → 2 middle blocks each have 1 tool message → 2 masked
    const messages: LlmMessage[] = Array.from({ length: 10 }, (_, i) => makeToolBlock(i)).flat()
    const spy = vi.fn()
    const count = compressor.compress(messages, spy)
    expect(count).toBe(2)
    expect(spy).toHaveBeenCalledOnce()
    expect(spy).toHaveBeenCalledWith(2)
  })

  it('does not overwrite the original object reference for non-masked messages', () => {
    const messages: LlmMessage[] = Array.from({ length: 10 }, (_, i) => makeToolBlock(i)).flat()
    const firstToolMsg = messages[1]
    compressor.compress(messages, vi.fn())
    // First block is kept intact — same object reference (not replaced)
    expect(messages[1]).toBe(firstToolMsg)
  })

  it('replaces masked entries with new objects (original refs retain full content)', () => {
    const messages: LlmMessage[] = Array.from({ length: 10 }, (_, i) => makeToolBlock(i)).flat()
    const block3ToolMsg = messages[7] // tool result for block index 3
    compressor.compress(messages, vi.fn())
    // The array slot now holds a different object
    expect(messages[7]).not.toBe(block3ToolMsg)
    // The original still has the real content
    expect(block3ToolMsg.content).toBe('result 3')
  })
})
