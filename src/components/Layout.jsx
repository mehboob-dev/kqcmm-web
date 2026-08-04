import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { trackPageView, trackShare } from '../utils/analytics'
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
import Icon from './FontAwesome'
import OnboardingTour from './OnboardingTour'

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [strings, setStrings] = useState(null)
  const [replayToken, setReplayToken] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { lang, changeLang } = useLanguage()
  const { currentFont, currentSize } = useFont()
  const mainRef = useRef(null)

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

  // Scroll to top on page navigation
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
  }, [location.pathname])

  // Track SPA route changes as GA4 page views. The basename (/kqcmm-web/) is
  // stripped so the path matches what prerendered SEO pages record.
  useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname.replace(/^\/kqcmm-web\/?/, '/')
    trackPageView(path, strings?.appName)
  }, [location.pathname])
  // Auto-close sidebar drawer and settings popup with a short delay when the onboarding tour advances past their steps
  useEffect(() => {
    if (typeof MutationObserver === 'undefined') return undefined
    let timer1 = null
    let timer2 = null
    const sync = () => {
      const step = document.body.getAttribute('data-tour-step')
      if (step && step !== 'header-settings') {
        if (timer1) clearTimeout(timer1)
        timer1 = setTimeout(() => setSettingsOpen(false), 600)
      }
      if (step && step !== 'header-menu') {
        if (timer2) clearTimeout(timer2)
        timer2 = setTimeout(() => setDrawerOpen(false), 600)
      }
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-tour-step'] })
    return () => {
      observer.disconnect()
      if (timer1) clearTimeout(timer1)
      if (timer2) clearTimeout(timer2)
    }
  }, [])

  const [customTitle, setCustomTitle] = useState('')

  // Page title lookup driven by the page-route registry so a renamed route
  // keeps the correct header title. Aliases redirect before they render, so the
  // map only needs canonical routes.
  const pageTitleMap = strings ? pageRoutes.reduce((map, page) => {
    if (page.route === '/') map[page.route] = strings.appName
    else if (page.titleKey) map[page.route] = strings.drawer?.[page.titleKey] || page.route
    return map
  }, { '/settings': strings.settings.title }) : {}

  useEffect(() => {
    const entry = pageByRoute(location.pathname)
    if (entry && entry.renderer === 'generic') {
      if (entry.contentFile) {
        getContent(lang, entry.contentFile)
          .then(data => {
            const locale = data ? resolveLocale(data, lang) : null
            if (locale?.title) {
              setCustomTitle(locale.title)
            } else {
              setCustomTitle((entry.route || '').replace(/^\//, '').replace(/-/g, ' '))
            }
          })
          .catch(() => {
            setCustomTitle((entry.route || '').replace(/^\//, '').replace(/-/g, ' '))
          })
      } else {
        setCustomTitle((entry.route || '').replace(/^\//, '').replace(/-/g, ' '))
      }
    } else {
      setCustomTitle('')
    }
  }, [location.pathname, lang])

  // Custom pages (renderer: generic) have no string key — fall back to the
  // localized content title, then a humanized slug, then the app name.
  let title = pageTitleMap[location.pathname]
  if (!title) {
    title = customTitle || (pageByRoute(location.pathname)?.route || '').replace(/^\//, '').replace(/-/g, ' ')
  }
  title = title || (strings?.appName || 'KQCMM')
  const showBack = location.pathname !== '/'

  const share = strings?.share || {}

  // Legacy copy fallback that works even over plain http:// (no secure context),
  // e.g. mobile devices hitting the dev server on a LAN IP. The modern
  // clipboard/share APIs are HTTPS-only, so execCommand + a hidden textarea
  // covers the non-secure case.
  const copyLegacy = (text) => {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    const selected = document.getSelection?.().rangeCount > 0 ? document.getSelection().getRangeAt(0) : false
    ta.select()
    ta.setSelectionRange(0, ta.value.length)
    let ok = false
    try { ok = document.execCommand('copy') } catch (e) { /* unsupported */ }
    document.body.removeChild(ta)
    if (selected) document.getSelection().removeAllRanges()
    return ok
  }

  const handleShare = async () => {
    const url = window.location.origin + import.meta.env.BASE_URL
    const text = share.message || 'KQCMM'
    const title = share.title || 'Share KQCMM'
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url })
        trackShare('webshare')
        return
      } catch (e) { /* user cancelled — ignore */ }
    }
    // Fallback 1: modern clipboard API (HTTPS only)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      return
    } catch (e) { /* clipboard unavailable — try legacy */ }
    // Fallback 2: legacy textarea copy (plain HTTP / older mobile browsers)
    const ok = copyLegacy(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (!ok) alert(share.message || url)
  }

  return (
    <div
      className="app-shell"
      style={{
        fontFamily: currentFont.family,
      }}
    >
      {/* HEADER */}
      <header className="app-header">
        <button className="hamburger-btn" data-tour="header-menu" onClick={() => setDrawerOpen(true)} aria-label="Menu">
          ☰
        </button>
        <span className="app-title">{title}</span>
        <button className="hamburger-btn" data-tour="header-share" onClick={handleShare} aria-label={share.title || 'Share'} style={{ fontSize: 26 }}>
          {copied ? <Icon name="faCheck" /> : <Icon name="faShareNodes" />}
        </button>
        <button className="hamburger-btn" data-tour="header-settings" onClick={() => setSettingsOpen(true)} aria-label="Settings" style={{ fontSize: 18 }}>
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
      {strings && settingsOpen && <SettingsPopup strings={strings} onClose={() => setSettingsOpen(false)} onReplayTour={() => { setSettingsOpen(false); setReplayToken(t => t + 1) }} />}

      {/* FIRST-RUN WALKTHROUGH — mounted after strings load; auto-starts on '/' */}
      {strings && <OnboardingTour strings={strings} lang={lang} pathname={location.pathname} replayToken={replayToken} navigate={navigate} onFinish={(code) => code && changeLang(code)} />}
    </div>
  )
}
