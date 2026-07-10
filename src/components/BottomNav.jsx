import { NavLink } from 'react-router-dom'

export default function BottomNav({ strings }) {
  const items = [
    { to: '/', icon: '🏠', label: strings.nav.home },
    { to: '/khatm', icon: '✨', label: strings.nav.khatmEKhwajagan },
    { to: '/sijrah-nama', icon: '📖', label: strings.nav.sijrah },
    { to: '/roshni', icon: '🕯️', label: strings.nav.roshni },
    { to: '/dua', icon: '🤲', label: strings.nav.duas },
  ]

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `nav-item${isActive ? ' active' : ''}`
          }
        >
          <span className="nav-icon">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
