import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/khatm.json'

export default function Khatm() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      <div className="card">
        <div className="card-title">{content.structure?.title || 'Structure'}</div>
        <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{content.structure?.text}</div>
      </div>
      {content.masters && (
        <div className="card">
          <div className="card-title">{content.masters.title}</div>
          <div className="card-text">{content.masters.text}</div>
        </div>
      )}
    </div>
  )
}
