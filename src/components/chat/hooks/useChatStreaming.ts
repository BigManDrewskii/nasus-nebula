import { useEffect, useState } from 'react'

export interface StreamingContent {
  messageId: string
  content: string
  isComplete: boolean
}

export interface ChatStreamingState {
  streamingContent: Map<string, StreamingContent>
  getStreamingText: (messageId: string) => string
  isStreaming: (messageId: string) => boolean
}

/**
 * Hook to manage streaming text accumulation with smooth updates.
 * Handles text chunks being added over time via nasus:stream-chunk events.
 *
 * @param taskId - Optional task ID to filter events for. If omitted, tracks all tasks.
 * @returns Map of streaming content and utility functions
 */
export function useChatStreaming(taskId?: string | null): ChatStreamingState {
  const [streamingContent, setStreamingContent] = useState<Map<string, StreamingContent>>(new Map())

  // Helper to update streaming content and trigger re-render
  const updateStreamingContent = (updater: (current: Map<string, StreamingContent>) => Map<string, StreamingContent>) => {
    setStreamingContent((prev) => updater(prev))
  }

  useEffect(() => {
    const handleStreamChunk = (e: Event) => {
      const detail = (e as CustomEvent<{
        taskId: string
        messageId: string
        delta: string
      }>).detail

      if (!detail?.messageId || !detail?.delta || (taskId && detail.taskId !== taskId)) return

      const { messageId, delta } = detail

      updateStreamingContent((current) => {
        const existing = current.get(messageId)
        if (existing) {
          // Append to existing content
          return new Map(current).set(messageId, {
            messageId,
            content: existing.content + delta,
            isComplete: existing.isComplete,
          })
        } else {
          // Initialize new streaming entry
          return new Map(current).set(messageId, {
            messageId,
            content: delta,
            isComplete: false,
          })
        }
      })
    }

    const handleStreamComplete = (e: Event) => {
      const detail = (e as CustomEvent<{
        taskId: string
        messageId: string
      }>).detail

      if (!detail?.messageId || (taskId && detail.taskId !== taskId)) return

      const { messageId } = detail

      updateStreamingContent((current) => {
        const existing = current.get(messageId)
        if (existing) {
          return new Map(current).set(messageId, {
            ...existing,
            isComplete: true,
          })
        }
        return current
      })
    }

    const handleAgentDone = (e: Event) => {
      const detail = (e as CustomEvent<{
        taskId: string
        messageId: string
      }>).detail

      if (!detail?.messageId || (taskId && detail.taskId !== taskId)) return

      const { messageId } = detail

      updateStreamingContent((current) => {
        const existing = current.get(messageId)
        if (existing) {
          return new Map(current).set(messageId, {
            ...existing,
            isComplete: true,
          })
        }
        return current
      })
    }

    // Register event listeners
    window.addEventListener('nasus:stream-chunk', handleStreamChunk)
    window.addEventListener('nasus:stream-complete', handleStreamComplete)
    window.addEventListener('nasus:agent-done', handleAgentDone)

    // Cleanup
    return () => {
      window.removeEventListener('nasus:stream-chunk', handleStreamChunk)
      window.removeEventListener('nasus:stream-complete', handleStreamComplete)
      window.removeEventListener('nasus:agent-done', handleAgentDone)
    }
  }, [taskId])

  /**
   * Get the accumulated streaming text for a message
   */
  const getStreamingText = (messageId: string): string => {
    const entry = streamingContent.get(messageId)
    return entry?.content ?? ''
  }

  /**
   * Check if a message is currently streaming
   */
  const isStreaming = (messageId: string): boolean => {
    const entry = streamingContent.get(messageId)
    return entry ? !entry.isComplete : false
  }

  return {
    streamingContent,
    getStreamingText,
    isStreaming,
  }
}
