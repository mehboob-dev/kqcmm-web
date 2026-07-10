import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/khatm.json'

export default function Khatm() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      {content.sections?.map((s, i) => (
        <div key={i} className="card">
          <div className="card-title">{s.title}</div>
          {s.text && <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{s.text}</div>}
        </div>
      ))}
      {content.masters && (
        <div className="card" style={{ marginTop: 16, borderColor: 'var(--accent)' }}>
          <div className="card-title" style={{ color: 'var(--accent)' }}>{content.masters.title}</div>
          <div className="card-text">{content.masters.text}</div>
        </div>
      )}
    </div>
  )
}
