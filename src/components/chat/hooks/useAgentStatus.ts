import { useEffect, useState } from 'react'

export type AgentStatus = 'idle' | 'processing' | 'streaming' | 'done'

export interface AgentStatusState {
  status: AgentStatus
  currentTool: string | null
  iteration: number
}

export interface AgentStatusDetail {
  taskId: string
  messageId: string
  iteration?: number
}

/**
 * Hook to track agent execution state and current tool being used.
 * Listens to nasus: prefixed events to determine agent status.
 *
 * @param taskId - Optional task ID to filter events for. If omitted, tracks all tasks.
 * @returns Current agent status state including status, currentTool, and iteration
 */
export function useAgentStatus(taskId?: string | null): AgentStatusState {
  const [status, setStatus] = useState<AgentStatus>('idle')
  const [currentTool, setCurrentTool] = useState<string | null>(null)
  const [iteration, setIteration] = useState(0)

  useEffect(() => {
    const handleAgentStarted = (e: Event) => {
      const detail = (e as CustomEvent<AgentStatusDetail>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId)) {
        setStatus('processing')
        setCurrentTool(null)
      }
    }

    const handleIteration = (e: Event) => {
      const detail = (e as CustomEvent<AgentStatusDetail>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId) && typeof detail.iteration === 'number') {
        setIteration(detail.iteration)
        setStatus('processing')
      }
    }

    const handleChunk = (e: Event) => {
      const detail = (e as CustomEvent<AgentStatusDetail>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId)) {
        setStatus('streaming')
      }
    }

    const handleToolCall = (e: Event) => {
      const detail = (e as CustomEvent<{ taskId: string; messageId: string; tool: string }>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId) && detail?.tool) {
        setCurrentTool(detail.tool)
        setStatus('processing')
      }
    }

    const handleAgentDone = (e: Event) => {
      const detail = (e as CustomEvent<AgentStatusDetail>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId)) {
        setStatus('done')
        setCurrentTool(null)
      }
    }

    const handleProcessingEnd = (e: Event) => {
      const detail = (e as CustomEvent<AgentStatusDetail>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId)) {
        setCurrentTool(null)
      }
    }

    const handleVerificationPassed = (e: Event) => {
      const detail = (e as CustomEvent<AgentStatusDetail>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId)) {
        setStatus('done')
        setCurrentTool(null)
      }
    }

    const handleVerificationFailed = (e: Event) => {
      const detail = (e as CustomEvent<AgentStatusDetail>).detail
      if (detail?.taskId && (!taskId || detail.taskId === taskId)) {
        setStatus('done')
        setCurrentTool(null)
      }
    }

    // Register event listeners
    window.addEventListener('nasus:agent-started', handleAgentStarted)
    window.addEventListener('nasus:iteration', handleIteration)
    window.addEventListener('nasus:stream-chunk', handleChunk)
    window.addEventListener('nasus:tool-call', handleToolCall)
    window.addEventListener('nasus:agent-done', handleAgentDone)
    window.addEventListener('nasus:processing-end', handleProcessingEnd)
    window.addEventListener('nasus:verification-passed', handleVerificationPassed)
    window.addEventListener('nasus:verification-failed', handleVerificationFailed)

    // Cleanup
    return () => {
      window.removeEventListener('nasus:agent-started', handleAgentStarted)
      window.removeEventListener('nasus:iteration', handleIteration)
      window.removeEventListener('nasus:stream-chunk', handleChunk)
      window.removeEventListener('nasus:tool-call', handleToolCall)
      window.removeEventListener('nasus:agent-done', handleAgentDone)
      window.removeEventListener('nasus:processing-end', handleProcessingEnd)
      window.removeEventListener('nasus:verification-passed', handleVerificationPassed)
      window.removeEventListener('nasus:verification-failed', handleVerificationFailed)
    }
  }, [taskId])

  return { status, currentTool, iteration }
}
