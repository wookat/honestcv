import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { applyThemePref, loadThemePref, watchSystemTheme } from '@/lib/theme'
import { trackVisit } from '@/lib/track'

trackVisit()
applyThemePref(loadThemePref())
watchSystemTheme()

// Offline app shell (public/sw.js): registered after load so it never
// competes with startup; production only so the dev server stays uncached.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

const container = document.getElementById('root')!
const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
)

// The landing route ships prerendered HTML to hydrate; the SPA shell carries
// only a static loading skeleton, which is cleared and client-rendered.
if (container.querySelector('[aria-busy]') || !container.firstElementChild) {
  container.replaceChildren()
  createRoot(container).render(app)
} else {
  hydrateRoot(container, app)
}
