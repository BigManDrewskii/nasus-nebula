import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { executeBash } from '../../sandboxRuntime'
import type { ExecutionConfig } from '../../sandboxRuntime'

/**
 * Tool for executing shell commands in a cloud sandbox (E2B).
 */
export class BashExecuteTool extends BaseTool {
  private executionConfig?: ExecutionConfig

  readonly name = 'bash_execute'
  readonly description =
    'Execute a shell command in a cloud sandbox (E2B). Requires an E2B API key in Settings → Code Execution. Use for: installing packages (pip install, apt-get), running CLI tools, file operations, compiling code, running scripts. Not available in Pyodide-only mode.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'Shell command to run (bash). Examples: "pip install pandas", "python script.py", "ls /workspace".',
      },
    },
    required: ['command'],
  }

  setExecutionConfig(config: ExecutionConfig): void {
    this.executionConfig = config
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const command = args.command as string

    if (!command?.trim()) {
      return toolFailure('Missing command')
    }

    const cfg: ExecutionConfig = this.executionConfig || { executionMode: 'disabled' }
    const result = await executeBash(command, cfg)

    return result.isError ? toolFailure(result.output) : toolSuccess(result.output)
  }
}
