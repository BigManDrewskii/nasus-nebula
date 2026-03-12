import { ActionChips } from '../ActionChips'
import { UserInputArea, type UserInputAreaHandle } from '../UserInputArea'
import { NasusLogo } from '../NasusLogo'
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
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32 }}>

        {/* Logo + headline block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute',
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'var(--amber)',
              filter: 'blur(28px)',
              opacity: 0.14,
              pointerEvents: 'none',
            }} />
            <NasusLogo size={34} />
          </div>
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h3
              className="font-display font-semibold"
              style={{ fontSize: 'var(--text-2xl)', color: 'var(--tx-primary)', margin: 0, letterSpacing: '-0.03em', lineHeight: 1.15 }}
            >
              What would you like to build?
            </h3>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--tx-tertiary)', margin: 0, lineHeight: 1.5 }}>
              Describe your task and Nasus will get to work
            </p>
          </div>
        </div>

        {/* 4 action chips */}
        <ActionChips onSend={onSend} onPrefill={onPrefill} />

        {/* Input */}
        <div className="w-full" style={{ position: 'relative' }}>
          {extensionConnected && (
            <div style={{
              position: 'absolute', top: -22, right: 2,
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 'var(--text-2xs)', fontWeight: 500, color: '#22c55e', opacity: 0.8,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: '50%', background: '#22c55e',
                boxShadow: '0 0 6px rgba(34, 197, 94, 0.5)',
              }} />
              Browser connected{extensionVersion ? ` v${extensionVersion}` : ''}
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

        {/* Keyboard shortcuts */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center', opacity: 0.45 }}>
          {[
            { key: '⌘N', label: 'New task' },
            { key: '⌘,', label: 'Settings' },
            { key: 'Esc', label: 'Stop' },
          ].map(({ key, label }) => (
            <span key={key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <kbd style={{
                fontSize: 'var(--text-2xs)', fontFamily: 'var(--font-mono)',
                color: 'var(--tx-secondary)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 4, padding: '2px 8px',
              }}>{key}</kbd>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx-tertiary)' }}>{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
