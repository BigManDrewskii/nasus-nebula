import { useEffect, useState, useRef } from 'react'

/**
 * Throttle streaming content updates so the UI renders on every animation frame
 * during an active stream, then flushes immediately when streaming stops.
 *
 * Unlike a trailing debounce (which resets its timer on every new token and
 * therefore never fires while tokens are arriving fast), this uses
 * requestAnimationFrame batching: the first token triggers a frame, subsequent
 * tokens accumulate into latestRef and are flushed at ~60 fps.
 *
 * The `_debounceMs` param is kept for API compatibility but is unused.
 */
export function useDebouncedStreaming<T>(value: T, isStreaming: boolean, _debounceMs: number): T {
  const [displayValue, setDisplayValue] = useState<T>(value)
  const rafRef = useRef<number | undefined>(undefined)
  const latestRef = useRef<T>(value)

  // Always keep latestRef current so the rAF callback reads the freshest value
  latestRef.current = value

  useEffect(() => {
    if (!isStreaming) {
      // Streaming stopped — flush immediately and cancel any pending frame
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = undefined
      }
      setDisplayValue(value)
      return
    }

    // Streaming is active — schedule a frame if one isn't already pending.
    // If a frame is already queued it will naturally pick up the latest value
    // via latestRef, so we don't need to schedule another one.
    if (rafRef.current !== undefined) return

    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = undefined
      setDisplayValue(latestRef.current)
    })
  }, [value, isStreaming])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current !== undefined) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return displayValue
}
