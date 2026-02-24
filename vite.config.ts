import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
      nodePolyfills({
        // Polyfill globals (Buffer, process, etc.) needed by e2b and @daytonaio/sdk
        globals: { Buffer: true, process: true, global: true },
        protocolImports: true,
        exclude: ['fs'],
      }),
  ],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
})
