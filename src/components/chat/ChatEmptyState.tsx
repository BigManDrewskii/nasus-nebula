import { ActionChips } from '../ActionChips'
import { UserInputArea, type UserInputAreaHandle } from '../UserInputArea'
import type { Attachment } from '../../types'

interface ChatEmptyStateProps {
  onSend: (content: string) => void
  onPrefill: (content: string) => void
  inputRef: React.RefObject<UserInputAreaHandle | null>
  attachments: Attachment[]
  onAddFiles: (files: File[]) => void
  onRemoveAttachment: (id: string) => void
  isOverLimit: boolean
  totalAttachmentSize: number
  extensionConnected: boolean
  extensionVersion?: string | null
  onContentChange?: (content: string) => void
}

export function ChatEmptyState({
  onSend,
  onPrefill,
  inputRef,
  attachments,
  onAddFiles,
  onRemoveAttachment,
  isOverLimit,
  totalAttachmentSize,
  extensionConnected,
  extensionVersion,
  onContentChange,
}: ChatEmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6">
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* Headline block */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3
            className="font-display font-semibold tracking-tight"
            style={{ fontSize: 22, color: 'var(--tx-primary)', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}
          >
            What would you like to build?
          </h3>
          <p style={{ fontSize: 13, color: 'var(--tx-tertiary)', margin: 0, lineHeight: 1.5 }}>
            Describe your task and Nasus will get to work
          </p>
        </div>

        {/* 4 action chips */}
        <ActionChips onSend={onSend} onPrefill={onPrefill} />

        {/* Input */}
        <div className="w-full" style={{ position: 'relative' }}>
          {extensionConnected && (
            <div style={{
              position: 'absolute', top: -20, right: 0,
              display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 9, fontWeight: 600, color: '#22c55e', opacity: 0.75,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)',
              }} />
              Browser connected {extensionVersion && `v${extensionVersion}`}
            </div>
          )}
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

        {/* Keyboard hints */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center', opacity: 0.4 }}>
          {[
            { key: '⌘N', label: 'New task' },
            { key: '⌘,', label: 'Settings' },
            { key: 'Esc', label: 'Stop' },
            { key: '⇧⏎', label: 'New line' },
          ].map(({ key, label }) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{
                fontSize: 9, fontFamily: 'var(--font-mono)',
                color: 'var(--tx-secondary)',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 4, padding: '1px 5px',
                letterSpacing: '0.02em',
              }}>{key}</kbd>
              <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontWeight: 400 }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
