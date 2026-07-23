import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/changelog.json'

export default function Changelog() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <SeoHead title="Changelog" path="/changelog" description="Version history and release notes for KQCMM web app." />
      <h2 className="page-title">{content.title || 'Changelog'}</h2>
      {content.versions?.map((v, i) => (
        <div key={i} className="card">
          <div className="card-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span>v{v.version}</span>
            <span style={{ fontSize: '0.8em', color: 'var(--text-muted)', fontWeight: 400 }}>{v.date}</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: '0.92em' }}>
            {v.changes.map((c, ci) => <li key={ci}>{c}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}
