import SeoHead from '../components/SeoHead'
import ContentSkeleton from '../components/ContentSkeleton'
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { loadStrings } from '../config/strings'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'
import Icon from '../components/FontAwesome'

export default function About() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'about')
  const [strings, setStrings] = useState(null)

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

  if (loading || !data) {
    return <ContentSkeleton hero={false} rows={4} />
  }

  const content = data[lang] || data.en || {}

  return (
    <div className="content-page">
      <SeoHead title="About" path={routeForPage('about')} description="About Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya (KQCMM) — mission, activities, and contact information." />
      <div className="page-hero">
        <div className="page-hero-badge">About KQCMM</div>
        <h2 className="page-hero-title">{content.title}</h2>
        {content.intro && <div className="page-hero-intro" style={{ whiteSpace: 'pre-line' }}>{content.intro}</div>}
      </div>
      {content.sections?.map((s, i) => (
        <div key={i} className="card">
          {s.title && <div className="card-title">{s.title}</div>}
          <div className="card-text">{s.text || s.body}</div>
        </div>
      ))}
      {content.mission && (
        <div className="card">
          <div className="card-title">{content.mission.title}</div>
          <div className="card-text">{content.mission.text}</div>
        </div>
      )}
      {content.activities && (
        <div className="card">
          <div className="card-title">{content.activities.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{content.activities.text}</div>
        </div>
      )}
      {content.contact && (
        <div className="card">
          <div className="card-title">{content.contact.title}</div>
          <div className="card-text">{content.contact.text}</div>
        </div>
      )}
      <div className="card version-card">
        <div>
          <div className="version-label">Version</div>
          <div className="version-number">7.1.0</div>
        </div>
        <Link to={routeForPage('changelog')} viewTransition className="version-link">
          Changelog <Icon name="faArrowRight" />
        </Link>
      </div>
    </div>
  )
}
