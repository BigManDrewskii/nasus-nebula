interface ConfirmModalProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {

  return (
    <div
      className="fixed inset-0 z-[100] flex-center"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="flex-col confirm-modal-card"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <h3 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h3>
        <p className="confirm-modal-body">{message}</p>
        <div className="flex-v-center justify-end confirm-modal-footer">
          <button
            onClick={onCancel}
            className="confirm-modal-cancel hover-bg-app-3 hover-text-primary"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`confirm-modal-confirm${danger ? ' confirm-modal-confirm--danger' : ''}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
