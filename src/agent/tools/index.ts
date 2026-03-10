/**
 * Tool Registry — central tool registration and execution.
 *
 * This module exports a pre-configured ToolRegistry with all available tools.
 * Individual tools are organized by category.
 */

import type { JSONSchema7 } from 'json-schema'
import { ToolRegistry } from './core/ToolRegistry'
import type { ExecutionConfig } from '../sandboxRuntime'

// Nasus agent delegation
import { callNasusAgent } from './core/CallNasusAgentTool'
import type { NasusModuleId } from './core/nasus_types'
import { BaseTool } from './core/BaseTool'
import { toolSuccess, toolFailure } from './core/ToolResult'
import type { ToolResult } from './core/ToolResult'

// Core tools
import { SaveMemoryTool } from './core/SaveMemoryTool'
import { UpdatePlanTool } from './core/UpdatePlanTool'
import { SavePreferenceTool } from './core/SavePreferenceTool'
import { ThinkTool } from './core/ThinkTool'
import { CompleteTool } from './core/CompleteTool'

// File tools
import { ReadFileTool } from './file/ReadFileTool'
import { WriteFileTool } from './file/WriteFileTool'
import { PatchFileTool } from './file/PatchFileTool'
import { EditFileTool } from './file/EditFileTool'
import { UndoFileTool } from './file/UndoFileTool'
import { ListFilesTool } from './file/ListFilesTool'
import { SearchFilesTool } from './file/SearchFilesTool'
import { AnalyzeCodeTool } from './file/AnalyzeCodeTool'

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
import { BrowserAnalyzeScreenshotTool } from './browser/BrowserAnalyzeScreenshotTool'
import { BrowserScrollTool } from './browser/BrowserScrollTool'
import { BrowserWaitForTool } from './browser/BrowserWaitForTool'
import { BrowserAriaSnapshotTool } from './browser/BrowserAriaSnapshotTool'
import { BrowserReadPageTool } from './browser/BrowserReadPageTool'

/**
 * Global tool registry instance.
 */
export const toolRegistry = new ToolRegistry()

// Register all tools
toolRegistry.registerConstructor('save_memory', SaveMemoryTool)
toolRegistry.registerConstructor('update_plan', UpdatePlanTool)
toolRegistry.registerConstructor('save_preference', SavePreferenceTool)
toolRegistry.registerConstructor('think', ThinkTool)
toolRegistry.registerConstructor('complete', CompleteTool)
toolRegistry.registerConstructor('read_file', ReadFileTool)
toolRegistry.registerConstructor('write_file', WriteFileTool)
toolRegistry.registerConstructor('patch_file', PatchFileTool)
toolRegistry.registerConstructor('edit_file', EditFileTool)
toolRegistry.registerConstructor('undo_file', UndoFileTool)
toolRegistry.registerConstructor('list_files', ListFilesTool)
toolRegistry.registerConstructor('search_files', SearchFilesTool)
toolRegistry.registerConstructor('analyze_code', AnalyzeCodeTool)

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
toolRegistry.registerConstructor('browser_analyze_screenshot', BrowserAnalyzeScreenshotTool)
toolRegistry.registerConstructor('browser_scroll', BrowserScrollTool)
toolRegistry.registerConstructor('browser_wait_for', BrowserWaitForTool)
toolRegistry.registerConstructor('browser_aria_snapshot', BrowserAriaSnapshotTool)
toolRegistry.registerConstructor('browser_read_page', BrowserReadPageTool)

// Nasus Python agent stack — delegates to local FastAPI sidecar on port 4751
class NasusAgentTool extends BaseTool {
  readonly name = 'call_nasus_agent'
  readonly description = [
    'Call the Nasus AI agent stack via the local Python sidecar on port 4751.',
    'Use to delegate complex tasks to Nasus modules:',
    '  M10 -- Task Planner: break a goal into a DAG of subtasks',
    '  M11 -- Quality Reviewer: score and approve/reject output',
    '  M09 -- Memory Manager: read/write persistent project memory',
    '  M00 -- Orchestrator: run a full multi-module pipeline',
    'Returns the completed job result including the output payload.',
  ].join('\n')
  readonly parameters = {
    type: 'object' as const,
    required: ['module_id'] as const,
    properties: {
      module_id: {
        type: 'string' as const,
        enum: ['M00', 'M09', 'M10', 'M11'],
        description: 'Which Nasus module to invoke',
      },
      payload: {
        type: 'object' as const,
        description: 'Module-specific input payload',
      },
    },
  }
  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const module_id = args.module_id as NasusModuleId
    const payload = (args.payload ?? {}) as Record<string, unknown>

    // ── Readiness guard ──────────────────────────────────────────────────
    // The Python sidecar can take up to 15s to boot. Poll nasus_is_ready
    // via Tauri IPC before attempting the HTTP fetch so we get a clean error
    // instead of a connection-refused that burns a strike in ExecutionAgent.
    const READY_POLL_INTERVAL_MS = 500
    const READY_TIMEOUT_MS = 20_000
    const readyStart = Date.now()

    while (true) {
      // Attempt a lightweight health probe directly — avoids IPC round-trip
      // when the sidecar is already up (the common case after first use).
      try {
        const probe = await fetch('http://127.0.0.1:4751/health', {
          signal: AbortSignal.timeout(1500),
        })
        if (probe.ok) break // sidecar is alive — proceed
      } catch {
        // not up yet — fall through to timeout check
      }

      if (Date.now() - readyStart >= READY_TIMEOUT_MS) {
        return toolFailure(
          'Nasus Python sidecar is not running or did not start within 20 seconds. ' +
          'Check Settings → Execution → Nasus Stack to install or restart the sidecar.',
        )
      }

      await new Promise((r) => setTimeout(r, READY_POLL_INTERVAL_MS))
    }
    // ────────────────────────────────────────────────────────────────────

    try {
      const result = await callNasusAgent({ module_id, payload })
      if (result.status === 'FAILED') {
        return toolFailure(`Nasus job failed: ${result.errors.join('; ') || 'unknown error'}`)
      }
      return toolSuccess(JSON.stringify(result.payload, null, 2))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return toolFailure(`Nasus sidecar call failed: ${msg}`)
    }
  }
}

toolRegistry.registerConstructor('call_nasus_agent', NasusAgentTool)

/**
 * Get tool function definitions for OpenAI function calling.
 */
export function getToolDefinitions(env: 'sandbox' | 'browser-only' = 'sandbox'): Array<{ type: 'function'; function: { name: string; description: string; parameters: JSONSchema7 } }> {
  const allTools = toolRegistry.getToolDefinitions()

    if (env === 'browser-only') {
      // Remove tools that require shell/sandbox
      const excludeInBrowserMode = new Set([
        'bash_execute',
        'git',
      ])
    return allTools
      .filter(t => !excludeInBrowserMode.has(t.function.name))
      .map(t => ({ ...t, function: { ...t.function, parameters: t.function.parameters as JSONSchema7 } }))
  }

  return allTools.map(t => ({ ...t, function: { ...t.function, parameters: t.function.parameters as JSONSchema7 } }))
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
    onSearchStatus?: (evt: unknown) => void
  }
): Promise<{ output: string; isError: boolean }> {
  // Inject context into args for tools that need it
  const augmentedArgs: Record<string, unknown> = { ...args }
  if (context?.taskId) {
    augmentedArgs.__taskId = context.taskId
  }

  // Configure tools before execution
  const tool = toolRegistry.get(name)

  // Set execution config on tools that need it (must be before execute)
  if (context?.executionConfig && tool && 'setExecutionConfig' in tool) {
    (tool as { setExecutionConfig: (cfg: ExecutionConfig) => void }).setExecutionConfig(context.executionConfig)
  }

  // Set search config/status on tools that need it (e.g. SearchWebTool)
  if (tool && 'withConfig' in tool && typeof (tool as { withConfig?: unknown }).withConfig === 'function') {
    (tool as { withConfig: (cfg: undefined, cb?: (evt: unknown) => void) => void }).withConfig(undefined, context?.onSearchStatus)
  }

  const result = await toolRegistry.execute(name, augmentedArgs)

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
export { ReadFileTool, WriteFileTool, PatchFileTool, EditFileTool, UndoFileTool, ListFilesTool, SearchFilesTool, AnalyzeCodeTool } from './file'

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
  BrowserAnalyzeScreenshotTool,
  BrowserScrollTool,
  BrowserWaitForTool,
  BrowserAriaSnapshotTool,
  BrowserReadPageTool,
} from './browser'
