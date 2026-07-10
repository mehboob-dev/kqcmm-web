import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/roshni.json'

export default function Roshni() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      {content.sections?.map((s, i) => (
        <div key={i} className="card">
          <div className="card-title">{s.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{s.text}</div>
        </div>
      ))}
      {content.faith && (
        <div className="card">
          <div className="card-title">{content.faith.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{content.faith.text}</div>
        </div>
      )}
      {content.poem && (
        <div className="card">
          <div className="card-title">{content.poem.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line', lineHeight: 2 }}>{content.poem.text}</div>
        </div>
      )}
    </div>
  )
}
