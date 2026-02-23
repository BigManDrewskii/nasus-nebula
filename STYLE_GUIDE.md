# Nasus Desktop App: Style Guide

**Objective:** To create a user interface that is minimal, professional, and focused, inspired by the Manus aesthetic but with a darker, more distinct personality. The design should feel modern, sharp, and conducive to deep work.

## Color Palette

The palette is intentionally restrained, using near-black backgrounds with a cool blue accent to create a focused, high-contrast environment.

| Role | Hex | Tailwind Class | Description |
| :--- | :--- | :--- | :--- |
| **Background (Primary)** | `#111111` | `bg-neutral-900` | The main application background. A very dark gray, not pure black. |
| **Background (Secondary)** | `#1A1A1A` | `bg-neutral-800` | For sidebars, panels, and other secondary surfaces. |
| **Borders / Dividers** | `#262626` | `border-neutral-700` | Subtle lines to separate UI elements. |
| **Text (Primary)** | `#F5F5F5` | `text-neutral-100` | For main headings and body copy. |
| **Text (Secondary)** | `#A3A3A3` | `text-neutral-400` | For secondary information, placeholders, and disabled states. |
| **Accent (Primary)** | `#3B82F6` | `bg-blue-500` / `text-blue-500` | The primary interactive color for buttons, links, and active states. |
| **Accent (Hover)** | `#2563EB` | `hover:bg-blue-600` | For hover states on primary interactive elements. |
| **Focus Ring** | `#60A5FA` | `ring-blue-400` | For focus indicators on interactive elements. |

## Typography

We will use two fonts to create a clear visual hierarchy: a clean sans-serif for UI elements and a monospace font for all code and technical output.

- **UI Font:** **Inter**
  - **Headings:** `font-semibold` (e.g., `text-lg font-semibold`)
  - **Body:** `font-normal` (e.g., `text-sm`)
- **Code Font:** **JetBrains Mono**
  - Used for all code blocks, terminal output, and inline code snippets.

## Spacing & Sizing

A consistent spacing scale based on a 4px grid should be used for all padding, margins, and layout composition to ensure a harmonious and balanced design.

- **Base Unit:** 4px
- **Examples:**
  - `p-2` (8px)
  - `p-4` (16px)
  - `gap-4` (16px)
  - `rounded-lg` (8px border radius)

## Iconography

- **Style:** Use a single, consistent icon set. **Heroicons (Outline style)** is recommended for its clean, modern aesthetic that matches the UI.
- **Color:** Icons should be monochromatic, using `text-neutral-400` by default and `text-blue-500` for active or accented states.
