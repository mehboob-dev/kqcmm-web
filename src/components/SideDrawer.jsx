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
    { to: '/roshni', icon: '💡', label: strings.drawer.roshni },
    { to: '/abbajaan', icon: '👨‍👦', label: strings.drawer.abbajaan },
    { to: '/settings', icon: '⚙', label: strings.settings.title },
  ]

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-header">
          <h2>{strings.appName}</h2>
          <p>{strings.tagline}</p>
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
