import { useEffect, useRef, useState, useCallback } from 'react'
import { tauriInvoke } from '../tauri'
import { stopWebAgent } from '../agent/index'
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
import { PlanView } from './PlanConfirmationModal'
import { isPaidRoute, getRouteLabel } from '../lib/routing'
import { useAgentStatus } from './chat/hooks/useAgentStatus'
import { ChatEmptyState } from './chat/ChatEmptyState'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

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
      e2bApiKey,
      executionMode,
      enableVerification,
      routerConfig,
      pendingPlan,
      approvePlan,
      rejectPlan,
      currentPlan,
      currentPhase,
      currentStep,
      setSandboxStatus,
      sandboxStatus: globalSandboxStatus,
      extensionConnected,
      extensionVersion,
    } = useAppStore()

    // Use the agent status hook to track agent state
    const { status: agentStatus, iteration } = useAgentStatus(task?.id)

    const runningRef = useRef(false)
    const queuedMsgRef = useRef<string | null>(null)
    const sendTimestamps = useRef<number[]>([])
    const inputRef = useRef<UserInputAreaHandle>(null)
    const messageListRef = useRef<HTMLDivElement>(null)
    const bottomRef = useRef<HTMLDivElement>(null)

    const [tokenCount, setTokenCount] = useState(0)
    const [showMemory, setShowMemory] = useState(false)
    const [queuedMsg, setQueuedMsg] = useState<string | null>(null)
    const [activeModelBadge] = useState<{ modelId: string; displayName: string; reason: string } | null>(null)
    // Routing preview state
    const [routingPreview, setRoutingPreview] = useState<{ modelId: string; displayName: string; reason: string } | null>(null)
    // Cost badge for completed tasks
    const [taskCostBadge] = useState<{ costUsd: number; isFree: boolean; callCount: number } | null>(null)
    const [showNewMsgPill, setShowNewMsgPill] = useState(false)
    const [pillVisible, setPillVisible] = useState(false) // drives opacity transition
    const [rateLimitWarning, setRateLimitWarning] = useState<string | null>(null)
    const [showWorkspacePicker, setShowWorkspacePicker] = useState(false)
    const [localWorkspace, setLocalWorkspace] = useState(workspacePath)
    const [workspaceWarning, setWorkspaceWarning] = useState<string | null>(null)
    const [folderDropConfirm, setFolderDropConfirm] = useState<string | null>(null)

    // Derived state from agentStatus hook
    const agentRunning = agentStatus === 'processing' || agentStatus === 'streaming'
    const processingPhase = agentStatus === 'processing'

  const sandboxStatus = (globalSandboxStatus === 'error' ? 'stopped' : globalSandboxStatus) as 'idle' | 'starting' | 'ready' | 'stopped'
  const isActive = agentRunning
  const isPaid = isPaidRoute(provider, routerConfig)
  const routeLabel = getRouteLabel(provider, routerConfig)
  const messages = task ? (allMessages[task.id] ?? getMessages(task.id)) : []
  const taskWorkspacePath = workspacePath || (task?.id ? `workspace-${task.id}` : null)

  const inputState: InputState = agentRunning
    ? (processingPhase ? 'processing' : 'streaming')
    : 'idle'

  const updateRoutingPreview = useCallback((_content: string) => {
    // No-op for now, can be implemented to show auto-routing changes in real-time
  }, [])


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

  function hidePill() {
    setPillVisible(false)
    setTimeout(() => setShowNewMsgPill(false), 200)
  }

  const configRef = useRef({ apiKey, model, workspacePath, apiBase, provider, exaKey, maxIterations, e2bApiKey, executionMode, enableVerification, routerConfig })
  useEffect(() => {
    configRef.current = { apiKey, model, workspacePath, apiBase, provider, exaKey, maxIterations, e2bApiKey, executionMode, enableVerification, routerConfig }
  }, [apiKey, model, workspacePath, apiBase, provider, exaKey, maxIterations, e2bApiKey, executionMode, enableVerification, routerConfig])

  const runAgent = useCallback(async (
            taskId: string,
            agentMsgId: string,
            history: LlmMessage[],
            taskTitle: string,
          ) => {
            const cfg = configRef.current
            
            try {
              // Now using tauriInvoke even for agent execution.
              // This is routed through invokeWebAgent (TS) in both environments.
              // In Tauri, it ALSO registers the task with the Rust backend for state tracking.
              await tauriInvoke('run_agent', {
                taskId,
                messageId: agentMsgId,
                userMessages: history,
                apiKey: cfg.apiKey || '',
                model: cfg.model || 'anthropic/claude-3.7-sonnet',
                apiBase: cfg.apiBase || 'https://openrouter.ai/api/v1',
                provider: cfg.provider || 'openrouter',
                workspacePath: cfg.workspacePath || '',
                searchConfig: {
                  exaKey: cfg.exaKey || '',
                },
                executionConfig: {
                  executionMode: (cfg.executionMode || 'docker') as 'docker' | 'e2b' | 'pyodide' | 'disabled',
                  e2bApiKey: cfg.e2bApiKey || undefined,
                  taskId: taskId,
                },
                routerMode: 'auto' as const,
                routerBudget: 'balanced' as const,
                routerModelOverrides: {},
                maxIterations: cfg.maxIterations ?? 50,
                taskTitle,
                usePlanning: true, // Enable the Orchestrator (Planning Agent)
                orchestratorConfig: {
                  enableVerification: cfg.enableVerification ?? true,
                },
              })
        } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (!msg.includes('AbortError') && !msg.includes('Aborted')) {
        setError(taskId, agentMsgId, `Agent error: ${msg}`)
      } else {
        useAppStore.getState().updateTaskStatus(taskId, 'stopped')
        useAppStore.getState().setStreaming(taskId, agentMsgId, false)
      }
      runningRef.current = false
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
      setSandboxStatus(isTauri ? 'starting' : 'idle')
      updateTaskStatus(task.id, 'in_progress')
        // Unlock scroll and jump to bottom when a new exchange starts
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

      // Always use runWebAgent for now, as the Rust backend is a placeholder.
      // This ensures the agent actually functions in desktop mode.
      await runAgent(task.id, agentMsgId, history, task.title)
    }

  async function handleRetry(failedMsgId: string) {
    if (!task || runningRef.current) return
    const history = getRawHistory(task.id)
    if (history.length === 0) return
    setError(task.id, failedMsgId, '')
    setStreaming(task.id, failedMsgId, true)
    runningRef.current = true
    setTokenCount(0)
    setSandboxStatus(isTauri ? 'starting' : 'idle')
    updateTaskStatus(task.id, 'in_progress')
    await runAgent(task.id, failedMsgId, history, task.title)
  }

    async function handleStop() {
      if (!task) return
      queuedMsgRef.current = null
      setQueuedMsg(null)
      // Always call stopWebAgent even in Tauri mode since we're using runWebAgent
      stopWebAgent(task.id)
      if (isTauri) {
        try { await tauriInvoke('stop_agent', { taskId: task.id }) } catch { /* best-effort */ }
      }
      runningRef.current = false
      updateTaskStatus(task.id, 'stopped')
    }

  function handleResume(progressContent: string) {
    setShowMemory(false)
    const resumePrompt = `[Session Resume]\nPlease read your memory files (task_plan.md, findings.md, progress.md) and continue from where you left off. Here is the last progress log:\n\n${progressContent.slice(-2000)}`
    handleSend(resumePrompt)
  }

  useEffect(() => {
    if (pendingPlan || currentPlan) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [pendingPlan, currentPlan])

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
                routerConfig={routerConfig}
                sandboxStatus={sandboxStatus}
                outputVisible={outputVisible}
                workspaceFileCount={workspaceFileCount}
                onShowOutput={onShowOutput}
                onShowMemory={() => setShowMemory(true)}
                onStop={handleStop}
              />



        {/* Empty state */}
      {showEmptyState ? (
        <ChatEmptyState
          workspacePath={workspacePath}
          localWorkspace={localWorkspace}
          showWorkspacePicker={showWorkspacePicker}
          setShowWorkspacePicker={setShowWorkspacePicker}
          setLocalWorkspace={setLocalWorkspace}
          setWorkspacePath={setWorkspacePath}
          addRecentWorkspacePath={addRecentWorkspacePath}
          onSend={handleSend}
          onPrefill={(p) => inputRef.current?.prefill(p)}
          inputRef={inputRef}
          attachments={attachments}
          onAddFiles={addFiles}
          onRemoveAttachment={removeAttachment}
          isOverLimit={isOverLimit}
          totalAttachmentSize={totalSize}
          provider={provider}
          routerConfig={routerConfig}
          extensionConnected={extensionConnected}
          extensionVersion={extensionVersion}
          isPaid={isPaid}
          routeLabel={routeLabel}
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
              <div className="max-w-[780px] mx-auto px-5 py-8 flex flex-col gap-8">
                    {visibleMessages.map((msg, i) => (
                      <div key={msg.id} className="msg-in" style={{ animationDelay: `${Math.min(i * 20, 80)}ms` }}>
                        <ChatMessage
                          message={msg}
                          onRetry={msg.error ? () => handleRetry(msg.id) : undefined}
                        />
                      </div>
                    ))}

                    {/* Planning View integrated inline */}
                    {(pendingPlan || currentPlan) && (
                      <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        <PlanView
                          plan={pendingPlan || currentPlan!}
                          onApprove={pendingPlan ? approvePlan : undefined}
                          onReject={pendingPlan ? rejectPlan : undefined}
                          currentPhase={currentPhase}
                          currentStep={currentStep}
                        />
                      </div>
                    )}

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
                    {(activeModelBadge || routingPreview || taskCostBadge) && (
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
                        {!isActive && routingPreview && (
                          <span
                            title={routingPreview.reason}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 4,
                              fontSize: 10, padding: '2px 8px', borderRadius: 6,
                              background: 'rgba(255,255,255,0.04)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              color: 'var(--tx-tertiary)',
                              cursor: 'default',
                              animation: 'fadeIn 0.2s ease',
                            }}
                          >
                            <Pxi name="route" size={8} />
                            Auto-route: {routingPreview.displayName}
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
                          <div className="relative">
                            <div style={{
                              position: 'absolute', top: -16, right: 0,
                              display: 'flex', alignItems: 'center', gap: 4,
                              fontSize: 9, fontWeight: 700, color: isPaid ? 'var(--amber)' : '#4ade80',
                              opacity: 0.6, letterSpacing: '0.04em'
                            }}>
                              <Pxi name={provider === 'ollama' ? 'server' : 'cloud'} size={8} />
                              {routeLabel}
                            </div>


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
              </div>
        </>
      )}
    </div>
  )
}
