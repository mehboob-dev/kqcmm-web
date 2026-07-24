import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import Icon from './FontAwesome'
import navConfig from '../config/navigation.json'

export default function BottomNav({ strings }) {
  const navigate = useNavigate()
  const location = useLocation()
  const ref = useRef(null)
  const [installPrompt, setInstallPrompt] = useState(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    if (ref.current) {
      const h = ref.current.offsetHeight
      document.documentElement.style.setProperty('--bottom-nav-height', h + 'px')
    }
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
    to: item.to,
    icon: item.icon,
    label: strings.nav?.[item.key] || item.key,
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
    <nav className="bottom-nav" ref={ref}>
      {items.map((item) => (
        <button
            key={item.to}
            onClick={() => navigate(item.to, { replace: true })}
            className={`nav-item${location.pathname === item.to ? ' active' : ''}`}
        >
          <Icon name={item.icon} className="nav-icon" />
          {item.label}
        </button>
      ))}
      {/* 6th tab: Install App — only when browser supports it */}
      {installPrompt && !isInstalled && (
        <button
          onClick={handleInstall}
          className="nav-item"
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 11,
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            padding: 0,
            width: '100%',
          }}
          aria-label="Install App"
        >
          📲
          <span>Install</span>
        </button>
      )}
    </nav>
  )
}
