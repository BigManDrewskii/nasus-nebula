import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { warmEmbeddingModel } from './agent/memory/transformersEmbedding'
import { logger } from './lib/logger'
import { tauriInvoke } from './tauri'

window.addEventListener('unhandledrejection', (event) => {
  logger.error(
    'UnhandledRejection',
    'An unhandled promise rejection occurred.',
    event.reason
  )
})

window.addEventListener('beforeunload', () => {
  tauriInvoke('docker_dispose_all_containers').catch(() => {/* best-effort */})
})

// Kick off model download in background so first memory search is fast
warmEmbeddingModel()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
