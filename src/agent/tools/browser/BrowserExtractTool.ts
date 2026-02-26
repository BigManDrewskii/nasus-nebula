import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserExtract } from '../../browserBridge'

/**
 * Tool for extracting readable text content from the browser.
 */
export class BrowserExtractTool extends BaseTool {
  readonly name = 'browser_extract'
  readonly description =
    "Extract the readable text content of the current browser page (or a specific element) as Markdown. Use this to read page content, scrape data, or verify the state of a page after navigation or interaction."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector to extract from (default: full page body).' },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const result = await browserExtract({
        tabId: args.tab_id as number | undefined,
        selector: args.selector as string | undefined,
      })
      if (result.error) {
        return toolFailure(result.error)
      }
      const header = `URL: ${result.url}\nTitle: ${result.title}\nLength: ${result.length} chars\n\n`
      const content = result.content.length > 12000
        ? result.content.slice(0, 12000) + '\n[...truncated]'
        : result.content
      return toolSuccess(header + content)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
