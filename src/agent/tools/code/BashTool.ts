import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for simple shell commands in browser mode.
 * Only cat, ls, echo, mkdir, cp, mv, rm, pwd work.
 */
export class BashTool extends BaseTool {
  readonly name = 'bash'
  readonly description =
    'Run a simple shell command. ONLY these commands work: cat, ls, echo, mkdir, cp, mv, rm, pwd. THESE ALWAYS FAIL AND MUST NEVER BE USED: npm, node, npx, pip, python, python3, curl, wget, git, apt, apt-get, brew, yarn, pnpm, bun. For web/code tasks, use write_file instead of npm/npx. For network, use http_fetch. For Python, use python_execute.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: "Simple shell command (cat/ls/echo/mkdir only — NO npm/node/npx/pip/python/curl).",
      },
      timeout_secs: { type: 'integer', description: 'Max seconds (default 30).', default: 30 },
    },
    required: ['command'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const cmd = String(args.command ?? '')
    const taskId = (args as any).__taskId || 'initial'

    // Base64 write pattern (used by some agents)
    const b64WriteMatch = cmd.match(/echo\s+'([A-Za-z0-9+/=\s]+)'\s*\|\s*base64\s+-d\s*>\s*(\S+)/)
    if (b64WriteMatch) {
      try {
        const decoded = atob(b64WriteMatch[1].replace(/\s/g, ''))
        const path = this.normalizePath(b64WriteMatch[2])
        await workspaceManager.writeFile(taskId, path, decoded)
        return toolSuccess(`written: ${b64WriteMatch[2]}`)
      } catch { /* fall through */ }
    }

    // cat command - read file
    const catMatch = cmd.match(/^cat\s+'?([^'>\s]+)'?\s*(?:2>&1)?$/)
    if (catMatch) {
      const path = this.normalizePath(catMatch[1])
      try {
        const content = await workspaceManager.readFile(taskId, path)
        return toolSuccess(content)
      } catch {
        return toolFailure(`cat: ${catMatch[1]}: No such file`)
      }
    }

    // ls command - list files
    if (cmd.trim().startsWith('ls') || cmd.trim().startsWith('find')) {
      const files = await workspaceManager.listFiles(taskId)
      const output = files.length
        ? files.map((f) => `/workspace/${f.path}`).join('\n')
        : '(empty workspace)'
      return toolSuccess(output)
    }

    // mkdir command - no-op (directories are auto-created)
    if (cmd.trim().startsWith('mkdir')) {
      return toolSuccess('(directory created)')
    }

    // echo command
    const echoMatch = cmd.match(/^echo\s+(.+)$/)
    if (echoMatch) {
      return toolSuccess(echoMatch[1].replace(/['"]/g, ''))
    }

    // Intercept forbidden commands
    if (/\bnpx\b|\bnpm\b|\bnode\b|\byarn\b|\bpnpm\b|\bbun\b/.test(cmd)) {
      return toolFailure(
        'Error: Node.js / npm / npx / node is not available in browser mode. ' +
        'Do NOT retry this command. Instead: write the file contents directly with write_file.'
      )
    }

    if (/\bpip3?\b|\bpython3?\b/.test(cmd)) {
      return toolFailure(
        'Error: pip / python is not available as a shell command in browser mode. ' +
        'Use python_execute to run Python code, or bash_execute if a cloud sandbox is configured.'
      )
    }

    if (/\bcurl\b|\bwget\b/.test(cmd)) {
      return toolFailure(
        'Error: curl / wget is not available in browser mode. ' +
        'Use http_fetch to make HTTP requests or search_web to search the internet.'
      )
    }

    if (/\bapt\b|\bapt-get\b|\bbrew\b/.test(cmd)) {
      return toolFailure(
        'Error: apt / brew package managers are not available in browser mode. ' +
        'Use bash_execute if a Docker sandbox is configured.'
      )
    }

    if (/\bgit\b/.test(cmd)) {
      return toolFailure(
        'Error: git is not available in browser mode. ' +
        'Write files directly with write_file instead.'
      )
    }

    if (/\bwhich\b/.test(cmd)) {
      return toolFailure(
        'Error: which returned nothing — no shell tools are available in browser mode. ' +
        'Use write_file for file creation, http_fetch for network, python_execute for code.'
      )
    }

    return toolFailure(
      'Error: this shell command is not available in browser mode. ' +
      'Use write_file, read_file, http_fetch, search_web, python_execute, or bash_execute instead.'
    )
  }

  private normalizePath(path: string): string {
    return path
      .replace(/^\/workspace\/?/, '')
      .replace(/^\.\/?/, '')
      || 'output.txt'
  }
}
