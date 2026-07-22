import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import data from '../config/content/dua.json'

export default function Dua() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en
  const [jumpToIdx, setJumpToIdx] = useState()

  return (
    <div className="content-page">
      <SeoHead title="Duas" description="Collection of sacred supplications and duas from the Chishti tradition — 5 powerful prayers for blessings, health, knowledge, and spiritual growth." />
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
      {content.quickJump && (
        <QuickJump items={content.quickJump} onJump={setJumpToIdx} />
      )}
    </div>
  )
}
