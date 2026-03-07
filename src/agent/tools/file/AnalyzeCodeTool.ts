import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'
import { analyzeCode, getLanguageForFile } from '../../AstAnalyzer'

/**
 * Analyse the AST structure of a source file using Tree-sitter.
 * Returns a structural summary: classes, functions, imports, complexity.
 */
export class AnalyzeCodeTool extends BaseTool {
  readonly name = 'analyze_code'
  readonly description =
    'Analyse the structure of a source code file using AST parsing. Returns functions, classes, imports, dependencies, and complexity metrics. Useful before editing to understand code layout.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Path to the source file (relative to workspace or absolute).',
      },
    },
    required: ['path'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const path = args.path as string
    if (!path) return toolFailure('path is required')

    const filename = path.split('/').pop() ?? path
    const lang = getLanguageForFile(filename)
    if (!lang) {
      return toolFailure(
        `Unsupported language for file: ${filename}. Supported extensions: .js, .jsx, .ts, .tsx, .py, .rs, .go, .java, .cpp, .c`,
      )
    }

    try {
      const taskId = (args.__taskId as string | undefined) || 'initial'
      const source = await workspaceManager.readFile(taskId, path)
      if (!source) return toolFailure(`File not found or empty: ${path}`)

      const analysis = await analyzeCode(source, filename)

      const output = [
        analysis.summary,
        analysis.errors.length ? `\nWarnings:\n${analysis.errors.map(e => `  - ${e}`).join('\n')}` : '',
      ].filter(Boolean).join('\n')

      return toolSuccess(output)
    } catch (error) {
      return toolFailure(`Failed to analyse ${path}: ${error}`)
    }
  }
}
