import SeoHead from '../components/SeoHead'
import ContentSkeleton from '../components/ContentSkeleton'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function SalimPappa() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'salimPappa')

  if (loading || !data) {
    return <ContentSkeleton />
  }

  const content = data[lang] || data.en || {}

  return (
    <div className="content-page">
      <SeoHead title="Salim Pappa" path={routeForPage('salimPappa')} description="Dedicated page for Salim Pappa — teachings and spiritual guidance from the Chishti tradition." />

      <div className="bio-hero">
        <div className="bio-hero-badge">Teachings & Guidance</div>
        <h1 className="bio-hero-title">{content.title}</h1>
        {content.intro && <div className="bio-hero-intro">{content.intro}</div>}
      </div>

      {content.paragraphs?.length > 0 && (
        <div className="bio-timeline">
          {content.paragraphs.map((p, i) => (
            <div key={i} className="bio-timeline-item">
              <div className="bio-timeline-num">{i + 1}</div>
              <div className="bio-timeline-content">
                <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{p}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {content.teachings && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">{content.teachings.title}</div>
          <div className="card-text">{content.teachings.text}</div>
        </div>
      )}
      {content.unity && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-title">{content.unity.title}</div>
          <div className="card-text">{content.unity.text}</div>
        </div>
      )}
    </div>
  )
}
