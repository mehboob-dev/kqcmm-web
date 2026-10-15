import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './FontAwesome'
import navConfig from '../config/navigation.json'
import { routeForNavItem } from '../config/pageRoutes'
import { hapticTap } from '../utils/haptics'

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
    // Resolve via registry id, content-file basename, or configured route —
    // so a nav entry keeps working even if its pageId was entered as a slug.
    to: routeForNavItem(item),
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
          <div className="drawer-brand">
            <img className="drawer-brand-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="" />
            <h2 className="drawer-brand-name">{strings.appName}</h2>
            <p className="drawer-brand-tag">{strings.tagline}</p>
          </div>
        </div>
        <nav className="drawer-nav" data-tour="drawer-nav">
          {links.map((link) => (
            <NavLink
              key={link.to + link.label}
              to={link.to}
              onClick={() => hapticTap(10)}
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
