import SeoHead from '../components/SeoHead'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { loadStrings } from '../config/strings'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function About() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'about')
  const [strings, setStrings] = useState(null)

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

  if (loading || !data) {
    return (
      <div className="content-page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      </div>
    )
  }

  const content = data[lang] || data.en || {}

  return (
    <div className="content-page">
      <SeoHead title="About" path={routeForPage('about')} description="About Khanqahe Qadriyah Chishtiya Musharrafiya Mahboobiya (KQCMM) — mission, activities, and contact information." />
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p style={{ whiteSpace: 'pre-line' }}>{content.intro}</p></div>}
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
      <div className="card">
        <div className="card-title">Version</div>
        <div className="card-text">5.13.0</div>
      </div>
    </div>
  )
}
