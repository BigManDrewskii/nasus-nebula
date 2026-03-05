/**
 * Standardized tool result type.
 * All tools return this format for consistent handling.
 * Inspired by OpenManus ToolResult pattern.
 */

/**
 * Schema for tool parameters — used by all tool definitions.
 */
export interface ToolParameterSchema {
  type: 'object'
  description?: string
  properties?: Record<string, {
    type: string
    description?: string
    enum?: string[]
    default?: unknown
    properties?: Record<string, unknown>
    items?: unknown
    required?: readonly string[]
  }>
  required?: readonly string[]
}

/**
 * Standard result from any tool execution.
 */
export interface ToolResult {
  /** The primary output of the tool */
  output: unknown
  /** Error message if the tool failed */
  error: string | null
  /** For multimodal outputs (screenshots, charts) */
  base64_image?: string
  /** For streaming outputs */
  stream?: ReadableStream<Uint8Array>
  /** Additional metadata about the execution */
  metadata?: ToolResultMetadata
}

/**
 * Metadata about tool execution.
 */
export interface ToolResultMetadata {
  /** Tool execution duration in milliseconds */
  durationMs?: number
  /** Tokens used (for LLM-based tools) */
  tokensUsed?: number
  /** Size of data processed */
  bytesProcessed?: number
  /** Number of items affected */
  itemCount?: number
  /** Custom metadata */
  custom?: Record<string, unknown>
}

/**
 * Create a successful tool result.
 */
export function toolSuccess(output: unknown, metadata?: ToolResultMetadata): ToolResult {
  return {
    output,
    error: null,
    metadata,
  }
}

/**
 * Create a failed tool result.
 */
export function toolFailure(error: string, metadata?: ToolResultMetadata): ToolResult {
  return {
    output: null,
    error,
    metadata,
  }
}

/**
 * Create a multimodal result with image data.
 */
export function toolWithImage(
  output: string,
  base64Image: string,
  metadata?: ToolResultMetadata,
): ToolResult {
  return {
    output,
    error: null,
    base64_image: base64Image,
    metadata,
  }
}

/**
 * Check if a tool result is successful.
 */
export function isToolSuccess(result: ToolResult): boolean {
  return result.error === null
}

/**
 * Check if a tool result has an image.
 */
export function hasImage(result: ToolResult): boolean {
  return Boolean(result.base64_image)
}

/**
 * Format tool result for display to LLM.
 */
export function formatToolResult(result: ToolResult): string {
  if (result.error) {
    return `Error: ${result.error}`
  }

  if (typeof result.output === 'string') {
    return result.output
  }

  if (result.base64_image) {
    return `[Image output captured]`
  }

  return JSON.stringify(result.output, null, 2)
}

/**
 * Specialized result types for specific tools.
 */

/** File operation result */
export interface FileResult extends ToolResult {
  output: {
    path: string
    size?: number
    content?: string
  } | null
}

/** Search result */
export interface SearchToolResult extends ToolResult {
  output: {
    results: Array<{
      title: string
      url: string
      snippet: string
    }>
    query: string
    provider: string
    resultCount: number
  } | null
}

/** Code execution result */
export interface CodeResult extends ToolResult {
  output: {
    stdout: string
    stderr: string
    exitCode: number
    charts?: string[] // Base64-encoded charts
  } | null
}

/** Browser action result */
export interface BrowserResult extends ToolResult {
  output: {
    action: string
    url?: string
    screenshot?: string
  } | null
}

/** Eval result (for browser eval tool) */
export interface EvalResult extends ToolResult {
  output: {
    value: unknown
  } | null
}

/** Select result (for browser select tool) */
export interface SelectResult extends ToolResult {
  output: {
    selected: string
  } | null
}

/** Wait-for result (for browser wait tool) */
export interface WaitForResult extends ToolResult {
  output: {
    found: boolean
    selector: string
  } | null
}
