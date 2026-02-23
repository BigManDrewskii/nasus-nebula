import { useEffect, useRef, useState, useCallback } from 'react'
import { tauriInvoke, tauriListen } from '../tauri'
import { runWebAgent, stopWebAgent } from '../agent/index'
import type { Task, Message, AgentStep, LlmMessage } from '../types'
import { useAppStore } from '../store'
import { ChatMessage } from './ChatMessage'
import { UserInputArea, type UserInputAreaHandle } from './UserInputArea'
import { ActionChips } from './ActionChips'
import { MemoryViewer } from './MemoryViewer'
import { NasusLogo } from './NasusLogo'
import { Pxi } from './Pxi'
import { useAttachments } from '../hooks/useAttachments'
import { DropZoneOverlay, useDragDrop } from './DropZoneOverlay'
import { getWorkspace } from '../agent/tools'
import { WorkspacePicker } from './WorkspacePicker'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

/** Resolves the per-task workspace directory consistently everywhere */
function resolveTaskWorkspace(basePath: string, taskId: string): string {
  const base = basePath.trim()
  return base ? `${base}/${taskId}` : `/tmp/nasus-workspace/${taskId}`
}

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
    braveSearchKey,
    googleCseKey,
    googleCseId,
    searchProvider,
    maxIterations,
    setWorkspacePath,
    setApiKey,
    setModel,
    setApiBase,
    setProvider,
    addRecentWorkspacePath,
  } = useAppStore()

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
    const [queuedMsg, setQueuedMsg] = useState<string | null>(null)
    // Track whether the agent is actively running (used for correct isActive state)
    const [agentRunning, setAgentRunning] = useState(false)
    // Scroll-lock: false = auto-scroll, true = user has scrolled up
    const [scrollLocked, setScrollLocked] = useState(false)
    const [showNewMsgPill, setShowNewMsgPill] = useState(false)
    const [pillVisible, setPillVisible] = useState(false) // drives opacity transition
    const [showWorkspacePicker, setShowWorkspacePicker] = useState(false)
    const [localWorkspace, setLocalWorkspace] = useState(workspacePath)

    // Attachments
    const { attachments, totalSize, isOverLimit, addFiles, removeAttachment, clearAttachments } = useAttachments()
    const { isDragOver, handlers: dragHandlers } = useDragDrop(addFiles)

  function showPill() {
    setShowNewMsgPill(true)
    requestAnimationFrame(() => setPillVisible(true))
  }
  function hidePill() {
    setPillVisible(false)
    setTimeout(() => setShowNewMsgPill(false), 200)
  }

  const configRef = useRef({ apiKey, model, workspacePath, apiBase, provider, braveSearchKey, googleCseKey, googleCseId, searchProvider, maxIterations })
  useEffect(() => {
    configRef.current = { apiKey, model, workspacePath, apiBase, provider, braveSearchKey, googleCseKey, googleCseId, searchProvider, maxIterations }
  })

  useEffect(() => {
    tauriInvoke<{ api_key: string; model: string; workspace_path: string; api_base: string; provider: string }>('get_config')
      .then((cfg) => {
        if (cfg.workspace_path) setWorkspacePath(cfg.workspace_path)
        if (cfg.api_key) setApiKey(cfg.api_key)
        if (cfg.model) setModel(cfg.model)
        if (cfg.api_base) setApiBase(cfg.api_base)
        if (cfg.provider) setProvider(cfg.provider)
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const messages = task ? getMessages(task.id) : []
  // isActive is driven by agentRunning state (set when we kick off, cleared on done/error)
  const isActive = agentRunning

  const messageListRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const runningRef = useRef<boolean>(false)
  const queuedMsgRef = useRef<string | null>(null)
  const inputRef = useRef<UserInputAreaHandle>(null)

  // ── Scroll-lock detection ───────────────────────────────────────────────────
  useEffect(() => {
    const el = messageListRef.current
    if (!el) return
    function onScroll() {
      if (!el) return
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
      // Within 80px of bottom = auto-scroll territory
      if (distFromBottom < 80) {
          setScrollLocked(false)
          hidePill()
        } else {
        setScrollLocked(true)
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [task?.id])

  // ── Auto-scroll: only follow if not locked ──────────────────────────────────
  useEffect(() => {
    if (scrollLocked && agentRunning) {
        // New message arrived while user scrolled up — show pill
        showPill()
      } else if (!scrollLocked) {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        hidePill()
      }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      setIteration(0)
      setTokenCount(0)
      setSandboxStatus('idle')
      setAgentRunning(false)
      setScrollLocked(false)
      setPillVisible(false)
      setShowNewMsgPill(false)
      queuedMsgRef.current = null
      setQueuedMsg(null)
      clearAttachments()
    }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Web-agent custom events (browser mode only) ────────────────────────────
  useEffect(() => {
    if (isTauri || !task) return
    const taskId = task.id

    function onIteration(e: Event) {
      const { taskId: tid, iteration: iter } = (e as CustomEvent).detail
      if (tid === taskId) setIteration(iter)
    }
    function onTokens(e: Event) {
      const { taskId: tid, total_tokens } = (e as CustomEvent).detail
      if (tid === taskId) setTokenCount(total_tokens)
    }

    window.addEventListener('nasus:iteration', onIteration)
    window.addEventListener('nasus:tokens', onTokens)
    return () => {
      window.removeEventListener('nasus:iteration', onIteration)
      window.removeEventListener('nasus:tokens', onTokens)
    }
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
            setAgentRunning(false)
          }
          break
        }
        case 'done': {
          runningRef.current = false
          setAgentRunning(false)
          updateTaskStatus(task.id, 'completed')
          setStreaming(task.id, payload.message_id, false)
          setSandboxStatus('stopped')
          break
        }
        case 'error': {
          runningRef.current = false
          setAgentRunning(false)
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
          if (payload.title) updateTaskTitle(task.id, payload.title)
          break
        }
        case 'raw_messages': {
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
  }, [task?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const runAgent = useCallback(async (
    taskId: string,
    agentMsgId: string,
    history: LlmMessage[],
  ) => {
    const cfg = configRef.current
      const taskWorkspace = resolveTaskWorkspace(cfg.workspacePath, taskId)
    try {
      if (isTauri) {
        await tauriInvoke('run_agent', {
          taskId,
          messageId: agentMsgId,
          userMessages: history,
          apiKey: cfg.apiKey || '',
          model: cfg.model || 'anthropic/claude-3.5-sonnet',
          workspacePath: taskWorkspace,
          apiBase: cfg.apiBase || 'https://openrouter.ai/api/v1',
          provider: cfg.provider || 'openrouter',
          searchConfig: {
            provider: cfg.searchProvider || 'auto',
            braveKey: cfg.braveSearchKey || undefined,
            googleCseKey: cfg.googleCseKey || undefined,
            googleCseId: cfg.googleCseId || undefined,
          },
        })
      } else {
        // Web mode — runWebAgent already manages its own AbortController per taskId
        // and cancels any previous run for the same task on start
        await runWebAgent({
          taskId,
          messageId: agentMsgId,
          userMessages: history,
          apiKey: cfg.apiKey || '',
          model: cfg.model || 'anthropic/claude-3.5-sonnet',
          apiBase: cfg.apiBase || 'https://openrouter.ai/api/v1',
          provider: cfg.provider || 'openrouter',
          searchConfig: {
            provider: cfg.searchProvider || 'auto',
            braveKey: cfg.braveSearchKey || undefined,
            googleCseKey: cfg.googleCseKey || undefined,
            googleCseId: cfg.googleCseId || undefined,
          },
          maxIterations: cfg.maxIterations ?? 50,
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('AbortError') && !msg.includes('Aborted')) {
        setError(taskId, agentMsgId, `Agent error: ${msg}`)
      } else {
        useAppStore.getState().updateTaskStatus(taskId, 'stopped')
        useAppStore.getState().setStreaming(taskId, agentMsgId, false)
      }
      runningRef.current = false
      setAgentRunning(false)
    }
    // Drain queued message if one arrived while running
    const queued = queuedMsgRef.current
    if (queued) {
      queuedMsgRef.current = null
      setQueuedMsg(null)
      handleSend(queued)
    }
  }, [setError]) // eslint-disable-line react-hooks/exhaustive-deps

    async function handleSend(content: string) {
      if (!task) return
      if (runningRef.current) {
        queuedMsgRef.current = content
        setQueuedMsg(content)
        return
      }
      if (messages.length <= 1) updateTaskTitle(task.id, content.slice(0, 60))

      // Snapshot and clear attachments before any async work
      const pendingAttachments = [...attachments]
      clearAttachments()

      // Build MessageAttachment array for display (strip File object, keep display fields)
      const msgAttachments = pendingAttachments.length > 0
        ? pendingAttachments.map((a) => ({
            id: a.id,
            name: a.name,
            size: a.size,
            mimeType: a.mimeType,
            category: a.category,
            previewUrl: a.previewUrl,
            base64: a.base64,
          }))
        : undefined

      const userMsg: Message = {
        id: crypto.randomUUID(),
        author: 'user',
        content,
        timestamp: new Date(),
        attachments: msgAttachments,
      }
      addMessage(task.id, userMsg)

      // ── Inject files into workspace so agent can read them with file tools ────
      if (pendingAttachments.length > 0) {
        const ws = getWorkspace(task.id)
        for (const att of pendingAttachments) {
          if (att.textContent !== null) {
            ws.set(`uploads/${att.name}`, att.textContent)
          } else if (att.base64 !== null) {
            // Store base64 image data with a data URL header so agent can reference it
            ws.set(`uploads/${att.name}`, `data:${att.mimeType};base64,${att.base64}`)
          }
        }
      }

      // ── Build LLM message — augment text with file context ────────────────────
      let llmContent: string = content

      if (pendingAttachments.length > 0) {
        const fileList = pendingAttachments.map((a) => `- uploads/${a.name} (${a.category}, ${(a.size / 1024).toFixed(0)} KB)`).join('\n')
        const textFiles = pendingAttachments.filter((a) => a.textContent !== null)

        let augmented = content || `Please analyze the attached file(s).`
        augmented += `\n\n[User attached ${pendingAttachments.length} file(s):\n${fileList}\nFiles have been saved to the uploads/ directory in your workspace. Use read_file("uploads/<filename>") to access them.]`

        // Inline small text files (under 8 KB) directly into the message for immediate context
        for (const att of textFiles) {
          if (att.textContent && att.size < 8 * 1024) {
            augmented += `\n\n--- File: ${att.name} ---\n${att.textContent}\n--- End of ${att.name} ---`
          }
        }

        llmContent = augmented
      }

      const existingRaw = getRawHistory(task.id)
      const newUserMsg: LlmMessage = { role: 'user', content: llmContent }
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
      setAgentRunning(true)
      setIteration(0)
      setTokenCount(0)
      setSandboxStatus(isTauri ? 'starting' : 'idle')
      updateTaskStatus(task.id, 'in_progress')
        // Unlock scroll and jump to bottom when a new exchange starts
        setScrollLocked(false)
        hidePill()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
      await runAgent(task.id, agentMsgId, history)
    }

  async function handleRetry(failedMsgId: string) {
    if (!task || runningRef.current) return
    const history = getRawHistory(task.id)
    if (history.length === 0) return
    setError(task.id, failedMsgId, '')
    setStreaming(task.id, failedMsgId, true)
    runningRef.current = true
    setAgentRunning(true)
    setIteration(0)
    setTokenCount(0)
    setSandboxStatus(isTauri ? 'starting' : 'idle')
    updateTaskStatus(task.id, 'in_progress')
    await runAgent(task.id, failedMsgId, history)
  }

  async function handleStop() {
    if (!task) return
    queuedMsgRef.current = null
    setQueuedMsg(null)
    if (isTauri) {
      try { await tauriInvoke('stop_agent', { taskId: task.id }) } catch { /* best-effort */ }
    } else {
      stopWebAgent(task.id)
    }
    runningRef.current = false
    setAgentRunning(false)
    updateTaskStatus(task.id, 'stopped')
  }

  function handleResume(progressContent: string) {
    setShowMemory(false)
    const resumePrompt = `[Session Resume]\nPlease read your memory files (task_plan.md, findings.md, progress.md) and continue from where you left off. Here is the last progress log:\n\n${progressContent.slice(-2000)}`
    handleSend(resumePrompt)
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'n') { e.preventDefault(); onNewTask() }
      if (mod && e.key === ',') { e.preventDefault(); onOpenSettings() }
      if (e.key === 'Escape' && isActive && !showMemory) { e.preventDefault(); handleStop() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isActive, showMemory, onNewTask, onOpenSettings]) // eslint-disable-line react-hooks/exhaustive-deps

  // Slice from index 1 to skip the persisted welcome message (shown only in empty state)
  const visibleMessages = messages.slice(1)
  const isFirstMessage = messages.length <= 1
  const showEmptyState = isFirstMessage && !isActive

  // ── No task selected ──────────────────────────────────────────────────────
  if (!task) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: '#0d0d0d' }}>
        <div className="flex flex-col items-center gap-3 text-center px-8 max-w-xs">
          <NasusLogo size={32} fill="rgba(255,255,255,0.1)" />
          <p style={{ fontSize: 13, color: 'var(--tx-secondary)' }}>
            Select a task or create a new one
          </p>
        </div>
      </div>
    )
  }

    return (
      <div
        className="flex flex-col h-full"
        style={{ background: '#0d0d0d', position: 'relative' }}
        {...dragHandlers}
      >
        <DropZoneOverlay isDragOver={isDragOver} />
      {showMemory && (
        <MemoryViewer
          taskId={task.id}
          workspacePath={resolveTaskWorkspace(workspacePath, task.id)}
          onResume={handleResume}
          onClose={() => setShowMemory(false)}
        />
      )}

      {/* Header */}
      <header
        className="flex-shrink-0 flex items-center justify-between px-5 py-3"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0d0d0d' }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <h2 className="font-medium truncate" style={{ fontSize: 13, color: 'var(--tx-primary)' }}>
            {task.title}
          </h2>
          {isActive && iteration > 0 && (
            <span className="flex items-center gap-1.5 flex-shrink-0">
              <Pxi name="refresh" size={9} style={{ color: 'var(--tx-tertiary)', animation: 'spin 1s linear infinite' }} />
              <span className="font-mono" style={{ fontSize: 10, color: 'var(--tx-tertiary)' }}>{iteration}</span>
            </span>
          )}
          {tokenCount > 0 && (
            <span className="font-mono flex-shrink-0" style={{ fontSize: 10, color: 'var(--tx-tertiary)' }}>
              {(tokenCount / 1000).toFixed(1)}k · {estimateCost(model, tokenCount)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {(isActive || sandboxStatus === 'ready') && sandboxStatus !== 'idle' && (
            <SandboxPill status={sandboxStatus} />
          )}

          <button
            onClick={() => setShowMemory(true)}
            title="View agent memory files"
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors"
            style={{ color: 'var(--tx-tertiary)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
          >
            <Pxi name="bookmark" size={11} />
            <span style={{ fontSize: 11 }}>memory</span>
          </button>

          {isActive && (
            <button
              onClick={handleStop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-all"
              style={{
                fontSize: 11,
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
              title="Stop agent (Esc)"
            >
              <Pxi name="times-circle" size={11} />
              Stop
              <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 2 }}>Esc</span>
            </button>
          )}

          {!isActive && <StatusDot status={task.status} />}
        </div>
      </header>

      {/* Empty state */}
      {showEmptyState ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="w-full max-w-lg flex flex-col items-center gap-8">
            <div className="flex flex-col items-center gap-4 text-center">
              <NasusLogo size={38} fill="var(--amber)" />
              <div>
                <h3 className="font-semibold" style={{ fontSize: 16, color: 'var(--tx-primary)' }}>
                  What would you like to accomplish?
                </h3>
                <p className="mt-2 max-w-sm leading-relaxed" style={{ fontSize: 13, color: 'var(--tx-secondary)' }}>
                  Autonomous agent with a real sandbox — browses the web, writes &amp; runs code, manages files.
                </p>
              </div>
            </div>
              <ActionChips onSend={handleSend} onPrefill={(p) => inputRef.current?.prefill(p)} centered />

              {/* Workspace indicator */}
              <div className="w-full">
                {showWorkspacePicker ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.07)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.11em', color: 'var(--tx-tertiary)' }}>
                        <Pxi name="folder-open" size={9} style={{ color: 'var(--tx-tertiary)' }} />
                        Workspace
                      </label>
                      <button
                        onClick={() => setShowWorkspacePicker(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-tertiary)', padding: 2 }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-secondary)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
                      >
                        <Pxi name="times" size={10} />
                      </button>
                    </div>
                    <WorkspacePicker
                      value={localWorkspace}
                      onChange={setLocalWorkspace}
                    />
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => setShowWorkspacePicker(false)}
                        style={{ fontSize: 11, padding: '4px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--tx-tertiary)' }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          const p = localWorkspace.trim()
                          setWorkspacePath(p)
                          if (p) addRecentWorkspacePath(p)
                          setShowWorkspacePicker(false)
                        }}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '4px 12px',
                          borderRadius: 7,
                          border: 'none',
                          background: 'var(--amber)',
                          color: '#000',
                          cursor: 'pointer',
                        }}
                      >
                        Set workspace
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setLocalWorkspace(workspacePath); setShowWorkspacePicker(true) }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '7px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(255,255,255,0.06)',
                      background: 'transparent',
                      cursor: 'pointer',
                      transition: 'background 0.12s, border-color 0.12s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                  >
                    <Pxi name="folder" size={10} style={{ color: workspacePath ? 'var(--amber)' : 'var(--tx-tertiary)', flexShrink: 0 }} />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: workspacePath ? 'var(--tx-secondary)' : 'var(--tx-tertiary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'left',
                      }}
                      >
                        {workspacePath || '/tmp/nasus-workspace (default)'}
                      </span>
                    <Pxi name="pen" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
                  </button>
                )}
              </div>

                <div className="w-full">
                  <UserInputArea
                    ref={inputRef}
                    onSend={handleSend}
                    disabled={false}
                    autoFocus
                    attachments={attachments}
                    onAddFiles={addFiles}
                    onRemoveAttachment={removeAttachment}
                    isOverLimit={isOverLimit}
                    totalAttachmentSize={totalSize}
                  />
                </div>
          </div>
        </div>
      ) : (
        <>
          {/* Message list */}
          <div
            ref={messageListRef}
            className="flex-1 overflow-y-auto"
            id="message-list"
          >
            <div className="max-w-[780px] mx-auto px-5 py-6 flex flex-col gap-6">
              {visibleMessages.map((msg, i) => (
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

          {/* New messages pill — shown when scrolled up during active run */}
          {showNewMsgPill && (
            <div
              style={{
                position: 'absolute',
                bottom: 90,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                opacity: pillVisible ? 1 : 0,
                transition: 'opacity 0.2s ease',
                pointerEvents: pillVisible ? 'auto' : 'none',
              }}
            >
              <button
                onClick={() => {
                  setScrollLocked(false)
                  hidePill()
                  bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(234,179,8,0.12)',
                  border: '1px solid rgba(234,179,8,0.3)',
                  color: 'var(--amber)',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.2)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)' }}
              >
                <Pxi name="arrow-down" size={10} />
                New messages
              </button>
            </div>
          )}

            {/* Input */}
            <div className="flex-shrink-0 px-5 pb-5 pt-1">
              <div className="max-w-[780px] mx-auto">
                <UserInputArea
                  ref={inputRef}
                  onSend={handleSend}
                  onStop={handleStop}
                  isRunning={isActive}
                  queuedMsg={queuedMsg}
                  attachments={attachments}
                  onAddFiles={addFiles}
                  onRemoveAttachment={removeAttachment}
                  isOverLimit={isOverLimit}
                  totalAttachmentSize={totalSize}
                />
              </div>
            </div>
        </>
      )}
    </div>
  )
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Task['status'] }) {
  if (status === 'pending') return null
  if (status === 'completed') {
    return (
      <div className="flex items-center gap-1.5">
        <Pxi name="check-circle" size={11} style={{ color: '#34d399' }} />
        <span style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>Done</span>
      </div>
    )
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5">
        <Pxi name="times-circle" size={11} style={{ color: '#f87171' }} />
        <span style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>Failed</span>
      </div>
    )
  }
  if (status === 'stopped') {
    return (
      <div className="flex items-center gap-1.5">
        <Pxi name="stop-circle" size={11} style={{ color: 'var(--tx-tertiary)' }} />
        <span style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>Stopped</span>
      </div>
    )
  }
  if (status === 'in_progress') {
    return (
      <div className="flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--amber)', animation: 'pulseGlow 1.6s ease-in-out infinite' }}
        />
        <span style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>Running</span>
      </div>
    )
  }
  return null
}

// ─── Sandbox pill ─────────────────────────────────────────────────────────────

function SandboxPill({ status }: { status: 'idle' | 'starting' | 'ready' | 'stopped' }) {
  if (status === 'idle') return null

  const cfg = {
    starting: { icon: 'circle-notch', label: 'Starting',      color: 'var(--amber)' },
    ready:    { icon: 'check-circle', label: 'Sandbox ready', color: '#34d399' },
    stopped:  { icon: 'times-circle', label: 'Stopped',       color: 'var(--tx-secondary)' },
  }[status]

  if (!cfg) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Pxi name={cfg.icon} size={10} style={{ color: cfg.color }} />
      <span style={{ fontSize: 10, color: cfg.color }}>{cfg.label}</span>
    </div>
  )
}
