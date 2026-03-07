// Pixel Icon component using pixelarticons
// Usage: <Pxi name="search" size={14} className="text-neutral-400" />
//
// Uses direct named imports from pixelarticons/react for proper tree-shaking.
// All icons are registered in iconRegistry.ts — add new ones there, not here.

import type { ComponentType, SVGProps } from 'react'
import { getIconComponent } from './iconRegistry'
import { createLogger } from '../lib/logger'

const log = createLogger('Pxi')

interface PxiProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
  title?: string
}

const Placeholder = ({ size, className, style, label }: { size: number; className?: string; style?: React.CSSProperties; label: string }) => (
  <span
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      flexShrink: 0,
      ...style,
    }}
    title={label}
  >
    <span
      style={{
        width: Math.max(2, size / 4),
        height: Math.max(2, size / 4),
        backgroundColor: 'currentColor',
        borderRadius: '50%',
        opacity: 0.3,
      }}
    />
  </span>
)

export function Pxi({ name, size = 12, className = '', style, title }: PxiProps) {
  const Icon = getIconComponent(name) as ComponentType<SVGProps<SVGSVGElement>> | null

  if (!Icon) {
      if (import.meta.env.DEV) {
        log.warn(`Unknown icon: "${name}"`)
      }
    return <Placeholder size={size} className={className} style={style} label={`Missing icon: ${name}`} />
  }

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        flexShrink: 0,
        ...style,
      }}
        title={title}
        role={title ? 'img' : undefined}
        aria-label={title}
        aria-hidden={!title}
      >
      <Icon
        width={size}
        height={size}
        fill="currentColor"
      />
    </span>
  )
}
