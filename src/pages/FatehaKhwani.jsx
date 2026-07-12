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
          // Check if this section has sub-cards (text contains ||| separator)
          if (s.text && s.text.includes('|||')) {
            const subCards = s.text.split('|||').map(block => {
              const [title, ...rest] = block.split('::')
              return { title: title.trim(), text: rest.join('::').trim() }
            })
            return (
              <div>
                <div className="card" style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', marginBottom: 12 }}>
                  <div className="card-title" style={{ color: 'var(--accent)' }}>{s.title}</div>
                </div>
                {subCards.map((sub, si) => (
                  <div key={si} className="card" style={{ marginBottom: 8, marginLeft: 8, borderLeft: '3px solid var(--accent)' }}>
                    <div className="card-title" style={{ fontSize: '0.8em', color: 'var(--text-muted)' }}>{sub.title}</div>
                    <div className="card-text" style={{ whiteSpace: 'pre-line', fontSize: '0.95em' }}>{sub.text}</div>
                  </div>
                ))}
              </div>
            )
          }
          return (
            <div className="card">
              <div className="card-title">{s.title}</div>
              <div className="card-text" style={{ whiteSpace: 'pre-line', fontSize: '0.95em' }}>{s.text || s.arabic}</div>
            </div>
          )
        }}
      />
    </div>
  )
}
