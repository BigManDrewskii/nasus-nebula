/**
 * HTML → readable text extraction.
 *
 * Strips DOM noise (scripts, nav, ads, etc.) and converts the main content
 * of a web page into clean markdown-ish text the agent can reason over.
 * Runs entirely in-browser using DOMParser — no backend needed.
 */

export interface ExtractedContent {
  title: string
  description: string
  content: string
  url: string
  wordCount: number
  wasTruncated: boolean
}

export function extractReadableContent(
  html: string,
  url: string,
  options: {
    maxLength?: number      // Max chars to return (default 12000 ≈ ~3k tokens)
    includeLinks?: boolean  // Preserve hyperlinks as [text](url)
  } = {},
): ExtractedContent {
  const { maxLength = 12000, includeLinks = true } = options

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')

    // ── Metadata ──────────────────────────────────────────────────────────────
    const title =
      doc.querySelector('meta[property="og:title"]')?.getAttribute('content')?.trim() ||
      doc.querySelector('title')?.textContent?.trim() ||
      ''
    const description =
      doc.querySelector('meta[property="og:description"]')?.getAttribute('content')?.trim() ||
      doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() ||
      ''

    // ── Strip noise ───────────────────────────────────────────────────────────
    const removeSelectors = [
      'script', 'style', 'noscript', 'iframe', 'svg', 'canvas',
      'nav', 'header', 'footer',
      '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]', '[role="complementary"]',
      '.nav', '.navbar', '.header', '.footer', '.sidebar', '.side-bar',
      '.menu', '.breadcrumb', '.breadcrumbs', '.pagination',
      '.ad', '.ads', '.advert', '.advertisement', '.adsbygoogle',
      '.cookie-banner', '.cookie-notice', '.cookie-consent', '.cookie-bar',
      '.popup', '.modal', '.overlay', '.dialog',
      '.social-share', '.share-buttons', '.social',
      '.comments', '.comment-section', '#comments',
      '.related-posts', '.related-articles', '.recommended',
      '.newsletter', '.subscribe', '.subscription',
      '.print-only', '[aria-hidden="true"]',
      '[data-ad]', '[data-advertisement]',
    ]

    for (const sel of removeSelectors) {
      try {
        doc.querySelectorAll(sel).forEach((el) => el.remove())
      } catch { /* invalid selector — skip */ }
    }

    // ── Find main content ─────────────────────────────────────────────────────
    const container = findMainContent(doc)

    // ── Convert to readable text ──────────────────────────────────────────────
    const raw = elementToText(container, { includeLinks, baseUrl: url })

    // ── Cleanup whitespace ────────────────────────────────────────────────────
    const cleaned = raw
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/^\s+$/gm, '')
      .trim()

    // ── Truncate ──────────────────────────────────────────────────────────────
    const wasTruncated = cleaned.length > maxLength
    const content = wasTruncated
      ? cleaned.slice(0, maxLength) + `\n\n[Content truncated — showing first ~${Math.round(maxLength / 4)} tokens]`
      : cleaned

    return {
      title,
      description,
      content,
      url,
      wordCount: content.split(/\s+/).filter(Boolean).length,
      wasTruncated,
    }
  } catch {
    // Fallback: brute-force strip all tags
    const content = bruteForceExtract(html, maxLength)
    return { title: '', description: '', content, url, wordCount: 0, wasTruncated: true }
  }
}

// ── Heuristic: find the best content container ────────────────────────────────

function findMainContent(doc: Document): Element {
  // Priority: semantic elements
  for (const sel of ['main', 'article', '[role="main"]', '#main', '#content', '.content', '.post', '.article']) {
    const el = doc.querySelector(sel)
    if (el && (el.textContent?.trim().length ?? 0) > 200) return el
  }

  // Fallback: find densest text block
  const candidates = Array.from(doc.querySelectorAll('div, section'))
  let best: Element = doc.body
  let bestScore = 0

  for (const el of candidates) {
    const text = el.textContent?.trim() ?? ''
    if (text.length < 200 || text.length > 500000) continue

    // Penalise elements that are mostly navigation links
    const linkChars = Array.from(el.querySelectorAll('a')).reduce(
      (s, a) => s + (a.textContent?.length ?? 0), 0,
    )
    if (linkChars / text.length > 0.6) continue

    const score = text.length / Math.max(Math.log2((el.children.length || 1) + 1), 1)
    if (score > bestScore) { bestScore = score; best = el }
  }

  return best
}

// ── Recursive DOM → text converter ───────────────────────────────────────────

function elementToText(
  el: Element,
  opts: { includeLinks: boolean; baseUrl: string },
): string {
  const parts: string[] = []
  walkNode(el, opts, parts, 0)
  return parts.join('')
}

function walkNode(
  node: Node,
  opts: { includeLinks: boolean; baseUrl: string },
  out: string[],
  depth: number,
): void {
  if (node.nodeType === Node.TEXT_NODE) {
    const t = node.textContent?.replace(/\s+/g, ' ') ?? ''
    if (t.trim()) out.push(t)
    return
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return
  const el = node as Element
  const tag = el.tagName.toLowerCase()

  if (el.getAttribute('hidden') !== null) return
  if (el.getAttribute('aria-hidden') === 'true') return

  switch (tag) {
    case 'h1': { out.push('\n\n# ' + getInnerText(el) + '\n\n'); return }
    case 'h2': { out.push('\n\n## ' + getInnerText(el) + '\n\n'); return }
    case 'h3': { out.push('\n\n### ' + getInnerText(el) + '\n\n'); return }
    case 'h4':
    case 'h5':
    case 'h6': { out.push('\n\n#### ' + getInnerText(el) + '\n\n'); return }

    case 'p': {
      out.push('\n\n')
      walkChildren(el, opts, out, depth)
      out.push('\n\n')
      return
    }

    case 'br': { out.push('\n'); return }
    case 'hr': { out.push('\n\n---\n\n'); return }

    case 'li': {
      out.push('\n• ')
      walkChildren(el, opts, out, depth)
      return
    }

    case 'blockquote': {
      out.push('\n\n> ' + getInnerText(el).replace(/\n/g, '\n> ') + '\n\n')
      return
    }

    case 'pre': {
      out.push('\n\n```\n' + (el.textContent?.trim() ?? '') + '\n```\n\n')
      return
    }

    case 'code': {
      if (el.closest('pre')) { walkChildren(el, opts, out, depth); return }
      out.push('`' + (el.textContent ?? '') + '`')
      return
    }

    case 'a': {
      const href = el.getAttribute('href')
      const text = getInnerText(el)
      if (!text.trim()) return
      if (opts.includeLinks && href && !href.startsWith('javascript:') && !href.startsWith('#')) {
        const abs = toAbsoluteUrl(href, opts.baseUrl)
        out.push(`[${text}](${abs})`)
      } else {
        out.push(text)
      }
      return
    }

    case 'img': {
      const alt = el.getAttribute('alt')?.trim()
      if (alt) out.push(`[image: ${alt}]`)
      return
    }

    case 'table': {
      out.push('\n\n')
      walkChildren(el, opts, out, depth)
      out.push('\n\n')
      return
    }

    case 'tr': {
      out.push('\n')
      walkChildren(el, opts, out, depth)
      return
    }

    case 'td':
    case 'th': {
      walkChildren(el, opts, out, depth)
      out.push(' | ')
      return
    }

    // Skip entirely
    case 'script':
    case 'style':
    case 'noscript':
    case 'iframe':
    case 'svg':
    case 'canvas':
      return

    default:
      walkChildren(el, opts, out, depth + 1)
  }
}

function walkChildren(
  el: Element,
  opts: { includeLinks: boolean; baseUrl: string },
  out: string[],
  depth: number,
): void {
  for (const child of Array.from(el.childNodes)) {
    walkNode(child, opts, out, depth)
  }
}

function getInnerText(el: Element): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim()
}

function toAbsoluteUrl(href: string, base: string): string {
  try {
    return new URL(href, base).href
  } catch {
    return href
  }
}

// ── Brute-force fallback ──────────────────────────────────────────────────────

function bruteForceExtract(html: string, maxLength: number): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, ' ')
    .trim()

  return stripped.length > maxLength
    ? stripped.slice(0, maxLength) + '\n[truncated]'
    : stripped
}
