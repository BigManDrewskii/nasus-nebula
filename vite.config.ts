import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    // Exclude onnxruntime-web — vite-plugin-wasm must handle its .wasm files
    // directly; pre-bundling inlines WASM as base64 which breaks the plugin.
    exclude: ['onnxruntime-web', '@huggingface/transformers', 'web-tree-sitter'],
  },
  clearScreen: false,
  build: {
    sourcemap: 'hidden',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
