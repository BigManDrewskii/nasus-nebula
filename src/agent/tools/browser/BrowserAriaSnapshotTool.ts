import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { tauriInvoke } from '../../../tauri'
import type { AriaSnapshotResult } from '../../../tauri'
import { getTauriSessionId } from '../../browserBridge'

/**
 * Capture the ARIA accessibility tree of the current page as YAML.
 *
 * Uses Playwright v1.49+ locator.ariaSnapshot() — the replacement for the
 * removed page.accessibility.snapshot() API. Returns a YAML string that is
 * optimised for LLM consumption (same format used by @playwright/mcp).
 */
export class BrowserAriaSnapshotTool extends BaseTool {
  readonly name = 'browser_aria_snapshot'
  readonly description =
    'Capture the ARIA accessibility tree of the current browser page as YAML. ' +
    'Returns semantic roles, names, and attributes (headings, buttons, links, inputs, etc.) ' +
    'without visual noise. Use this to understand page structure before deciding where to click or type.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      selector: { type: 'string', description: 'CSS selector to snapshot (default: full page body).' },
    },
    required: [],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const selector = args.selector ? String(args.selector) : undefined

    try {
      const sessionId = await getTauriSessionId()
      const result = await tauriInvoke<AriaSnapshotResult>('browser_aria_snapshot', {
        session_id: sessionId,
        selector,
      })
      if (!result) return toolFailure('No response from sidecar')

      const output = [
        `### Page State`,
        `- URL: ${result.url}`,
        `- Title: ${result.title}`,
        ``,
        `### Accessibility Tree`,
        result.snapshot,
      ].join('\n')

      return toolSuccess(output)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
