import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import data from '../config/content/dua.json'

export default function Dua() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  return (
    <div className="content-page">
      <h2 className="page-title">{content.title}</h2>
      <ContentView
        items={content.duas}
        pageKey="dua"
        renderItem={(dua, i) => (
          <div className="card">
            <div className="card-title">{dua.heading}</div>
            {dua.arabic && <div className="arabic">{dua.arabic}</div>}
            <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{dua.text || dua.translation}</div>
          </div>
        )}
      />
    </div>
  )
}
