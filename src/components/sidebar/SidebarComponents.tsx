/**
 * Shared sidebar components for consistent UI across left and right sidebars.
 * Provides reusable button, section header, and empty state components.
 */

import { Pxi } from '../Pxi'

/* ── Sidebar Button ───────────────────────────────────────────────────────────── */

export interface SidebarButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: string
  children?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  fullWidth?: boolean
  className?: string
  style?: React.CSSProperties
}

export function SidebarButton({
  variant = 'ghost',
  size = 'md',
  icon,
  children,
  onClick,
  disabled = false,
  fullWidth = false,
  className = '',
  style,
}: SidebarButtonProps) {
  const sizes = {
    sm: { height: '26px', padding: '0 8px', fontSize: '11px', iconSize: 9 },
    md: { height: '30px', padding: '0 10px', fontSize: '11px', iconSize: 10 },
    lg: { height: '36px', padding: '0 14px', fontSize: '12px', iconSize: 11 },
  }

  const s = sizes[size]

  // Base styles
  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    height: s.height,
    padding: s.padding,
    fontSize: s.fontSize,
    fontWeight: 500,
    borderRadius: '7px',
    width: fullWidth ? '100%' : 'auto',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.15s ease',
    color: 'var(--tx-primary)',
    border: '1px solid transparent',
    background: 'transparent',
    ...style,
  }

  // Variant styles
  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--amber)',
      color: '#000',
      borderColor: 'var(--amber)',
    },
    secondary: {
      background: 'rgba(255,255,255,0.06)',
      borderColor: 'rgba(255,255,255,0.08)',
    },
    ghost: {
      background: 'transparent',
      borderColor: 'transparent',
    },
    danger: {
      background: 'rgba(239,68,68,0.15)',
      borderColor: 'rgba(239,68,68,0.3)',
      color: '#f87171',
    },
  }

  const finalStyle = { ...baseStyle, ...variantStyles[variant] }

  return (
    <button
      className={`sidebar-button variant-${variant} ${className}`}
      disabled={disabled}
      onClick={onClick}
      style={finalStyle}
    >
      {icon && <Pxi name={icon} size={s.iconSize} />}
      {children}
    </button>
  )
}

/* ── Sidebar Section Header ──────────────────────────────────────────────────── */

export interface SidebarSectionProps {
  label: string
  badge?: number | string
  date?: string
  accent?: boolean
  style?: React.CSSProperties
}

export function SidebarSection({ label, badge, date, accent, style }: SidebarSectionProps) {
  return (
    <div
      className="sidebar-section"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-1-5) 0',
        fontSize: 'var(--text-xs)',
        fontWeight: 500,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: accent ? 'var(--amber)' : 'var(--tx-tertiary)',
        ...style,
      }}
    >
      <span>{label}</span>
      {(badge || date) && (
        <span style={{ fontSize: 'var(--text-2xs)', opacity: 0.8 }}>
          {badge ?? date}
        </span>
      )}
    </div>
  )
}

/* ── Sidebar Empty State ─────────────────────────────────────────────────────── */

export interface SidebarEmptyStateProps {
  icon: string
  title: string
  subtitle?: string
  action?: { label: string; onClick: () => void }
}

export function SidebarEmptyState({ icon, title, subtitle, action }: SidebarEmptyStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8)',
        textAlign: 'center',
        color: 'var(--tx-tertiary)',
      }}
    >
      <Pxi name={icon} size={24} style={{ opacity: 0.4, marginBottom: 'var(--space-3)' }} />
      <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, marginBottom: '4px' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 'var(--text-xs)', maxWidth: '200px' }}>
          {subtitle}
        </div>
      )}
      {action && (
        <SidebarButton
          variant="secondary"
          size="sm"
          onClick={action.onClick}
          style={{ marginTop: 'var(--space-3)' }}
        >
          {action.label}
        </SidebarButton>
      )}
    </div>
  )
}

/* ── Rail Button (for collapsed sidebar state) ─────────────────────────────────── */

export interface RailButtonProps {
  icon: string
  title?: string
  active?: boolean
  amber?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

export function RailButton({ icon, title, active = false, amber = false, onClick, style }: RailButtonProps) {
  const baseStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '8px',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'var(--tx-muted)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'background 0.12s, border-color 0.12s, color 0.12s',
    margin: '1px 0',
    ...style,
  }

  const activeStyle = active ? {
    background: 'oklch(64% 0.214 40.1 / 0.05)',
    borderColor: 'oklch(64% 0.214 40.1 / 0.15)',
  } : {}

  return (
    <button
      className={`sidebar-rail-btn${amber ? ' accent-hover' : ''}${active ? ' active' : ''}`}
      onClick={onClick}
      title={title}
      style={{ ...baseStyle, ...activeStyle }}
    >
      <Pxi name={icon} size={11} />
    </button>
  )
}
