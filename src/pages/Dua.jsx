import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function Dua() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'dua')
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
      <SeoHead title="Duas" path={routeForPage('dua')} description="Collection of sacred supplications and duas from the Chishti tradition — 5 powerful prayers for blessings, health, knowledge, and spiritual growth." />
      <h2 className="page-title">{content.title}</h2>
      <ContentView
        items={content.duas}
        pageKey="dua"
        jumpTo={jumpToIdx}
        renderItem={(dua, i) => (
          <div className="card">
            <div className="card-title">{dua.heading}</div>
            {dua.arabic && <div className="arabic">{dua.arabic}</div>}
            <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{dua.text || dua.translation}</div>
          </div>
        )}
      />
      {data.quickJump && (
        <QuickJump page="dua" indices={data.quickJump} sourceItems={content.duas} labelKey="heading" onJump={setJumpToIdx} />
      )}
    </div>
  )
}
