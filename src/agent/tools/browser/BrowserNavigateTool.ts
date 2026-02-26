import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserNavigate } from '../../browserBridge'

/**
 * Tool for navigating the user's browser to a URL.
 */
export class BrowserNavigateTool extends BaseTool {
  readonly name = 'browser_navigate'
  readonly description =
    "Navigate the user's real browser to a URL. Requires the Nasus Browser Bridge extension. Use to open websites, web apps, or any URL in the user's actual browser session (with their real cookies/logins). Returns the page title and final URL."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      url: { type: 'string', description: 'Full URL to navigate to (include https://).' },
      new_tab: { type: 'boolean', description: 'Open in a new tab (default false).', default: false },
    },
    required: ['url'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const url = args.url as string
    const newTab = (args.new_tab as boolean) || false

    if (!url) {
      return toolFailure('Missing url')
    }

    try {
      const result = await browserNavigate(url, newTab)
      return toolSuccess(`Navigated to: ${result.url}\nTitle: ${result.title}\nTab ID: ${result.tabId}`)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
