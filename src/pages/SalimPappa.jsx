import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function SalimPappa() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'salimPappa')

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
      <SeoHead title="Salim Pappa" path={routeForPage('salimPappa')} description="Dedicated page for Salim Pappa — teachings and spiritual guidance from the Chishti tradition." />
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      {content.paragraphs?.map((p, i) => (
        <div key={i} className="card">
          <div className="card-text">{p}</div>
        </div>
      ))}
      {content.teachings && (
        <div className="card">
          <div className="card-title">{content.teachings.title}</div>
          <div className="card-text">{content.teachings.text}</div>
        </div>
      )}
      {content.unity && (
        <div className="card">
          <div className="card-title">{content.unity.title}</div>
          <div className="card-text">{content.unity.text}</div>
        </div>
      )}
    </div>
  )
}
