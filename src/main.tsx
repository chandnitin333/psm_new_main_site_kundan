import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initThemeColor } from './utils/themeColor'
import { initBranding } from './utils/branding'

// apply the admin-set accent colour + branding (name/fonts) — cached, fetched, polled
initThemeColor()
initBranding()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
