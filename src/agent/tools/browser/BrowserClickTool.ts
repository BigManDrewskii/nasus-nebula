import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserClick } from '../../browserBridge'

/**
 * Tool for clicking elements in the user's browser.
 */
export class BrowserClickTool extends BaseTool {
  readonly name = 'browser_click'
  readonly description =
    "Click an element in the user's browser tab. Use a CSS selector (preferred) or x,y pixel coordinates. Returns success info or an error if the element was not found."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      selector: {
        type: 'string',
        description: "CSS selector of the element to click (e.g. 'button.submit', '#login-btn').",
      },
      x: { type: 'number', description: 'X pixel coordinate (use if no selector).' },
      y: { type: 'number', description: 'Y pixel coordinate (use if no selector).' },
      tab_id: { type: 'number', description: 'Target tab ID (omit to use the current Nasus-controlled tab).' },
    },
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const result = await browserClick({
        tabId: args.tab_id as number | undefined,
        selector: args.selector as string | undefined,
        x: args.x as number | undefined,
        y: args.y as number | undefined,
      })
      if (result.error) {
        return toolFailure(result.error)
      }
      return toolSuccess(`Clicked: ${result.tag ?? ''} ${result.text ? `"${result.text}"` : ''}`.trim())
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
