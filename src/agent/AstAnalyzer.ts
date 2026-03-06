/**
 * AstAnalyzer — Tree-sitter-based AST analysis for source code files.
 *
 * Provides:
 *  - Symbol extraction (functions, classes, methods, imports, exports)
 *  - Complexity estimation (cyclomatic-style: branches + loops)
 *  - Dependency list (import/require statements)
 *  - Compact structural summary suitable for LLM context injection
 *
 * Language grammars are loaded lazily from /public/tree-sitter/*.wasm.
 * The core runtime (web-tree-sitter.wasm) is also loaded lazily.
 */

import type Parser from 'web-tree-sitter'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AstSymbol {
  kind: 'function' | 'class' | 'method' | 'variable' | 'import' | 'export' | 'type'
  name: string
  /** 1-based line number */
  line: number
  /** For methods: the parent class name */
  parent?: string
}

export interface AstAnalysis {
  language: string
  symbols: AstSymbol[]
  dependencies: string[]
  /** Approximate cyclomatic complexity (branches + loops + 1) */
  complexity: number
  /** Structural summary text for LLM consumption */
  summary: string
  errors: string[]
}

// ── Language map ──────────────────────────────────────────────────────────────

const EXT_TO_LANG: Record<string, string> = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  rs: 'rust',
  go: 'go',
  java: 'java',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  c: 'c',
  h: 'c',
}

export function getLanguageForFile(filename: string): string | null {
  const ext = filename.split('.').pop()?.toLowerCase() ?? ''
  return EXT_TO_LANG[ext] ?? null
}

// ── Singleton state ───────────────────────────────────────────────────────────

let parserInitialized = false
let ParserClass: typeof Parser | null = null
const languageCache = new Map<string, Parser.Language>()

async function getParser(): Promise<typeof Parser> {
  if (ParserClass) return ParserClass
  const mod = await import('web-tree-sitter')
  const Cls = (mod.default ?? mod) as typeof Parser
  await Cls.init({ locateFile: () => '/tree-sitter/web-tree-sitter.wasm' })
  ParserClass = Cls
  parserInitialized = true
  return Cls
}

async function getLanguage(lang: string): Promise<Parser.Language> {
  if (languageCache.has(lang)) return languageCache.get(lang)!
  const Cls = await getParser()
  const language = await Cls.Language.load(`/tree-sitter/tree-sitter-${lang}.wasm`)
  languageCache.set(lang, language)
  return language
}

// ── Core analysis ─────────────────────────────────────────────────────────────

/**
 * Analyse source code and return structured symbol/dependency information.
 */
export async function analyzeCode(
  source: string,
  filename: string,
): Promise<AstAnalysis> {
  const lang = getLanguageForFile(filename)
  if (!lang) {
    return {
      language: 'unknown',
      symbols: [],
      dependencies: [],
      complexity: 1,
      summary: `Unsupported language for file: ${filename}`,
      errors: [`No tree-sitter grammar for extension: ${filename.split('.').pop()}`],
    }
  }

  try {
    const Cls = await getParser()
    const language = await getLanguage(lang)
    const parser = new Cls()
    parser.setLanguage(language)
    const tree = parser.parse(source)

    const symbols = extractSymbols(tree.rootNode, lang)
    const dependencies = extractDependencies(tree.rootNode, lang)
    const complexity = estimateComplexity(tree.rootNode)
    const errors = tree.rootNode.hasError
      ? ['Syntax errors detected in source (parse tree may be incomplete)']
      : []

    const summary = buildSummary(filename, lang, symbols, dependencies, complexity)

    return { language: lang, symbols, dependencies, complexity, summary, errors }
  } catch (err) {
    return {
      language: lang,
      symbols: [],
      dependencies: [],
      complexity: 1,
      summary: `Failed to parse ${filename}: ${err}`,
      errors: [String(err)],
    }
  }
}

// ── Symbol extraction ──────────────────────────────────────────────────────────

function extractSymbols(root: Parser.SyntaxNode, lang: string): AstSymbol[] {
  const symbols: AstSymbol[] = []

  function walk(node: Parser.SyntaxNode, parentClass?: string): void {
    const t = node.type
    const line = node.startPosition.row + 1

    if (lang === 'javascript' || lang === 'typescript') {
      if (t === 'function_declaration' || t === 'function') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        if (name) symbols.push({ kind: 'function', name, line, parent: parentClass })
      } else if (t === 'arrow_function') {
        // named via variable_declarator parent
      } else if (t === 'class_declaration' || t === 'class') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        if (name) {
          symbols.push({ kind: 'class', name, line })
          for (const child of node.children) walk(child, name)
          return
        }
      } else if (t === 'method_definition') {
        const name = childFieldText(node, 'name') ?? childText(node, 'property_identifier')
        if (name) symbols.push({ kind: 'method', name, line, parent: parentClass })
      } else if (t === 'variable_declarator') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        const init = node.childForFieldName('value')
        if (name && init && (init.type === 'arrow_function' || init.type === 'function')) {
          symbols.push({ kind: 'function', name, line, parent: parentClass })
        } else if (name) {
          symbols.push({ kind: 'variable', name, line, parent: parentClass })
        }
      } else if (t === 'import_statement' || t === 'import_declaration') {
        const src = node.childForFieldName('source') ?? childText(node, 'string')
        if (src) symbols.push({ kind: 'import', name: cleanString(src), line })
      } else if (t === 'export_statement' || t === 'export_declaration') {
        const name = childText(node, 'identifier') ?? 'default'
        symbols.push({ kind: 'export', name, line })
      } else if ((lang === 'typescript') && (t === 'type_alias_declaration' || t === 'interface_declaration')) {
        const name = childFieldText(node, 'name') ?? childText(node, 'type_identifier')
        if (name) symbols.push({ kind: 'type', name, line })
      }
    } else if (lang === 'python') {
      if (t === 'function_definition') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        if (name) symbols.push({ kind: 'function', name, line, parent: parentClass })
      } else if (t === 'class_definition') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        if (name) {
          symbols.push({ kind: 'class', name, line })
          for (const child of node.children) walk(child, name)
          return
        }
      } else if (t === 'import_statement' || t === 'import_from_statement') {
        const mod = childText(node, 'dotted_name') ?? childText(node, 'identifier')
        if (mod) symbols.push({ kind: 'import', name: mod, line })
      }
    } else if (lang === 'rust') {
      if (t === 'function_item') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        if (name) symbols.push({ kind: 'function', name, line, parent: parentClass })
      } else if (t === 'struct_item' || t === 'enum_item') {
        const name = childFieldText(node, 'name') ?? childText(node, 'type_identifier')
        if (name) symbols.push({ kind: 'class', name, line })
      } else if (t === 'impl_item') {
        const name = childText(node, 'type_identifier')
        for (const child of node.children) walk(child, name ?? parentClass)
        return
      } else if (t === 'use_declaration') {
        const path = node.text.replace(/^use\s+/, '').replace(/;$/, '').trim()
        symbols.push({ kind: 'import', name: path, line })
      }
    } else if (lang === 'go') {
      if (t === 'function_declaration') {
        const name = childFieldText(node, 'name') ?? childText(node, 'field_identifier')
        if (name) symbols.push({ kind: 'function', name, line })
      } else if (t === 'method_declaration') {
        const name = childFieldText(node, 'name') ?? childText(node, 'field_identifier')
        if (name) symbols.push({ kind: 'method', name, line })
      } else if (t === 'type_declaration') {
        const name = childText(node, 'type_identifier')
        if (name) symbols.push({ kind: 'type', name, line })
      } else if (t === 'import_declaration') {
        const path = childText(node, 'interpreted_string_literal')
        if (path) symbols.push({ kind: 'import', name: cleanString(path), line })
      }
    } else if (lang === 'java') {
      if (t === 'method_declaration') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        if (name) symbols.push({ kind: 'method', name, line, parent: parentClass })
      } else if (t === 'class_declaration' || t === 'interface_declaration') {
        const name = childFieldText(node, 'name') ?? childText(node, 'identifier')
        if (name) {
          symbols.push({ kind: 'class', name, line })
          for (const child of node.children) walk(child, name)
          return
        }
      } else if (t === 'import_declaration') {
        const path = node.text.replace(/^import\s+/, '').replace(/;$/, '').trim()
        symbols.push({ kind: 'import', name: path, line })
      }
    }

    for (const child of node.children) walk(child, parentClass)
  }

  walk(root)
  return symbols
}

// ── Dependency extraction ─────────────────────────────────────────────────────

function extractDependencies(root: Parser.SyntaxNode, lang: string): string[] {
  const deps = new Set<string>()

  function walk(node: Parser.SyntaxNode): void {
    const t = node.type
    if (lang === 'javascript' || lang === 'typescript') {
      if (t === 'import_statement' || t === 'import_declaration') {
        const src = node.childForFieldName('source')
        if (src) deps.add(cleanString(src.text))
      } else if (t === 'call_expression') {
        const fn = node.childForFieldName('function')
        const args = node.childForFieldName('arguments')
        if (fn?.text === 'require' && args) {
          const str = args.children.find(c => c.type === 'string')
          if (str) deps.add(cleanString(str.text))
        }
      }
    } else if (lang === 'python') {
      if (t === 'import_statement') {
        const names = node.children.filter(c => c.type === 'dotted_name' || c.type === 'identifier')
        for (const n of names) deps.add(n.text)
      } else if (t === 'import_from_statement') {
        const mod = node.childForFieldName('module_name') ?? node.children.find(c => c.type === 'dotted_name')
        if (mod) deps.add(mod.text)
      }
    } else if (lang === 'rust') {
      if (t === 'extern_crate_declaration') {
        const name = node.children.find(c => c.type === 'identifier')
        if (name) deps.add(name.text)
      }
    }
    for (const child of node.children) walk(child)
  }

  walk(root)
  return Array.from(deps).filter(d => d.length > 0)
}

// ── Complexity estimation ─────────────────────────────────────────────────────

const BRANCH_NODES = new Set([
  'if_statement', 'else_clause', 'elif_clause',
  'for_statement', 'while_statement', 'do_statement',
  'switch_statement', 'case_clause', 'catch_clause',
  'conditional_expression', 'ternary_expression',
  'match_expression', 'match_arm',
  'for_in_statement', 'for_of_statement',
])

function estimateComplexity(root: Parser.SyntaxNode): number {
  let count = 1
  function walk(node: Parser.SyntaxNode): void {
    if (BRANCH_NODES.has(node.type)) count++
    for (const child of node.children) walk(child)
  }
  walk(root)
  return count
}

// ── Summary builder ────────────────────────────────────────────────────────────

function buildSummary(
  filename: string,
  lang: string,
  symbols: AstSymbol[],
  deps: string[],
  complexity: number,
): string {
  const lines: string[] = [`File: ${filename} (${lang})`]

  const classes = symbols.filter(s => s.kind === 'class')
  const fns = symbols.filter(s => s.kind === 'function' || s.kind === 'method')
  const types = symbols.filter(s => s.kind === 'type')
  const imports = symbols.filter(s => s.kind === 'import')

  if (classes.length) lines.push(`Classes: ${classes.map(c => c.name).join(', ')}`)

  // Group methods under their parent
  const methodsByClass = new Map<string, string[]>()
  for (const s of fns) {
    if (s.parent) {
      if (!methodsByClass.has(s.parent)) methodsByClass.set(s.parent, [])
      methodsByClass.get(s.parent)!.push(s.name)
    }
  }
  for (const [cls, methods] of methodsByClass) {
    lines.push(`  ${cls} methods: ${methods.join(', ')}`)
  }

  const topFns = fns.filter(s => !s.parent)
  if (topFns.length) lines.push(`Functions: ${topFns.map(f => `${f.name}:${f.line}`).join(', ')}`)
  if (types.length) lines.push(`Types: ${types.map(t => t.name).join(', ')}`)

  const externalDeps = deps.filter(d => !d.startsWith('.') && !d.startsWith('/'))
  if (externalDeps.length) lines.push(`External deps: ${externalDeps.join(', ')}`)

  const localImports = imports.filter(i => i.name.startsWith('.'))
  if (localImports.length) lines.push(`Local imports: ${localImports.map(i => i.name).join(', ')}`)

  lines.push(`Complexity: ${complexity}`)

  return lines.join('\n')
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function childFieldText(node: Parser.SyntaxNode, field: string): string | null {
  return node.childForFieldName(field)?.text ?? null
}

function childText(node: Parser.SyntaxNode, type: string): string | null {
  return node.children.find(c => c.type === type)?.text ?? null
}

function cleanString(s: string): string {
  return s.replace(/^['"`]|['"`]$/g, '').replace(/^"(.*)"$/, '$1').trim()
}

/**
 * Returns true if tree-sitter has been successfully initialized.
 */
export function isAstAnalyzerReady(): boolean {
  return parserInitialized
}
