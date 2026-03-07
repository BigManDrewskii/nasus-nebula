import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for writing content to a file in the workspace.
 */
export class WriteFileTool extends BaseTool {
  readonly name = 'write_file'
  readonly description =
    'Write content to a file in the workspace. Use to update task_plan.md, findings.md, progress.md, or create output artifacts.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
      content: { type: 'string', description: 'Full file content to write.' },
    },
    required: ['path', 'content'],
  }

    async execute(args: Record<string, unknown>): Promise<ToolResult> {
      const rawPath = args.path as string
      const content = args.content as string

      if (!rawPath || content === undefined) {
        return toolFailure('path and content are required')
      }

      // Normalize path: strip /workspace/ prefix (Rust already scopes to task-{id}/)
      // so /workspace/foo.html → foo.html, not task-{id}/workspace/foo.html
      const path = rawPath
        .replace(/^\/workspace\/?/, '')
        .replace(/^\.\//, '')
        .replace(/^\//, '')

      try {
        const taskId = (args as any).__taskId || 'initial'
        await workspaceManager.writeFile(taskId, path, content)
        return toolSuccess(`File written: ${path}`)
      } catch (error) {
        return toolFailure(`Failed to write file: ${error}`)
      }
    }
}
