import { useEffect } from 'react'
import { MarkdownRenderer } from './MarkdownRenderer'
import { Pxi } from './Pxi'

interface Props {
  content: string
  onClose: () => void
}

export function MessageExpandModal({ content, onClose }: Props) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="msg-expand-backdrop"
      onClick={onClose}
    >
      <div
        className="msg-expand-modal"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="msg-expand-header">
          <span className="msg-expand-title">Full response</span>
          <button
            className="msg-expand-close hover-bg-app-3"
            onClick={onClose}
            title="Close"
          >
            <Pxi name="times" size={12} />
          </button>
        </div>
        <div className="msg-expand-body">
          <div className="cm-prose agent-prose">
            <MarkdownRenderer content={content} />
          </div>
        </div>
      </div>
    </div>
  )
}
