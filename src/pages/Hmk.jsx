import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function Hmk() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'hmk')

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
      <SeoHead title="Hmk / Kalam" path={routeForPage('hmk')} description="Biography and spiritual kalam of Hajee Mahboob Kassim — devotional poetry and life history." />
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      {content.paragraphs?.map((p, i) => (
        <div key={i} className="card">
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{p}</div>
        </div>
      ))}
      {content.items?.map((item, i) => (
        <div key={i} className="card">
          <div className="card-title">{item.title}</div>
          <div className="card-text">{item.text}</div>
        </div>
      ))}
    </div>
  )
}
