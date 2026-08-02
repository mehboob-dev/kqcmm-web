import { useState, useEffect, useRef } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFont } from '../context/FontContext'
import { loadStrings } from '../config/strings'
import { getContent, resolveLocale } from '../config/content'
import { pageByRoute } from '../config/pageRoutes'
import pageRoutes from '../config/pageRoutes.json'
import SideDrawer from './SideDrawer'
import BottomNav from './BottomNav'
import SettingsPopup from './SettingsPopup'
import HijriStrip from './HijriStrip'

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [strings, setStrings] = useState(null)
  const location = useLocation()
  const { lang } = useLanguage()
  const { currentFont, currentSize } = useFont()
  const mainRef = useRef(null)

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

  // Scroll to top on page navigation
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [location.pathname])

  // Page title lookup driven by the page-route registry so a renamed route
  // keeps the correct header title. Aliases redirect before they render, so the
  // map only needs canonical routes.
  const pageTitleMap = strings ? pageRoutes.reduce((map, page) => {
    if (page.route === '/') map[page.route] = strings.appName
    else if (page.titleKey) map[page.route] = strings.drawer?.[page.titleKey] || page.route
    return map
  }, { '/settings': strings.settings.title }) : {}

  // Custom pages (renderer: generic) have no string key — fall back to the
  // localized content title, then a humanized slug, then the app name.
  let title = pageTitleMap[location.pathname]
  if (!title) {
    const entry = pageByRoute(location.pathname)
    if (entry && entry.renderer === 'generic') {
      try {
        const data = entry.contentFile ? getContent(entry.contentFile) : null
        const locale = data ? resolveLocale(data, lang) : null
        title = locale?.title || (entry.route || '').replace(/^\//, '').replace(/-/g, ' ')
      } catch { /* fall through */ }
    }
  }
  title = title || (strings?.appName || 'KQCMM')
  const showBack = location.pathname !== '/'

  return (
    <div
      className="app-shell"
      style={{
        fontFamily: currentFont.family,
      }}
    >
      {/* HEADER */}
      <header className="app-header">
        <button className="hamburger-btn" onClick={() => setDrawerOpen(true)} aria-label="Menu">
          ☰
        </button>
        <span className="app-title">{title}</span>
        <button className="hamburger-btn" onClick={() => setSettingsOpen(true)} aria-label="Settings" style={{ fontSize: 18 }}>
          <span style={{ fontSize: 40 }}>⚙</span>
        </button>
      </header>

      {/* HIJRI STRIP — app-wide, below the header */}
      <HijriStrip lang={lang} />

      {/* MAIN CONTENT — base font size lives here */}
      <main className="main-content" ref={mainRef} dir={document.documentElement.dir} style={{ fontSize: currentSize.size }}>
        {strings ? <Outlet context={{ strings }} /> : <div className="content-page"><p>Loading...</p></div>}
      </main>

      {/* BOTTOM NAV */}
      {strings && <BottomNav strings={strings} />}

      {/* SIDE DRAWER */}
      {strings && <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} strings={strings} />}

      {/* SETTINGS POPUP */}
      {strings && settingsOpen && <SettingsPopup strings={strings} onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
