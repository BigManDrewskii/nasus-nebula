import { useEffect, useRef, useState, useCallback } from 'react'
import { tauriInvoke, tauriListen } from '../tauri'
import type { Task, Message, AgentStep, LlmMessage } from '../types'
import { useAppStore } from '../store'
import { ChatMessage } from './ChatMessage'
import { UserInputArea } from './UserInputArea'
import { ActionChips } from './ActionChips'
import { MemoryViewer } from './MemoryViewer'
import { Pxi } from './Pxi'

interface ChatViewProps {
  task: Task | null
  onNewTask: () => void
  onOpenSettings: () => void
}

interface AgentEventPayload {
  kind:
    | 'thinking'
    | 'tool_call'
    | 'tool_result'
    | 'stream_chunk'
    | 'done'
    | 'error'
    | 'strike_escalation'
    | 'context_compressed'
    | 'iteration_tick'
    | 'token_usage'
    | 'auto_title'
    | 'raw_messages'
  task_id: string
  message_id: string
  content?: string
  error?: string
  call_id?: string
  tool?: string
  input?: Record<string, unknown>
  output?: string
  is_error?: boolean
  delta?: string
  done?: boolean
  attempts?: string[]
  removed_count?: number
  iteration?: number
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  title?: string
  messages?: LlmMessage[]
}

export function ChatView({ task, onNewTask, onOpenSettings }: ChatViewProps) {
  const {
    getMessages,
    getRawHistory,
    addMessage,
    appendChunk,
    setStreaming,
    setError,
    addStep,
    updateStep,
    appendRawHistory,
    updateTaskTitle,
    updateTaskStatus,
    apiKey,
    model,
    workspacePath,
    apiBase,
    provider,
    setWorkspacePath,
    setApiKey,
    setModel,
    setApiBase,
    setProvider,
  } = useAppStore()

  // ── Cost estimation ──────────────────────────────────────────────────────────
  // Approximate blended (prompt+completion) $/token for common OpenRouter models.
  // Uses total_tokens as a proxy — good enough for a "this task cost ~$X" indicator.
  function estimateCost(m: string, tokens: number): string {
    const ratesPerMillion: Record<string, number> = {
      'anthropic/claude-3.5-sonnet': 9,
      'anthropic/claude-3.7-sonnet': 9,
      'anthropic/claude-3-haiku': 1.25,
      'openai/gpt-4o': 7.5,
      'openai/gpt-4o-mini': 0.3,
      'google/gemini-2.0-flash-001': 0.2,
      'google/gemini-2.5-pro-exp-03-25': 7,
      'meta-llama/llama-3.3-70b-instruct': 0.6,
      'deepseek/deepseek-r1': 2,
    }
    const rate = ratesPerMillion[m] ?? 5
    const cost = (tokens / 1_000_000) * rate
    if (cost < 0.001) return '<$0.001'
    if (cost < 0.01) return `$${cost.toFixed(4)}`
    return `$${cost.toFixed(3)}`
  }

  const [iteration, setIteration] = useState(0)
  const [tokenCount, setTokenCount] = useState(0)
  const [sandboxStatus, setSandboxStatus] = useState<'idle' | 'starting' | 'ready' | 'stopped'>('idle')
  const [showMemory, setShowMemory] = useState(false)

  // Keep a ref to the latest config values so runAgent never captures a stale closure.
  const configRef = useRef({ apiKey, model, workspacePath, apiBase, provider })
  useEffect(() => {
    configRef.current = { apiKey, model, workspacePath, apiBase, provider }
  })

  useEffect(() => {
    tauriInvoke<{ api_key: string; model: string; workspace_path: string; api_base: string; provider: string }>('get_config')
      .then((cfg) => {
        // Always sync from the persisted config — overrides stale Zustand state
        // (handles the case where the user edited config.json outside the app).
        if (cfg.workspace_path) setWorkspacePath(cfg.workspace_path)
        if (cfg.api_key) setApiKey(cfg.api_key)
        if (cfg.model) setModel(cfg.model)
        if (cfg.api_base) setApiBase(cfg.api_base)
        if (cfg.provider) setProvider(cfg.provider)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const messages = task ? getMessages(task.id) : []
  const lastMsg = messages[messages.length - 1]
  const isThinking = task != null && lastMsg?.author === 'user'
  const isStreaming = task != null && lastMsg?.author === 'agent' && lastMsg?.streaming === true
  const isActive = isThinking || isStreaming

  const bottomRef = useRef<HTMLDivElement>(null)
  const runningRef = useRef<boolean>(false)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    setIteration(0)
    setTokenCount(0)
    setSandboxStatus('idle')
  }, [task?.id])

  useEffect(() => {
    if (!task) return
    let active = true
    const cleanups: Array<() => void> = []

    tauriListen<AgentEventPayload>('agent-event', (payload) => {
      if (!active || payload.task_id !== task.id) return

      switch (payload.kind) {
        case 'thinking': {
          const content = payload.content ?? ''
          if (content.includes('Starting sandbox') || content.includes('Pulling image')) {
            setSandboxStatus('starting')
          } else if (content.includes('Sandbox ready') || content.includes('ready')) {
            setSandboxStatus('ready')
          }
          const step: AgentStep = { kind: 'thinking', content }
          addStep(task.id, payload.message_id, step)
          break
        }
        case 'tool_call': {
          const step: AgentStep = {
            kind: 'tool_call',
            tool: payload.tool ?? '',
            input: payload.input ?? {},
            callId: payload.call_id ?? '',
          }
          addStep(task.id, payload.message_id, step)
          break
        }
        case 'tool_result': {
          const step: AgentStep = {
            kind: 'tool_result',
            callId: payload.call_id ?? '',
            output: payload.output ?? '',
            isError: payload.is_error ?? false,
          }
          updateStep(task.id, payload.message_id, step)
          break
        }
        case 'stream_chunk': {
          if (!payload.done && payload.delta) {
            appendChunk(task.id, payload.message_id, payload.delta)
          }
          if (payload.done) {
            setStreaming(task.id, payload.message_id, false)
            runningRef.current = false
          }
          break
        }
        case 'done': {
          runningRef.current = false
          updateTaskStatus(task.id, 'completed')
          setStreaming(task.id, payload.message_id, false)
          setSandboxStatus('stopped')
          break
        }
        case 'error': {
          runningRef.current = false
          setError(task.id, payload.message_id, payload.error ?? 'Unknown error')
          updateTaskStatus(task.id, 'failed')
          break
        }
        case 'strike_escalation': {
          const step: AgentStep = {
            kind: 'strike_escalation',
            tool: payload.tool ?? '',
            attempts: payload.attempts ?? [],
          }
          addStep(task.id, payload.message_id, step)
          break
        }
        case 'context_compressed': {
          const step: AgentStep = {
            kind: 'context_compressed',
            removedCount: payload.removed_count ?? 0,
          }
          addStep(task.id, payload.message_id, step)
          break
        }
        case 'iteration_tick': {
          setIteration(payload.iteration ?? 0)
          break
        }
        case 'token_usage': {
          setTokenCount(payload.total_tokens ?? 0)
          break
        }
          case 'auto_title': {
            if (payload.title) {
              updateTaskTitle(task.id, payload.title)
            }
            break
          }
          case 'raw_messages': {
            // Append assistant + tool messages to rawHistory so multi-turn context is preserved
            if (payload.messages && payload.messages.length > 0) {
              appendRawHistory(task.id, payload.messages)
            }
            break
          }
        }
    }).then((fn) => cleanups.push(fn))

    return () => {
      active = false
      cleanups.forEach((fn) => fn())
    }
  }, [task?.id])

  // ── Core send logic ─────────────────────────────────────────────────────────
  // Use configRef so we always read the latest values even if get_config resolves
  // after the first render (avoiding the workspace-path race / stale-closure bug).
  const runAgent = useCallback(async (
    taskId: string,
    agentMsgId: string,
    history: LlmMessage[],
  ) => {
    const cfg = configRef.current
    const taskWorkspace = cfg.workspacePath
      ? `${cfg.workspacePath}/${taskId}`
      : `/tmp/nasus-workspace/${taskId}`
    try {
      await tauriInvoke('run_agent', {
          taskId,
          messageId: agentMsgId,
          userMessages: history,
          apiKey: cfg.apiKey || '',
          model: cfg.model || 'anthropic/claude-3.5-sonnet',
          workspacePath: taskWorkspace,
          apiBase: cfg.apiBase || 'https://openrouter.ai/api/v1',
          provider: cfg.provider || 'openrouter',
        })
      } catch (err) {
        setError(taskId, agentMsgId, `Failed to start agent: ${err}`)
        runningRef.current = false
      }
    }, [setError]) // configRef is stable — no need to list individual config values

  async function handleSend(content: string) {
    if (!task || runningRef.current) return

    if (messages.length === 1) {
      updateTaskTitle(task.id, content.slice(0, 60))
    }

    const userMsg: Message = {
      id: crypto.randomUUID(),
      author: 'user',
      content,
      timestamp: new Date(),
    }
    addMessage(task.id, userMsg)

    // Build on top of the persisted raw history (includes all past tool calls/results)
    const existingRaw = getRawHistory(task.id)
    const newUserMsg: LlmMessage = { role: 'user', content }
    const history = [...existingRaw, newUserMsg]
    appendRawHistory(task.id, [newUserMsg])

    const agentMsgId = crypto.randomUUID()
    const agentMsg: Message = {
      id: agentMsgId,
      author: 'agent',
      content: '',
      timestamp: new Date(),
      steps: [],
      streaming: true,
    }
    addMessage(task.id, agentMsg)
    runningRef.current = true
    setIteration(0)
    setTokenCount(0)
    setSandboxStatus('starting')
    updateTaskStatus(task.id, 'in_progress')

    await runAgent(task.id, agentMsgId, history)
  }

  // Retry: re-run the last failed agent message using same history
  async function handleRetry(failedMsgId: string) {
    if (!task || runningRef.current) return
    const history = getRawHistory(task.id)
    if (history.length === 0) return

    // Clear the error state on the failed message and re-enable streaming
    setError(task.id, failedMsgId, '')
    setStreaming(task.id, failedMsgId, true)
    runningRef.current = true
    setIteration(0)
    setTokenCount(0)
    setSandboxStatus('starting')
    updateTaskStatus(task.id, 'in_progress')

    await runAgent(task.id, failedMsgId, history)
  }

  async function handleStop() {
    if (!task) return
    try {
      await tauriInvoke('stop_agent', { taskId: task.id })
    } catch { /* best-effort */ }
    runningRef.current = false
    updateTaskStatus(task.id, 'failed')
  }

  function handleResume(progressContent: string) {
    setShowMemory(false)
    const resumePrompt = `[Session Resume]\nPlease read your memory files (task_plan.md, findings.md, progress.md) and continue from where you left off. Here is the last progress log:\n\n${progressContent.slice(-2000)}`
    handleSend(resumePrompt)
  }

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'n') { e.preventDefault(); onNewTask() }
      if (mod && e.key === ',') { e.preventDefault(); onOpenSettings() }
      if (e.key === 'Escape' && isActive) { e.preventDefault(); handleStop() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isActive, onNewTask, onOpenSettings])

  const isFirstMessage = messages.length === 1
  const showEmptyState = isFirstMessage && !isActive

  // ── No task selected ─────────────────────────────────────────────────────────
  if (!task) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: '#0d0d0d' }}>
        <div className="flex flex-col items-center gap-3 text-center px-8 max-w-xs">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 0 0 1px rgba(37,99,235,0.25), 0 4px 16px rgba(37,99,235,0.15)',
            }}
          >
            <span className="text-white font-bold text-base">N</span>
          </div>
          <p className="text-[13px] leading-relaxed" style={{ color: '#444' }}>
            Select a task or create a new one
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d0d0d' }}>
      {/* Memory viewer */}
      {showMemory && (
        <MemoryViewer
          taskId={task.id}
          workspacePath={workspacePath ? `${workspacePath}/${task.id}` : `/tmp/nasus-workspace/${task.id}`}
          onResume={handleResume}
          onClose={() => setShowMemory(false)}
        />
      )}

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d' }}
      >
        {/* Left: title + live counters */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <h2 className="text-[13px] font-medium truncate" style={{ color: '#c0c0c0' }}>
            {task.title}
          </h2>
          {isActive && iteration > 0 && (
            <span className="flex items-center gap-1 flex-shrink-0">
              <Pxi name="refresh" size={9} style={{ color: '#555' }} />
              <span className="text-[10px] font-mono" style={{ color: '#555' }}>{iteration}</span>
            </span>
          )}
          {tokenCount > 0 && (
            <span className="text-[10px] font-mono flex-shrink-0" style={{ color: '#555' }}>
              {(tokenCount / 1000).toFixed(1)}k · {estimateCost(model, tokenCount)}
            </span>
          )}
        </div>

        {/* Right: sandbox pill + memory + stop/status */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {(isActive || sandboxStatus === 'ready') && sandboxStatus !== 'idle' && (
            <SandboxPill status={sandboxStatus} />
          )}

          {/* Memory button */}
          <button
            onClick={() => setShowMemory(true)}
            title="View agent memory files"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
            style={{ color: '#555' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#999' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#555' }}
          >
            <Pxi name="bookmark" size={11} />
            <span className="text-[11px]">memory</span>
          </button>

          {/* Stop — only when running */}
          {isActive && (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.14)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
              }}
            >
              <Pxi name="times-circle" size={11} />
              Stop
            </button>
          )}

          {/* Status — only when idle */}
          {!isActive && <StatusDot status={task.status} />}
        </div>
      </header>

      {/* Empty state — centred hero when no messages yet */}
      {showEmptyState ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-lg flex flex-col items-center gap-7">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-xl shadow-blue-500/25">
                <span className="text-white font-bold text-base">N</span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-neutral-200">What would you like to accomplish?</h3>
                <p className="text-[13px] text-neutral-600 mt-1 max-w-sm leading-relaxed">
                  Autonomous agent with a real sandbox — browses the web, writes &amp; runs code, manages files.
                </p>
              </div>
            </div>
            <ActionChips onSelect={handleSend} centered />
            <div className="w-full">
              <UserInputArea onSend={handleSend} disabled={false} autoFocus />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Message list */}
          <div className="flex-1 overflow-y-auto" id="message-list">
            <div className="max-w-[780px] mx-auto px-5 py-6 flex flex-col gap-5">
              {messages.slice(1).map((msg, i) => (
                <div key={msg.id} className="msg-in" style={{ animationDelay: `${Math.min(i * 20, 80)}ms` }}>
                  <ChatMessage
                    message={msg}
                    onRetry={msg.error ? () => handleRetry(msg.id) : undefined}
                  />
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 px-5 pb-5 pt-1">
            <div className="max-w-[780px] mx-auto">
              <UserInputArea onSend={handleSend} disabled={isActive} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Status dot (header) ──────────────────────────────────────────────────────

function StatusDot({ status }: { status: Task['status'] }) {
  if (status === 'pending') return null
  if (status === 'completed') {
    return (
      <div className="flex items-center gap-1.5">
        <Pxi name="check-circle" size={11} style={{ color: '#34d399' }} />
        <span className="text-[11px]" style={{ color: '#555' }}>Done</span>
      </div>
    )
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5">
        <Pxi name="times-circle" size={11} style={{ color: '#f87171' }} />
        <span className="text-[11px]" style={{ color: '#555' }}>Stopped</span>
      </div>
    )
  }
  if (status === 'in_progress') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[11px]" style={{ color: '#555' }}>Running</span>
      </div>
    )
  }
  return null
}

// ─── Sandbox pill ─────────────────────────────────────────────────────────────

function SandboxPill({ status }: { status: 'idle' | 'starting' | 'ready' | 'stopped' }) {
  if (status === 'idle') return null

  const cfg = {
    starting: { icon: 'circle-notch', label: 'Starting', color: '#b45309' },
    ready:    { icon: 'check-circle', label: 'Sandbox ready', color: '#059669' },
    stopped:  { icon: 'times-circle', label: 'Stopped', color: '#555' },
  }[status]

  if (!cfg) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
    >
      <Pxi name={cfg.icon} size={10} style={{ color: cfg.color }} />
      <span className="text-[10px]" style={{ color: cfg.color }}>{cfg.label}</span>
    </div>
  )
}
