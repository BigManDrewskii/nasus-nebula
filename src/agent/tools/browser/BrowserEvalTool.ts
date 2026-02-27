import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolParameterSchema, EvalResult } from '../core/ToolResult'
import { browserEval } from '../../browserBridge'

/**
 * Tool for evaluating JavaScript expressions in the browser.
 */
export class BrowserEvalTool extends BaseTool {
  readonly name = 'browser_eval'
  readonly description =
    "Evaluate a JavaScript expression in the current page and return its value. Use to read page state that browser_extract cannot capture: form field values, JavaScript variables, computed styles, element counts, localStorage values, etc. Keep expressions simple and side-effect-free when possible."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      expression: {
        type: 'string',
        description: "JavaScript expression to evaluate. Examples: \"document.querySelector('input#email').value\", \"window.__APP_STATE__.user.name\", \"document.querySelectorAll('.item').length\".",
      },
      await_promise: { type: 'boolean', description: 'If the expression returns a Promise, await it before returning (default false).', default: false },
      tab_id: { type: 'number', description: 'Target tab ID (omit for current tab).' },
    },
    required: ['expression'],
  }

  async execute(args: Record<string, unknown>): Promise<EvalResult> {
    const expression = args.expression as string

    if (!expression) {
      return toolFailure('Missing expression') as EvalResult
    }

    try {
      const result = await browserEval({
        tabId: args.tab_id as number | undefined,
        expression,
        awaitPromise: Boolean(args.await_promise),
      })
      return toolSuccess({ value: result.result }) as EvalResult
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err)) as EvalResult
    }
  }
}
