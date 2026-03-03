import { useEffect, useState, useRef } from 'react'

/**
 * Debounce streaming content to reduce re-renders during rapid token updates.
 * Only updates the returned value after `debounceMs` milliseconds have passed
 * without any new updates, or when streaming stops.
 */
export function useDebouncedStreaming<T>(value: T, isStreaming: boolean, debounceMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // If not streaming, update immediately
    if (!isStreaming) {
      setDebouncedValue(value)
      return
    }

    // While streaming, debounce the updates
    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, isStreaming, debounceMs])

  return debouncedValue
}
