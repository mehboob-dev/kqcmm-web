import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './App'
import { initErrorTracking } from './utils/analytics'
import './styles.css'

// Report uncaught JS errors to GA4 (safe no-op when analytics isn't configured).
initErrorTracking()

const basename = '/kqcmm-web/'
const rootEl = document.getElementById('root')

const app = (
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)

// Always use createRoot, never hydrate. The prerendered HTML in #root is
// present for SEO (crawlers see the full content), but every page loads its
// content async via usePageContent — the first client render is "Loading...",
// which would mismatch the server HTML and make React 18 hydration throw
// (errors #418/#423/#425). A clean createRoot render on top of the static HTML
// avoids the mismatch entirely; the static markup is simply replaced.
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(app)
}
