// FontAwesome icon map — centralized
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHouse, faStar, faBook, faFire, faHandsPraying,
  faScroll, faMosque, faUser, faCircleInfo, faCalendar,
  faPeopleGroup, faGear, faBars, faXmark, faClockRotateLeft,
} from '@fortawesome/free-solid-svg-icons'

const iconMap = {
  faHouse, faStar, faBook, faFire, faHandsPraying,
  faScroll, faMosque, faUser, faCircleInfo, faCalendar,
  faPeopleGroup, faGear, faBars, faXmark, faClockRotateLeft,
}

export default function Icon({ name, className, style }) {
  const icon = iconMap[name]
  if (!icon) return <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>?</span>
  return <FontAwesomeIcon icon={icon} className={className} style={style} />
}
