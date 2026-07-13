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
        renderItem={(s, i) => {
          if (s.text && s.text.includes('|||')) {
            const subCards = s.text.split('|||').map(block => {
              const [title, ...rest] = block.split('::')
              return { title: title.trim(), text: rest.join('::').trim() }
            })
            return (
              <div>
                <div className="card">
                  <div className="card-title">{s.title}</div>
                </div>
                {subCards.map((sub, si) => (
                  <div key={si} className="card card-accent">
                    <div className="card-title">{sub.title}</div>
                    <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{sub.text}</div>
                  </div>
                ))}
              </div>
            )
          }
          return (
            <div className="card">
              <div className="card-title">{s.title}</div>
              <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{s.text || s.arabic}</div>
            </div>
          )
        }}
      />
    </div>
  )
}
