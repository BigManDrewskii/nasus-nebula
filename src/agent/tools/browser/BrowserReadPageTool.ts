import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserReadPage } from '../../browserBridge'
import { CONTENT_TRUNCATION_LIMIT } from '../../../lib/constants'

/**
 * High-level "read this URL" tool.
 *
 * Combines navigate + wait for network idle + DOM→Markdown extraction into
 * a single tool call. Preferred over the manual navigate→wait_for→extract
 * sequence for research and content reading tasks.
 *
 * Advantages over http_fetch:
 * - Works on JS-rendered pages (SPA, React, Vue, etc.)
 * - Waits for dynamic content to load
 * - Has access to the full rendered DOM (not just the initial HTML)
 * - Runs the same DOM→Markdown extractor as browser_extract
 */
export class BrowserReadPageTool extends BaseTool {
  readonly name = 'browser_read_page'
  readonly description =
    'Navigate to a URL and read its full content as Markdown in a single step. Handles JS-rendered pages, waits for dynamic content, and returns clean structured text. Preferred over http_fetch for web pages and over the manual navigate→wait_for→extract sequence for research tasks.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'Full URL to read (include https://).',
      },
      timeout_ms: {
        type: 'number',
        description: 'Navigation timeout in milliseconds (default 30000).',
        default: 30000,
      },
      selector: {
        type: 'string',
        description: 'CSS selector to scope extraction to a specific element (default: full page).',
      },
      chunk_index: {
        type: 'integer',
        description: 'Zero-indexed chunk to return for very long pages (default: 0).',
        default: 0,
      },
      chunk_size: {
        type: 'integer',
        description: `Max characters per chunk (default ${CONTENT_TRUNCATION_LIMIT}).`,
        default: CONTENT_TRUNCATION_LIMIT,
      },
    },
    required: ['url'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const url = args.url as string
    const timeoutMs = (args.timeout_ms as number) || 30000
    const selector = args.selector as string | undefined
    const chunkIndex = (args.chunk_index as number) || 0
    const chunkSize = (args.chunk_size as number) || CONTENT_TRUNCATION_LIMIT

    if (!url) return toolFailure('url is required')

    try {
      const result = await browserReadPage({ url, timeoutMs, selector })

      if (!result.content) {
        return toolFailure(`No content extracted from ${url} — the page may be empty or require authentication.`)
      }

      const totalLength = result.content.length
      const numChunks = Math.ceil(totalLength / chunkSize)
      const start = chunkIndex * chunkSize
      const end = start + chunkSize

      const header = [
        `URL: ${result.url}`,
        `Title: ${result.title}`,
        numChunks > 1 ? `Chunk: ${chunkIndex + 1}/${numChunks} (${totalLength} chars total)` : `Length: ${totalLength} chars`,
        '',
        '',
      ].join('\n')

      let content = result.content.slice(start, end)
      if (end < totalLength) {
        content += `\n\n[... truncated. Use chunk_index=${chunkIndex + 1} to read the next chunk]`
      }

      return toolSuccess(header + content)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('DNS') || msg.includes('NAME_NOT_RESOLVED')) {
        return toolFailure(`Could not reach "${url}" — DNS lookup failed.`)
      }
      if (msg.includes('timed out') || msg.includes('Timeout')) {
        return toolFailure(`Timed out loading "${url}" after ${timeoutMs}ms. Try increasing timeout_ms.`)
      }
      return toolFailure(msg)
    }
  }
}
