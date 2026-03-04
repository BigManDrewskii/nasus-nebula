import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { browserEval } from '../../browserBridge'

/**
 * Tool for extracting all links from the current browser page.
 */
export class BrowserExtractLinksTool extends BaseTool {
  readonly name = 'browser_extract_links'
  readonly description =
    'Extract all links (text and URL) from the current browser page. Use this to find navigation targets, social media profiles, or related resources.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const tabId = args.tab_id as number | undefined
      
      // JavaScript to extract links
      const expression = `
        Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.innerText.trim(),
          href: a.href,
          title: a.title || ''
        })).filter(link => link.href && link.href.startsWith('http'))
      `
      
      const result = await browserEval({
        tabId,
        expression,
      })
      
      if (result.error) {
        return toolFailure(result.error)
      }
      
      const links = result.result as Array<{ text: string; href: string; title: string }>
      
      if (!links || links.length === 0) {
        return toolSuccess('No links found on the page.')
      }
      
      // De-duplicate and format
      const seen = new Set<string>()
      const formattedLinks = links
        .filter(link => {
          if (seen.has(link.href)) return false
          seen.add(link.href)
          return true
        })
        .map(link => `- ${link.text || '[No Text]'} (${link.title ? link.title + ': ' : ''}${link.href})`)
        .join('\n')
      
      const header = `Found ${seen.size} unique links:\n\n`
      return toolSuccess(header + formattedLinks)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
