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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)
