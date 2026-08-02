import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import { getContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

const data = getContent('sijrahNama')

export default function SijrahNama() {
  const { lang } = useLanguage()
  const content = data[lang] || data.en

  // Build a combined items array from verses + lineage
  const items = [
    ...(content.verses || []),
    ...(content.lineage || []),
  ]

  return (
    <div className="content-page">
      <SeoHead title="Sijrah Nama" path={routeForPage('sijrahNama')} description="Sacred verses and spiritual poetry from the Chishti tradition — read and reflect on the devotional poetry." />
      <h2 className="page-title">{content.title}</h2>
      {content.intro && <div className="page-section"><p>{content.intro}</p></div>}
      {items.length > 0 ? (
        <ContentView
          items={items}
          pageKey="sijrahNama"
          renderItem={(v, i) => (
            <div className="card">
              <div className="card-title">{v.title}</div>
              <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{v.text}</div>
            </div>
          )}
        />
      ) : (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No content yet for this language.</p>
      )}
    </div>
  )
}
