import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserExtract } from '../../browserBridge'
import { CONTENT_TRUNCATION_LIMIT } from '../../../lib/constants'

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
      chunk_index: { type: 'integer', description: 'Zero-indexed chunk to return (default: 0). Use if the page is very long.', default: 0 },
      chunk_size: { type: 'integer', description: `Maximum characters per chunk (default ${CONTENT_TRUNCATION_LIMIT}).`, default: CONTENT_TRUNCATION_LIMIT },
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

      const chunkIndex = (args.chunk_index as number) || 0
      const chunkSize = (args.chunk_size as number) || CONTENT_TRUNCATION_LIMIT
      const start = chunkIndex * chunkSize
      const end = start + chunkSize
      
      const totalLength = result.content.length
      const numChunks = Math.ceil(totalLength / chunkSize)
      
      const header = `URL: ${result.url}\nTitle: ${result.title}\nChunk: ${chunkIndex + 1}/${numChunks}\nTotal Length: ${totalLength} chars\n\n`
      
      let content = result.content.slice(start, end)
      if (end < totalLength) {
        content += `\n\n[... truncated. Use chunk_index=${chunkIndex + 1} to see more ...]`
      }
      
      return toolSuccess(header + content)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
