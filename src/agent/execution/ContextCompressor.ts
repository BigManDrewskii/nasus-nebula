/**
 * ContextCompressor — message-window compression for the ReAct loop.
 *
 * Identifies assistant+tool_calls blocks in the history and masks the
 * middle ones (keeping first 3 and last 5 intact) to prevent context
 * overflow without losing recent state.
 */

import type { LlmMessage } from '../llm'
import { CONTEXT_WINDOWS } from '../../lib/constants'

export class ContextCompressor {
  /**
   * Return the context-window token limit for a given model ID.
   * Falls back to 128 K when the model is unrecognised.
   */
  getContextWindow(modelId: string): number {
    for (const [re, ctx] of CONTEXT_WINDOWS) {
      if (re.test(modelId)) return ctx
    }
    return 128_000
  }

  /**
   * Number of LLM messages above which compression is triggered.
   * Scaled to 60 % of the context window, expressed in ~500-token message units.
   */
  getThreshold(model: string): number {
    return Math.max(20, Math.floor((this.getContextWindow(model) * 0.6) / 500))
  }

  /**
   * Compress messages in-place by masking middle tool-result observations.
   *
   * Only fires when there are > 8 tool-call blocks.  Keeps first 3 and
   * last 5 blocks intact so recent context is preserved.
   *
   * @param messages  - The mutable messages array (modified in-place).
   * @param onCompressed - Called with the number of observations masked.
   * @returns Number of observations masked (0 = nothing happened).
   */
  compress(
    messages: LlmMessage[],
    onCompressed: (maskedCount: number) => void,
  ): number {
    const toolCallBlocks: { assistantIndex: number; toolResultIndices: number[] }[] = []

    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]
      if (m.role === 'assistant' && m.tool_calls?.length) {
        const block = { assistantIndex: i, toolResultIndices: [] as number[] }
        let j = i + 1
        while (j < messages.length && messages[j].role === 'tool') {
          block.toolResultIndices.push(j)
          j++
        }
        if (block.toolResultIndices.length > 0) {
          toolCallBlocks.push(block)
        }
      }
    }

    if (toolCallBlocks.length <= 8) return 0

    // Mask middle blocks — keep first 3 and last 5 intact
    const toMask = toolCallBlocks.slice(3, -5)
    let maskedCount = 0

    for (const block of toMask) {
      for (const toolIndex of block.toolResultIndices) {
        const toolMessage = messages[toolIndex]
        if (toolMessage && toolMessage.role === 'tool') {
          // Replace the message object (not mutate) so any external references
          // to the original object retain the full content for observability.
          messages[toolIndex] = {
            ...toolMessage,
            content: '[Observation masked for brevity.]',
          }
          maskedCount++
        }
      }
    }

    if (maskedCount > 0) {
      onCompressed(maskedCount)
    }

    return maskedCount
  }
}
