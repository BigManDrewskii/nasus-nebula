# Nasus Theme → shadcn/ui Specification

> A complete translation of the Nasus theme into shadcn/ui compatible CSS variables and Tailwind config.

---

## Color System

### Amber Accent Ramp (Primary Brand Color)

| Token | OKLCH Value | Hex (approx) | Usage |
|-------|-------------|--------------|-------|
| `--primary` | `oklch(64% 0.214 40.1)` | `#eab308` | Main accent, links, active states |
| `--primary-deep` | `oklch(44% 0.154 10.1)` | `#a16207` | Darker accent, hover depth |
| `--primary-mid` | `oklch(54% 0.173 20.1)` | `#ca8a04` | Mid-tone accent |
| `--primary-soft` | `oklch(79% 0.164 30.1)` | `#fde047` | Soft backgrounds |
| `--primary-light` | `oklch(89% 0.135 55.1)` | `#fef08a` | Light backgrounds |
| `--primary-pale` | `oklch(99% 0.116 70.1)` | `#fefce8` | Subtle tints |

### Dark Background Ramp

| Token | OKLCH Value | Hex (approx) | Usage |
|-------|-------------|--------------|-------|
| `--background` | `oklch(20% 0.183 115)` | `#0a0a0a` | App root background |
| `--surface-1` | `oklch(37.4% 0.102 59.2)` | `#171717` | Elevated surfaces |
| `--surface-2` | `oklch(20.7% 0.115 66.1)` | `#0c0c0c` | Panel surfaces |
| `--surface-3` | `oklch(46.2% 0.11 75.5)` | `#262626` | Cards, modals |
| `--surface-4` | `oklch(58.6% 0.093 101)` | `#404040` | Borders, dividers |
| `--surface-5` | `oklch(67.4% 0.079 119)` | `#525252` | Hover states |

### Text Contrast Hierarchy

All values achieve ≥ 4.5:1 WCAG AA on `#0a0a0a` background.

| Token | Value | Luminance | Contrast | Usage |
|-------|-------|-----------|----------|-------|
| `--foreground` | `#e2e2e2` | ~0.774 | 14.6:1 | Headings, key labels |
| `--muted` | `#ababab` | ~0.428 | 7.9:1 | Body copy, chat text |
| `--muted-foreground` | `#757575` | ~0.197 | 4.5:1 | Captions, hints |
| `--decorative` | `#555555` | ~0.099 | 2.7:1 | Decorative only (non-text) |
| `--ghost` | `#3a3a3a` | ~0.049 | 1.7:1 | Decorative only |

### Semantic Colors

```css
/* Destructive / Error */
--destructive: #ef4444;
--destructive-foreground: #f87171;
--destructive-alpha-07: rgba(239, 68, 68, 0.07);
--destructive-alpha-13: rgba(239, 68, 68, 0.13);
--destructive-alpha-22: rgba(239, 68, 68, 0.22);
--destructive-alpha-38: rgba(239, 68, 68, 0.38);
```

### Syntax Highlighting (Code)

```css
--syntax-key: #7dd3fc;
--syntax-string: #86efac;
--syntax-keyword: #c084fc;
--syntax-number: #fb923c;
--syntax-comment: #6b7280;
--syntax-tag: #7dd3fc;
--syntax-attribute: #fbbf24;
```

---

## Typography

### Font Stack

```css
--font-display: 'Unbounded', sans-serif;
--font-sans: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale

| Token | Default | Compact | Usage |
|-------|---------|---------|-------|
| `--text-2xs` | 11px | 9px | Micro labels, timestamps, badges |
| `--text-xs` | 12px | 10px | Captions, tags, pill text |
| `--text-sm` | 13px | 11px | Secondary body, hints |
| `--text-base` | 14px | 12px | Primary body, chat, inputs |
| `--text-md` | 15px | 13px | Sub-headings, task titles |
| `--text-lg` | 16px | 14px | Section/panel headings |
| `--text-xl` | 18px | 16px | Modal/page headings |
| `--text-2xl` | 22px | 20px | Display, wordmark |

### Font Role Utilities

```css
.font-display { font-family: 'Unbounded', sans-serif; letter-spacing: -0.01em; }
.font-body { font-family: 'Inter', system-ui, sans-serif; }
.font-numeric { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
```

---

## Spacing Scale (4pt Grid)

```css
--space-0-5: 2px;
--space-1: 4px;
--space-1-5: 6px;
--space-2: 8px;
--space-2-5: 10px;
--space-3: 12px;
--space-3-5: 14px;
--space-4: 16px;
--space-4-5: 18px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

---

## Icon Sizes

```css
--icon-xs: 10px;
--icon-sm: 12px;
--icon-md: 14px;
--icon-lg: 16px;
--icon-xl: 20px;
```

---

## Border Radius

```css
--radius-sm: 6px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-full: 999px;
```

---

## shadcn/ui globals.css Template

```css
@import url('https://fonts.googleapis.com/css2?family=Unbounded:wght@400;500;600;700&family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;1,14..32,400&family=JetBrains+Mono:wght@400;500&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ── Amber Accent Ramp ── */
    --primary: oklch(64% 0.214 40.1);
    --primary-foreground: #000000;
    --primary-deep: oklch(44% 0.154 10.1);
    --primary-mid: oklch(54% 0.173 20.1);
    --primary-soft: oklch(79% 0.164 30.1);
    --primary-light: oklch(89% 0.135 55.1);
    --primary-pale: oklch(99% 0.116 70.1);

    /* ── Backgrounds ── */
    --background: oklch(20% 0.183 115);
    --foreground: #e2e2e2;
    --card: oklch(20.7% 0.115 66.1);
    --card-foreground: #e2e2e2;
    --popover: oklch(20.7% 0.115 66.1);
    --popover-foreground: #e2e2e2;

    /* ── Surfaces ── */
    --surface-1: oklch(37.4% 0.102 59.2);
    --surface-2: oklch(20.7% 0.115 66.1);
    --surface-3: oklch(46.2% 0.11 75.5);
    --surface-4: oklch(58.6% 0.093 101);
    --surface-5: oklch(67.4% 0.079 119);

    /* ── Text ── */
    --muted: #ababab;
    --muted-foreground: #757575;
    --accent: oklch(79% 0.164 30.1);
    --accent-foreground: #e2e2e2;

    /* ── Destructive ── */
    --destructive: #ef4444;
    --destructive-foreground: #f87171;

    /* ── Borders ── */
    --border: rgba(255, 255, 255, 0.06);
    --input: rgba(255, 255, 255, 0.08);
    --ring: oklch(64% 0.214 40.1);

    /* ── Radius ── */
    --radius: 8px;
  }

  .dark {
    --background: oklch(20% 0.183 115);
    --foreground: #e2e2e2;
  }

  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 14px;
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ── Font Roles ── */
  .font-display {
    font-family: 'Unbounded', sans-serif;
    letter-spacing: -0.01em;
  }

  .font-body {
    font-family: 'Inter', system-ui, sans-serif;
  }

  .font-numeric {
    font-family: 'JetBrains Mono', monospace;
    font-variant-numeric: tabular-nums;
  }
}

@layer utilities {
  /* ── Text Buffer Scroll (multi-line truncation) ── */
  .text-balance {
    text-wrap: balance;
  }
}
```

---

## Tailwind Config Extension

```js
// tailwind.config.js
module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'oklch(var(--primary))',
          foreground: 'oklch(var(--primary-foreground))',
          deep: 'oklch(var(--primary-deep))',
          mid: 'oklch(var(--primary-mid))',
          soft: 'oklch(var(--primary-soft))',
          light: 'oklch(var(--primary-light))',
          pale: 'oklch(var(--primary-pale))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'oklch(var(--destructive))',
          foreground: 'oklch(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        surface: {
          1: 'oklch(var(--surface-1))',
          2: 'oklch(var(--surface-2))',
          3: 'oklch(var(--surface-3))',
          4: 'oklch(var(--surface-4))',
          5: 'oklch(var(--surface-5))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['Unbounded', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': '11px',
      },
      spacing: {
        '0-5': '2px',
        '1-5': '6px',
        '2-5': '10px',
        '3-5': '14px',
        '4-5': '18px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
```

---

## Component-Specific Variables

### Sidebar

```css
--sidebar-bg: rgba(9, 9, 9, 0.4);
--sidebar-border: rgba(255, 255, 255, 0.05);
--sidebar-hover-bg: rgba(255, 255, 255, 0.04);
--sidebar-active-bg: rgba(255, 255, 255, 0.08);
--sidebar-rail-width: 44px;
--sidebar-width: 230px;
--sidebar-padding-x: 10px;
```

### Glass Effect

```css
--glass-bg: rgba(255, 255, 255, 0.025);
--glass-border: rgba(255, 255, 255, 0.06);
--glass-blur: blur(24px);
```

### Mesh Gradient

```css
--mesh-gradient: radial-gradient(at 0% 0%, oklch(25% 0.1 260 / 0.15) 0px, transparent 50%),
                 radial-gradient(at 100% 100%, oklch(64% 0.214 40.1 / 0.08) 0px, transparent 50%);
```

---

## Animations

```css
@keyframes glow {
  0%, 100% { opacity: 0.5; filter: blur(8px); }
  50% { opacity: 0.8; filter: blur(12px); }
}

@keyframes shimmer-glow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(234,179,8,0); }
  50% { box-shadow: 0 0 14px 3px rgba(234,179,8,0.18); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 0 0 oklch(64% 0.214 40.1 / 0.4); }
  50% { box-shadow: 0 0 0 5px oklch(64% 0.214 40.1 / 0); }
}

@keyframes msg-in {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## Breakpoints

```css
--bp-compact: 1024px;
--bp-medium: 1280px;
--bp-spacious: 1600px;
```

---

## Migration Notes

1. **OKLCH Support**: shadcn/ui defaults to HSL. Nasus uses OKLCH for perceptual uniformity. Consider using `@pluging/postcss-oklch` or convert to HSL.

2. **Alpha Variants**: Nasus uses explicit alpha tokens (e.g., `--amber-a08`). In shadcn, use CSS `color-mix()` or Tailwind's opacity modifiers.

3. **Typography Scale**: Nasus has a compact mode (`data-scale="compact"`). Consider implementing via a `.compact` class or CSS variable override.

4. **Syntax Highlighting**: Not part of shadcn core. Use with shiki, prism-react-renderer, or similar.

5. **Glass Effects**: Use `backdrop-filter: blur(24px)` plus semi-transparent backgrounds.

---

## Tailwind v4 Native Syntax

If using Tailwind v4 with native CSS variables:

```css
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --font-display: 'Unbounded', sans-serif;
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --color-primary: oklch(64% 0.214 40.1);
  --color-primary-deep: oklch(44% 0.154 10.1);
  --color-background: oklch(20% 0.183 115);
  --color-foreground: #e2e2e2;
  --color-muted: #ababab;
  --color-muted-foreground: #757575;
  --color-destructive: #ef4444;

  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```
