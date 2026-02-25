/**
 * Stack template pre-seeder.
 *
 * When the agent starts a UI/web/code task, detect the stack from the user's
 * message and pre-seed the workspace with a ready-to-use starter file.
 * This eliminates the wasted turns where the agent writes config boilerplate
 * before doing any actual work.
 *
 * The templates are CDN-first (no npm needed) so they render immediately in
 * the Output panel preview without any build step.
 */

import { getWorkspace } from './tools'

// ── Stack detection ───────────────────────────────────────────────────────────

type StackId =
  | 'nextjs-shadcn'
  | 'react-spa'
  | 'html-tailwind'
  | 'html-plain'
  | 'python-script'
  | 'python-flask'

interface DetectedStack {
  id: StackId
  label: string
  contextInjection: string
}

const STACK_PATTERNS: Array<{ id: StackId; label: string; patterns: RegExp[]; contextInjection: string }> = [
  {
    id: 'nextjs-shadcn',
    label: 'Next.js + shadcn/ui',
    patterns: [
      /next\.?js/i, /shadcn/i, /next\s+(?:js|react)/i,
      /(?:landing|hero|ui)\s+(?:page|section|component).*(?:next|react|shadcn)/i,
      /(?:next|react|shadcn).*(?:landing|hero|ui)\s+(?:page|section|component)/i,
    ],
    contextInjection:
      'Stack detected: Next.js + shadcn/ui. Template pre-loaded at /workspace/index.html — ' +
      'this is a self-contained CDN version that renders identically to a shadcn Next.js app. ' +
      'Start writing component code immediately. Do NOT run npm, create package.json, or scaffold a project.',
  },
  {
    id: 'react-spa',
    label: 'React SPA',
    patterns: [
      /\breact\b.*(?:app|component|spa|page)/i,
      /(?:app|component|spa|page).*\breact\b/i,
      /create.react/i,
    ],
    contextInjection:
      'Stack detected: React SPA. Template pre-loaded at /workspace/index.html with React + Babel CDN. ' +
      'Write components directly in <script type="text/babel"> blocks. No npm needed.',
  },
  {
    id: 'html-tailwind',
    label: 'HTML + Tailwind',
    patterns: [
      /tailwind/i,
      /(?:html|webpage|website|landing|hero)\s+(?:page|site|app)/i,
      /(?:page|site|app)\s+(?:html|webpage|website|landing|hero)/i,
      /build.+(?:website|webpage|landing|hero)/i,
      /(?:website|webpage|landing|hero).+build/i,
      /clone.+(?:style|design|aesthetic|look)/i,
      /(?:style|design|aesthetic|look).+clone/i,
    ],
    contextInjection:
      'Stack detected: HTML + Tailwind CSS. Template pre-loaded at /workspace/index.html with Tailwind CDN. ' +
      'Write HTML/CSS directly. No build step needed — the file renders immediately.',
  },
  {
    id: 'python-script',
    label: 'Python script',
    patterns: [
      /\bpython\b.*(?:script|analyze|parse|data|csv|json)/i,
      /(?:script|analyze|parse|data|csv|json).*\bpython\b/i,
      /write.*\.py\b/i,
    ],
    contextInjection:
      'Stack detected: Python script. Template pre-loaded at /workspace/script.py. ' +
      'Write Python code directly. Use python_execute to run it.',
  },
  {
    id: 'python-flask',
    label: 'Python Flask API',
    patterns: [
      /\bflask\b/i,
      /python.*(?:api|server|backend|rest)/i,
      /(?:api|server|backend|rest).*python/i,
    ],
    contextInjection:
      'Stack detected: Python Flask API. Template pre-loaded at /workspace/app.py and /workspace/requirements.txt. ' +
      'Write Flask routes directly into app.py. Use python_execute to test individual functions.',
  },
]

export function detectStack(userMessage: string): DetectedStack | null {
  for (const stack of STACK_PATTERNS) {
    if (stack.patterns.some((re) => re.test(userMessage))) {
      return { id: stack.id, label: stack.label, contextInjection: stack.contextInjection }
    }
  }
  return null
}

// ── Template content ──────────────────────────────────────────────────────────

const NEXTJS_SHADCN_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
          colors: {
            border: 'hsl(214.3 31.8% 91.4%)',
            background: 'hsl(0 0% 100%)',
            foreground: 'hsl(222.2 84% 4.9%)',
            primary: { DEFAULT: 'hsl(222.2 47.4% 11.2%)', foreground: 'hsl(210 40% 98%)' },
            muted: { DEFAULT: 'hsl(210 40% 96.1%)', foreground: 'hsl(215.4 16.3% 46.9%)' },
            accent: { DEFAULT: 'hsl(210 40% 96.1%)', foreground: 'hsl(222.2 47.4% 11.2%)' },
          },
          borderRadius: { lg: '0.5rem', md: '0.375rem', sm: '0.25rem' },
        }
      }
    }
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
    /* shadcn-style button */
    .btn { display:inline-flex;align-items:center;justify-content:center;border-radius:0.375rem;font-size:0.875rem;font-weight:500;height:2.5rem;padding:0 1rem;cursor:pointer;border:none;transition:background 0.15s,opacity 0.15s; }
    .btn-primary { background:hsl(222.2,47.4%,11.2%);color:hsl(210,40%,98%); }
    .btn-primary:hover { opacity:0.9; }
    .btn-outline { background:transparent;border:1px solid hsl(214.3,31.8%,91.4%);color:hsl(222.2,84%,4.9%); }
    .btn-outline:hover { background:hsl(210,40%,96.1%); }
    .btn-ghost { background:transparent;color:hsl(222.2,84%,4.9%); }
    .btn-ghost:hover { background:hsl(210,40%,96.1%); }
    /* shadcn-style badge */
    .badge { display:inline-flex;align-items:center;border-radius:9999px;border:1px solid transparent;padding:0.125rem 0.625rem;font-size:0.75rem;font-weight:600; }
    .badge-secondary { background:hsl(210,40%,96.1%);color:hsl(215.4,16.3%,46.9%);border-color:hsl(214.3,31.8%,91.4%); }
  </style>
</head>
<body class="bg-background text-foreground antialiased">
  <!-- Page content goes here -->
  <main id="root"></main>
  <script>
    // Vanilla JS component helpers (mirrors React component patterns)
    function h(tag, props, ...children) {
      const el = document.createElement(tag)
      if (props) Object.entries(props).forEach(([k, v]) => {
        if (k === 'className') el.className = v
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v)
        else el.setAttribute(k, v)
      })
      children.flat().forEach(c => el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c))
      return el
    }
    // Mount point
    const root = document.getElementById('root')
  </script>
</body>
</html>`

const REACT_SPA_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>React App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
  <style> * { box-sizing: border-box; } body { font-family: 'Inter', sans-serif; margin: 0; } </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    const { useState, useEffect } = React

    function App() {
      return (
        <div className="min-h-screen bg-white">
          {/* Components go here */}
        </div>
      )
    }

    ReactDOM.createRoot(document.getElementById('root')).render(<App />)
  </script>
</body>
</html>`

const HTML_TAILWIND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Page</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
  </style>
</head>
<body>
  <!-- Content goes here -->
</body>
</html>`

const PYTHON_SCRIPT = `#!/usr/bin/env python3
"""
Script: describe purpose here
"""

import json
import sys


def main():
    print("Script ready")


if __name__ == "__main__":
    main()
`

const PYTHON_FLASK = `from flask import Flask, jsonify, request

app = Flask(__name__)


@app.route("/")
def index():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
`

const FLASK_REQUIREMENTS = `flask>=3.0.0
`

// ── Seeder ────────────────────────────────────────────────────────────────────

export function seedStackTemplate(taskId: string, stackId: StackId): void {
  const ws = getWorkspace(taskId)

  switch (stackId) {
    case 'nextjs-shadcn':
      if (!ws.has('index.html')) ws.set('index.html', NEXTJS_SHADCN_HTML)
      break
    case 'react-spa':
      if (!ws.has('index.html')) ws.set('index.html', REACT_SPA_HTML)
      break
    case 'html-tailwind':
    case 'html-plain':
      if (!ws.has('index.html')) ws.set('index.html', HTML_TAILWIND_HTML)
      break
    case 'python-script':
      if (!ws.has('script.py')) ws.set('script.py', PYTHON_SCRIPT)
      break
    case 'python-flask':
      if (!ws.has('app.py')) ws.set('app.py', PYTHON_FLASK)
      if (!ws.has('requirements.txt')) ws.set('requirements.txt', FLASK_REQUIREMENTS)
      break
  }
}
