import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import data from '../config/content/sijrahNama.json'

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
      <SeoHead title="Sijrah Nama" path="/sijrah-nama" description="Sacred verses and spiritual poetry from the Chishti tradition — read and reflect on the devotional poetry." />
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
