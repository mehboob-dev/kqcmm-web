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
import ContentSkeleton from './ContentSkeleton'
import { showToast } from '../utils/toast'
import { initSpotlight } from '../utils/spotlight'
import { initReveals } from '../utils/reveal'

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [strings, setStrings] = useState(null)
  const [replayToken, setReplayToken] = useState(0)
  const location = useLocation()
  const navigate = useNavigate()
  const { lang, changeLang } = useLanguage()
  const { currentFont, currentSize } = useFont()
  const mainRef = useRef(null)
  const shellRef = useRef(null)
  const chromeRef = useRef(null)

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

  // Scroll to top on page navigation; restore the top chrome and reset the
  // reading-progress line for the new page.
  useEffect(() => {
    if (mainRef.current) mainRef.current.scrollTop = 0
    chromeRef.current?.classList.remove('hidden')
    shellRef.current?.style.setProperty('--read-progress', '0')
  }, [location.pathname])

  // Track SPA route changes as GA4 page views. The basename (/kqcmm-web/) is
  // stripped so the path matches what prerendered SEO pages record.
  useEffect(() => {
    const path = location.pathname === '/' ? '/' : location.pathname.replace(/^\/kqcmm-web\/?/, '/')
    trackPageView(path, strings?.appName)
  }, [location.pathname])
  // Auto-close menu and settings popup with a short delay when the onboarding tour advances past their steps
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
        timer2 = setTimeout(() => setMenuOpen(false), 600)
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

  // Publish the fixed top-chrome height so .main-content can reserve space.
  useEffect(() => {
    const chrome = chromeRef.current
    const shell = shellRef.current
    if (!chrome || !shell) return undefined
    const publish = () => shell.style.setProperty('--chrome-h', `${chrome.offsetHeight}px`)
    publish()
    if (typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(publish)
    ro.observe(chrome)
    return () => ro.disconnect()
  }, [strings])

  // Immersive chrome: rAF-throttled scroll listener on the content area —
  // updates the reading-progress line and hides the top chrome while the user
  // reads downward, bringing it back on any upward scroll (or near the top).
  useEffect(() => {
    const el = mainRef.current
    const shell = shellRef.current
    const chrome = chromeRef.current
    if (!el || !shell || !chrome) return undefined
    let lastY = el.scrollTop
    let hidden = false
    let ticking = false
    const update = () => {
      ticking = false
      const y = el.scrollTop
      const max = el.scrollHeight - el.clientHeight
      const pct = max > 8 ? Math.min(1, Math.max(0, y / max)) : 0
      shell.style.setProperty('--read-progress', pct.toFixed(4))
      if (y > lastY + 2 && y > 140 && !hidden) {
        hidden = true
        chrome.classList.add('hidden')
      } else if ((y < lastY - 2 || y < 140) && hidden) {
        hidden = false
        chrome.classList.remove('hidden')
      }
      lastY = y
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    update()
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  // Spatial shell (7.1.0): cursor spotlight on cards + below-fold scroll
  // reveals. Both attach document/main-level listeners once; routing just
  // swaps DOM and the reveal MutationObserver picks the new nodes up.
  useEffect(() => {
    const stopSpotlight = initSpotlight()
    const stopReveals = initReveals(() => mainRef.current)
    return () => {
      stopSpotlight()
      stopReveals()
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
      showToast(share.copied || 'Link copied!')
      return
    } catch (e) { /* clipboard unavailable — try legacy */ }
    // Fallback 2: legacy textarea copy (plain HTTP / older mobile browsers)
    const ok = copyLegacy(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (!ok) showToast(share.message || url)
    else showToast(share.copied || 'Link copied!')
  }

  return (
    <div
      className="app-shell"
      ref={shellRef}
      style={{
        fontFamily: currentFont.family,
      }}
    >
      {/* READING PROGRESS — thin gradient line, width driven by --read-progress */}
      <div className="read-progress" aria-hidden="true" />

      {/* TOP CHROME — 8.0.0: no bar. Floating glass orbs and a centered
          Hijri chip hover directly over the page; pages own their titles. */}
      <div className="top-chrome" ref={chromeRef}>
      <header className="app-header">
        <button className="hamburger-btn" data-tour="header-menu" onClick={() => setMenuOpen(true)} aria-label="Menu" style={{ fontSize: 17 }}>
          <Icon name="faBars" />
        </button>
        <HijriStrip lang={lang} />
        <button className="hamburger-btn" data-tour="header-share" onClick={handleShare} aria-label={share.title || 'Share'} style={{ fontSize: 18 }}>
          {copied ? <Icon name="faCheck" /> : <Icon name="faShareNodes" />}
        </button>
        <button className="hamburger-btn" data-tour="header-settings" onClick={() => setSettingsOpen(true)} aria-label="Settings" style={{ fontSize: 16 }}>
          <Icon name="faGear" />
        </button>
      </header>
      </div>

      {/* MAIN CONTENT — base font size lives here */}
      <main className="main-content" ref={mainRef} dir={document.documentElement.dir} style={{ fontSize: currentSize.size }}>
        {strings ? <Outlet context={{ strings }} /> : <ContentSkeleton />}
      </main>

      {/* BOTTOM NAV */}
      {strings && <BottomNav strings={strings} />}

      {/* FULL-SCREEN MENU */}
      {strings && <SideDrawer open={menuOpen} onClose={() => setMenuOpen(false)} strings={strings} />}

      {/* SETTINGS POPUP */}
      {strings && settingsOpen && <SettingsPopup strings={strings} onClose={() => setSettingsOpen(false)} onReplayTour={() => { setSettingsOpen(false); setReplayToken(t => t + 1) }} />}

      {/* FIRST-RUN WALKTHROUGH — mounted after strings load; auto-starts on '/' */}
      {strings && <OnboardingTour strings={strings} lang={lang} pathname={location.pathname} replayToken={replayToken} navigate={navigate} onFinish={(code) => code && changeLang(code)} />}
    </div>
  )
}
