import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { executePython } from '../../sandboxRuntime'
import type { ExecutionConfig } from '../../sandboxRuntime'

/**
 * Tool for executing Python code in a sandbox.
 */
export class PythonExecuteTool extends BaseTool {
  private executionConfig?: ExecutionConfig

  readonly name = 'python_execute'
  readonly description =
    'Execute Python code in a sandbox. When a cloud sandbox (E2B) is configured this runs in a full Linux environment with all packages available — use pip install via bash_execute first if needed. Otherwise falls back to Pyodide (WebAssembly) in the browser. Use for data analysis, math, parsing, text processing, charts (matplotlib), and computation. stdout/stderr are captured and returned.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'Python source code to execute. Use print() to produce output.',
      },
    },
    required: ['code'],
  }

  setExecutionConfig(config: ExecutionConfig): void {
    this.executionConfig = config
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const code = args.code as string

    if (!code?.trim()) {
      return toolFailure('Missing code')
    }

    const cfg: ExecutionConfig = this.executionConfig || { executionMode: 'disabled' }
    const result = await executePython(code, cfg)

    return result.isError ? toolFailure(result.output) : toolSuccess(result.output)
  }
}
