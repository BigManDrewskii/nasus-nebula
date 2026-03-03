/**
 * Centralized constants for Nasus.
 * Replaces magic numbers scattered throughout the codebase.
 */

// ── Content Limits ────────────────────────────────────────────────────────────────

/** Maximum characters for content truncation in browser extraction */
export const CONTENT_TRUNCATION_LIMIT = 12000 as const

/** Maximum characters for HTTP response truncation */
export const HTTP_RESPONSE_TRUNCATION_LIMIT = 8000 as const

/** Maximum characters for JSON prettified truncation */
export const JSON_TRUNCATION_LIMIT = 8000 as const

/** Maximum characters for tool results before truncating for storage */
export const MAX_TOOL_RESULT_CHARS = 2000 as const

// ── Timeouts (milliseconds) ───────────────────────────────────────────────────────

/** Default timeout for HTTP requests and API calls */
export const DEFAULT_TIMEOUT_MS = 10000 as const

/** Extended timeout for browser navigation operations */
export const NAVIGATION_TIMEOUT_MS = 30000 as const

/** Timeout for idle stream detection */
export const IDLE_STREAM_TIMEOUT_MS = 30000 as const

/** Interval between status polls (milliseconds) */
export const STATUS_POLL_INTERVAL_MS = 30000 as const

/** Base delay for retry attempts (ms) - exponential backoff multiplier */
export const BASE_RETRY_DELAY_MS = 1000 as const

/** Interval between OpenRouter model refresh checks (1 hour) */
export const MODEL_REFRESH_INTERVAL_MS = 3600000 as const

/** Delay before showing "tasks pruned" notice (ms) */
export const PRUNE_NOTICE_DELAY_MS = 5000 as const

/** Delay before revoking preview URL (ms) */
export const PREVIEW_REVOKE_DELAY_MS = 1000 as const

/** Delay before browser startup status check (ms) */
export const BROWSER_STARTUP_CHECK_DELAY_MS = 1000 as const

/** Default extension detection timeout (ms) */
export const EXTENSION_DETECTION_TIMEOUT_MS = 2000 as const

/** Quick timeout for fast operations (ms) */
export const QUICK_TIMEOUT_MS = 2000 as const

// ── Storage & Memory ──────────────────────────────────────────────────────────────

/** Maximum number of tasks to keep in memory/store */
export const MAX_TASKS = 50 as const

/** Maximum raw history messages to keep in memory (prevents OOM) */
export const MAX_RAW_HISTORY_LIVE = 120 as const

/** Maximum number of memories to store in localStorage */
export const MAX_MEMORIES = 1000 as const

/** Maximum storage size in bytes (5MB) for localStorage */
export const MAX_STORAGE_SIZE_BYTES = 5242880 as const

/** Maximum attachment size in bytes (5MB) for file uploads */
export const MAX_ATTACHMENT_SIZE_BYTES = 5242880 as const

// ── Retry & Resilience ───────────────────────────────────────────────────────────

/** Maximum number of retry attempts for failed operations */
export const MAX_RETRIES = 3 as const

/** Maximum number of bash tool calls (prevents runaway shell loops) */
export const MAX_BASH_CALLS = 4 as const

// ── Agent Behavior ─────────────────────────────────────────────────────────────────

/** Default maximum iterations for ReAct loop */
export const DEFAULT_MAX_ITERATIONS = 50 as const

/** Iteration count at which to show countdown warning */
export const ITERATION_WARNING_THRESHOLD = 10 as const

/** Interval between "attention refresh" iterations */
export const ATTENTION_REFRESH_INTERVAL = 5 as const

// ── UI & Display ───────────────────────────────────────────────────────────────────

/** Threshold for considering output "long" (characters) */
export const LONG_OUTPUT_THRESHOLD_CHARS = 1000 as const

/** Threshold for considering output "long" (lines) */
export const LONG_OUTPUT_LINES = 10 as const

/** Threshold for showing "thinking" analysis timing (ms) */
export const THINKING_ANALYSIS_THRESHOLD_MS = 5000 as const

// ── Docker Sandbox ─────────────────────────────────────────────────────────────────

/** Docker container memory limit (512MB in bytes) */
export const DOCKER_MEMORY_LIMIT_BYTES = 536870912 as const

/** Docker container CPU shares */
export const DOCKER_CPU_SHARES = 1024 as const

/** Docker image for local Python sandbox */
export const DOCKER_PYTHON_IMAGE = 'python:3.12-slim' as const

// ── Rate Limiting ───────────────────────────────────────────────────────────────────

/** Number of rapid sends before showing warning */
export const RATE_LIMIT_THRESHOLD = 3 as const

/** Time window for rate limit detection (ms) */
export const RATE_LIMIT_WINDOW_MS = 5000 as const

// ── Error Messages ───────────────────────────────────────────────────────────────────

/** Default error message when API key is missing */
export const MISSING_API_KEY_MESSAGE = 'Please enter your API key in Settings' as const
