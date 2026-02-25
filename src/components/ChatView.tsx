import { useEffect, useRef, useState, useCallback } from 'react'
import { tauriInvoke, tauriListen } from '../tauri'
import { runWebAgent, stopWebAgent } from '../agent/index'
import { disposeSandbox } from '../agent/sandboxRuntime'
import type { Task, Message, AgentStep, LlmMessage, AgentEventPayload } from '../types'
import { useAppStore } from '../store'
import { ChatMessage } from './ChatMessage'
import { UserInputArea, type UserInputAreaHandle, type InputState } from './UserInputArea'
import { ActionChips } from './ActionChips'
import { MemoryViewer } from './MemoryViewer'
import { NasusLogo } from './NasusLogo'
import { Pxi } from './Pxi'
import { useAttachments } from '../hooks/useAttachments'
import { DropZoneOverlay, useDragDrop } from './DropZoneOverlay'
import { getWorkspace } from '../agent/tools'
import { WorkspacePicker } from './WorkspacePicker'
import { ChatHeader, ToastOverlay } from './ChatHeader'

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
  outputVisible?: boolean
  onShowOutput?: () => void
  workspaceFileCount?: number
  /** Whether the left sidebar is currently collapsed */
  leftCollapsed?: boolean
  /** Whether the right output panel is currently collapsed */
  rightCollapsed?: boolean
  /** Toggle the left sidebar */
  onToggleLeft?: () => void
  /** Toggle the right output panel */
  onToggleRight?: () => void
}

export function ChatView({ task, onNewTask, onOpenSettings, outputVisible, onShowOutput, workspaceFileCount = 0, leftCollapsed: _leftCollapsed = false, rightCollapsed: _rightCollapsed = false, onToggleLeft: _onToggleLeft, onToggleRight: _onToggleRight }: ChatViewProps) {
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
    serperKey,
    tavilyKey,
    searxngUrl,
    searchProvider,
    maxIterations,
    setWorkspacePath,
    setApiKey,
    setModel,
    setApiBase,
    setProvider,
    addRecentWorkspacePath,
    e2bApiKey,
    executionMode,
    routerConfig,
    setTaskRouterState,
  } = useAppStore()

    const [iteration, setIteration] = useState(0)
    const [tokenCount, setTokenCount] = useState(0)
    const [sandboxStatus, setSandboxStatus] = useState<'idle' | 'starting' | 'ready' | 'stopped'>('idle')
    const [showMemory, setShowMemory] = useState(false)
    const [queuedMsg, setQueuedMsg] = useState<string | null>(null)
    // Track whether the agent is actively running (used for correct isActive state)
    const [agentRunning, setAgentRunning] = useState(false)
  // Selected model badge for in-chat display
  const [activeModelBadge, setActiveModelBadge] = useState<{ modelId: string; displayName: string; reason: string } | null>(null)
  // Cost badge for completed tasks
  const [taskCostBadge, setTaskCostBadge] = useState<{ costUsd: number; isFree: boolean; callCount: number } | null>(null)
    // processingPhase: true from Send until first token/tool — drives "thinking" input state
    const [processingPhase, setProcessingPhase] = useState(false)
    // Scroll-lock: false = auto-scroll, true = user has scrolled up
    const [scrollLocked, setScrollLocked] = useState(false)
    const [showNewMsgPill, setShowNewMsgPill] = useState(false)
    const [pillVisible, setPillVisible] = useState(false) // drives opacity transition
    const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)
  const [showWorkspacePicker, setShowWorkspacePicker] = useState(false)
    const [localWorkspace, setLocalWorkspace] = useState(workspacePath)
    const [workspaceWarning, setWorkspaceWarning] = useState<string | null>(null)
  const [folderDropConfirm, setFolderDropConfirm] = useState<string | null>(null)

    // Attachments
  const { attachments, totalSize, isOverLimit, addFiles, removeAttachment, clearAttachments } = useAttachments()

  // When a folder is dropped, set it as the workspace path
  const handleFolderDropped = useCallback((path: string) => {
    setWorkspacePath(path)
    addRecentWorkspacePath(path)
    setLocalWorkspace(path)
    setFolderDropConfirm(path)
    setTimeout(() => setFolderDropConfirm(null), 3000)
  }, [setWorkspacePath, addRecentWorkspacePath]) // eslint-disable-line react-hooks/exhaustive-deps

  const { isDragOver, dragMode, handlers: dragHandlers } = useDragDrop(addFiles, handleFolderDropped)

  function showPill() {
    setShowNewMsgPill(true)
    requestAnimationFrame(() => setPillVisible(true))
  }
  function hidePill() {
    setPillVisible(false)
    setTimeout(() => setShowNewMsgPill(false), 200)
  }

      const configRef = useRef({ apiKey, model, workspacePath, apiBase, provider, braveSearchKey, googleCseKey, googleCseId, serperKey, tavilyKey, searxngUrl, searchProvider, maxIterations, e2bApiKey, executionMode, routerConfig })
      useEffect(() => {
        configRef.current = { apiKey, model, workspacePath, apiBase, provider, braveSearchKey, googleCseKey, googleCseId, serperKey, tavilyKey, searxngUrl, searchProvider, maxIterations, e2bApiKey, executionMode, routerConfig }
      }, [apiKey, model, workspacePath, apiBase, provider, braveSearchKey, googleCseKey, googleCseId, serperKey, tavilyKey, searxngUrl, searchProvider, maxIterations, e2bApiKey, executionMode, routerConfig])

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

  // Derive 4-state input machine from running states
  const inputState: InputState = processingPhase
    ? 'processing'
    : agentRunning
    ? 'streaming'
    : 'idle'

  const messageListRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const runningRef = useRef<boolean>(false)
  const queuedMsgRef = useRef<string | null>(null)
  const inputRef = useRef<UserInputAreaHandle>(null)
  // Rate limiting: track recent send timestamps (max 10 sends per 60s)
  // Persisted in sessionStorage so it survives React remounts/HMR but resets on tab close.
  const sendTimestamps = useRef<number[]>(
    (() => {
      try {
        const raw = sessionStorage.getItem('nasus-send-ts')
        if (raw) {
          const parsed: number[] = JSON.parse(raw)
          const now = Date.now()
          return parsed.filter((t) => now - t < 60_000)
        }
      } catch { /* ignore */ }
      return []
    })()
  )

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

    const prevTaskIdRef = useRef<string | undefined>(undefined)
  useEffect(() => {
    // Stop any running agent for the previous task when switching tasks
    if (prevTaskIdRef.current && prevTaskIdRef.current !== task?.id && !isTauri) {
      stopWebAgent(prevTaskIdRef.current)
      disposeSandbox().catch(() => {})
    }
    prevTaskIdRef.current = task?.id
      setIteration(0)
        setTokenCount(0)
        setSandboxStatus('idle')
        setAgentRunning(false)
        setProcessingPhase(false)
        setScrollLocked(false)
      setPillVisible(false)
      setShowNewMsgPill(false)
      queuedMsgRef.current = null
      setQueuedMsg(null)
      clearAttachments()
    setActiveModelBadge(null)
    setTaskCostBadge(null)
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
    function onAgentStarted(e: Event) {
      const { taskId: tid } = (e as CustomEvent).detail
      if (tid === taskId) {
        setAgentRunning(true)
        setProcessingPhase(true)
      }
    }
    function onAgentDone(e: Event) {
      const { taskId: tid } = (e as CustomEvent).detail
      if (tid === taskId) {
        runningRef.current = false
        setAgentRunning(false)
        setProcessingPhase(false)
      }
    }
    function onProcessingEnd(e: Event) {
      const { taskId: tid } = (e as CustomEvent).detail
      if (tid === taskId) setProcessingPhase(false)
    }

    window.addEventListener('nasus:iteration', onIteration)
    window.addEventListener('nasus:tokens', onTokens)
    window.addEventListener('nasus:agent-started', onAgentStarted)
    window.addEventListener('nasus:agent-done', onAgentDone)
    window.addEventListener('nasus:processing-end', onProcessingEnd)
    return () => {
      window.removeEventListener('nasus:iteration', onIteration)
      window.removeEventListener('nasus:tokens', onTokens)
      window.removeEventListener('nasus:agent-started', onAgentStarted)
      window.removeEventListener('nasus:agent-done', onAgentDone)
      window.removeEventListener('nasus:processing-end', onProcessingEnd)
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
            if (content.includes('Starting sandbox') || content.includes('Pulling image') || content.includes('Pulling Docker image') || content.includes('[Docker pull]')) {
              setSandboxStatus('starting')
            } else if (content.includes('Sandbox ready') || content.includes('Image') && content.includes('ready')) {
              setSandboxStatus('ready')
            }
            setProcessingPhase(false)
            const step: AgentStep = { kind: 'thinking', content }
            addStep(task.id, payload.message_id, step)
            break
          }
          case 'tool_call': {
            setProcessingPhase(false)
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
            setProcessingPhase(false)
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
            setProcessingPhase(false)
            runningRef.current = false
          setAgentRunning(false)
          updateTaskStatus(task.id, 'completed')
          setStreaming(task.id, payload.message_id, false)
          setSandboxStatus('stopped')
          break
        }
          case 'error': {
            setProcessingPhase(false)
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
          case 'model_selected': {
            if (payload.model_id) {
              setActiveModelBadge({
                modelId: payload.model_id,
                displayName: payload.display_name ?? payload.model_id,
                reason: payload.reason ?? '',
              })
              setTaskRouterState(task.id, {
                modelId: payload.model_id,
                displayName: payload.display_name ?? payload.model_id,
                reason: payload.reason ?? '',
              })
            }
            break
          }
          case 'task_cost': {
            if (typeof payload.total_cost_usd === 'number') {
              setTaskCostBadge({
                costUsd: payload.total_cost_usd,
                isFree: payload.is_free ?? false,
                callCount: payload.call_count ?? 0,
              })
              setTaskRouterState(task.id, {
                totalCostUsd: payload.total_cost_usd,
                totalInputTokens: payload.total_input_tokens ?? 0,
                totalOutputTokens: payload.total_output_tokens ?? 0,
                callCount: payload.call_count ?? 0,
                isFree: payload.is_free ?? false,
              })
            }
            break
          }
          case 'free_limit_warning': {
            const remaining = payload.remaining ?? 0
            setRateLimitWarning(
              remaining === 0
                ? 'Free model daily limit reached. Switch to a paid model to continue.'
                : `Free model limit: ${remaining} requests remaining today.`,
            )
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
            model: cfg.model || 'anthropic/claude-3.7-sonnet',
            workspacePath: taskWorkspace,
            apiBase: cfg.apiBase || 'https://openrouter.ai/api/v1',
            provider: cfg.provider || 'openrouter',
            routerMode: cfg.routerConfig.mode,
            routerBudget: cfg.routerConfig.budget,
            routerModelOverrides: cfg.routerConfig.modelOverrides,
            searchConfig: {
              provider: cfg.searchProvider || 'auto',
              braveKey: cfg.braveSearchKey || undefined,
              googleCseKey: cfg.googleCseKey || undefined,
              googleCseId: cfg.googleCseId || undefined,
              serperKey: cfg.serperKey || undefined,
              tavilyKey: cfg.tavilyKey || undefined,
              searxngUrl: cfg.searxngUrl || undefined,
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
              model: cfg.model || 'anthropic/claude-3.7-sonnet',
              apiBase: cfg.apiBase || 'https://openrouter.ai/api/v1',
              provider: cfg.provider || 'openrouter',
              searchConfig: {
                provider: cfg.searchProvider || 'auto',
                braveKey: cfg.braveSearchKey || undefined,
                googleCseKey: cfg.googleCseKey || undefined,
                googleCseId: cfg.googleCseId || undefined,
                serperKey: cfg.serperKey || undefined,
                tavilyKey: cfg.tavilyKey || undefined,
                searxngUrl: cfg.searxngUrl || undefined,
              },
            executionConfig: {
              executionMode: (cfg.executionMode || 'e2b') as 'e2b' | 'pyodide' | 'disabled',
              e2bApiKey: cfg.e2bApiKey || undefined,
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

      // Rate limit: max 10 new agent runs per 60 seconds
      const now = Date.now()
      sendTimestamps.current = sendTimestamps.current.filter((t) => now - t < 60_000)
      if (sendTimestamps.current.length >= 10) {
        const oldest = sendTimestamps.current[0]
        const waitSecs = Math.ceil((oldest + 60_000 - now) / 1000)
        setRateLimitWarning(`Too many requests. Please wait ${waitSecs}s before sending again.`)
        setTimeout(() => setRateLimitWarning(null), 4000)
        return
      }
        sendTimestamps.current.push(now)
        try { sessionStorage.setItem('nasus-send-ts', JSON.stringify(sendTimestamps.current)) } catch { /* ignore */ }
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
      setProcessingPhase(true)
      setIteration(0)
      setTokenCount(0)
      setSandboxStatus(isTauri ? 'starting' : 'idle')
      updateTaskStatus(task.id, 'in_progress')
        // Unlock scroll and jump to bottom when a new exchange starts
        setScrollLocked(false)
        hidePill()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

      // Validate workspace path before running (Tauri only)
      if (isTauri && workspacePath) {
        try {
          const ok = await tauriInvoke<boolean>('validate_path', { path: workspacePath })
          if (!ok) {
            setWorkspaceWarning(`Workspace path "${workspacePath}" is not accessible or not writable. Please update it in settings.`)
            setTimeout(() => setWorkspaceWarning(null), 6000)
          }
        } catch { /* non-blocking — proceed anyway */ }
      }

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
      setProcessingPhase(false)
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
          <DropZoneOverlay isDragOver={isDragOver} dragMode={dragMode} />

        <ToastOverlay
          workspaceWarning={workspaceWarning}
          rateLimitWarning={rateLimitWarning}
          folderDropConfirm={folderDropConfirm}
        />
      {showMemory && (
        <MemoryViewer
          taskId={task.id}
          workspacePath={resolveTaskWorkspace(workspacePath, task.id)}
          onResume={handleResume}
          onClose={() => setShowMemory(false)}
        />
      )}

      <ChatHeader
          task={task}
          isActive={isActive}
          iteration={iteration}
          tokenCount={tokenCount}
          model={model}
          sandboxStatus={sandboxStatus}
          outputVisible={outputVisible}
          workspaceFileCount={workspaceFileCount}
          onShowOutput={onShowOutput}
          onShowMemory={() => setShowMemory(true)}
          onStop={handleStop}
        />

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
                        inputState={inputState}
                        attachments={attachments}
                        onAddFiles={addFiles}
                        onRemoveAttachment={removeAttachment}
                        isOverLimit={isOverLimit}
                        totalAttachmentSize={totalSize}
                      />
                    </div>

                  {/* Keyboard shortcut legend */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
                    {[
                      { key: '⌘N', label: 'New task' },
                      { key: '⌘K', label: 'Search tasks' },
                      { key: '⌘,', label: 'Settings' },
                      { key: 'Esc', label: 'Stop agent' },
                    ].map(({ key, label }) => (
                      <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <kbd style={{
                          fontSize: 9.5,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--tx-muted)',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: 4,
                          padding: '1px 5px',
                        }}>{key}</kbd>
                        <span style={{ fontSize: 10.5, color: 'var(--tx-muted)' }}>{label}</span>
                      </span>
                    ))}
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
                  {/* Model badge + cost indicator row */}
                  {(activeModelBadge || taskCostBadge) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      {activeModelBadge && (
                        <span
                          title={activeModelBadge.reason}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 10, padding: '2px 8px', borderRadius: 6,
                            background: 'rgba(234,179,8,0.08)',
                            border: '1px solid rgba(234,179,8,0.18)',
                            color: 'var(--amber)',
                            cursor: 'default',
                          }}
                        >
                          <Pxi name="sparkles" size={8} />
                          {activeModelBadge.displayName}
                        </span>
                      )}
                      {taskCostBadge && taskCostBadge.callCount > 0 && (
                        <span
                          title={`${taskCostBadge.callCount} LLM call${taskCostBadge.callCount !== 1 ? 's' : ''}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 10, padding: '2px 8px', borderRadius: 6,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            color: 'var(--tx-tertiary)',
                            cursor: 'default',
                          }}
                        >
                          <Pxi name="coin" size={8} />
                          {taskCostBadge.isFree
                            ? 'Free'
                            : taskCostBadge.costUsd < 0.001
                            ? '<$0.001'
                            : `$${taskCostBadge.costUsd.toFixed(4)}`}
                        </span>
                      )}
                    </div>
                  )}
                  <UserInputArea
                    ref={inputRef}
                    onSend={handleSend}
                    onStop={handleStop}
                    isRunning={isActive}
                    inputState={inputState}
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

