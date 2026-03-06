/**
 * Minimal type declarations for web-tree-sitter.
 * Provides the types used in AstAnalyzer.ts.
 */
declare module 'web-tree-sitter' {
  namespace Parser {
    interface Point {
      row: number
      column: number
    }

    interface SyntaxNode {
      type: string
      text: string
      startPosition: Point
      endPosition: Point
      startIndex: number
      endIndex: number
      parent: SyntaxNode | null
      children: SyntaxNode[]
      namedChildren: SyntaxNode[]
      childCount: number
      namedChildCount: number
      firstChild: SyntaxNode | null
      lastChild: SyntaxNode | null
      firstNamedChild: SyntaxNode | null
      lastNamedChild: SyntaxNode | null
      nextSibling: SyntaxNode | null
      previousSibling: SyntaxNode | null
      nextNamedSibling: SyntaxNode | null
      previousNamedSibling: SyntaxNode | null
      isNamed: boolean
      isMissing: boolean
      hasError: boolean
      child(index: number): SyntaxNode | null
      namedChild(index: number): SyntaxNode | null
      childForFieldName(fieldName: string): SyntaxNode | null
      descendantsOfType(
        type: string | string[],
        startPosition?: Point,
        endPosition?: Point,
      ): SyntaxNode[]
    }

    interface Tree {
      rootNode: SyntaxNode
    }

    // Language is both a value (for `Parser.Language.load(...)`) and a type
    class Language {
      static load(path: string): Promise<Language>
      version: number
    }
  }

  class Parser {
    static init(options?: { locateFile?: (path: string) => string }): Promise<void>
    static Language: typeof Parser.Language
    setLanguage(language: Parser.Language): void
    parse(input: string): Parser.Tree
  }

  export = Parser
}
