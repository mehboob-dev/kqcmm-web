import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import data from '../config/content/khatm.json'

export default function Khatm() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en
  const [jumpToIdx, setJumpToIdx] = useState()

  return (
    <div className="content-page">
      <SeoHead title="Khatm-e-Khwajagan" path="/khatm" description="30-step spiritual dhikr with Quranic recitations, salawat, and dhikr in remembrance of the Chishti masters (Khwajagan)." />
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p style={{ whiteSpace: 'pre-line' }}>{content.intro}</p></div>}
      <ContentView
        items={content.sections}
        pageKey="khatm"
        jumpTo={jumpToIdx}
        renderItem={(s, i) => (
          <div className="card">
            <div className="card-title">{s.title}</div>
            {s.text && <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{s.text}</div>}
          </div>
        )}
      />
      {content.quickJump && (
        <QuickJump items={content.quickJump} onJump={setJumpToIdx} />
      )}
    </div>
  )
}
