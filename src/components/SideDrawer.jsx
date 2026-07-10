import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

export default function SideDrawer({ open, onClose, strings }) {
  const location = useLocation()

  useEffect(() => {
    onClose()
  }, [location.pathname])

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const links = [
    { to: '/', icon: '🏠', label: strings.drawer.home },
    { to: '/dua', icon: '🤲', label: strings.drawer.duas },
    { to: '/hmk', icon: '📜', label: strings.drawer.hmk },
    { to: '/sijrah-nama', icon: '📖', label: strings.drawer.sijrahNama },
    { to: '/fateha-khwani', icon: '🕌', label: strings.drawer.fatehaKhwani },
    { to: '/khatm', icon: '✨', label: strings.drawer.khatm },
    { to: '/salim-pappa', icon: '👤', label: strings.drawer.salimPappa },
    { to: '/about', icon: 'ℹ️', label: strings.drawer.about },
    { to: '/calendar', icon: '📅', label: strings.drawer.calendar },
    { to: '/roshni', icon: '🕯️', label: strings.drawer.roshni },
    { to: '/abbajaan', icon: '👨‍👦', label: strings.drawer.abbajaan },
    { to: '/settings', icon: '⚙', label: strings.settings.title },
  ]

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-header" style={{
          backgroundImage: 'url(/drawer-bg.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: 208,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
        }}>
          <div style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))', padding: '16px 16px 20px', margin: -1 }}>
            <h2 style={{ color: '#fff', fontSize: 20, fontWeight: 800, textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>{strings.appName}</h2>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, marginTop: 4, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>{strings.tagline}</p>
          </div>
        </div>
        <nav className="drawer-nav">
          {links.map((link) => (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              className={({ isActive }) =>
                `drawer-link${isActive ? ' active' : ''}`
              }
            >
              <span className="dl-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
