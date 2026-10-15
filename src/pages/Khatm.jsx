import SeoHead from '../components/SeoHead'
import ContentSkeleton from '../components/ContentSkeleton'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function Khatm() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'khatm')
  const [jumpToIdx, setJumpToIdx] = useState()

  if (loading || !data) {
    return <ContentSkeleton />
  }

  const content = data[lang] || data.en || {}

  return (
    <div className="content-page">
      <SeoHead title="Khatm-e-Khwajagan" path={routeForPage('khatm')} description="30-step spiritual dhikr with Quranic recitations, salawat, and dhikr in remembrance of the Chishti masters (Khwajagan)." />
      <div className="page-hero">
        <div className="page-hero-badge">Spiritual Dhikr</div>
        <h2 className="page-hero-title">{content.title}</h2>
        {content.intro && <div className="page-hero-intro" style={{ whiteSpace: 'pre-line' }}>{content.intro}</div>}
      </div>
      <ContentView
        items={content.sections}
        pageKey="khatm"
        jumpTo={jumpToIdx}
        renderItem={(s, i) => (
          <div className="card">
            <div className="card-head">
              <span className="card-num">{i + 1}</span>
              <div className="card-title">{s.title}</div>
            </div>
            {s.text && <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{s.text}</div>}
          </div>
        )}
      />
      {data.quickJump && (
        <QuickJump page="khatm" indices={data.quickJump} sourceItems={content.sections} labelKey="title" onJump={setJumpToIdx} />
      )}
    </div>
  )
}
