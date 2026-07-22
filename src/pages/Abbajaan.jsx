import SeoHead from '../components/SeoHead'
import { useLanguage } from '../context/LanguageContext'
import data from '../config/content/abbajaan.json'

export default function Abbajaan() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <SeoHead title="Abbajaan" description="Dedicated page for Abbajaan — life, teachings, and memories from the Chishti spiritual tradition." />
      <h2 className="page-title">{content.title}</h2>
      {content.sections?.map((s, i) => (
        <div key={i} className="card">
          {s.title && <div className="card-title">{s.title}</div>}
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{s.text || s.body}</div>
        </div>
      ))}
      {content.life && (
        <div className="card">
          <div className="card-title">{content.life.title}</div>
          <div className="card-text">{content.life.text}</div>
        </div>
      )}
      {content.teaching && (
        <div className="card">
          <div className="card-title">{content.teaching.title}</div>
          <div className="card-text">{content.teaching.text}</div>
        </div>
      )}
      {content.memory && (
        <div className="card">
          <div className="card-title">{content.memory.title}</div>
          <div className="card-text">{content.memory.text}</div>
        </div>
      )}
    </div>
  )
}
