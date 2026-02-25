import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    nodePolyfills({
      // Polyfill globals (Buffer, process, etc.) needed by e2b
      globals: { Buffer: true, process: true, global: true },
      // Include node: protocol imports (e.g. node:stream, node:buffer)
      protocolImports: true,
      exclude: ['fs'],
    }),
  ],
  resolve: {
    alias: {
      // Stub out Node-only packages from e2b's dependency chain that are
      // never called in browser mode but import node:stream at eval time.
      'tar': path.resolve(__dirname, 'src/stubs/tar.js'),
      'minipass': path.resolve(__dirname, 'src/stubs/minipass.js'),
    },
  },
  optimizeDeps: {
    // Exclude e2b packages from pre-bundling — they contain Node-only
    // imports that will be resolved at runtime via dynamic import().
    exclude: ['@e2b/code-interpreter', 'e2b'],
  },
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
})
