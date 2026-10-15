import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function Changelog() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'changelog')

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
      <SeoHead title="Changelog" path={routeForPage('changelog')} description="Version history and release notes for KQCMM web app." />
      <div className="page-hero">
        <div className="page-hero-badge">Release Notes</div>
        <h2 className="page-hero-title">{content.title || 'Changelog'}</h2>
      </div>
      <div className="log-timeline">
        {content.versions?.map((v, i) => (
          <div key={i} className="log-item">
            <span className="log-dot" aria-hidden="true" />
            <div className="card log-card">
              <div className="log-head">
                <span className="log-version">v{v.version}</span>
                {i === 0 && <span className="log-latest">Latest</span>}
                <span className="log-date">{v.date}</span>
              </div>
              <ul className="log-changes">
                {v.changes.map((c, ci) => <li key={ci}>{c}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
