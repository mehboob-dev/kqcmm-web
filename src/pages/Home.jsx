import SeoHead from '../components/SeoHead'
import { Link, useOutletContext } from 'react-router-dom'
import { routeForPage } from '../config/pageRoutes'

const quickLinks = [
  { to: () => routeForPage('dua'), icon: '🤲', labelKey: 'duas' },
  { to: () => routeForPage('hmk'), icon: '📜', labelKey: 'hmk' },
  { to: () => routeForPage('sijrahNama'), icon: '📖', labelKey: 'sijrah' },
  { to: () => routeForPage('fatehaKhwani'), icon: '🕌', labelKey: 'fatehaKhwani' },
  { to: () => routeForPage('khatm'), icon: '✨', labelKey: 'khatm' },
  { to: () => routeForPage('salimPappa'), icon: '👤', labelKey: 'salimPappa' },
  { to: () => routeForPage('roshni'), icon: '🕯️', labelKey: 'roshni' },
  { to: () => routeForPage('abbajaan'), icon: '👳', labelKey: 'abbajaan' },
  { to: () => routeForPage('calendar'), icon: '📅', labelKey: 'calendar' },
  { to: () => routeForPage('about'), icon: 'ℹ️', labelKey: 'about' },
]

const homePageRoutes = quickLinks.map(link => ({ ...link, to: link.to() }))

export default function Home() {
  const { strings } = useOutletContext()

  return (
    <>
      <SeoHead title="Home" path="" description="Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya — Spiritual platform for followers of the Chishti Sufi order. Duas, khatm, fateha, kalam, sijrah nama and more." />
      <div className="home-container content-page">
      <img src={import.meta.env.BASE_URL + 'logo.png'} alt="KQCMM" className="home-logo" />
      <h1 className="home-title">KQCMM</h1>
      <p className="home-subtitle">{strings.tagline}</p>
      <p className="home-desc">{strings.home.welcome}</p>
      <div className="home-quick-links">
        {homePageRoutes.map((link) => {
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
    </>
  )
}
