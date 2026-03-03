/**
 * Tool registry and execution dispatcher.
 * Manages tool lifecycle and provides centralized execution.
 * Inspired by OpenManus ToolCollection pattern.
 */

import type { BaseTool, ToolConstructor } from './BaseTool'
import type { ToolResult } from './ToolResult'
// import { toolSuccess, toolFailure } from './ToolResult'

/**
 * Registry for all available tools.
 * Provides tool lookup, registration, and execution.
 */
export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map()
  private toolConstructors: Map<string, ToolConstructor> = new Map()

  /**
   * Register a tool instance.
   */
  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool)
  }

  /**
   * Register a tool constructor for lazy instantiation.
   */
  registerConstructor(name: string, constructor: ToolConstructor): void {
    this.toolConstructors.set(name, constructor)
  }

  /**
   * Register multiple tools at once.
   */
  registerAll(tools: BaseTool[]): void {
    for (const tool of tools) {
      this.register(tool)
    }
  }

  /**
   * Unregister a tool by name.
   */
  unregister(name: string): void {
    this.tools.delete(name)
    this.toolConstructors.delete(name)
  }

  /**
   * Get a tool by name (instantiates if constructor-only).
   */
  get(name: string): BaseTool | undefined {
    // Check for already instantiated tool
    let tool = this.tools.get(name)

    // Try to instantiate from constructor
    if (!tool) {
      const Constructor = this.toolConstructors.get(name)
      if (Constructor) {
        tool = new Constructor()
        this.tools.set(name, tool)
      }
    }

    return tool
  }

  /**
   * Check if a tool exists.
   */
  has(name: string): boolean {
    return this.tools.has(name) || this.toolConstructors.has(name)
  }

  /**
   * Get all registered tool names.
   */
  getToolNames(): string[] {
    const names = new Set([
      ...this.tools.keys(),
      ...this.toolConstructors.keys(),
    ])
    return Array.from(names)
  }

  /**
   * Get all tool definitions for function calling.
   * Deduplicates by name — constructor-registered tools that were already
   * instantiated via get() live in both maps; we must not emit them twice
   * or OpenRouter will return 400 "duplicate function name".
   */
  getToolDefinitions(): Array<{ type: 'function'; function: { name: string; description: string; parameters: unknown } }> {
    const seen = new Set<string>()
    const definitions: Array<{ type: 'function'; function: { name: string; description: string; parameters: unknown } }> = []

    // All unique tool names across both maps
    const allNames = new Set([...this.tools.keys(), ...this.toolConstructors.keys()])

    for (const name of allNames) {
      if (seen.has(name)) continue
      seen.add(name)

      // Prefer already-instantiated tool; fall back to constructor
      let tool = this.tools.get(name)
      if (!tool) {
        const Constructor = this.toolConstructors.get(name)
        if (Constructor) tool = new Constructor()
      }
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

    for (const tool of this.tools.values()) {
      if (capability === 'sandbox' && tool.requiresSandbox) {
        tools.push(tool)
      } else if (capability === 'browser' && tool.worksInBrowser) {
        tools.push(tool)
      }
    }

    // Also check constructor tools
    for (const Constructor of this.toolConstructors.values()) {
      const tool = new Constructor()
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
    this.tools.clear()
    this.toolConstructors.clear()
  }

  /**
   * Get the count of registered tools.
   */
  get size(): number {
    return new Set([...this.tools.keys(), ...this.toolConstructors.keys()]).size
  }
}

/**
 * Global tool registry instance.
 */
export const globalToolRegistry = new ToolRegistry()
