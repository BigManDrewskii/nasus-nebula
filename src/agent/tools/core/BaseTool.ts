/**
 * Abstract base tool class.
 * All tools extend this for consistent interface.
 * Inspired by OpenManus BaseTool pattern.
 */

import type { ToolResult } from './ToolResult'

/**
 * JSON Schema for tool parameters.
 */
export interface ToolParameterSchema {
  type: 'object'
  properties: Record<string, {
    type: string
    description: string
    enum?: string[]
    items?: unknown
  }>
  required: string[]
}

/**
 * Abstract base class for all tools.
 */
export abstract class BaseTool {
  /** Unique tool identifier */
  abstract readonly name: string

  /** Human-readable description for LLM */
  abstract readonly description: string

  /** JSON Schema for parameters (for function calling) */
  abstract readonly parameters: ToolParameterSchema

  /** Whether this tool requires cloud sandbox */
  readonly requiresSandbox: boolean = false

  /** Whether this tool works in browser-only mode */
  readonly worksInBrowser: boolean = true

  /** Timeout for tool execution (ms) */
  readonly timeout: number = 30_000

  /**
   * Execute the tool with given arguments.
   * Subclasses implement this.
   */
  abstract execute(args: Record<string, unknown>): Promise<ToolResult>

  /**
   * Convert tool to OpenAI function format.
   * Used for function calling with LLMs.
   */
  toFunctionDefinition(): {
    type: 'function'
    function: {
      name: string
      description: string
      parameters: ToolParameterSchema
    }
  } {
    return {
      type: 'function',
      function: {
        name: this.name,
        description: this.description,
        parameters: this.parameters,
      },
    }
  }

  /**
   * Validate arguments against the parameter schema.
   * Throws if validation fails.
   */
  protected validateArgs(args: Record<string, unknown>): void {
    for (const required of this.parameters.required) {
      if (!(required in args)) {
        throw new Error(`Missing required parameter: ${required}`)
      }
    }
  }

  /**
   * Get a parameter value or throw if missing.
   */
  protected getParam<T = string>(
    args: Record<string, unknown>,
    key: string,
    defaultValue?: T,
  ): T {
    if (key in args) {
      return args[key] as T
    }
    if (defaultValue !== undefined) {
      return defaultValue
    }
    throw new Error(`Missing required parameter: ${key}`)
  }

  /**
   * Wrap execution with timeout.
   */
  protected async withTimeout<T>(
    fn: () => Promise<T>,
    timeoutMs: number = this.timeout,
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Tool execution timed out after ${timeoutMs}ms`)), timeoutMs)
    )

    return Promise.race([fn(), timeout])
  }
}

/**
 * Utility type for tool constructors.
 */
export type ToolConstructor = new () => BaseTool

/**
 * Check if a class is a tool constructor.
 */
export function isToolClass(cls: unknown): cls is ToolConstructor {
  return (
    typeof cls === 'function' &&
    cls.name !== '' &&
    'prototype' in cls
  )
}
