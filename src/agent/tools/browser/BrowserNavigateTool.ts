import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure, browserErrorToFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserNavigate } from '../../browserBridge'

/**
 * Tool for navigating the headless Playwright browser to a URL.
 */
export class BrowserNavigateTool extends BaseTool {
  readonly name = 'browser_navigate'
  readonly description =
    "Navigate the headless browser to a URL. Returns the page title, final URL, and HTTP status. For sites that need JS rendering, follow with browser_wait_for or browser_extract. Use browser_read_page instead if you just want to read the page content in one call."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Full URL to navigate to (must include https:// or http://).',
      },
      timeout_ms: {
        type: 'number',
        description: 'Navigation timeout in milliseconds (default 30000). Increase for slow sites.',
        default: 30000,
      },
    },
    required: ['url'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const url = args.url as string
    const timeoutMs = (args.timeout_ms as number) || 30000

    if (!url) return toolFailure('url is required')

    // Basic URL sanity check
    let parsedUrl: URL
    try {
      parsedUrl = new URL(url)
    } catch {
      return toolFailure(
        `Invalid URL "${url}" — make sure it includes the protocol (e.g. https://example.com).`
      )
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return toolFailure(`Unsupported protocol "${parsedUrl.protocol}" — only http:// and https:// are supported.`)
    }

    try {
      const result = await browserNavigate(url, false, timeoutMs)
      const statusNote = result.status && result.status >= 400
        ? ` (HTTP ${result.status} — page may show an error)`
        : result.status
          ? ` (HTTP ${result.status})`
          : ''
      return toolSuccess(
        `Navigated to: ${result.url}\nTitle: ${result.title}${statusNote}`
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Enrich common error messages for the agent
      if (msg.includes('DNS') || msg.includes('NAME_NOT_RESOLVED')) {
        return toolFailure(`Could not reach "${url}" — DNS lookup failed. Check the domain name.`)
      }
      if (msg.includes('CONNECTION_REFUSED') || msg.includes('ECONNREFUSED')) {
        return toolFailure(`Connection refused at "${url}" — the server may be down.`)
      }
      if (msg.includes('timed out') || msg.includes('Timeout')) {
        return toolFailure(`Navigation timed out after ${timeoutMs}ms for "${url}". Try increasing timeout_ms or check if the site is slow.`)
      }
      if (msg.includes('SSL') || msg.includes('CERT')) {
        return toolFailure(`SSL certificate error for "${url}".`)
      }
      return browserErrorToFailure(err) ?? toolFailure(msg)
    }
  }
}
