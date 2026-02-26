import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserSelect } from '../../browserBridge'

/**
 * Tool for selecting options in dropdown elements.
 */
export class BrowserSelectTool extends BaseTool {
  readonly name = 'browser_select'
  readonly description =
    "Select an option in a <select> dropdown by value or visible label text. More reliable than browser_click for dropdowns."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector of the <select> element.' },
      value: { type: 'string', description: 'The option value attribute to select.' },
      label: { type: 'string', description: 'The visible option text to select (use if value is unknown).' },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
    required: ['selector'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const selector = args.selector as string

    if (!selector) {
      return toolFailure('Missing selector')
    }

    try {
      const result = await browserSelect({
        tabId: args.tab_id as number | undefined,
        selector,
        value: args.value as string | undefined,
        label: args.label as string | undefined,
      })
      return toolSuccess(`Selected: ${result.selected}`)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
