import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './FontAwesome'
import navConfig from '../config/navigation.json'
import { routeForNavItem } from '../config/pageRoutes'
import { hapticTap } from '../utils/haptics'

export default function BottomNav({ strings }) {
  const navigate = useNavigate()
  const location = useLocation()
  const ref = useRef(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    // Publish the distance from the viewport bottom to the nav's TOP edge, so
    // fixed bars (counter, slide nav, quick jump) sit flush against the nav.
    // Using the nav's own height would be off by the safe-area inset
    // (padding-bottom: env(safe-area-inset-bottom)) which makes the nav extend
    // past the viewport — leaving a visible gap above it. ResizeObserver keeps
    // the value in sync when the install button appears/disappears, fonts load,
    // or safe-area padding changes.
    const nav = ref.current
    const publish = () => {
      const gap = Math.round(window.innerHeight - nav.getBoundingClientRect().top)
      document.documentElement.style.setProperty('--bottom-nav-height', gap + 'px')
    }
    publish()
    const ro = new ResizeObserver(publish)
    ro.observe(nav)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true) {
      setIsInstalled(true)
    }
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const items = navConfig.bottomNav.map(item => ({
    // Resolve via registry id, content-file basename, or configured route —
    // so a nav entry keeps working even if its pageId was entered as a slug.
    to: routeForNavItem(item),
    icon: item.icon,
    label: strings.nav?.[item.key] || item.key,
    pageId: item.pageId,
  }))

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') {
      setInstallPrompt(null)
      setIsInstalled(true)
    }
  }

  return (
    <nav className="bottom-nav" data-tour="bottom-nav" ref={ref}>
      {items.map((item) => {
        const active = location.pathname === item.to
        return (
        <button
            key={item.to}
            onClick={() => { hapticTap(10); navigate(item.to, { replace: true, viewTransition: true }) }}
            className={`nav-item${active ? ' active' : ''}`}
            aria-current={active ? 'page' : undefined}
            data-tour={item.pageId === 'home' ? 'bottom-home' : `bottom-nav-${item.pageId}`}
        >
          <Icon name={item.icon} className="nav-icon" />
          {item.label}
        </button>
        )
      })}
      {/* 6th tab: Install App — only when browser supports it */}
      {installPrompt && !isInstalled && (
        <button
          onClick={handleInstall}
          className="nav-item"
          aria-label="Install App"
        >
          <span className="nav-icon"><Icon name="faDownload" /></span>
          <span>Install</span>
        </button>
      )}
    </nav>
  )
}
