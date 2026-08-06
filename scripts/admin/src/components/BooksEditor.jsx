import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'

// Color swatches for the themed cover picker (mirrors the app's theme covers).
const COVER_COLORS = ['#4a6cf7', '#2e7d32', '#b8860b', '#c2185b', '#3f3aa8', '#0f766e', '#9d2b4a', '#7c5cfc']

const BooksEditor = forwardRef(function BooksEditor({ api, show, onStatusChange }, ref) {
  const [index, setIndex] = useState({ books: [] })
  const [activeSlug, setActiveSlug] = useState('')
  const [book, setBook] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadIndex = async () => {
    setLoading(true)
    setError(null)
    try {
      const idx = await api.listBooks()
      setIndex(idx)
      if (!activeSlug && idx.books?.length) setActiveSlug(idx.books.find(b => b.status !== 'coming-soon')?.slug || idx.books[0].slug)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadIndex() }, [])

  const loadBook = async (slug) => {
    if (!slug) { setBook(null); return }
    setLoading(true)
    setError(null)
    try {
      const b = await api.getBook(slug)
      setBook(b)
      setDirty(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeSlug) loadBook(activeSlug)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlug])

  const saveBook = async () => {
    if (!book) return
    setSaving(true)
    try {
      const r = await api.saveBook(activeSlug, book)
      setDirty(false)
      show('Book saved!')
      // Refresh chapterCount in the index list.
      setIndex(prev => ({ books: prev.books.map(b => b.slug === activeSlug ? { ...b, chapterCount: r.chapterCount } : b) }))
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const update = (patch) => { setBook(prev => ({ ...prev, ...patch })); setDirty(true) }
  const updateChapter = (i, patch) => {
    setBook(prev => ({ ...prev, chapters: prev.chapters.map((ch, j) => j === i ? { ...ch, ...patch } : ch) }))
    setDirty(true)
  }

  const addChapter = () => {
    update({ chapters: [...(book.chapters || []), { heading: `Section ${(book.chapters || []).length + 1}`, isAuto: true, paragraphs: [] }] })
  }

  const deleteChapter = (i) => {
    if (!confirm(`Delete chapter "${book.chapters[i].heading}"?`)) return
    update({ chapters: book.chapters.filter((_, j) => j !== i) })
  }

  const moveChapter = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= book.chapters.length) return
    const arr = [...book.chapters]
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    update({ chapters: arr })
  }

  const mergeIntoPrev = (i) => {
    if (i === 0) return
    if (!confirm(`Merge "${book.chapters[i].heading}" into "${book.chapters[i - 1].heading}"?`)) return
    const arr = [...book.chapters]
    arr[i - 1].paragraphs = [...arr[i - 1].paragraphs, ...arr[i].paragraphs]
    arr[i - 1].isAuto = false
    arr.splice(i, 1)
    update({ chapters: arr })
  }

  // Report dirty/saving to App.jsx header badge & Save button.
  useEffect(() => { onStatusChange?.({ dirty, saving }) }, [dirty, saving, onStatusChange])

  useImperativeHandle(ref, () => ({ save: saveBook, dirty, saving }), [dirty, saving, book, activeSlug])

  if (loading && !book) return <div className="section-card"><p style={{ color: 'var(--text-muted)' }}>Loading books…</p></div>
  if (error) return <div className="section-card"><p style={{ color: 'var(--danger)' }}>Failed: {error}</p><button className="btn btn-ghost" onClick={loadIndex} style={{ marginTop: 8 }}>Retry</button></div>

  const liveBooks = (index.books || []).filter(b => b.status !== 'coming-soon')

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      {/* Book list */}
      <div style={{ flex: '0 0 220px', borderRight: '1px solid var(--border)', paddingRight: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Books</h3>
        {liveBooks.map(b => (
          <button
            key={b.slug}
            onClick={() => setActiveSlug(b.slug)}
            style={{
              display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 4,
              borderRadius: 6, border: activeSlug === b.slug ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: activeSlug === b.slug ? 'var(--accent-bg)' : 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 13,
            }}
          >
            {b.title}
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{b.chapterCount || 0} chapters</div>
          </button>
        ))}
        {liveBooks.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No live books.</p>}
      </div>

      {/* Editor */}
      {book && (
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="field-group">
            <label className="field-label">Title</label>
            <input className="field-input" value={book.title || ''} onChange={e => update({ title: e.target.value })} />
          </div>
          <div className="field-group">
            <label className="field-label">Author</label>
            <input className="field-input" value={book.author || ''} onChange={e => update({ author: e.target.value })} />
          </div>
          <div className="field-group">
            <label className="field-label">Cover color</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {COVER_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => update({ cover: c })}
                  title={c}
                  aria-label={`Cover ${c}`}
                  style={{
                    width: 28, height: 28, borderRadius: '50%', cursor: 'pointer',
                    background: c, border: book.cover === c ? '2px solid var(--accent)' : '1px solid var(--border)',
                    outline: book.cover === c ? '2px solid var(--accent)' : 'none', outlineOffset: 1,
                  }}
                />
              ))}
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">Description</label>
            <textarea className="field-input" rows={3} value={book.description || ''} onChange={e => update({ description: e.target.value })} />
          </div>

          <div className="section-title" style={{ marginTop: 16, marginBottom: 8 }}>Chapters ({book.chapters?.length || 0})</div>
          <div className="table-wrap">
            {book.chapters?.map((ch, i) => (
              <div key={i} className="table-row" style={{ alignItems: 'center' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <input
                    className="field-input"
                    value={ch.heading || ''}
                    onChange={e => updateChapter(i, { heading: e.target.value, isAuto: false })}
                    style={{ fontSize: 12, padding: '4px 8px', width: '100%' }}
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ch.paragraphs?.length || 0} paragraphs</div>
                </div>
                <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                  <button className="btn-icon" onClick={() => moveChapter(i, -1)} disabled={i === 0} title="Move up" style={{ fontSize: 12 }}>↑</button>
                  <button className="btn-icon" onClick={() => moveChapter(i, 1)} disabled={i === book.chapters.length - 1} title="Move down" style={{ fontSize: 12 }}>↓</button>
                  <button className="btn-icon" onClick={() => mergeIntoPrev(i)} disabled={i === 0} title="Merge into previous chapter" style={{ fontSize: 12 }}>⊕</button>
                  <button className="btn-icon danger" onClick={() => deleteChapter(i)} title="Delete chapter" style={{ fontSize: 12 }}>🗑</button>
                </div>
              </div>
            ))}
            {(!book.chapters || book.chapters.length === 0) && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>No chapters yet.</p>
            )}
          </div>
          <button className="btn btn-ghost" onClick={addChapter} style={{ marginTop: 8 }}>+ Add chapter</button>

          {/* Editing paragraphs is via the section's full editor? For v1, a
              simple expandable per-chapter textarea list keeps scope tight. */}
          <div style={{ marginTop: 16 }}>
            <div className="section-title" style={{ marginBottom: 8 }}>Paragraphs (edit text)</div>
            {book.chapters?.map((ch, i) => (
              <details key={i} style={{ marginBottom: 8 }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: 'var(--accent)' }}>
                  {i + 1}. {ch.heading || 'Untitled'} — {ch.paragraphs?.length || 0} paragraphs
                </summary>
                <div style={{ marginTop: 6 }}>
                  {ch.paragraphs?.map((p, j) => (
                    <textarea
                      key={j}
                      className="field-input"
                      rows={3}
                      value={p}
                      onChange={e => {
                        const arr = [...book.chapters]
                        arr[i].paragraphs[j] = e.target.value
                        setBook({ ...book, chapters: arr })
                        setDirty(true)
                      }}
                      style={{ fontSize: 12, marginBottom: 6, width: '100%' }}
                    />
                  ))}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={() => {
                      const arr = [...book.chapters]
                      arr[i].paragraphs.push('')
                      setBook({ ...book, chapters: arr })
                      setDirty(true)
                    }}>+ paragraph</button>
                    {ch.paragraphs?.length > 0 && (
                      <button className="btn btn-ghost" style={{ fontSize: 11, color: 'var(--danger)' }} onClick={() => {
                        if (!confirm('Delete last paragraph?')) return
                        const arr = [...book.chapters]
                        arr[i].paragraphs.pop()
                        setBook({ ...book, chapters: arr })
                        setDirty(true)
                      }}>− paragraph</button>
                    )}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default BooksEditor
