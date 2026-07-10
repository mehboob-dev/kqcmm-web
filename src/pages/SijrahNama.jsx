import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/sijrahNama.json'

export default function SijrahNama() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      {content.verses?.map((v, i) => (
        <div key={i} className="card">
          <div className="card-title">{v.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{v.text}</div>
        </div>
      ))}
    </div>
  )
}
