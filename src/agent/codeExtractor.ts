/**
 * codeExtractor.ts
 *
 * Parses fenced code blocks from LLM markdown responses, infers appropriate
 * filenames, writes them to the task workspace, and emits agent step events
 * so the chat UI shows per-file progress (like a real agent using write_file).
 */

import { workspaceManager } from './workspace/WorkspaceManager'
import type { AgentStep } from '../store/appSlice'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ExtractedFile {
  filename: string
  language: string
  content: string
  lineCount: number
}

// ─── Filename inference ───────────────────────────────────────────────────────

const LANG_DEFAULTS: Record<string, string> = {
  html:       'index.html',
  htm:        'index.html',
  css:        'styles.css',
  scss:       'styles.scss',
  sass:       'styles.sass',
  less:       'styles.less',
  javascript: 'script.js',
  js:         'script.js',
  typescript: 'app.ts',
  ts:         'app.ts',
  tsx:        'App.tsx',
  jsx:        'App.jsx',
  python:     'main.py',
  py:         'main.py',
  bash:       'run.sh',
  shell:      'run.sh',
  sh:         'run.sh',
  zsh:        'run.sh',
  rust:       'main.rs',
  rs:         'main.rs',
  go:         'main.go',
  java:       'Main.java',
  c:          'main.c',
  cpp:        'main.cpp',
  sql:        'query.sql',
  json:       'data.json',
  yaml:       'config.yaml',
  yml:        'config.yaml',
  toml:       'config.toml',
  markdown:   'README.md',
  md:         'README.md',
  text:       'output.txt',
  txt:        'output.txt',
  xml:        'data.xml',
  svg:        'image.svg',
}

/** Comment patterns that hint at the intended filename inside the code itself.
 *  Ordered from most-specific (keyword prefix) to bare filename fallback. */
const FILENAME_HINT_RE = [
  // Explicit keyword: <!-- filename: index.html --> / // filename: app.ts / # filename: main.py
  /^<!--\s*(?:filename|file|save\s+as)[:\s]+([^\s>]+)\s*-->/im,
  /^\/\*\s*(?:filename|file|save\s+as)[:\s]+([^\s*]+)\s*\*\//im,
  /^\/\/\s*(?:filename|file|save\s+as)[:\s]+(\S+)/im,
  /^#\s*(?:filename|file|save\s+as)[:\s]+(\S+)/im,
  // Bare filename in a comment: <!-- index.html --> / // script.js / /* styles.css */ / # main.py
  /^<!--\s*([\w][\w.\-]*\.[\w]+)\s*-->/im,
  /^\/\*\s*([\w][\w.\-]*\.[\w]+)\s*\*\//im,
  /^\/\/\s*([\w][\w.\-]*\.[\w]+)\s*$/im,
  /^#\s*([\w][\w.\-]*\.[\w]+)\s*$/im,
]

function extractFilenameHint(code: string): string | null {
  const firstLines = code.split('\n').slice(0, 3).join('\n')
  for (const re of FILENAME_HINT_RE) {
    const m = re.exec(firstLines)
    if (m) return m[1].trim()
  }
  return null
}

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._\-]/g, '_').replace(/^\./, '_')
}

function inferFilename(
  language: string,
  code: string,
  seen: Set<string>,
): string {
  const hint = extractFilenameHint(code)
  if (hint) {
    const safe = safeName(hint)
    if (!seen.has(safe)) return safe
  }

  const lang = language.toLowerCase()
  const base = LANG_DEFAULTS[lang] ?? `file.${lang || 'txt'}`
  if (!seen.has(base)) return base

  // Deduplicate: file.html → file2.html → file3.html
  const dot = base.lastIndexOf('.')
  const stem = dot >= 0 ? base.slice(0, dot) : base
  const ext  = dot >= 0 ? base.slice(dot)    : ''
  for (let i = 2; i < 100; i++) {
    const candidate = `${stem}${i}${ext}`
    if (!seen.has(candidate)) return candidate
  }
  return `${stem}_${Date.now()}${ext}`
}

// ─── Code block parser ────────────────────────────────────────────────────────

const CODE_FENCE_RE = /^```(\w*)\n([\s\S]*?)^```/gm

interface RawBlock {
  language: string
  code: string
}

function parseCodeBlocks(markdown: string): RawBlock[] {
  const blocks: RawBlock[] = []
  let match: RegExpExecArray | null
  CODE_FENCE_RE.lastIndex = 0
  while ((match = CODE_FENCE_RE.exec(markdown)) !== null) {
    const language = match[1].trim()
    const code = match[2]
    // Skip completely empty blocks
    const meaningful = code.trim().split('\n').filter(l => l.trim().length > 0).length
    if (meaningful < 1) continue
    blocks.push({ language, code: code.trimEnd() })
  }
  return blocks
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Parse code blocks from an LLM response, write them to the workspace,
 * and emit tool_call / result agent steps so the chat shows live progress.
 *
 * Returns the list of files written (empty if none found).
 */
export async function extractAndWriteCodeFiles(
  responseText: string,
  taskId: string,
  emitStep: (step: AgentStep) => void,
): Promise<ExtractedFile[]> {
  const raw = parseCodeBlocks(responseText)
  if (raw.length === 0) return []

  const seen = new Set<string>()
  const written: ExtractedFile[] = []

  for (let i = 0; i < raw.length; i++) {
    const { language, code } = raw[i]
    const filename = inferFilename(language, code, seen)
    seen.add(filename)
    const lineCount = code.split('\n').length

    // Emit a tool-call step so the UI shows "Writing filename..."
    emitStep({
      id: `ws-write-${filename}`,
      type: 'tool',
      content: `Writing \`${filename}\``,
      tool: 'write_file',
      toolInput: { path: filename, lines: lineCount },
      timestamp: new Date().toISOString(),
    })

    try {
      await workspaceManager.writeFile(taskId, filename, code)

      // Emit a result step confirming success
      emitStep({
        id: `ws-done-${filename}`,
        type: 'result',
        content: `Created \`${filename}\` — ${lineCount} lines`,
        tool: 'write_file',
        toolOutput: `${lineCount} lines written`,
        timestamp: new Date().toISOString(),
      })

      written.push({ filename, language, content: code, lineCount })
    } catch (err) {
      emitStep({
        id: `ws-err-${filename}`,
        type: 'error',
        content: `Failed to write \`${filename}\`: ${err instanceof Error ? err.message : String(err)}`,
        tool: 'write_file',
        timestamp: new Date().toISOString(),
      })
    }
  }

  return written
}
