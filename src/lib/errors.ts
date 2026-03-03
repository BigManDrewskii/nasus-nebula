/**
 * Error classification utilities for consistent error handling.
 *
 * Provides categorization and retry logic for different error types
 * encountered throughout the application.
 */

/**
 * Error categories for structured handling
 */
export type ErrorCategory =
  | 'network'
  | 'permission'
  | 'validation'
  | 'timeout'
  | 'unknown'

/**
 * Error category constants for type-safe usage
 */
export const ErrorCategory = {
  NETWORK: 'network' as const,
  PERMISSION: 'permission' as const,
  VALIDATION: 'validation' as const,
  TIMEOUT: 'timeout' as const,
  UNKNOWN: 'unknown' as const,
} as const

/**
 * Categorize an error into one of the defined categories.
 */
export function categorizeError(error: Error | string | unknown): ErrorCategory {
  const message = String(error instanceof Error ? error.message : error ?? '').toLowerCase()

  // Network errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('econnrefused') ||
    message.includes('enotfound') ||
    message.includes('econnreset') ||
    message.includes('econnaborted') ||
    message.includes('cors')
  ) {
    return 'network'
  }

  // Permission errors
  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('access denied') ||
    message.includes('eacces') ||
    message.includes('eperm')
  ) {
    return 'permission'
  }

  // Validation errors
  if (
    message.includes('invalid') ||
    message.includes('validation') ||
    message.includes('required') ||
    message.includes('missing') ||
    message.includes('syntax')
  ) {
    return 'validation'
  }

  // Timeout errors
  if (
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('etimedout')
  ) {
    return 'timeout'
  }

  return 'unknown'
}

/**
 * Determine if an error is retryable based on its category.
 */
export function isRetryableError(error: Error | unknown): boolean {
  const category = categorizeError(error)
  return category === 'network' || category === 'timeout'
}

/**
 * Get a user-friendly error message based on error category.
 */
export function getUserFriendlyMessage(error: Error | unknown): string {
  const category = categorizeError(error)
  const message = String(error instanceof Error ? error.message : error ?? 'Unknown error')

  switch (category) {
    case 'network':
      return 'Network error. Please check your connection and try again.'
    case 'permission':
      return 'Permission denied. Please check your credentials.'
    case 'timeout':
      return 'Request timed out. Please try again.'
    case 'validation':
      return `Invalid input: ${message}`
    default:
      return message
  }
}
