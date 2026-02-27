import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolParameterSchema, WaitForResult } from '../core/ToolResult'
import { browserWaitFor } from '../../browserBridge'

/**
 * Tool for waiting for elements or URL patterns in the browser.
 */
export class BrowserWaitForTool extends BaseTool {
  readonly name = 'browser_wait_for'
  readonly description =
    'Wait until a CSS selector appears in the DOM or the current URL matches a pattern. Essential after navigation on SPAs (React, Vue, Angular) where page content loads asynchronously after the URL changes. Use before browser_extract or browser_click on dynamically rendered content.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      selector: { type: 'string', description: "CSS selector to wait for (e.g. 'main.content', '#results')." },
      url_pattern: { type: 'string', description: 'Substring to match against the current tab URL (e.g. "/dashboard", "search?q=").' },
      timeout_ms: { type: 'number', description: 'How long to wait in milliseconds (default 10000).', default: 10000 },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
  }

  async execute(args: Record<string, unknown>): Promise<WaitForResult> {
    try {
      const result = await browserWaitFor({
        tabId: args.tab_id as number | undefined,
        selector: args.selector as string | undefined,
        urlPattern: args.url_pattern as string | undefined,
        timeoutMs: args.timeout_ms as number | undefined,
      })
      return toolSuccess({ found: result.success, selector: result.selector || '' }) as WaitForResult
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err)) as WaitForResult
    }
  }
}
