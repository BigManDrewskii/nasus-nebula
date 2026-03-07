import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for replacing an exact string in a workspace file.
 * Safer than write_file for small edits.
 * Falls back to normalized whitespace matching if exact match fails.
 */
export class PatchFileTool extends BaseTool {
  readonly name = 'patch_file'
  readonly description =
    "Replace a string in a workspace file. PREFER edit_file (line-number based) over patch_file for modifications — it is more reliable. Only use patch_file when you know the exact content after reading the file first with read_file. If patch_file fails once, switch to edit_file immediately — do NOT retry patch_file."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path relative to workspace root (e.g. "index.html" or "src/app.ts"). Do not prefix with /workspace.' },
      old_str: { type: 'string', description: 'String to find (must be unique in the file). Read the file first to get the exact content.' },
      new_str: { type: 'string', description: 'Replacement string.' },
    },
    required: ['path', 'old_str', 'new_str'],
  }

    async execute(args: Record<string, unknown>): Promise<ToolResult> {
      const rawPath = args.path as string
      const oldStr = args.old_str as string
      const newStr = args.new_str as string

      if (!rawPath || !oldStr || newStr === undefined) {
        return toolFailure('path, old_str, and new_str are required')
      }

      const path = rawPath
        .replace(/^\/workspace\/?/, '')
        .replace(/^\.\//, '')
        .replace(/^\//, '')

      try {
        const taskId = (args as any).__taskId || 'initial'
        const rawContent = await workspaceManager.readFile(taskId, path)

      // ── Attempt 1: exact match ──────────────────────────────────────────────
      if (rawContent.includes(oldStr)) {
        return this.applyPatch(taskId, path, rawContent, oldStr, newStr, 'exact')
      }

      // ── Attempt 2: CRLF-normalized match ───────────────────────────────────
      const normContent = rawContent.replace(/\r\n/g, '\n').replace(/\t/g, '  ')
      const normSearch  = oldStr.replace(/\r\n/g, '\n').replace(/\t/g, '  ')

      if (normContent.includes(normSearch)) {
        return this.applyPatch(taskId, path, normContent, normSearch, newStr, 'normalized')
      }

      // ── Attempt 3: trim-each-line match ────────────────────────────────────
      const trimmedContentLines = normContent.split('\n').map(l => l.trimEnd())
      const trimmedSearchLines  = normSearch.split('\n').map(l => l.trimEnd())
      const trimmedContent = trimmedContentLines.join('\n')
      const trimmedSearch  = trimmedSearchLines.join('\n')

      if (trimmedContent.includes(trimmedSearch)) {
        return this.applyPatch(taskId, path, trimmedContent, trimmedSearch, newStr, 'trimmed')
      }

      // ── All attempts failed ─────────────────────────────────────────────────
      return toolFailure(
        `patch_file failed: old_str not found in "${path}" (tried exact, CRLF-normalized, and trimmed matching).\n` +
        `Use read_file to see the exact file content, then use edit_file with line numbers instead of patch_file.\n` +
        `edit_file is more reliable and does not require exact string matching.`
      )
    } catch (error) {
      return toolFailure(`Failed to patch file: ${error}`)
    }
  }

  private async applyPatch(
    taskId: string,
    path: string,
    content: string,
    searchStr: string,
    replaceStr: string,
    matchType: string,
  ): Promise<ToolResult> {
    // Ensure the search string is unique
    const firstIdx = content.indexOf(searchStr)
    const lastIdx  = content.lastIndexOf(searchStr)
    if (firstIdx !== lastIdx) {
      const matchCount = content.split(searchStr).length - 1
      return toolFailure(
        `old_str appears ${matchCount} times in ${path}. It must be unique. ` +
        `Add more surrounding context to old_str to make it unambiguous.`
      )
    }

    const patched = content.replace(searchStr, replaceStr)
    await workspaceManager.writeFile(taskId, path, patched)

    const note = matchType !== 'exact' ? ` (matched via ${matchType} normalization)` : ''
    return toolSuccess(`File patched: ${path}${note}`)
  }
}
