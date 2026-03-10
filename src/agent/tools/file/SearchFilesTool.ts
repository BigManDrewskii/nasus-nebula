import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for searching for a pattern across all files in the workspace (grep).
 */
export class SearchFilesTool extends BaseTool {
  readonly name = 'search_files'
  readonly description = "Search for a pattern across all files in the workspace (grep). Returns matching lines with file paths and line numbers."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      pattern: { type: 'string', description: 'Regex pattern or literal string to search for.' },
      path: { type: 'string', description: 'Subdirectory to search in (relative to /workspace).' },
      glob: { type: 'string', description: 'Optional glob pattern to filter files (e.g. "*.ts").' },
    },
    required: ['pattern'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const patternStr = args.pattern as string
    const subPath = args.path as string || ''
    const glob = args.glob as string
    
    const taskId = (args.__taskId as string | undefined) || 'initial'

    try {
      const files = await workspaceManager.listFiles(taskId)
      const results: string[] = []
      
      let regex: RegExp
      try {
        regex = new RegExp(patternStr, 'i')
      } catch (_e) {
        // Fallback to literal search if regex is invalid
        const escaped = patternStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        regex = new RegExp(escaped, 'i')
      }

      const EXCLUDED_DIRS = ['node_modules', '.git', 'dist', 'build', '.next', 'out', 'target', 'vendor']

      for (const file of files) {
        // Skip excluded directories
        if (EXCLUDED_DIRS.some(dir => file.path.split('/').includes(dir))) continue

        // Filter by subdirectory if provided
        if (subPath && !file.path.startsWith(subPath)) continue
        
        // Filter by glob if provided (simple implementation)
        if (glob) {
          const globRegex = new RegExp('^' + glob.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$')
          if (!globRegex.test(file.filename)) continue
        }

        // We only search text files (heuristically skip binary files or large files)
        if (file.size > 1_000_000) continue // 1MB limit for safety

        const content = await workspaceManager.readFile(taskId, file.path)
        const lines = content.split('\n')
        
        lines.forEach((line, i) => {
          if (regex.test(line)) {
            results.push(`${file.path}:${i + 1}: ${line.trim()}`)
          }
        })
      }

      if (results.length === 0) {
        return toolSuccess('No matches found.')
      }

      // Limit results to avoid bloating context
      const limit = 100
      const truncated = results.slice(0, limit)
      let output = truncated.join('\n')
      if (results.length > limit) {
        output += `\n\n[... truncated ${results.length - limit} more matches]`
      }

      return toolSuccess(output)
    } catch (error) {
      return toolFailure(`Search failed: ${error}`)
    }
  }
}
