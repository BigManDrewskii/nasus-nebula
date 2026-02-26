import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserScroll } from '../../browserBridge'

/**
 * Tool for scrolling the browser tab up or down.
 */
export class BrowserScrollTool extends BaseTool {
  readonly name = 'browser_scroll'
  readonly description = 'Scroll the current browser tab up or down.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      direction: { type: 'string', enum: ['up', 'down'], description: 'Scroll direction.' },
      amount: { type: 'number', description: 'Pixels to scroll (default 400).' },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
    required: ['direction'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const direction = args.direction as 'up' | 'down'

    if (!direction) {
      return toolFailure('Missing direction')
    }

    try {
      const result = await browserScroll({
        tabId: args.tab_id as number | undefined,
        direction,
        amount: args.amount as number | undefined,
      })
      return toolSuccess(`Scrolled ${direction} by ${Math.abs(result.scrolled)}px`)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
