/**
 * FileParser — Extract text from binary file formats.
 *
 * Supports PDF, CSV, and DOCX. All parsers are lazily imported so they don't
 * bloat the initial bundle. Returns plain UTF-8 text suitable for LLM consumption.
 */

export type ParsedFile = {
  text: string
  /** Human-readable format label */
  format: string
  /** Approximate word count */
  words: number
  /** Any parser warnings */
  warnings?: string[]
}

/**
 * Parse a Uint8Array (binary file contents) given a filename hint.
 * Returns extracted text or throws if the format is unsupported.
 */
export async function parseFileBuffer(
  buffer: Uint8Array,
  filename: string,
): Promise<ParsedFile> {
  const lower = filename.toLowerCase()

  if (lower.endsWith('.pdf')) {
    return parsePdf(buffer)
  }
  if (lower.endsWith('.csv') || lower.endsWith('.tsv')) {
    return parseCsv(buffer, lower.endsWith('.tsv') ? '\t' : ',')
  }
  if (lower.endsWith('.docx')) {
    return parseDocx(buffer)
  }
  if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.json') ||
      lower.endsWith('.yaml') || lower.endsWith('.yml') || lower.endsWith('.toml') ||
      lower.endsWith('.xml') || lower.endsWith('.html') || lower.endsWith('.htm') ||
      lower.endsWith('.js') || lower.endsWith('.ts') || lower.endsWith('.py') ||
      lower.endsWith('.rs') || lower.endsWith('.go') || lower.endsWith('.java') ||
      lower.endsWith('.c') || lower.endsWith('.cpp') || lower.endsWith('.h') ||
      lower.endsWith('.sh') || lower.endsWith('.bash') || lower.endsWith('.zsh')) {
    const text = new TextDecoder().decode(buffer)
    return { text, format: 'text', words: countWords(text) }
  }

  throw new Error(`Unsupported file format: ${filename.split('.').pop() ?? 'unknown'}`)
}

// ── PDF ───────────────────────────────────────────────────────────────────────

async function parsePdf(buffer: Uint8Array): Promise<ParsedFile> {
  const pdfjsLib = await import('pdfjs-dist')
  // Disable worker — use main-thread rendering (safe for Tauri WKWebView)
  pdfjsLib.GlobalWorkerOptions.workerSrc = ''

  const pdf = await pdfjsLib.getDocument({ data: buffer, disableAutoFetch: true }).promise
  const parts: string[] = []
  const warnings: string[] = []

  for (let p = 1; p <= pdf.numPages; p++) {
    try {
      const page = await pdf.getPage(p)
      const content = await page.getTextContent()
        const pageText = content.items
            .filter((item): item is { str: string } & typeof item => 'str' in item && typeof (item as any).str === 'string')
            .map(item => item.str)
          .join(' ')
      if (pageText.trim()) parts.push(`[Page ${p}]\n${pageText.trim()}`)
    } catch (err) {
      warnings.push(`Failed to extract page ${p}: ${String(err)}`)
    }
  }

  const text = parts.join('\n\n')
  return { text, format: 'PDF', words: countWords(text), warnings: warnings.length ? warnings : undefined }
}

// ── CSV ───────────────────────────────────────────────────────────────────────

async function parseCsv(buffer: Uint8Array, delimiter: string): Promise<ParsedFile> {
  const Papa = (await import('papaparse')).default
  const raw = new TextDecoder().decode(buffer)

  const result = Papa.parse<string[]>(raw, {
    delimiter,
    header: false,
    skipEmptyLines: true,
    preview: 500, // Cap at 500 rows to stay within LLM context
  })

  const rows = result.data as string[][]
  if (rows.length === 0) return { text: '(empty CSV)', format: 'CSV', words: 0 }

  // Format as markdown table if small enough, otherwise plain
  if (rows.length <= 200 && rows[0].length <= 20) {
    const header = rows[0].map(c => String(c).replace(/\|/g, '\\|'))
    const sep = header.map(() => '---')
    const body = rows.slice(1).map(r =>
      r.map(c => String(c).replace(/\|/g, '\\|'))
    )
    const table = [
      `| ${header.join(' | ')} |`,
      `| ${sep.join(' | ')} |`,
      ...body.map(r => `| ${r.join(' | ')} |`),
    ].join('\n')
    const text = `CSV data (${rows.length} rows × ${rows[0].length} columns):\n\n${table}`
    return { text, format: 'CSV', words: countWords(text) }
  }

  // Fallback: plain text representation
  const text = rows.map(r => r.join(delimiter)).join('\n')
  return {
    text: `CSV data (${rows.length} rows, truncated at 500):\n\n${text}`,
    format: 'CSV',
    words: countWords(text),
  }
}

// ── DOCX ──────────────────────────────────────────────────────────────────────

async function parseDocx(buffer: Uint8Array): Promise<ParsedFile> {
  const mammoth = await import('mammoth')
  const result = await mammoth.extractRawText({ arrayBuffer: buffer.buffer as ArrayBuffer })
  const text = result.value
  const warnings = result.messages
    .filter(m => m.type === 'warning')
    .map(m => m.message)
  return { text, format: 'DOCX', words: countWords(text), warnings: warnings.length ? warnings : undefined }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Check if a filename is a supported binary format.
 */
export function isSupportedBinaryFormat(filename: string): boolean {
  const lower = filename.toLowerCase()
  return lower.endsWith('.pdf') || lower.endsWith('.docx') ||
         lower.endsWith('.csv') || lower.endsWith('.tsv')
}
