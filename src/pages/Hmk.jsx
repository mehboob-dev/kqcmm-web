import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/hmk.json'

export default function Hmk() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <SeoHead title="Hmk / Kalam" description="Biography and spiritual kalam of Hajee Mahboob Kassim — devotional poetry and life history." />
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
