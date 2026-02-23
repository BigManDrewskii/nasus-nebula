// Pixel Icon Library helper component
// Usage: <Pxi name="search" size={14} className="text-neutral-400" />
// The `name` maps directly to hn-{name} — see full list at:
// node_modules/@hackernoon/pixel-icon-library/icons/SVG/regular/

interface PxiProps {
  name: string
  size?: number
  className?: string
  style?: React.CSSProperties
}

export function Pxi({ name, size = 14, className = '', style }: PxiProps) {
  return (
    <i
      className={`hn hn-${name} ${className}`}
      style={{ fontSize: size, lineHeight: 1, display: 'inline-block', ...style }}
      aria-hidden="true"
    />
  )
}
