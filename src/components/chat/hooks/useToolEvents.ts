import { useEffect, useState, useRef } from 'react'

export type ToolEventPhase = 'start' | 'complete' | 'error'

export interface ToolEvent {
  toolName: string
  callId: string
  phase: ToolEventPhase
  timestamp: number
  input?: Record<string, unknown>
  output?: string
  error?: string
}

export interface ToolEventsState {
  events: ToolEvent[]
  activeTools: Set<string>
  completedTools: Set<string>
  getEventsForTool: (toolName: string) => ToolEvent[]
  getLatestEventForTool: (toolName: string) => ToolEvent | null
}

/**
 * Hook to track tool execution events for a given task ID.
 * Listens to nasus:tool-call and nasus:tool-result events.
 *
 * @param taskId - The task ID to track tool events for
 * @returns Tool events state and utility functions
 */
export function useToolEvents(taskId: string | null): ToolEventsState {
  const [events, setEvents] = useState<ToolEvent[]>([])
  const [activeTools, setActiveTools] = useState<Set<string>>(new Set())
  const [completedTools, setCompletedTools] = useState<Set<string>>(new Set())
  const eventsRef = useRef(events)

  // Keep ref in sync
  useEffect(() => {
    eventsRef.current = events
  }, [events])

  useEffect(() => {
    if (!taskId) {
      setEvents([])
      setActiveTools(new Set())
      setCompletedTools(new Set())
      return
    }

    const handleToolCall = (e: Event) => {
      const detail = (e as CustomEvent<{
        taskId: string
        messageId: string
        tool: string
        input: Record<string, unknown>
        callId: string
      }>).detail

      if (!detail || detail.taskId !== taskId) return

      const { tool, input, callId } = detail

      const newEvent: ToolEvent = {
        toolName: tool,
        callId,
        phase: 'start',
        timestamp: Date.now(),
        input,
      }

      setEvents((prev) => [...prev, newEvent])
      setActiveTools((prev) => new Set(prev).add(tool))
    }

    const handleToolResult = (e: Event) => {
      const detail = (e as CustomEvent<{
        taskId: string
        messageId: string
        callId: string
        output: string
        isError: boolean
      }>).detail

      if (!detail || detail.taskId !== taskId) return

      const { callId, output, isError } = detail

      // Find the matching tool call event
      const matchingEvent = eventsRef.current.find((ev) => ev.callId === callId)

      if (!matchingEvent) return

      const newEvent: ToolEvent = {
        toolName: matchingEvent.toolName,
        callId,
        phase: isError ? 'error' : 'complete',
        timestamp: Date.now(),
        output,
        error: isError ? output : undefined,
      }

      setEvents((prev) => {
        // Remove the start event and add the complete event
        const filtered = prev.filter((ev) => ev.callId !== callId)
        return [...filtered, newEvent]
      })

      setActiveTools((prev) => {
        const next = new Set(prev)
        next.delete(matchingEvent.toolName)
        return next
      })

      setCompletedTools((prev) => new Set(prev).add(matchingEvent.toolName))
    }

    // Register event listeners
    window.addEventListener('nasus:tool-call', handleToolCall)
    window.addEventListener('nasus:tool-result', handleToolResult)

    // Cleanup
    return () => {
      window.removeEventListener('nasus:tool-call', handleToolCall)
      window.removeEventListener('nasus:tool-result', handleToolResult)
    }
  }, [taskId])

  /**
   * Get all events for a specific tool
   */
  const getEventsForTool = (toolName: string): ToolEvent[] => {
    return events.filter((ev) => ev.toolName === toolName)
  }

  /**
   * Get the most recent event for a specific tool
   */
  const getLatestEventForTool = (toolName: string): ToolEvent | null => {
    const toolEvents = getEventsForTool(toolName)
    return toolEvents.length > 0 ? toolEvents[toolEvents.length - 1] : null
  }

  return {
    events,
    activeTools,
    completedTools,
    getEventsForTool,
    getLatestEventForTool,
  }
}
