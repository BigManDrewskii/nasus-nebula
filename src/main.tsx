import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { warmEmbeddingModel } from './agent/memory/transformersEmbedding'

// Kick off model download in background so first memory search is fast
warmEmbeddingModel()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
