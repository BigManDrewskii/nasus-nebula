import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for reading file contents from the workspace.
 * Automatically parses binary formats (PDF, DOCX, CSV) to plain text.
 */
export class ReadFileTool extends BaseTool {
  readonly name = 'read_file'
  readonly description =
    "Read the contents of a file from the workspace. Supports plain text, PDF, DOCX, and CSV files. Use to check task_plan.md, findings.md, progress.md."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
    },
    required: ['path'],
  }

    async execute(args: Record<string, unknown>): Promise<ToolResult> {
      const rawPath = args.path as string

      if (!rawPath) {
        return toolFailure('path is required')
      }

      // Normalize path: strip /workspace/ prefix (Rust scopes to task-{id}/ already)
      const path = rawPath
        .replace(/^\/workspace\/?/, '')
        .replace(/^\.\//, '')
        .replace(/^\//, '')

      try {
        const taskId = (args as any).__taskId || 'initial'
        const content = await workspaceManager.readFileParsed(taskId, path)
        return toolSuccess(content)
      } catch (error) {
        return toolFailure(`Failed to read file: ${error}`)
      }
    }
}
