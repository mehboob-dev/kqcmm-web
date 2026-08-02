import { useState, useEffect, useRef, useCallback } from 'react'
import Modal from './ui/Modal.jsx'

const CONTENT_KEYS = ['title', 'heading', 'text', 'body', 'intro', 'label', 'subtitle']

function countFields(obj, key = '') {
  if (typeof obj === 'string') {
    if (!key || CONTENT_KEYS.includes(key)) {
      return { strings: 1, filled: obj.trim().length > 0 ? 1 : 0 }
    }
    return { strings: 0, filled: 0 }
  }
  if (typeof obj !== 'object' || obj === null) return { strings: 0, filled: 0 }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return { strings: 1, filled: 0 }
    return obj.reduce((a, item) => {
      const c = countFields(item, '')
      return { strings: a.strings + c.strings, filled: a.filled + c.filled }
    }, { strings: 0, filled: 0 })
  }
  return Object.entries(obj).reduce((a, [k, v]) => {
    const c = countFields(v, k)
    return { strings: a.strings + c.strings, filled: a.filled + c.filled }
  }, { strings: 0, filled: 0 })
}

function pctClass(pct) {
  if (pct >= 90) return 'pct-high'
  if (pct >= 50) return 'pct-mid'
  return 'pct-low'
}

export default function LanguageEditor({ api, pages, show, onJumpToPage }) {
  const [pageData, setPageData] = useState({})
  const [activePage, setActivePage] = useState(null)
  const [compareLangs, setCompareLangs] = useState([])
  const [statusLoading, setStatusLoading] = useState(true)
  const [statusErrors, setStatusErrors] = useState(0)
  const mountedRef = useRef(true)

  // Language CRUD
  const [dialog, setDialog] = useState(null)
  const [newLang, setNewLang] = useState('')
  const [sourceLang, setSourceLang] = useState('en')
  const [dialogBusy, setDialogBusy] = useState(false)
  const [dialogError, setDialogError] = useState('')

  const [langList, setLangList] = useState([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    return () => { mountedRef.current = false }
  }, [])

  const loadPageData = useCallback(() => {
    if (!pages || pages.length === 0) { setStatusLoading(false); return }
    let errCount = 0; let completed = 0
    setStatusLoading(true); setStatusErrors(0); setPageData({})

    // Languages come from the real source of truth (strings/*.json), NOT from
    // guessing object keys — content files have top-level non-language objects
    // (calendar.json's monthNames/monthNamesShort) that would otherwise show up
    // as fake "languages".
    api.listStringLangs()
      .then(codes => {
        if (!mountedRef.current || !codes.length) return
        setLangList(codes)
        // Seed compare with the first two real langs on first load, then keep
        // any existing selection in sync (drop langs that no longer exist).
        setCompareLangs(prev => {
          if (prev.length) return prev.filter(l => codes.includes(l))
          return codes.slice(0, 2)
        })
      })
      .catch(() => { /* keep current langList */ })

    pages.forEach(async (p) => {
      try {
        const d = await api.getPage(p.name)
        if (mountedRef.current) {
          setPageData(prev => ({ ...prev, [p.name]: d }))
        }
      } catch { errCount++ }
      finally {
        completed++
        if (completed === pages.length && mountedRef.current) {
          setStatusLoading(false); setStatusErrors(errCount)
        }
      }
    })
  }, [pages])

  useEffect(() => { loadPageData() }, [loadPageData, refreshKey])

  const data = activePage ? pageData[activePage] : null

  const pageStatus = pages.map(p => {
    const d = pageData[p.name]
    if (!d) return { name: p.name, langs: {} }
    const langs = {}
    langList.forEach(l => {
      const obj = d[l]
      if (!obj) { langs[l] = { strings: 0, filled: 0, pct: -1 }; return }
      const c = countFields(obj)
      langs[l] = { ...c, pct: c.strings > 0 ? Math.round(c.filled / c.strings * 100) : 0 }
    })
    return { name: p.name, langs }
  })

  const openAddLang = () => { setDialog('add'); setNewLang(''); setSourceLang('en'); setDialogError('') }
  const openRemoveLang = () => { setDialog('remove'); setNewLang(''); setDialogError('') }
  const closeDialog = () => { setDialog(null); setDialogError('') }

  const handleAddLang = async () => {
    const code = newLang.trim().toLowerCase().replace(/\s+/g, '-')
    if (!code) { setDialogError('Enter a language code'); return }
    if (langList.includes(code)) { setDialogError('Language already exists'); return }
    if (!/^[a-z]{2,8}$/.test(code)) { setDialogError('Use 2-8 lowercase letters (e.g. "fr", "arabic")'); return }
    setDialogBusy(true)
    try {
      const r = await api.addContentLang(code, sourceLang === 'none' ? null : sourceLang)
      show(`Language "${code}" added to ${r.modified} pages`)
      closeDialog()
      setRefreshKey(k => k + 1)
    } catch (e) { setDialogError(e.message) }
    finally { setDialogBusy(false) }
  }

  const handleRemoveLang = async () => {
    const code = newLang.trim()
    if (!code) { setDialogError('Select a language'); return }
    if (code === 'en') { setDialogError('Cannot remove English'); return }
    if (!confirm(`Remove "${code}" from ALL pages and strings? This cannot be undone.`)) return
    setDialogBusy(true)
    try {
      const r = await api.removeContentLang(code)
      show(`Language "${code}" removed from ${r.modified} pages`)
      closeDialog()
      // Also remove from compareLangs so it doesn't reference a deleted lang
      setCompareLangs(prev => prev.filter(l => l !== code))
      setRefreshKey(k => k + 1)
    } catch (e) { setDialogError(e.message) }
    finally { setDialogBusy(false) }
  }

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700 }}>Translation Status</h3>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={openAddLang}>+ Add Language</button>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px', color: 'var(--danger)' }} onClick={openRemoveLang}>- Remove Language</button>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
          {statusLoading ? 'Loading page data…' : `${langList.length} languages across ${pages.length} pages`}
          {statusErrors > 0 && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>{statusErrors} page(s) failed to load</span>}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
          % = non-empty translatable fields ÷ total translatable fields, per language.
          Only content fields are counted (<code>title</code>, <code>heading</code>, <code>text</code>,
          <code>body</code>, <code>intro</code>, <code>label</code>, <code>subtitle</code>). A field empty in
          both languages (or with different field counts per language) will show &lt; 100%.
        </p>
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-col-page">Page</div>
            {langList.map(l => <div key={l} className="table-col-lang">{l}</div>)}
          </div>
          {statusLoading ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : (
            pageStatus.map(({ name, langs }) => (
              <div key={name} className={'table-row' + (activePage === name ? ' active' : '')}
                onClick={() => setActivePage(name)}
                role="button" tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActivePage(name) }}>
                <div className="table-col-page">{name}</div>
                {langList.map(l => {
                  const s = langs[l]
                  if (!s || s.pct === -1) return <div key={l} className="table-col-lang" style={{ color: '#d1d5db' }}>—</div>
                  return <div key={l} className={'table-col-lang ' + pctClass(s.pct)}
                    style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                    title={`Edit ${name} in ${l}`}
                    onClick={e => { e.stopPropagation(); onJumpToPage?.(name, l) }}
                    role="button" tabIndex={0}
                    onKeyDown={e => { if (e.key === 'Enter') { e.stopPropagation(); onJumpToPage?.(name, l) } }}>
                    {s.pct}%
                  </div>
                })}
              </div>
            ))
          )}
        </div>
      </div>

      {activePage && data && (
        <div className="preview-panel" style={{ width: 420, maxWidth: '50vw' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>{activePage} — Compare</h3>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
            {langList.map(l => (
              <button key={l}
                className={'lang-tab' + (compareLangs.includes(l) ? ' active' : '')}
                style={{ fontSize: 11, padding: '4px 12px' }}
                onClick={() => setCompareLangs(prev =>
                  prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]
                )}>
                {l}
              </button>
            ))}
          </div>
          <CompareView data={data} langs={compareLangs} depth={0} />
        </div>
      )}

      {/* Add language dialog */}
      {dialog === 'add' && (
        <Modal title="Add Language" onClose={closeDialog}
          actions={<><button className="btn btn-ghost" onClick={closeDialog}>Cancel</button><button className="btn btn-primary" onClick={handleAddLang} disabled={dialogBusy}>Add</button></>}>
          <div className="field-group">
            <label className="field-label" htmlFor="new-lang">Language code</label>
            <input id="new-lang" className="field-input" value={newLang} onChange={e => setNewLang(e.target.value)} placeholder="e.g. fr, arabic, turkish" />
            <small className="field-help">Lowercase letters only (2-8 characters).</small>
          </div>
          <div className="field-group">
            <label className="field-label" htmlFor="source-lang">Copy content from</label>
            <select id="source-lang" className="field-select" value={sourceLang} onChange={e => setSourceLang(e.target.value)}>
              {langList.map(l => <option key={l} value={l}>{l}</option>)}
              <option value="none">Empty (start fresh)</option>
            </select>
            <small className="field-help">Content will be cloned from this language as a starting point.</small>
          </div>
          {dialogError && <p className="form-error" role="alert">{dialogError}</p>}
        </Modal>
      )}

      {/* Remove language dialog */}
      {dialog === 'remove' && (
        <Modal title="Remove Language" danger onClose={closeDialog}
          actions={<><button className="btn btn-ghost" onClick={closeDialog}>Cancel</button><button className="btn btn-danger" onClick={handleRemoveLang} disabled={dialogBusy}>Remove</button></>}>
          <p className="modal-context">This will permanently delete the language from all content pages and strings.</p>
          <div className="field-group">
            <label className="field-label" htmlFor="remove-lang">Language to remove</label>
            <select id="remove-lang" className="field-select" value={newLang} onChange={e => setNewLang(e.target.value)}>
              <option value="">Select…</option>
              {langList.filter(l => l !== 'en').map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          {dialogError && <p className="form-error" role="alert">{dialogError}</p>}
        </Modal>
      )}
    </div>
  )
}

function CompareView({ data, langs, depth }) {
  const ref = langs.find(l => data[l])
  if (!ref) return <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select at least one language</p>
  const refObj = data[ref]

  if (typeof refObj !== 'object' || refObj === null) {
    return <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
      {langs.map(l => (
        <div key={l} style={{ flex: '1 0 120px', fontSize: 12, padding: '4px 8px', background: '#fff', borderRadius: 6, border: '1px solid var(--border)' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: 10, fontWeight: 600 }}>{l}: </span>
          {data[l] !== undefined && data[l] !== null && data[l] !== ''
            ? String(data[l]).substring(0, 100)
            : <span style={{ color: 'var(--danger)' }}>[empty]</span>}
        </div>
      ))}
    </div>
  }

  if (Array.isArray(refObj)) {
    return <div style={{ marginLeft: depth > 0 ? 8 : 0 }}>
      {refObj.slice(0, 10).map((_, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <span className="tag" style={{ marginBottom: 4 }}>#{i + 1}</span>
          <CompareView data={Object.fromEntries(langs.map(l => [l, data[l]?.[i]]))} langs={langs} depth={depth + 1} />
        </div>
      ))}
      {refObj.length > 10 && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>… and {refObj.length - 10} more</p>}
    </div>
  }

  return <div style={{ marginLeft: depth > 0 ? 8 : 0 }}>
    {Object.keys(refObj).filter(k => k !== 'quickJump').map(k => {
      const hasChildren = typeof refObj[k] === 'object' && refObj[k] !== null && !Array.isArray(refObj[k])
      const isArray = Array.isArray(refObj[k])
      if (isArray && typeof refObj[k]?.[0] === 'object') return null

      return (
        <div key={k} style={{ marginBottom: depth < 4 ? 8 : 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 3, marginTop: depth < 4 ? 4 : 0 }}>{k}</div>
          {hasChildren ? (
            <CompareView data={Object.fromEntries(langs.map(l => [l, data[l]?.[k]]))} langs={langs} depth={depth + 1} />
          ) : isArray ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {langs.map(l => {
                const arr = data[l]?.[k]
                if (!Array.isArray(arr) || arr.length === 0) return <div key={l} style={{ flex: 1, fontSize: 11, color: 'var(--danger)' }}>[empty]</div>
                return <div key={l} style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)' }}>
                  <span style={{ fontWeight: 600 }}>{l}:</span> {arr.filter(Boolean).length}/{arr.length}
                </div>
              })}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {langs.map(l => {
                const v = data[l]?.[k]
                const isEmpty = !v || !String(v).trim()
                return (
                  <div key={l} style={{
                    flex: '1 0 160px', fontSize: 12, padding: '4px 8px',
                    background: isEmpty ? '#fef2f2' : '#fff',
                    borderRadius: 6, border: isEmpty ? '1px solid #fecaca' : '1px solid var(--border)',
                    color: isEmpty ? 'var(--danger)' : 'var(--text)',
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600, fontSize: 10 }}>{l}: </span>
                    {isEmpty ? '[empty]' : String(v).substring(0, 120)}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    })}
  </div>
}
