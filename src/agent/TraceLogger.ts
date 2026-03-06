/**
 * TraceLogger — Non-blocking observability for agent tool calls.
 *
 * Persists each tool call, result, and error to the `trace_steps` table in
 * nasus.db via the Tauri `db_append_trace` command. All writes are fire-and-
 * forget to avoid blocking the agent loop.
 *
 * Usage:
 *   const trace = new TraceLogger(taskId, messageId)
 *   const span = trace.startToolCall('bash', { command: '...' })
 *   const result = await executeTool(...)
 *   span.end(result.output, result.isError)
 */

import { dbAppendTrace, type DbTraceStep } from '../tauri'

export class TraceSpan {
  private startMs: number
  private closed = false
  readonly id: string
  private readonly toolName: string
  private readonly inputJson: string
  private readonly logger: TraceLogger

  constructor(
    logger: TraceLogger,
    id: string,
    toolName: string,
    inputJson: string,
  ) {
    this.logger = logger
    this.id = id
    this.toolName = toolName
    this.inputJson = inputJson
    this.startMs = Date.now()
  }

  end(outputText?: string, isError = false): void {
    if (this.closed) return
    this.closed = true
    const durationMs = Date.now() - this.startMs
    this.logger._flush({
      id: this.id,
      taskId: this.logger.taskId,
      messageId: this.logger.messageId,
      stepKind: 'tool_result',
      toolName: this.toolName,
      inputJson: this.inputJson,
      outputText: outputText?.slice(0, 4000) ?? null,
      isError,
      durationMs,
      timestamp: this.startMs,
    })
  }
}

export class TraceLogger {
  readonly taskId: string
  readonly messageId: string

  constructor(taskId: string, messageId: string) {
    this.taskId = taskId
    this.messageId = messageId
  }

  /** Record a planning/thinking step (no tool). */
  recordThinking(content: string): void {
    this._flush({
      id: crypto.randomUUID(),
      taskId: this.taskId,
      messageId: this.messageId,
      stepKind: 'thinking',
      toolName: null,
      inputJson: null,
      outputText: content.slice(0, 2000),
      isError: false,
      durationMs: null,
      timestamp: Date.now(),
    })
  }

  /** Start a tool-call span. Call `.end()` when the tool returns. */
  startToolCall(toolName: string, input: unknown): TraceSpan {
    const id = crypto.randomUUID()
    const inputJson = JSON.stringify(input).slice(0, 2000)

    // Log the call start immediately
    this._flush({
      id: `${id}-call`,
      taskId: this.taskId,
      messageId: this.messageId,
      stepKind: 'tool_call',
      toolName,
      inputJson,
      outputText: null,
      isError: false,
      durationMs: null,
      timestamp: Date.now(),
    })

    return new TraceSpan(this, id, toolName, inputJson)
  }

  /** Internal: fire-and-forget write to SQLite. */
  _flush(step: DbTraceStep): void {
    // Non-blocking; swallow errors to never affect the agent loop
    dbAppendTrace(step).catch(() => {})
  }
}
