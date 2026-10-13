import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function Abbajaan() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'abbajaan')

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
      <SeoHead title="Abbajaan" path={routeForPage('abbajaan')} description="Dedicated page for Abbajaan — life, teachings, and memories from the Chishti spiritual tradition." />

      <div className="bio-hero">
        <div className="bio-hero-badge">Life & Memories</div>
        <h1 className="bio-hero-title">{content.title}</h1>
      </div>

      {content.sections?.length > 0 && (
        <div className="bio-timeline">
          {content.sections.map((s, i) => (
            <div key={i} className="bio-timeline-item">
              <div className="bio-timeline-num">{i + 1}</div>
              <div className="bio-timeline-content">
                {s.title && <div className="card-title">{s.title}</div>}
                <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{s.text || s.body}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {content.life && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">{content.life.title}</div>
          <div className="card-text">{content.life.text}</div>
        </div>
      )}
      {content.teaching && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-title">{content.teaching.title}</div>
          <div className="card-text">{content.teaching.text}</div>
        </div>
      )}
      {content.memory && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-title">{content.memory.title}</div>
          <div className="card-text">{content.memory.text}</div>
        </div>
      )}
    </div>
  )
}
