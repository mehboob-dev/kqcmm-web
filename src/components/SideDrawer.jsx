import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import Icon from './FontAwesome'
import navConfig from '../config/navigation.json'
import { routeForNavItem } from '../config/pageRoutes'
import { hapticTap } from '../utils/haptics'

// Full-screen "magazine" menu overlay. Replaces the old slide-in side drawer:
// indexed editorial links, staggered entrance, pattern-textured backdrop.
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

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const links = navConfig.sideDrawer.map(item => ({
    // Resolve via registry id, content-file basename, or configured route —
    // so a nav entry keeps working even if its pageId was entered as a slug.
    to: routeForNavItem(item),
    icon: item.icon,
    label: strings.drawer?.[item.key] || item.key,
  }))

  return (
    <>
      <div className={`menu-overlay${open ? ' open' : ''}`} onClick={onClose} />
      <div
        className={`menu-panel${open ? ' open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={strings.appName}
        aria-hidden={!open}
      >
        <span className="pattern-layer" aria-hidden="true" />
        <div className="menu-panel-inner">
          <div className="menu-top">
            <div className="menu-brand">
              <img className="menu-brand-logo" src={import.meta.env.BASE_URL + 'logo.png'} alt="" />
              <div>
                <p className="menu-brand-name">{strings.appName}</p>
                <p className="menu-brand-tag">{strings.tagline}</p>
              </div>
            </div>
            <button className="menu-close" onClick={onClose} aria-label="Close menu">
              <Icon name="faXmark" />
            </button>
          </div>
          <nav className="menu-nav" data-tour="drawer-nav">
            {links.map((link, i) => (
              <NavLink
                key={link.to + link.label}
                to={link.to}
                onClick={() => hapticTap(10)}
                className={({ isActive }) => `menu-link${isActive ? ' active' : ''}`}
                style={{ animationDelay: `${90 + i * 26}ms` }}
              >
                <span className="menu-link-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="menu-link-label">{link.label}</span>
                <span className="menu-link-icon"><Icon name={link.icon} /></span>
              </NavLink>
            ))}
          </nav>
          <div className="menu-foot">
            <span className="ornament" aria-hidden="true"><span className="ornament-diamond" /></span>
          </div>
        </div>
      </div>
    </>
  )
}
