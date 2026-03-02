import { ActionChips } from '../ActionChips'
import { UserInputArea, type UserInputAreaHandle } from '../UserInputArea'
import { WorkspacePicker } from '../WorkspacePicker'
import { Pxi } from '../Pxi'
import type { Attachment } from '../../types'

interface ChatEmptyStateProps {
  workspacePath: string
  localWorkspace: string
  showWorkspacePicker: boolean
  setShowWorkspacePicker: (show: boolean) => void
  setLocalWorkspace: (path: string) => void
  setWorkspacePath: (path: string) => void
  addRecentWorkspacePath: (path: string) => void
  onSend: (content: string) => void
  onPrefill: (content: string) => void
  inputRef: React.RefObject<UserInputAreaHandle | null>
  attachments: Attachment[]
  onAddFiles: (files: File[]) => void
  onRemoveAttachment: (id: string) => void
  isOverLimit: boolean
  totalAttachmentSize: number
  provider: string
  routerConfig: { mode: string; budget: string }
  extensionConnected: boolean
  extensionVersion?: string | null
  isPaid: boolean
  routeLabel: string
  onContentChange?: (content: string) => void
}

export function ChatEmptyState({
  workspacePath,
  localWorkspace,
  showWorkspacePicker,
  setShowWorkspacePicker,
  setLocalWorkspace,
  setWorkspacePath,
  addRecentWorkspacePath,
  onSend,
  onPrefill,
  inputRef,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  isOverLimit,
  totalAttachmentSize,
  provider,
  extensionConnected,
  extensionVersion,
  isPaid,
  routeLabel,
  onContentChange,
}: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-lg flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h3 className="font-display font-bold tracking-tight" style={{ fontSize: 20, color: 'var(--tx-primary)', marginBottom: 8 }}>
              What would you like to accomplish?
            </h3>
            <p className="max-w-sm leading-relaxed mx-auto" style={{ fontSize: 13, color: 'var(--tx-secondary)' }}>
              Autonomous agent with a real sandbox — browses the web, writes &amp; runs code, manages files.
            </p>
          </div>
        </div>
        <ActionChips onSend={onSend} onPrefill={onPrefill} centered />

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
                  aria-label="Close workspace picker"
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

        <div className="w-full relative">
          <div style={{
            position: 'absolute', top: -18, left: 0, right: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: 9, fontWeight: 600,
          }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: isPaid ? 'var(--amber)' : '#4ade80',
              opacity: 0.6, letterSpacing: '0.02em'
            }}>
              <Pxi name={provider === 'ollama' ? 'server' : 'cloud'} size={8} />
              USING {routeLabel} ROUTE
            </span>
            {extensionConnected && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                color: '#22c55e',
                opacity: 0.7,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%', background: '#22c55e',
                  boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)',
                }} />
                Browser connected {extensionVersion && `v${extensionVersion}`}
              </span>
            )}
          </div>

          <UserInputArea
            ref={inputRef}
            onSend={onSend}
            onContentChange={onContentChange}
            disabled={false}
            autoFocus
            inputState="idle"
            attachments={attachments}
            onAddFiles={onAddFiles}
            onRemoveAttachment={onRemoveAttachment}
            isOverLimit={isOverLimit}
            totalAttachmentSize={totalAttachmentSize}
          />
        </div>

        {/* Keyboard shortcut legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', justifyContent: 'center', opacity: 0.6 }}>
          {[
            { key: '⌘N', label: 'New task' },
            { key: '⌘K', label: 'Search' },
            { key: '⌘,', label: 'Settings' },
            { key: 'Esc', label: 'Stop' },
          ].map(({ key, label }) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: 'var(--tx-secondary)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 4,
                padding: '1px 4px',
              }}>{key}</kbd>
              <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontWeight: 500 }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
