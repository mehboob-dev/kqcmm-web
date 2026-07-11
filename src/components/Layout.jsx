import { useState, useEffect, useRef } from 'react'
import { useLocation, Outlet } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useFont } from '../context/FontContext'
import { loadStrings } from '../config/strings'
import SideDrawer from './SideDrawer'
import BottomNav from './BottomNav'
import SettingsPopup from './SettingsPopup'

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

  // Page title lookup from strings
  const pageTitleMap = strings ? {
    '/': strings.appName,
    '/dua': strings.drawer.duas,
    '/hmk': strings.drawer.hmk,
    '/sijrah-nama': strings.drawer.sijrahNama,
    '/fateha-khwani': strings.drawer.fatehaKhwani,
    '/khatm': strings.drawer.khatm,
    '/salim-pappa': strings.drawer.salimPappa,
    '/about': strings.drawer.about,
    '/calendar': strings.drawer.calendar,
    '/roshni': strings.drawer.roshni,
    '/abbajaan': strings.drawer.abbajaan,
    '/settings': strings.settings.title,
  } : {}

  const title = pageTitleMap[location.pathname] || (strings?.appName || 'KQCMM')
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
