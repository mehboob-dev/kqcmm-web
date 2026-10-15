import SeoHead from '../components/SeoHead'
import ContentSkeleton from '../components/ContentSkeleton'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function Roshni() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'roshni')
  const [jumpToIdx, setJumpToIdx] = useState()

  if (loading || !data) {
    return <ContentSkeleton />
  }

  const content = data[lang] || data.en || {}

  return (
    <div className="content-page">
      <SeoHead title="Roshni" path={routeForPage('roshni')} description="Chirag Raushan / Roshni — spiritual illumination and devotional content from the Chishti tradition." />
      <div className="page-hero">
        <div className="page-hero-badge">Spiritual Illumination</div>
        <h2 className="page-hero-title">{content.title}</h2>
        {content.intro && <div className="page-hero-intro">{content.intro}</div>}
      </div>
      <ContentView
        items={content.sections}
        pageKey="roshni"
        jumpTo={jumpToIdx}
        renderItem={(s, i) => (
          <div className="card">
            <div className="card-head">
              <span className="card-num">{i + 1}</span>
              <div className="card-title">{s.title}</div>
            </div>
            <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{s.text || s.body}</div>
          </div>
        )}
      />
      {content.faith && (
        <div className="card highlight-card" style={{ marginTop: 16 }}>
          <div className="card-title">{content.faith.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{content.faith.text}</div>
        </div>
      )}
      {content.poem && (
        <div className="card poem-card" style={{ marginTop: 12 }}>
          <div className="card-title">{content.poem.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{content.poem.text}</div>
        </div>
      )}
      {data.quickJump && (
        <QuickJump page="roshni" indices={data.quickJump} sourceItems={content.sections} labelKey="title" onJump={setJumpToIdx} />
      )}
    </div>
  )
}
