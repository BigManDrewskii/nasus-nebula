import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { executeBash } from '../../sandboxRuntime'
import type { ExecutionConfig } from '../../sandboxRuntime'

/**
 * Tool for starting a dev server or static file server for preview.
 */
export class ServePreviewTool extends BaseTool {
  private executionConfig?: ExecutionConfig

  readonly name = 'serve_preview'
  readonly description =
    'Start a dev server or static file server for a project in the cloud sandbox. Returns a preview URL that renders in the Preview tab. Use this after copying a template to /workspace/project. Examples: serve_preview(command="cd /workspace/project && npm run dev", port=3000) for Next.js/Vite, or serve_preview(command="serve /workspace/project -l 3000", port=3000) for static files. Requires E2B cloud sandbox.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        description: 'The shell command to start the server. Must bind to 0.0.0.0 and the specified port.',
      },
      port: {
        type: 'integer',
        description: 'The port the server will listen on (default 3000).',
        default: 3000,
      },
    },
    required: ['command'],
  }

  setExecutionConfig(config: ExecutionConfig): void {
    this.executionConfig = config
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const command = args.command as string
    const port = (args.port as number) || 3000

    if (!command?.trim()) {
      return toolFailure('Missing command')
    }

    const cfg: ExecutionConfig = this.executionConfig || { executionMode: 'disabled' }

    if (cfg.executionMode !== 'e2b' || !cfg.e2bApiKey?.trim()) {
      return toolFailure(
        'serve_preview requires E2B cloud sandbox. Add your E2B API key in Settings → Code Execution. ' +
        'In browser-only mode, use write_file to create index.html and preview it in the Output panel instead.'
      )
    }

    try {
      // Kill any existing server on this port
      await executeBash(
        `kill $(lsof -t -i:${port} 2>/dev/null) 2>/dev/null || true`,
        cfg,
      )

      // Start server in background
      const bgCommand = `nohup sh -c ${JSON.stringify(command)} > /tmp/nasus-server-${port}.log 2>&1 &`
      await executeBash(bgCommand, cfg)

      // Poll until port responds (max 20 × 500ms = 10s)
      let ready = false
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 500))
        const check = await executeBash(
          `curl -s -o /dev/null -w '%{http_code}' http://localhost:${port}/ 2>/dev/null || echo waiting`,
          cfg,
        )
        const code = check.output.trim()
        if (code === '200' || code === '304' || code === '302' || code === '101') {
          ready = true
          break
        }
      }

      if (ready) {
        // Emit preview-ready event
        window.dispatchEvent(
          new CustomEvent('nasus:preview-ready', {
            detail: { port, url: `http://localhost:${port}` },
          }),
        )
        return toolSuccess(
          `Dev server is running on port ${port}. Preview is now live in the Preview tab.\n` +
          `URL: http://localhost:${port}\n` +
          `Edit files in the project directory — the dev server hot-reloads automatically.`
        )
      }

      // Server didn't come up — return logs
      const logs = await executeBash(
        `tail -30 /tmp/nasus-server-${port}.log 2>/dev/null || echo '(no logs)'`,
        cfg,
      )
      return toolFailure(
        `Server did not respond on port ${port} within 10 seconds.\n` +
        `Server logs:\n${logs.output.trim()}`
      )
    } catch (error) {
      return toolFailure(`serve_preview failed: ${error}`)
    }
  }
}
