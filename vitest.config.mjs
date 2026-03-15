import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const require = createRequire(import.meta.url)

// Custom TypeScript transform plugin using TypeScript's own compiler.
// This bypasses vite:esbuild (which requires a native esbuild binary) so
// tests can run even when the esbuild binary is blocked by Gatekeeper.
function typescriptPlugin() {
  const ts = require('typescript')

  return {
    name: 'typescript-native',
    enforce: 'pre',
    transform(code, id) {
      if (!id.match(/\.(ts|tsx)$/)) return null
      if (id.includes('node_modules')) return null

      const result = ts.transpileModule(code, {
        fileName: id,
        compilerOptions: {
          module: ts.ModuleKind.ESNext,
          target: ts.ScriptTarget.ES2022,
          jsx: id.endsWith('.tsx') ? ts.JsxEmit.ReactJSX : ts.JsxEmit.None,
          experimentalDecorators: true,
          useDefineForClassFields: true,
          verbatimModuleSyntax: false,
          esModuleInterop: true,
          skipLibCheck: true,
          isolatedModules: true,
        },
      })

      return {
        code: result.outputText,
        map: result.sourceMapText ? JSON.parse(result.sourceMapText) : null,
      }
    },
  }
}

export default defineConfig({
  esbuild: false,
  plugins: [typescriptPlugin()],
  resolve: {
    alias: {
      // voy-search ships only a WASM binary; stub it for Node/jsdom test runs.
      'voy-search': path.resolve(__dirname, 'src/test/mocks/voy-search.ts'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: false,
  },
})
