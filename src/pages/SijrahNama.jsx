import SeoHead from '../components/SeoHead'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'
import ContentView from '../components/ContentView'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

export default function SijrahNama() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'sijrahNama')

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

  // Build a combined items array from verses + lineage
  const verses = content.verses || []
  const items = [
    ...verses,
    ...(content.lineage || []),
  ]

  return (
    <div className="content-page">
      <SeoHead title="Sijrah Nama" path={routeForPage('sijrahNama')} description="Sacred verses and spiritual poetry from the Chishti tradition — read and reflect on the devotional poetry." />
      <div className="page-hero">
        <div className="page-hero-badge">Sacred Verses</div>
        <h2 className="page-hero-title">{content.title}</h2>
        {content.intro && <div className="page-hero-intro">{content.intro}</div>}
      </div>
      {items.length > 0 ? (
        <ContentView
          items={items}
          pageKey="sijrahNama"
          renderItem={(v, i) => (
            i < verses.length ? (
              <div className="card">
                <div className="card-head">
                  <span className="card-num">{i + 1}</span>
                  <div className="card-title">{v.title}</div>
                </div>
                <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{v.text}</div>
              </div>
            ) : (
              <div className="bio-timeline-item">
                <div className="bio-timeline-num">{i - verses.length + 1}</div>
                <div className="bio-timeline-content">
                  <div className="card-title">{v.title}</div>
                  <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{v.text}</div>
                </div>
              </div>
            )
          )}
        />
      ) : (
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No content yet for this language.</p>
      )}
    </div>
  )
}
