import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './FontAwesome'
import navConfig from '../config/navigation.json'

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

  const links = navConfig.sideDrawer.map(item => ({
    to: item.to,
    icon: item.icon,
    label: strings.drawer?.[item.key] || item.key,
  }))

  return (
    <>
      <div className={`drawer-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <aside className={`drawer${open ? ' open' : ''}`}>
        <div className="drawer-header" style={{
          backgroundImage: 'url(' + import.meta.env.BASE_URL + 'drawer-bg.jpg)',
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
              <span className="dl-icon"><Icon name={link.icon} /></span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
