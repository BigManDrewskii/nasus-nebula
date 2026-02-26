import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserType } from '../../browserBridge'

/**
 * Tool for typing text into browser elements.
 */
export class BrowserTypeTool extends BaseTool {
  readonly name = 'browser_type'
  readonly description =
    "Type text into the focused element or a specific input in the user's browser. Use browser_click to focus an input first, then browser_type to enter text."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      text: { type: 'string', description: 'Text to type.' },
      selector: { type: 'string', description: 'CSS selector of input to focus before typing.' },
      clear_first: { type: 'boolean', description: 'Clear the field before typing (default false).' },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
    required: ['text'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const text = args.text as string

    if (!text) {
      return toolFailure('Missing text')
    }

    try {
      const result = await browserType({
        tabId: args.tab_id as number | undefined,
        selector: args.selector as string | undefined,
        text,
        clearFirst: Boolean(args.clear_first),
      })
      return toolSuccess(`Typed ${result.typed}`)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
