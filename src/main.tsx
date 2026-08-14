import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { trackVisit } from '@/lib/track'

trackVisit()

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
