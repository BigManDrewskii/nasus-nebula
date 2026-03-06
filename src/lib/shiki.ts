/**
 * Shiki highlighter singleton using react-shiki/core.
 *
 * Uses the JS regex engine (createJavaScriptRegexEngine) to avoid any WASM
 * dependency — keeps startup fast and avoids CSP issues in Tauri.
 *
 * Themes and languages are loaded lazily as dynamic imports so Vite can
 * tree-shake unused entries. Only the languages actually used in NASUS responses
 * are included here.
 */

import ShikiHighlighter, {
  createHighlighterCore,
  createJavaScriptRegexEngine,
} from 'react-shiki/core'

export const highlighterPromise = createHighlighterCore({
  themes: [
    import('@shikijs/themes/one-dark-pro'),
    import('@shikijs/themes/github-light'),
  ],
  langs: [
    import('@shikijs/langs/typescript'),
    import('@shikijs/langs/javascript'),
    import('@shikijs/langs/tsx'),
    import('@shikijs/langs/jsx'),
    import('@shikijs/langs/python'),
    import('@shikijs/langs/rust'),
    import('@shikijs/langs/bash'),
    import('@shikijs/langs/shell'),
    import('@shikijs/langs/json'),
    import('@shikijs/langs/yaml'),
    import('@shikijs/langs/toml'),
    import('@shikijs/langs/markdown'),
    import('@shikijs/langs/html'),
    import('@shikijs/langs/css'),
    import('@shikijs/langs/sql'),
    import('@shikijs/langs/go'),
    import('@shikijs/langs/java'),
    import('@shikijs/langs/c'),
    import('@shikijs/langs/cpp'),
  ],
  engine: createJavaScriptRegexEngine(),
})

export { ShikiHighlighter }
