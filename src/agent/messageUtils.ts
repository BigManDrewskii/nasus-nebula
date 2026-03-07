/**
 * Shared LLM message sanitization utilities.
 *
 * Enforces the OpenAI message ordering invariants:
 *   1. Every assistant message with tool_calls must be followed by ALL corresponding
 *      tool result messages (AI_MissingToolResultsError if violated).
 *   2. Every tool result (role:'tool') must be preceded by an assistant message that
 *      declared its tool_call_id (provider 400 error if violated).
 *   3. The last message must never be an assistant message with unresolved tool_calls
 *      (causes "tool must follow tool_calls" on the very next LLM request).
 *
 * These violations can occur after context compression or mid-stream failures.
 * This single implementation is shared by ExecutionAgent and llm.ts.
 */

import type { LlmMessage, ToolCall } from './llm'

/**
 * Sanitize a message array so it conforms to the OpenAI message format.
 * Orphaned or incomplete tool_call blocks are silently dropped.
 */
export function sanitizeMessages(messages: LlmMessage[]): LlmMessage[] {
  // Pass 1 — forward scan: drop assistant+tool_call blocks with missing results
  // and orphaned tool results, building the kept set.
  const pass1: LlmMessage[] = []
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]

    // Rule 1: assistant with tool_calls → all results must immediately follow
    if (m.role === 'assistant' && m.tool_calls && m.tool_calls.length > 0) {
      const expectedIds = new Set(m.tool_calls.map((tc: ToolCall) => tc.id))
      let j = i + 1
      const foundIds = new Set<string>()
      while (j < messages.length && messages[j].role === 'tool') {
        const tid = messages[j].tool_call_id
        if (tid) foundIds.add(tid)
        j++
      }
      const hasMissing = [...expectedIds].some(id => !foundIds.has(id))
      if (hasMissing) {
        console.warn('[sanitizeMessages] Dropping incomplete assistant+tool_calls block, missing ids:',
          [...expectedIds].filter(id => !foundIds.has(id)))
        i = j - 1 // skip this assistant + any partial tool results after it
        continue
      }
    }
    pass1.push(m)
  }

  // Pass 2 — build declared IDs from the kept messages, then filter orphaned tool results
  const declaredIds = new Set<string>()
  for (const m of pass1) {
    if (m.role === 'assistant' && m.tool_calls?.length) {
      for (const tc of m.tool_calls) declaredIds.add(tc.id)
    }
  }
  const pass2 = pass1.filter(m => {
    if (m.role !== 'tool') return true
    const tid = m.tool_call_id
    if (!tid || !declaredIds.has(tid)) {
      console.warn('[sanitizeMessages] Dropping orphaned tool result, id:', tid)
      return false
    }
    return true
  })

  // Rule 3: trailing assistant+tool_calls with no following tool results must be removed
  while (pass2.length > 0) {
    const last = pass2[pass2.length - 1]
    if (last.role === 'assistant' && last.tool_calls && last.tool_calls.length > 0) {
      const lastIds = new Set(last.tool_calls.map((tc: ToolCall) => tc.id))
      const hasResults = pass2.some(m => m.role === 'tool' && m.tool_call_id && lastIds.has(m.tool_call_id))
      if (!hasResults) {
        pass2.pop()
        console.warn('[sanitizeMessages] Removed trailing assistant with unresolved tool_calls')
        continue
      }
    }
    break
  }

  return pass2
}
