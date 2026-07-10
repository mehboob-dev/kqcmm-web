import { Link, useOutletContext } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const quickLinks = [
  { to: '/dua', icon: '🤲', labelKey: 'duas' },
  { to: '/hmk', icon: '📜', labelKey: 'hmk' },
  { to: '/sijrah-nama', icon: '📖', labelKey: 'sijrah' },
  { to: '/fateha-khwani', icon: '🕌', labelKey: 'fatehaKhwani' },
  { to: '/khatm', icon: '✨', labelKey: 'khatm' },
  { to: '/salim-pappa', icon: '👤', labelKey: 'salimPappa' },
  { to: '/calendar', icon: '📅', labelKey: 'calendar' },
  { to: '/about', icon: 'ℹ️', labelKey: 'about' },
]

export default function Home() {
  const { strings } = useOutletContext()
  const { lang } = useLanguage()

  return (
    <div className="home-container content-page">
      <div className="home-logo" style={{ background: 'var(--bg-card, #2a2a3e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
        🕌
      </div>
      <h1 className="home-title">KQCMM</h1>
      <p className="home-subtitle">{strings.tagline}</p>
      <p className="home-desc">{strings.home.welcome}</p>
      <div className="home-quick-links">
        {quickLinks.map((link) => {
          const label = strings.drawer[link.labelKey] || link.labelKey
          return (
            <Link key={link.to} to={link.to} className="quick-link">
              <span className="ql-icon">{link.icon}</span>
              <span className="ql-label">{label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
