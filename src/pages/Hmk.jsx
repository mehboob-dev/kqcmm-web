import SeoHead from '../components/SeoHead'
import ContentSkeleton from '../components/ContentSkeleton'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function Hmk() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'hmk')

  if (loading || !data) {
    return <ContentSkeleton />
  }

  const content = data[lang] || data.en || {}

  return (
    <div className="content-page">
      <SeoHead title="Hmk / Kalam" path={routeForPage('hmk')} description="Biography and spiritual kalam of Hajee Mahboob Kassim — devotional poetry and life history." />

      <div className="bio-hero">
        <div className="bio-hero-badge">Biography & Mission</div>
        <h1 className="bio-hero-title">{content.title}</h1>
        {content.intro && <div className="bio-hero-intro">{content.intro}</div>}
      </div>

      <div className="bio-timeline">
        {content.paragraphs?.map((p, i) => {
          const isQuote = p.trim().startsWith('"') && p.trim().endsWith('"')
          if (isQuote) {
            return (
              <div key={i} className="bio-quote-card">
                <span className="bio-quote-mark">“</span>
                <div style={{ whiteSpace: 'pre-line' }}>{p.replace(/^"|"$/g, '')}</div>
              </div>
            )
          }
          return (
            <div key={i} className="bio-timeline-item">
              <div className="bio-timeline-num">{i + 1}</div>
              <div className="bio-timeline-content">
                <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{p}</div>
              </div>
            </div>
          )
        })}
      </div>

      {content.items?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {content.items.map((item, i) => (
            <div key={i} className="card">
              <div className="card-title">{item.title}</div>
              <div className="card-text">{item.text}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
