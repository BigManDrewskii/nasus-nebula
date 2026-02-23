/**
 * NasusLogo — the official Nasus icon + optional wordmark.
 *
 * The icon is the provided SVG path scaled to `size` (default 24).
 * The fill defaults to the amber accent (--amber) but can be overridden.
 */

interface NasusLogoProps {
  /** Icon size in px (square) */
  size?: number
  /** Optional fill colour override (defaults to CSS var --amber) */
  fill?: string
  /** If true, renders the NASUS wordmark next to the icon */
  showWordmark?: boolean
  /** Extra class names on the wrapper */
  className?: string
}

export function NasusLogo({
  size = 24,
  fill,
  showWordmark = false,
  className = '',
}: NasusLogoProps) {
  const iconFill = fill ?? 'var(--amber)'

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 256 256"
        fill="none"
        style={{ flexShrink: 0 }}
      >
        <path
          d="M 0 192 C 0 227.346 28.654 256 64 256 L 256 256 L 256 64 C 256 28.654 227.346 0 192 0 L 0 0 Z M 178 128 C 150.386 128 128 150.386 128 178 L 128 192 L 64 192 L 64 128 L 78 128 C 105.614 128 128 105.614 128 78 L 128 64 L 192 64 L 192 128 Z"
          fill={iconFill}
        />
      </svg>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className="font-display font-600 tracking-tight"
          style={{
            fontSize: size * 0.6,
            color: 'var(--amber-light)',
            lineHeight: 1,
          }}
        >
          NASUS
        </span>
      )}
    </div>
  )
}
