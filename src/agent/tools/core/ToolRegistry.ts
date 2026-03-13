/**
 * Tool registry and execution dispatcher.
 * Manages tool lifecycle and provides centralized execution.
 * Inspired by OpenManus ToolCollection pattern.
 */

import type { BaseTool, ToolConstructor } from './BaseTool'
import type { ToolResult } from './ToolResult'

/**
 * Registry for all available tools.
 * Provides tool lookup, registration, and execution.
 *
 * Tools are registered as constructors and instantiated lazily on first use.
 * Instances are cached after the first call so that per-tool state (e.g.
 * executionConfig) is preserved across calls within the same registry lifetime.
 */
export class ToolRegistry {
  /** Registered tool constructors (source of truth). */
  private toolConstructors: Map<string, ToolConstructor> = new Map()
  /** Cached tool instances — populated lazily via get(). */
  private instances: Map<string, BaseTool> = new Map()

  /**
   * Register a tool constructor for lazy instantiation.
   */
  registerConstructor(name: string, constructor: ToolConstructor): void {
    this.toolConstructors.set(name, constructor)
    // Invalidate any cached instance so the next get() picks up the new constructor.
    this.instances.delete(name)
  }

  /**
   * Unregister a tool by name.
   */
  unregister(name: string): void {
    this.toolConstructors.delete(name)
    this.instances.delete(name)
  }

  /**
   * Get a tool by name, instantiating it lazily on first access.
   */
  get(name: string): BaseTool | undefined {
    const cached = this.instances.get(name)
    if (cached) return cached

    const Constructor = this.toolConstructors.get(name)
    if (!Constructor) return undefined

    const tool = new Constructor()
    this.instances.set(name, tool)
    return tool
  }

  /**
   * Check if a tool exists.
   */
  has(name: string): boolean {
    return this.toolConstructors.has(name)
  }

  /**
   * Get all registered tool names.
   */
  getToolNames(): string[] {
    return Array.from(this.toolConstructors.keys())
  }

  /**
   * Get all tool definitions for function calling.
   * Each tool is instantiated at most once (via get()), so this is safe to call
   * repeatedly without redundant construction.
   */
  getToolDefinitions(): Array<{ type: 'function'; function: { name: string; description: string; parameters: unknown } }> {
    const definitions: Array<{ type: 'function'; function: { name: string; description: string; parameters: unknown } }> = []

    for (const name of this.toolConstructors.keys()) {
      const tool = this.get(name)
      if (tool) definitions.push(tool.toFunctionDefinition())
    }

    return definitions
  }

  /**
   * Execute a tool by name with given arguments.
   */
  async execute(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.get(name)

    if (!tool) {
      return {
        output: null,
        error: `Unknown tool: ${name}`,
      }
    }

    try {
      return await tool.execute(args)
    } catch (error) {
      return {
        output: null,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Filter tools by capability (e.g., sandbox-only, browser-compatible).
   */
  filterByCapability(capability: 'sandbox' | 'browser'): BaseTool[] {
    const tools: BaseTool[] = []

    for (const name of this.toolConstructors.keys()) {
      const tool = this.get(name)!
      if (capability === 'sandbox' && tool.requiresSandbox) {
        tools.push(tool)
      } else if (capability === 'browser' && tool.worksInBrowser) {
        tools.push(tool)
      }
    }

    return tools
  }

  /**
   * Clear all tools (useful for testing or reset).
   */
  clear(): void {
    this.toolConstructors.clear()
    this.instances.clear()
  }

  /**
   * Get the count of registered tools.
   */
  get size(): number {
    return this.toolConstructors.size
  }
}

