import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import SeoHead from '../components/SeoHead'
import ContentView from '../components/ContentView'
import QuickJump from '../components/QuickJump'
import { useLanguage } from '../context/LanguageContext'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'
import { readProgress, saveProgress, progressPct } from '../utils/bookProgress'
import { coverGradient } from './BooksIndex'

export default function BookReader() {
  const { slug } = useParams()
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, `books/${slug}`)

  const [jumpToIdx, setJumpToIdx] = useState()

  // Extract the nested localized content (fallback to English)
  const content = data?.[lang] || data?.en || {}

  // Chapters as "items" for ContentView (list + slide modes). Each chapter is a
  // titled section of card paragraphs. Jumping (QuickJump/TOC) is handled via
  // jumpToIdx, which ContentView scrolls/slides to.
  const chapters = content.chapters || []
  const renderChapter = (ch, i) => {
    const isLast = i === chapters.length - 1
    return (
      <section style={{ marginBottom: 14 }}>
        <h3 style={{ fontSize: '1.05em', color: 'var(--text-heading)', marginBottom: 8 }}>
          {ch.heading}
        </h3>
        {ch.paragraphs.map((p, j) => (
          <div key={j} className="card">
            <div className="card-text" style={{ whiteSpace: 'pre-line' }}>{p}</div>
          </div>
        ))}
        {isLast && (
          <div style={{ textAlign: 'center', marginTop: 28, marginBottom: 20 }}>
            <Link
              to={routeForPage('books')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--accent)',
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 20px',
                fontSize: '0.92em',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              ← Back to Books
            </Link>
          </div>
        )}
      </section>
    )
  }

  // Track reading progress as the reader scrolls/slides. ContentView reports the
  // active chapter via onIndexChange (slide index or list viewport band).
  const handleChapterChange = (idx) => {
    if (idx >= 0) saveProgress(slug, idx)
  }
  // Resume: on load, jump to the saved chapter.
  const savedIdx = data ? readProgress(slug) : -1
  const didResume = useRef(false)
  useEffect(() => {
    if (data && savedIdx > 0 && !didResume.current) {
      didResume.current = true
      setJumpToIdx(savedIdx)
    }
  }, [data, savedIdx])

  // Remember the most recently opened book so the Home dashboard can offer
  // a "continue reading" shortcut (best-effort; storage may be blocked).
  useEffect(() => {
    if (!slug) return
    try { localStorage.setItem('kqcmm_last_book', slug) } catch { /* ignore */ }
  }, [slug])

  const progressPctNow = progressPct(slug, chapters.length)

  const handleShare = async () => {
    const title = `${content.title || 'Book'} — Hajee Mahboob Kassim`
    const text = `${content.title || ''}: ${content.description || ''}`
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title, text, url }) } catch { /* user cancelled */ }
    } else if (navigator.clipboard) {
      try { await navigator.clipboard.writeText(url); alert('Link copied') } catch { /* ignore */ }
    }
  }

  if (loading || !data) {
    return (
      <div className="content-page">
        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div className="content-page">
      <SeoHead
        title={content.title}
        path={`/books/${slug}`}
        description={content.description || `${content.title || ''} by Hajee Mahboob Kassim`}
      />

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Link to={routeForPage('books')} style={{ color: 'var(--text-muted)', fontSize: '0.9em', textDecoration: 'none' }}>
          ← Books
        </Link>
        <button
          onClick={handleShare}
          style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', borderRadius: 8, padding: '6px 12px', fontSize: '0.85em', cursor: 'pointer' }}
        >
          ↗ Share
        </button>
      </div>

      {/* Cover + header */}
      <div
        className="reader-hero-cover"
        style={{
          background: coverGradient(content.cover),
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.6em', fontWeight: 800, textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>{content.title}</h1>
        <div style={{ marginTop: 6, fontSize: '0.95em', opacity: 0.95, textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>{content.author}</div>
      </div>
      {content.description && (
        <p style={{ color: 'var(--text-muted)', fontSize: '0.92em', marginBottom: 16, lineHeight: 1.6 }}>{content.description}</p>
      )}

      {/* Reading progress */}
      {progressPctNow > 0 && (
        <div className="reader-progress-wrap">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82em', fontWeight: 600 }}>
            <span style={{ color: 'var(--text-heading)' }}>Reading Progress</span>
            <span style={{ color: 'var(--accent)' }}>{progressPctNow}%</span>
          </div>
          <div className="reader-progress-track">
            <div className="reader-progress-bar" style={{ width: `${progressPctNow}%` }} />
          </div>
        </div>
      )}

      {/* Chapters (list or slide via ContentView) */}
      <ContentView
        items={chapters}
        pageKey={`book-${slug}`}
        jumpTo={jumpToIdx}
        onIndexChange={handleChapterChange}
        showCounter={false}
        renderItem={renderChapter}
      />

      {/* Chapter jump (replaces the old TOC dropdown) */}
      <QuickJump
        page={`book-${slug}`}
        indices={chapters.map((_, i) => i)}
        sourceItems={chapters}
        labelKey="heading"
        onJump={setJumpToIdx}
      />
    </div>
  )
}
