import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolParameterSchema, BrowserResult } from '../core/ToolResult'
import { browserAct } from '../../browserBridge'

export class BrowserActTool extends BaseTool {
  readonly name = 'browser_act'
  readonly description =
    `Perform a browser action using a natural language instruction. ` +
    `Use this instead of browser_click or browser_type when you don't have a reliable CSS selector, ` +
    `when the page structure is complex, or when a previous selector-based click has failed. ` +
    `Examples: "click the Sign In button", "type 'hello@example.com' into the email field", ` +
    `"select the first search result", "close the cookie banner". ` +
    `Requires OPENAI_API_KEY or ANTHROPIC_API_KEY to be set in agent environment.`

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      instruction: {
        type: 'string',
        description: 'Natural language description of the action to perform',
      },
    },
    required: ['instruction'],
  }

  async execute(args: Record<string, unknown>): Promise<BrowserResult> {
    const instruction = args.instruction as string
    if (!instruction) {
      return toolFailure('Missing instruction') as BrowserResult
    }
    try {
      const result = await browserAct(instruction)
      return toolSuccess(JSON.stringify(result)) as BrowserResult
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err)) as BrowserResult
    }
  }
}
