import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import data from '../config/content/fatehaKhwani.json'

export default function FatehaKhwani() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      <ContentView
        items={content.sections}
        pageKey="fatehaKhwani"
        renderItem={(s, i) => (
          <div className="card">
            <div className="card-title">{s.title}</div>
            <div className="card-text" style={{ whiteSpace: 'pre-line', fontSize: '0.95em' }}>{s.text || s.arabic}</div>
          </div>
        )}
      />
    </div>
  )
}
