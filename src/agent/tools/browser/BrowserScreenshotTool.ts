import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserScreenshot } from '../../browserBridge'

/**
 * Tool for taking screenshots of the browser tab.
 */
export class BrowserScreenshotTool extends BaseTool {
  readonly name = 'browser_screenshot'
  readonly description =
    "Take a screenshot of the current browser tab and return it as a base64 image. Use to visually verify a page state, capture a result, or inspect a UI element."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      full_page: { type: 'boolean', description: 'Capture the full scrollable page (default false = viewport only).' },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const result = await browserScreenshot({
        tabId: args.tab_id as number | undefined,
        fullPage: Boolean(args.full_page),
      })
      // Return the data URL — the LLM can reference it
      return toolSuccess(result.dataUrl)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
