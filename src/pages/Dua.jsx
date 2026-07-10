import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/dua.json'

export default function Dua() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      {content.duas.map((dua, i) => (
        <div key={i} className="card">
          <div className="card-title">{dua.heading}</div>
          {dua.arabic && <div className="arabic">{dua.arabic}</div>}
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{dua.text || dua.translation}</div>
        </div>
      ))}
    </div>
  )
}
