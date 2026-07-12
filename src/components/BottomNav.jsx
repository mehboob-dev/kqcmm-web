import { NavLink } from 'react-router-dom'
import Icon from './FontAwesome'
import navConfig from '../config/navigation.json'

export default function BottomNav({ strings }) {
  const items = navConfig.bottomNav.map(item => ({
    to: item.to,
    icon: item.icon,
    label: strings.nav?.[item.key] || item.key,
  }))

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
          <Icon name={item.icon} className="nav-icon" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
