import SeoHead from '../components/SeoHead'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { loadStrings } from '../config/strings'
import { getContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

const data = getContent('about')

export default function About() {
  const { lang } = useLanguage()
  const [strings, setStrings] = useState(null)
  const content = data[lang] || data.en

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

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
        <div className="card-text">5.11.0</div>
      </div>
    </div>
  )
}
