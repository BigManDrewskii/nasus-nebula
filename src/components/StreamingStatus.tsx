interface StreamingStatusProps {
  phase: 'idle' | 'processing' | 'streaming' | 'done'
  currentTool?: string
  className?: string
}

export function StreamingStatus({ phase, currentTool, className = '' }: StreamingStatusProps) {
  if (phase === 'idle' || phase === 'done') {
    return null
  }

  const isStreaming = phase === 'streaming'
  const dotColor = isStreaming ? 'var(--amber)' : 'var(--tx-tertiary)'
  const textColor = isStreaming ? 'var(--tx-secondary)' : 'var(--tx-tertiary)'

  return (
    <div
      className={`streaming-status ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        color: textColor,
        fontWeight: 500,
      }}
      role="status"
      aria-live="polite"
      aria-label={isStreaming ? `Streaming${currentTool ? ` using ${currentTool}` : ''}` : 'Processing'}
    >
      {/* Pulsing dot */}
      <span
        style={{
          display: 'inline-block',
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          animation: 'streamingPulse 1.5s ease-in-out infinite',
          flexShrink: 0,
        }}
        aria-hidden="true"
      />

      {/* Text label */}
      <span>
        {isStreaming && currentTool ? `Using ${currentTool}…` : 'Thinking…'}
      </span>

    </div>
  )
}
