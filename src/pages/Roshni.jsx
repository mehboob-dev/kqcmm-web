import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import data from '../config/content/roshni.json'

export default function Roshni() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en
  const [jumpToIdx, setJumpToIdx] = useState()

  return (
    <div className="content-page">
      <SeoHead title="Roshni" path="/roshni" description="Chirag Raushan / Roshni — spiritual illumination and devotional content from the Chishti tradition." />
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      <ContentView
        items={content.sections}
        pageKey="roshni"
        jumpTo={jumpToIdx}
        renderItem={(s, i) => (
          <div className="card">
            <div className="card-title">{s.title}</div>
            <div className="card-text" style={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>{s.text || s.body}</div>
          </div>
        )}
      />
      {content.faith && (
        <div className="card" style={{ marginTop: 16 }}>
          <div className="card-title">{content.faith.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{content.faith.text}</div>
        </div>
      )}
      {content.poem && (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="card-title">{content.poem.title}</div>
          <div className="card-text" style={{ whiteSpace: 'pre-line', lineHeight: 2 }}>{content.poem.text}</div>
        </div>
      )}
      {content.quickJump && (
        <QuickJump items={content.quickJump} onJump={setJumpToIdx} />
      )}
    </div>
  )
}
