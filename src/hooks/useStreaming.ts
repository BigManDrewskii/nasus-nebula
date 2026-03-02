import { useRef, useEffect, useState } from 'react'

/**
 * Hook to debounced rapid streaming content updates.
 * Reduces re-renders during fast streaming by batching updates.
 *
 * @param content - The current content being streamed
 * @param isStreaming - Whether streaming is active
 * @param delay - Debounce delay in ms (default: 50ms for smooth but efficient updates)
 * @returns The debounced content to display
 */
export function useDebouncedStreaming(content: string, isStreaming: boolean, delay: number = 50): string {
  const [debouncedContent, setDebouncedContent] = useState(content)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastUpdateRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!isStreaming) {
      // When streaming stops, immediately update with final content
      setDebouncedContent(content)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
      return
    }

    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateRef.current

    // If updates are coming very fast, debounce them
    if (timeSinceLastUpdate < delay) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      timeoutRef.current = setTimeout(() => {
        setDebouncedContent(content)
        lastUpdateRef.current = Date.now()
      }, delay - timeSinceLastUpdate)
    } else {
      // Updates are slow enough to show directly
      setDebouncedContent(content)
      lastUpdateRef.current = now
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [content, isStreaming, delay])

  // Always ensure debounced content catches up on unmount
  useEffect(() => {
    return () => {
      if (debouncedContent !== content) {
        setDebouncedContent(content)
      }
    }
  }, [content, debouncedContent])

  return debouncedContent
}

/**
 * Hook for smooth streaming text with optional chunked updates.
 * Accumulates streaming chunks and returns accumulated text.
 *
 * @param initialContent - Initial content
 * @returns Object with accumulated content and append function
 */
export function useStreamingAccumulator(initialContent: string = '') {
  const [accumulated, setAccumulated] = useState(initialContent)
  const contentRef = useRef(initialContent)

  const append = (chunk: string) => {
    contentRef.current += chunk
    setAccumulated(contentRef.current)
  }

  const reset = (content: string = '') => {
    contentRef.current = content
    setAccumulated(content)
  }

  const setContent = (content: string) => {
    contentRef.current = content
    setAccumulated(content)
  }

  return { accumulated, append, reset, setContent }
}
