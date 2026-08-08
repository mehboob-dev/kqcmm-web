import SeoHead from '../components/SeoHead'
import { Link, useOutletContext } from 'react-router-dom'
import Icon from '../components/FontAwesome'
import homeConfig from '../config/home.json'
import { pageById, routeForNavItem } from '../config/pageRoutes'

// Home page tiles are driven by src/config/home.json — editable from the admin
// panel (🏠 Home tab). Each tile references a registry pageId + a FontAwesome
// icon name; the label is derived per language from the page's titleKey in
// strings.drawer (so labels stay translated automatically).
const homePageRoutes = (homeConfig.tiles || []).map(tile => {
  const page = pageById(tile.pageId)
  return {
    to: routeForNavItem({ pageId: tile.pageId }),
    icon: tile.icon,
    labelKey: page?.titleKey || tile.pageId,
  }
})

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
      <div className="home-quick-links" data-tour="home-links">
        {homePageRoutes.map((link) => {
          const label = strings.drawer[link.labelKey] || link.labelKey
          return (
            <Link
              key={link.to}
              to={link.to}
              className="quick-link"
              data-tour={`home-link-${link.labelKey}`}
            >
              <span className="ql-icon"><Icon name={link.icon} /></span>
              <span className="ql-label">{label}</span>
            </Link>
          )
        })}
      </div>
      </div>
    </>
  )
}
