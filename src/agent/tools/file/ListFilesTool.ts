import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for listing files and directories in the workspace.
 */
export class ListFilesTool extends BaseTool {
  readonly name = 'list_files'
  readonly description = 'List files and directories in the workspace.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path (default: /workspace).', default: '/workspace' },
      recursive: { type: 'boolean', description: 'List recursively (default false).', default: false },
    },
  }

    async execute(args: Record<string, unknown>): Promise<ToolResult> {
      const rawPath = (args.path as string) || '/workspace'

      try {
        const taskId = (args.__taskId as string | undefined) || 'initial'
        const files = await workspaceManager.listFiles(taskId)

        // Normalize the requested path: strip /workspace/ prefix since workspace_list
        // returns paths relative to task-{id}/ (e.g. "src/app.ts", not "/workspace/src/app.ts")
        const normalizedFilter = rawPath
          .replace(/^\/workspace\/?/, '')
          .replace(/^\.\//, '')
          .replace(/^\//, '')

        // Filter by subdirectory if a sub-path was requested
        let filtered = files
        if (normalizedFilter) {
          const prefix = normalizedFilter.endsWith('/') ? normalizedFilter : normalizedFilter + '/'
          filtered = files.filter(f => f.path === normalizedFilter || f.path.startsWith(prefix))
        }

        if (filtered.length === 0) {
          // Distinguish between "root workspace is empty" vs "subdirectory not found"
          if (!normalizedFilter) {
            return toolSuccess('Workspace is empty. No files have been created yet. Proceed to create files with write_file.')
          }
          return toolSuccess(`No files found in "${normalizedFilter}". The directory may not exist yet — use write_file to create files there.`)
        }

        // Show full relative paths so the agent knows where to read/write
        const output = filtered.map(f => f.path).join('\n')
        return toolSuccess(output)
      } catch (error) {
        return toolFailure(`Failed to list files: ${error}`)
      }
    }
}
