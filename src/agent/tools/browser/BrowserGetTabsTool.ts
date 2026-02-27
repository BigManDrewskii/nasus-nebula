import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserGetTabs } from '../../browserBridge'

/**
 * Tool for listing all open browser tabs.
 */
export class BrowserGetTabsTool extends BaseTool {
  readonly name = 'browser_get_tabs'
  readonly description =
    'List all open browser tabs with their IDs, titles, and URLs. Use this to find a specific tab to target, or to understand what the user currently has open.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {},
  }

  async execute(_args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const tabs = await browserGetTabs()
      if (!tabs || tabs.length === 0) {
        return toolSuccess('No open tabs')
      }
      const lines = tabs.map((t, i) =>
        `[${i + 1}] Tab ID: ${t.id}  Active: ${t.active}\n    Title: ${t.title}\n    URL: ${t.url}`
      )
      return toolSuccess(lines.join('\n\n'))
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
