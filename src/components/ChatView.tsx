import { useEffect, useRef, useState, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { tauriInvoke } from '../tauri'
import { runWebAgent, stopWebAgent } from '../agent/index'
import type { Task, Message, LlmMessage } from '../types'
import { useAppStore } from '../store'
import { ChatMessage } from './ChatMessage'
import { UserInputArea, type UserInputAreaHandle, type InputState } from './UserInputArea'
import { MemoryViewer } from './MemoryViewer'
import { NasusLogo } from './NasusLogo'
import { Pxi } from './Pxi'
import { useAttachments } from '../hooks/useAttachments'
import { DropZoneOverlay, useDragDrop } from './DropZoneOverlay'
import { ChatHeader, ToastOverlay } from './ChatHeader'
import { workspaceManager } from '../agent/workspace/WorkspaceManager'
import { PlanView, PlanConfirmationModal } from './PlanConfirmationModal'
import { resolveModelLocally } from '../lib/routing'
import { useAgentStatus } from './chat/hooks/useAgentStatus'
import { ChatEmptyState } from './chat/ChatEmptyState'

interface ChatViewProps {
  task: Task | null
  onNewTask: () => void
  onOpenSettings: (tab?: 'general' | 'model' | 'execution' | 'search' | 'about') => void
    outputVisible?: boolean
    onShowOutput?: () => void
    workspaceFileCount?: number
    /** Whether the right output panel is currently collapsed */
    rightCollapsed?: boolean
    /** Toggle the right output panel */
    onToggleRight?: () => void
  }
  
export function ChatView({ task, onNewTask, onOpenSettings, outputVisible, onShowOutput, workspaceFileCount = 0, rightCollapsed: _rightCollapsed = false, onToggleRight: _onToggleRight }: ChatViewProps) {
  const {
      messages: allMessages,
      getMessages,
      getRawHistory,
      addMessage,
      setStreaming,
      setError,
      appendRawHistory,
      updateTaskTitle,
      updateTaskStatus,
      apiKey,
      model,
      workspacePath,
      apiBase,
      provider,
      exaKey,
      maxIterations,
      setWorkspacePath,
      addRecentWorkspacePath,
      enableVerification,
      routerConfig,
      routingMode,
        pendingPlan,
        approvePlan,
        rejectPlan,
        setSandboxStatus,
      sandboxStatus: globalSandboxStatus,
      extensionConnected,
      extensionVersion,
      gatewayHealth,
      lastGatewayEvent,
        addStep: _addStep,
      addToast,
    } = useAppStore(
    useShallow((s) => ({
      messages: s.messages,
      getMessages: s.getMessages,
      getRawHistory: s.getRawHistory,
      addMessage: s.addMessage,
      setStreaming: s.setStreaming,
      setError: s.setError,
      appendRawHistory: s.appendRawHistory,
      updateTaskTitle: s.updateTaskTitle,
      updateTaskStatus: s.updateTaskStatus,
      apiKey: s.apiKey,
      model: s.model,
      workspacePath: s.workspacePath,
      apiBase: s.apiBase,
      provider: s.provider,
      exaKey: s.exaKey,
      maxIterations: s.maxIterations,
      setWorkspacePath: s.setWorkspacePath,
      addRecentWorkspacePath: s.addRecentWorkspacePath,
      enableVerification: s.enableVerification,
      routerConfig: s.routerConfig,
      routingMode: s.routerConfig.mode,
      pendingPlan: s.pendingPlan,
      approvePlan: s.approvePlan,
      rejectPlan: s.rejectPlan,
      setSandboxStatus: s.setSandboxStatus,
      sandboxStatus: s.sandboxStatus,
      extensionConnected: s.extensionConnected,
      extensionVersion: s.extensionVersion,
        gatewayHealth: s.gatewayHealth,
        lastGatewayEvent: s.lastGatewayEvent,
        addStep: s.addStep,
        addToast: s.addToast,
      })),
  )

    // Monitor gateway failovers and show notifications
    useEffect(() => {
      if (lastGatewayEvent?.type === 'fallback' && task?.id) {
        // Read stable store actions directly to avoid adding them as deps
        const { getMessages, addStep } = useAppStore.getState()
        const currentMsgs = getMessages(task.id)
        const activeAgentMsg = currentMsgs.find(m => m.author === 'agent' && m.streaming)
        if (activeAgentMsg) {
          addStep(task.id, activeAgentMsg.id, {
            kind: 'gateway_fallback',
            fromGateway: lastGatewayEvent.gatewayLabel || 'Primary',
            toGateway: lastGatewayEvent.nextGatewayId || 'Fallback',
            reason: lastGatewayEvent.error || 'Rate limited or timeout'
          })
        }
      }
    }, [lastGatewayEvent, task?.id])

    // Use the agent status hook to track agent state
    const { status: agentStatus, iteration } = useAgentStatus(task?.id)

    const runningRef = useRef(false)
    const queuedMsgRef = useRef<string | null>(null)
    const handleSendRef = useRef<((content: string) => void) | null>(null)
    const handleStopRef = useRef<(() => void) | null>(null)
    const sendTimestamps = useRef<number[]>([])
      const inputRef = useRef<UserInputAreaHandle>(null)
      const messageListRef = useRef<HTMLDivElement>(null)
      const bottomRef = useRef<HTMLDivElement>(null)
      const pillHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [tokenCount, setTokenCount] = useState(0)
    const [showMemory, setShowMemory] = useState(false)
    const [queuedMsg, setQueuedMsg] = useState<string | null>(null)
    const [activeModelBadge, setActiveModelBadge] = useState<{ modelId: string; displayName: string; reason: string } | null>(null)
    // Routing preview from store
    const { routingPreview, setRoutingPreview, taskRouterState } = useAppStore(
      useShallow((s) => ({
        routingPreview: s.routingPreview,
        setRoutingPreview: s.setRoutingPreview,
        taskRouterState: s.taskRouterState,
      }))
    )
    // Cost badge derived from live task router state
    const taskRouterEntry = task ? (taskRouterState[task.id] ?? null) : null
    const taskCostBadge = taskRouterEntry && taskRouterEntry.callCount > 0
      ? { costUsd: taskRouterEntry.totalCostUsd, isFree: taskRouterEntry.isFree, callCount: taskRouterEntry.callCount }
      : null
      const [showNewMsgPill, setShowNewMsgPill] = useState(false)
      const [pillVisible, setPillVisible] = useState(false) // drives opacity transition
        const [_showWorkspacePicker, _setShowWorkspacePicker] = useState(false)
        const [_localWorkspace, setLocalWorkspace] = useState(workspacePath)

    // Derived state from agentStatus hook
    const agentRunning = agentStatus === 'processing' || agentStatus === 'streaming'
    const processingPhase = agentStatus === 'processing'

  const sandboxStatus = globalSandboxStatus
  const isActive = agentRunning

  const messages = task ? (allMessages[task.id] ?? getMessages(task.id)) : []
  const taskWorkspacePath = workspacePath || (task?.id ? `workspace-${task.id}` : null)

  // Calculate message stats for ChatHeader tooltip
  const messageCount = messages.length
  const userTurns = messages.filter(m => m.author === 'user').length

  const inputState: InputState = agentRunning
    ? (processingPhase ? 'processing' : 'streaming')
    : 'idle'

  // Ref to store debounce timeout
  const routingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateRoutingPreview = useCallback((content: string) => {
    // Only preview in auto mode
    if (routerConfig.mode !== 'auto') {
      setRoutingPreview(null)
      return
    }

    // Clear existing timeout
    if (routingTimeoutRef.current) {
      clearTimeout(routingTimeoutRef.current)
    }

    // Don't call API for empty or very short input
    if (content.trim().length < 5) {
      setRoutingPreview(null)
      return
    }

    // Set loading state
    setRoutingPreview({
      modelId: '',
      displayName: 'Routing...',
      reason: 'Determining best model',
    })

    // Debounce the API call / heuristic
    routingTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await tauriInvoke<{
          model_id: string
          display_name: string
          reason: string
        }>('preview_routing', {
          message: content,
          mode: routerConfig.mode,
          budget: routerConfig.budget,
          modelOverrides: routerConfig.modelOverrides ?? {},
        })

        if (result) {
          setRoutingPreview({
            modelId: result.model_id,
            displayName: result.display_name,
            reason: result.reason,
          })
          return
        }
      } catch {
        // Fall through to local heuristic
      }

      // Tauri fallback: use local heuristic
      const local = resolveModelLocally(content, routerConfig, model)
      setRoutingPreview({
        modelId: local.modelId,
        displayName: local.displayName,
        reason: local.reason,
      })
    }, 300) // 300ms debounce
  }, [routerConfig, model, setRoutingPreview])

  // Cleanup timeout on unmount
    useEffect(() => {
      return () => {
        if (routingTimeoutRef.current) {
          clearTimeout(routingTimeoutRef.current)
        }
        if (pillHideTimerRef.current) {
          clearTimeout(pillHideTimerRef.current)
        }
      }
    }, [])

  // Listen for token usage events to update the live token counter
  useEffect(() => {
    if (!task) return
    const taskId = task.id
    const handleTokens = (e: Event) => {
      const detail = (e as CustomEvent<{ taskId: string; total_tokens: number }>).detail
      if (detail?.taskId === taskId) {
        setTokenCount(detail.total_tokens)
      }
    }
    window.addEventListener('nasus:tokens', handleTokens)
    return () => window.removeEventListener('nasus:tokens', handleTokens)
  }, [task])


  // Attachments
  const { attachments, totalSize, isOverLimit, addFiles, removeAttachment, clearAttachments } = useAttachments()

  // When a folder is dropped, set it as the workspace path
    const handleFolderDropped = useCallback((path: string) => {
      setWorkspacePath(path)
      addRecentWorkspacePath(path)
      setLocalWorkspace(path)
      addToast(`Workspace set to ${path}`, 'green')
    }, [setWorkspacePath, addRecentWorkspacePath, setLocalWorkspace, addToast])

  const { isDragOver, dragMode, handlers: dragHandlers } = useDragDrop(addFiles, handleFolderDropped)

  function hidePill() {
      setPillVisible(false)
      if (pillHideTimerRef.current) clearTimeout(pillHideTimerRef.current)
      pillHideTimerRef.current = setTimeout(() => setShowNewMsgPill(false), 200)
    }

  const configRef = useRef({ apiKey, model, workspacePath, apiBase, provider, exaKey, maxIterations, enableVerification, routerConfig })
  useEffect(() => {
    configRef.current = { apiKey, model, workspacePath, apiBase, provider, exaKey, maxIterations, enableVerification, routerConfig }
  }, [apiKey, model, workspacePath, apiBase, provider, exaKey, maxIterations, enableVerification, routerConfig])

    const runAgent = useCallback(async (
            taskId: string,
            agentMsgId: string,
            history: LlmMessage[],
            taskTitle: string,
          ) => {
            const cfg = configRef.current

            // Reset stale router state from previous runs so the badge never
            // shows a prior run's model/cost while this new run is starting.
            useAppStore.getState().setTaskRouterState(taskId, {
              modelId: '', displayName: '', reason: '',
              totalCostUsd: 0, totalInputTokens: 0, totalOutputTokens: 0,
              callCount: 0, isFree: false,
            })

            // Determine the model to use based on routing mode.
            // In auto mode we resolve once here using Tauri backend.
            // In manual mode we always use cfg.model directly.
            let modelToUse = cfg.model || 'anthropic/claude-3.7-sonnet'

              if (cfg.routerConfig.mode === 'auto') {
                const lastMsg = history[history.length - 1]
                const msgText = typeof lastMsg?.content === 'string' ? lastMsg.content : ''

                try {
                  const routing = await tauriInvoke<{
                    model_id: string
                    display_name: string
                    reason: string
                  }>('preview_routing', {
                    message: msgText,
                    mode: 'auto',
                    budget: cfg.routerConfig.budget,
                    modelOverrides: cfg.routerConfig.modelOverrides ?? {},
                  })
                  if (routing?.model_id) {
                    modelToUse = routing.model_id
                    setActiveModelBadge({ modelId: routing.model_id, displayName: routing.display_name, reason: routing.reason })
                  }
                } catch {
                  // Fall back to local heuristic on Tauri routing error
                  const local = resolveModelLocally(msgText, cfg.routerConfig, cfg.model)
                  modelToUse = local.modelId
                  setActiveModelBadge({ modelId: local.modelId, displayName: local.displayName, reason: local.reason })
                }
              } else {
                // Manual mode — show the selected model as the active badge
                setActiveModelBadge(null)
              }

            try {
              // Resolve the actual connection params from the gateway system.
              // cfg.apiKey / cfg.apiBase / cfg.provider are legacy store fields that are
              // zeroed on rehydration (partialize strips apiKey). resolveConnection() reads
              // from the gateway slice which is correctly populated by loadGatewayConfig.
              const conn = useAppStore.getState().resolveConnection()
              const resolvedApiKey = conn.apiKey || cfg.apiKey || ''
              const resolvedApiBase = conn.apiBase || cfg.apiBase || 'https://openrouter.ai/api/v1'
              const resolvedProvider = conn.provider || cfg.provider || 'openrouter'

                // Run the actual web agent (TypeScript orchestrator)
              await runWebAgent({
                taskId,
                taskTitle,
                messageId: agentMsgId,
                userMessages: history,
                apiKey: resolvedApiKey,
                model: modelToUse,
                apiBase: resolvedApiBase,
                provider: resolvedProvider,
                searchConfig: {
                  exaKey: cfg.exaKey || '',
                },
                  executionConfig: {
                    executionMode: 'docker' as const,
                    taskId,
                    workspacePath: await workspaceManager.getWorkspacePath(taskId),
                  },
                maxIterations: cfg.maxIterations ?? 50,
                usePlanning: true,
                orchestratorConfig: {
                  enableVerification: cfg.enableVerification ?? true,
                },
              })
            } catch (err) {
      // AI_NoOutputGeneratedError is only a true abort when the user actually stopped
      // the agent. When it occurs due to upstream stream errors (e.g. AI_MissingToolResultsError),
      // it should surface as a real error so the user sees "Try again".
      const isAbort = err instanceof Error && (
        err.name === 'AbortError' ||
        err.message.includes('AbortError') ||
        err.message.includes('Aborted') ||
        err.message.includes('aborted') ||
        err.message.includes('operation was aborted')
      )
      if (!isAbort) {
        const msg = err instanceof Error ? err.message : String(err)
        setError(taskId, agentMsgId, `Agent error: ${msg}`)
      } else {
        useAppStore.getState().updateTaskStatus(taskId, 'stopped')
        useAppStore.getState().setStreaming(taskId, agentMsgId, false)
      }
          } finally {
        // Always reset running flag — whether success, error, or abort
        runningRef.current = false
        // Clear active model badge when run finishes
        setActiveModelBadge(null)
        // Drain queued message via ref to avoid stale closure
        const queued = queuedMsgRef.current
        if (queued) {
          queuedMsgRef.current = null
          setQueuedMsg(null)
          handleSendRef.current?.(queued)
        }
      }
  }, [setError]) // eslint-disable-line react-hooks/exhaustive-deps

        async function handleSend(content: string) {
          if (!task) return
          if (runningRef.current) {
            queuedMsgRef.current = content
            setQueuedMsg(content)
            return
          }

          // Wait for gateway config to finish loading before checking the key.
          // loadGatewayConfig is async (Tauri round-trip) — if the user sends
          // immediately on cold start the key is not yet populated, causing a
          // spurious "Add your API key" prompt or a 401 against the wrong gateway.
          if (!useAppStore.getState().gatewayConfigReady) {
            // Poll every 50ms up to 3 seconds
            let waited = 0
            await new Promise<void>((resolve) => {
              const iv = setInterval(() => {
                waited += 50
                if (useAppStore.getState().gatewayConfigReady || waited >= 3000) {
                  clearInterval(iv)
                  resolve()
                }
              }, 50)
            })
          }

            // Require an API key for non-Ollama providers before firing any LLM calls.
          // Use resolveConnection() — cfg0.apiKey is the legacy store field which is
          // always '' after rehydration (partialize strips it). The gateway system
          // (populated by loadGatewayConfig) holds the real key.
          const cfg0 = configRef.current
          const conn0 = useAppStore.getState().resolveConnection()
          const effectiveKey = conn0.apiKey || cfg0.apiKey || ''
          const effectiveProvider = conn0.provider || cfg0.provider || 'openrouter'
          const needsKey = effectiveProvider !== 'ollama' && !effectiveKey.trim()
            if (needsKey) {
              addToast('Add your API key in Settings before sending.', 'red')
              onOpenSettings('model')
              return
            }

        // Rate limit: max 10 new agent runs per 60 seconds
      const now = Date.now()
      sendTimestamps.current = sendTimestamps.current.filter((t) => now - t < 60_000)
      if (sendTimestamps.current.length >= 10) {
        const oldest = sendTimestamps.current[0]
        const waitSecs = Math.ceil((oldest + 60_000 - now) / 1000)
          addToast(`Too many requests. Please wait ${waitSecs}s before sending again.`, 'red')
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
        for (const att of pendingAttachments) {
          if (att.textContent !== null) {
            await workspaceManager.writeFile(task.id, `uploads/${att.name}`, att.textContent)
          } else if (att.base64 !== null) {
            // Store base64 image data with a data URL header so agent can reference it
            await workspaceManager.writeFile(task.id, `uploads/${att.name}`, `data:${att.mimeType};base64,${att.base64}`)
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
      setTokenCount(0)
      setSandboxStatus('starting')
      updateTaskStatus(task.id, 'in_progress')
        // Unlock scroll and jump to bottom when a new exchange starts
        hidePill()
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)

      // Validate workspace path before running
      if (workspacePath) {
          try {
            const ok = await tauriInvoke<boolean>('validate_path', { path: workspacePath })
            if (!ok) {
              addToast(`Workspace path "${workspacePath}" is not accessible or not writable. Please update it in settings.`, 'amber')
            }
          } catch { /* non-blocking — proceed anyway */ }
      }

      // Always use runWebAgent for now, as the Rust backend is a placeholder.
      // This ensures the agent actually functions in desktop mode.
      await runAgent(task.id, agentMsgId, history, task.title)
    }
  // Keep ref always pointing to the latest handleSend to avoid stale closures
  handleSendRef.current = handleSend
  handleStopRef.current = handleStop

        async function handleRetry(failedMsgId: string) {
    if (!task || runningRef.current) return
    const history = getRawHistory(task.id)
    if (history.length === 0) return
    setError(task.id, failedMsgId, '')
    setStreaming(task.id, failedMsgId, true)
    runningRef.current = true
    setTokenCount(0)
    setSandboxStatus('starting')
    updateTaskStatus(task.id, 'in_progress')
    await runAgent(task.id, failedMsgId, history, task.title)
  }

    async function handleStop() {
      if (!task) return
      queuedMsgRef.current = null
      setQueuedMsg(null)
      
      // Immediately update local state for snappiness
      runningRef.current = false
      updateTaskStatus(task.id, 'stopped')
      
      // Find the currently streaming message and stop it
      const currentMessages = getMessages(task.id)
      const streamingMsg = currentMessages.find(m => m.streaming)
      if (streamingMsg) {
        setStreaming(task.id, streamingMsg.id, false)
      }

      // Stop the backend
      stopWebAgent(task.id)
      try { await tauriInvoke('stop_agent', { taskId: task.id }) } catch { /* best-effort */ }
    }

  function handleResume(progressContent: string) {
    setShowMemory(false)
    const resumePrompt = `[Session Resume]\nPlease read your memory files (task_plan.md, findings.md, progress.md) and continue from where you left off. Here is the last progress log:\n\n${progressContent.slice(-2000)}`
    handleSend(resumePrompt)
  }

    useEffect(() => {
      if (pendingPlan) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    }, [pendingPlan])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === ',') { e.preventDefault(); onOpenSettings() }
      if (e.key === 'Escape' && isActive && !showMemory) { e.preventDefault(); handleStopRef.current?.() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isActive, showMemory, onOpenSettings])

  // Slice from index 1 to skip the persisted welcome message (shown only in empty state)
  const visibleMessages = messages.slice(1)
  const isFirstMessage = messages.length <= 1
  const showEmptyState = isFirstMessage && !isActive

  // ── No task selected ──────────────────────────────────────────────────────
    if (!task) {
      return (
        <div className="flex flex-col h-full items-center justify-center cv-bg">
          <div className="flex flex-col items-center gap-3 text-center px-8 max-w-xs">
            <NasusLogo size={32} fill="rgba(255,255,255,0.1)" />
            <p className="cv-no-task-text">
              Select a task or create a new one
            </p>
          </div>
        </div>
      )
    }

    return (
      <div
        className="flex flex-col h-full cv-bg cv-relative"
        {...dragHandlers}
      >
          <DropZoneOverlay isDragOver={isDragOver} dragMode={dragMode} />

          <ToastOverlay />
      {showMemory && taskWorkspacePath && (
        <MemoryViewer
          taskId={task.id}
          workspacePath={taskWorkspacePath}
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
                provider={provider}
                routingMode={routingMode}
                routerConfig={routerConfig}
                sandboxStatus={sandboxStatus}
                outputVisible={outputVisible}
                workspaceFileCount={workspaceFileCount}
                onShowOutput={onShowOutput}
                onStop={handleStop}
                taskRouterState={taskRouterEntry}
                activeModelBadge={activeModelBadge}
                gatewayHealth={gatewayHealth}
                messageCount={messageCount}
                userTurns={userTurns}
                rightCollapsed={_rightCollapsed}
              onToggleRight={_onToggleRight}
            />

          {/* Sandbox error banner */}
          {sandboxStatus === 'error' && isActive && (
            <div className="cv-sandbox-error">
              <Pxi name="exclamation-triangle" size={16} style={{ color: '#f87171', flexShrink: 0 }} />
              <div className="cv-sandbox-error-body">
                <span className="cv-sandbox-error-title">Sandbox execution failed</span>
                <span className="cv-sandbox-error-msg">
                  The cloud sandbox couldn't execute the command. The agent will continue using local file operations.
                </span>
              </div>
            </div>
          )}



        {/* Empty state */}
      {showEmptyState ? (
          <ChatEmptyState
            onSend={handleSend}
            onPrefill={(p) => inputRef.current?.prefill(p)}
            inputRef={inputRef}
            attachments={attachments}
            onAddFiles={addFiles}
            onRemoveAttachment={removeAttachment}
            isOverLimit={isOverLimit}
            totalAttachmentSize={totalSize}
            extensionConnected={extensionConnected}
            extensionVersion={extensionVersion}
            onContentChange={updateRoutingPreview}
          />
      ) : (
        <>
            {/* Message list */}
            <div
              ref={messageListRef}
              className="flex-1 overflow-y-auto custom-scrollbar"
              id="message-list"
            >
              <div className="max-w-[780px] mx-auto px-5 py-8 flex flex-col gap-5">
                    {visibleMessages.map((msg, i) => (
                      <div key={msg.id} className="msg-in" style={{ animationDelay: `${Math.min(i * 20, 80)}ms` }}>
                        <ChatMessage
                          message={msg}
                          onRetry={msg.error ? () => handleRetry(msg.id) : undefined}
                        />
                      </div>
                    ))}

                      {/* Plan approval modal — rendered as fixed overlay */}
                      {pendingPlan && (
                        <PlanConfirmationModal
                          plan={pendingPlan}
                          onApprove={approvePlan}
                          onReject={rejectPlan}
                        />
                      )}

                    <div ref={bottomRef} />
                  </div>
                </div>

          {/* New messages pill — shown when scrolled up during active run */}
          {showNewMsgPill && (
            <div
              className="cv-pill-wrap"
              style={{
                opacity: pillVisible ? 1 : 0,
                pointerEvents: pillVisible ? 'auto' : 'none',
              }}
            >
              <button
                onClick={() => {
                  hidePill()
                  bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    hidePill()
                    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
                  }
                }}
                  className="cv-new-msg-btn hover-bg-amber"
              >
                <Pxi name="arrow-down" size={10} />
                New messages
              </button>
            </div>
          )}

              {/* Input */}
              <div className="flex-shrink-0 px-5 pb-5 pt-1">
                <div className="max-w-[780px] mx-auto">
              {/* Meta strip — routing preview + cost, consolidated */}
              {(activeModelBadge || routingPreview || taskCostBadge) && (
                <div className="cv-meta-strip">
                  {activeModelBadge && (
                    <span title={activeModelBadge.reason} className="cv-meta-badge cv-meta-badge--active">
                      <Pxi name="sparkles" size={8} />
                      {activeModelBadge.displayName}
                    </span>
                  )}
                  {!isActive && routingPreview && (
                    <span title={routingPreview.reason} className="cv-meta-badge cv-meta-badge--preview">
                      <Pxi name="route" size={8} />
                      {routingPreview.displayName}
                    </span>
                  )}
                  {taskCostBadge && taskCostBadge.callCount > 0 && (
                    <span
                      title={`${taskCostBadge.callCount} LLM call${taskCostBadge.callCount !== 1 ? 's' : ''}`}
                      className="cv-meta-badge cv-meta-badge--cost"
                    >
                      <Pxi name="coin" size={8} />
                      {taskCostBadge.isFree
                        ? 'free'
                        : taskCostBadge.costUsd < 0.001
                        ? '<$0.001'
                        : `$${taskCostBadge.costUsd.toFixed(4)}`}
                    </span>
                  )}
                </div>
              )}

              <UserInputArea
                ref={inputRef}
                onSend={(c) => { setRoutingPreview(null); handleSend(c) }}
                onStop={handleStop}
                onContentChange={updateRoutingPreview}
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
