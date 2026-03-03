import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import '@hackernoon/pixel-icon-library/fonts/iconfont.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
