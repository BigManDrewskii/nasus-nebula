import { useEffect, useRef, useState } from 'react'
import { tauriInvoke, tauriListen } from '../tauri'
import type { Task, Message, AgentStep } from '../types'
import { useAppStore } from '../store'
import { ChatMessage } from './ChatMessage'
import { UserInputArea } from './UserInputArea'
import { ActionChips } from './ActionChips'
import { MemoryViewer } from './MemoryViewer'
import { Pxi } from './Pxi'

interface ChatViewProps {
  task: Task | null
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
}

export function ChatView({ task }: ChatViewProps) {
  const {
    getMessages,
    addMessage,
    appendChunk,
    setStreaming,
    addStep,
    updateStep,
    updateTaskTitle,
    updateTaskStatus,
    apiKey,
    model,
    workspacePath,
    setWorkspacePath,
  } = useAppStore()

  const [iteration, setIteration] = useState(0)
  const [tokenCount, setTokenCount] = useState(0)
  const [sandboxStatus, setSandboxStatus] = useState<'idle' | 'starting' | 'ready' | 'stopped'>('idle')
  const [showMemory, setShowMemory] = useState(false)

  useEffect(() => {
    if (!workspacePath) {
      tauriInvoke<{ api_key: string; model: string; workspace_path: string }>('get_config')
        .then((cfg) => { if (cfg.workspace_path) setWorkspacePath(cfg.workspace_path) })
        .catch(() => {})
    }
  }, [])

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
          appendChunk(task.id, payload.message_id, `\n\n_Error: ${payload.error}_`)
          setStreaming(task.id, payload.message_id, false)
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
      }
    }).then((fn) => cleanups.push(fn))

    return () => {
      active = false
      cleanups.forEach((fn) => fn())
    }
  }, [task?.id])

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

    const history = [...messages.slice(1), userMsg].map((m) => ({
      role: m.author === 'user' ? 'user' : 'assistant',
      content: m.content,
    }))

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

    try {
      const taskWorkspace = workspacePath
        ? `${workspacePath}/${task.id}`
        : `/tmp/nasus-workspace/${task.id}`
      await tauriInvoke('run_agent', {
        taskId: task.id,
        messageId: agentMsgId,
        userMessages: history,
        apiKey: apiKey || '',
        model: model || 'anthropic/claude-3.5-sonnet',
        workspacePath: taskWorkspace,
      })
    } catch (err) {
      appendChunk(task.id, agentMsgId, `_Failed to start agent: ${err}_`)
      runningRef.current = false
    }
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

  const isFirstMessage = messages.length === 1
  const showEmptyState = isFirstMessage && !isActive

  // ── No task selected ──────────────────────────────────────────────────────
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
              <Pxi name="refresh" size={9} style={{ color: '#333' }} />
              <span className="text-[10px] font-mono" style={{ color: '#333' }}>{iteration}</span>
            </span>
          )}
          {isActive && tokenCount > 0 && (
            <span className="text-[10px] font-mono flex-shrink-0" style={{ color: '#2e2e2e' }}>
              {(tokenCount / 1000).toFixed(1)}k
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
            style={{ color: '#333' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#777' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#333' }}
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
                {/* Skip the welcome message (index 0) — shown as empty state instead */}
                {messages.slice(1).map((msg, i) => (
                  <div key={msg.id} className="msg-in" style={{ animationDelay: `${Math.min(i * 20, 80)}ms` }}>
                    <ChatMessage message={msg} />
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
        <span className="text-[11px]" style={{ color: '#2e2e2e' }}>Done</span>
      </div>
    )
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5">
        <Pxi name="times-circle" size={11} style={{ color: '#f87171' }} />
        <span className="text-[11px]" style={{ color: '#2e2e2e' }}>Stopped</span>
      </div>
    )
  }
  if (status === 'in_progress') {
    return (
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
        <span className="text-[11px]" style={{ color: '#2e2e2e' }}>Running</span>
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
    stopped:  { icon: 'times-circle', label: 'Stopped', color: '#333' },
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
