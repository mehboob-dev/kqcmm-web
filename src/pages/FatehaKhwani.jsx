import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function FatehaKhwani() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'fatehaKhwani')
  const [jumpToIdx, setJumpToIdx] = useState()

  if (loading || !data) {
    return (
      <div className="content-page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      </div>
    )
  }

  const content = data[lang] || data.en || {}

  return (
    <div className="content-page">
      <SeoHead title="Fateha Khwani" path={routeForPage('fatehaKhwani')} description="Traditional gathering for Qur'an recitation and du'a — dedicate the reward (thawab) of recitation to your loved ones." />
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      <ContentView
        items={content.sections}
        pageKey="fatehaKhwani"
        jumpTo={jumpToIdx}
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
      {data.quickJump && (
        <QuickJump page="fateha-khwani" indices={data.quickJump} sourceItems={content.sections} labelKey="title" onJump={setJumpToIdx} />
      )}
    </div>
  )
}
