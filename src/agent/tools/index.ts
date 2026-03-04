/**
 * Tool Registry — central tool registration and execution.
 *
 * This module exports a pre-configured ToolRegistry with all available tools.
 * Individual tools are organized by category.
 */

import { ToolRegistry } from './core/ToolRegistry'
import type { ExecutionConfig } from '../sandboxRuntime'

// Core tools
import { SaveMemoryTool } from './core/SaveMemoryTool'
import { UpdatePlanTool } from './core/UpdatePlanTool'
import { SavePreferenceTool } from './core/SavePreferenceTool'

// File tools
import { ReadFileTool } from './file/ReadFileTool'
import { WriteFileTool } from './file/WriteFileTool'
import { PatchFileTool } from './file/PatchFileTool'
import { EditFileTool } from './file/EditFileTool'
import { UndoFileTool } from './file/UndoFileTool'
import { ListFilesTool } from './file/ListFilesTool'
import { SearchFilesTool } from './file/SearchFilesTool'

// Web tools
import { HttpFetchTool } from './web/HttpFetchTool'
import { SearchWebTool } from './web/SearchWebTool'

// Code execution tools
import { BashTool } from './code/BashTool'
import { PythonExecuteTool } from './code/PythonExecuteTool'
import { BashExecuteTool } from './code/BashExecuteTool'
import { ServePreviewTool } from './code/ServePreviewTool'
import { GitTool } from './code/GitTool'

// Browser tools
import { BrowserNavigateTool } from './browser/BrowserNavigateTool'
import { BrowserClickTool } from './browser/BrowserClickTool'
import { BrowserTypeTool } from './browser/BrowserTypeTool'
import { BrowserExtractTool } from './browser/BrowserExtractTool'
import { BrowserExtractLinksTool } from './browser/BrowserExtractLinksTool'
import { BrowserScreenshotTool } from './browser/BrowserScreenshotTool'
import { BrowserScrollTool } from './browser/BrowserScrollTool'
import { BrowserGetTabsTool } from './browser/BrowserGetTabsTool'
import { BrowserWaitForTool } from './browser/BrowserWaitForTool'
import { BrowserEvalTool } from './browser/BrowserEvalTool'
import { BrowserSelectTool } from './browser/BrowserSelectTool'

/**
 * Global tool registry instance.
 */
export const toolRegistry = new ToolRegistry()

// Register all tools
toolRegistry.registerConstructor('save_memory', SaveMemoryTool)
toolRegistry.registerConstructor('update_plan', UpdatePlanTool)
toolRegistry.registerConstructor('save_preference', SavePreferenceTool)
toolRegistry.registerConstructor('read_file', ReadFileTool)
toolRegistry.registerConstructor('write_file', WriteFileTool)
toolRegistry.registerConstructor('patch_file', PatchFileTool)
toolRegistry.registerConstructor('edit_file', EditFileTool)
toolRegistry.registerConstructor('undo_file', UndoFileTool)
toolRegistry.registerConstructor('list_files', ListFilesTool)
toolRegistry.registerConstructor('search_files', SearchFilesTool)

toolRegistry.registerConstructor('http_fetch', HttpFetchTool)
toolRegistry.registerConstructor('search_web', SearchWebTool)

toolRegistry.registerConstructor('bash', BashTool)
toolRegistry.registerConstructor('python_execute', PythonExecuteTool)
toolRegistry.registerConstructor('bash_execute', BashExecuteTool)
toolRegistry.registerConstructor('git', GitTool)
toolRegistry.registerConstructor('serve_preview', ServePreviewTool)

toolRegistry.registerConstructor('browser_navigate', BrowserNavigateTool)
toolRegistry.registerConstructor('browser_click', BrowserClickTool)
toolRegistry.registerConstructor('browser_type', BrowserTypeTool)
toolRegistry.registerConstructor('browser_extract', BrowserExtractTool)
toolRegistry.registerConstructor('browser_extract_links', BrowserExtractLinksTool)
toolRegistry.registerConstructor('browser_screenshot', BrowserScreenshotTool)
toolRegistry.registerConstructor('browser_scroll', BrowserScrollTool)
toolRegistry.registerConstructor('browser_get_tabs', BrowserGetTabsTool)
toolRegistry.registerConstructor('browser_wait_for', BrowserWaitForTool)
toolRegistry.registerConstructor('browser_eval', BrowserEvalTool)
toolRegistry.registerConstructor('browser_select', BrowserSelectTool)

/**
 * Get tool function definitions for OpenAI function calling.
 */
export function getToolDefinitions(): Array<{ type: string; function: object }> {
  return toolRegistry.getToolDefinitions()
}

/**
 * Execute a tool by name with arguments.
 */
export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  context?: {
    taskId?: string
    executionConfig?: ExecutionConfig
    onSearchStatus?: (evt: any) => void
  }
): Promise<{ output: string; isError: boolean }> {
  // Inject context into args for tools that need it
  const augmentedArgs = { ...args }
  if (context?.taskId) {
    (augmentedArgs as any).__taskId = context.taskId
  }

  // Set search config/status on tools that need it (e.g. SearchWebTool)
  const tool = toolRegistry.get(name)
  if (tool && 'withConfig' in tool && typeof (tool as any).withConfig === 'function') {
    (tool as any).withConfig(undefined, context?.onSearchStatus)
  }

  const result = await toolRegistry.execute(name, augmentedArgs)

  // Set execution config on tools that need it
  if (context?.executionConfig) {
    const tool = toolRegistry.get(name)
    if (tool && 'setExecutionConfig' in tool) {
      (tool as any).setExecutionConfig(context.executionConfig)
    }
  }

  return {
    output: String(result.output ?? ''),
    isError: result.error !== null,
  }
}

/**
 * Re-export tool classes for direct use if needed.
 */
export {
  // Core
  ToolRegistry,
  type ToolResult,
  toolSuccess,
  toolFailure,
  toolWithImage,
} from './core'

export type {
  ToolParameterSchema,
  ToolResultMetadata,
  FileResult,
  SearchToolResult,
  CodeResult,
  BrowserResult,
} from './core/ToolResult'

export { BaseTool } from './core/BaseTool'

// Core tools
export { SaveMemoryTool } from './core/SaveMemoryTool'

// File tools
export { ReadFileTool, WriteFileTool, PatchFileTool, EditFileTool, UndoFileTool, ListFilesTool, SearchFilesTool } from './file'

// Web tools
export { HttpFetchTool, SearchWebTool } from './web'

// Code tools
export { BashTool, PythonExecuteTool, BashExecuteTool, GitTool, ServePreviewTool } from './code'

// Browser tools
export {
  BrowserNavigateTool,
  BrowserClickTool,
  BrowserTypeTool,
  BrowserExtractTool,
  BrowserScreenshotTool,
  BrowserScrollTool,
  BrowserGetTabsTool,
  BrowserWaitForTool,
  BrowserEvalTool,
  BrowserSelectTool,
} from './browser'
