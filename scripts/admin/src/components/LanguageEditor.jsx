import { useState, useEffect } from 'react'

const LANGS = ['en', 'hinglish', 'urdu']

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

export default function LanguageEditor({ api, pages, show }) {
  const [pageData, setPageData] = useState({})
  const [activePage, setActivePage] = useState(null)
  const [compareLangs, setCompareLangs] = useState(['en', 'urdu'])

  useEffect(() => {
    pages.forEach(async (p) => {
      try {
        const d = await api.getPage(p.name)
        setPageData(prev => ({ ...prev, [p.name]: d }))
      } catch {}
    })
  }, [pages])

  const data = activePage ? pageData[activePage] : null

  const pageStatus = pages.map(p => {
    const d = pageData[p.name]
    if (!d) return { name: p.name, langs: {} }
    const langs = {}
    LANGS.forEach(l => {
      const obj = d[l]
      if (!obj) { langs[l] = { strings: 0, filled: 0, pct: 0 }; return }
      const c = countFields(obj)
      langs[l] = { ...c, pct: c.strings > 0 ? Math.round(c.filled / c.strings * 100) : 0 }
    })
    return { name: p.name, langs }
  })

  return (
    <div style={{ display: 'flex', gap: 20, height: '100%' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: 'var(--text)' }}>
          Translation Status
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
          Shows how many text fields are filled per language. Click a row for side-by-side comparison.
        </p>
        <div className="table-wrap">
          <div className="table-header">
            <div className="table-col-page">Page</div>
            {LANGS.map(l => <div key={l} className="table-col-lang">{l}</div>)}
          </div>
          {pageStatus.map(({ name, langs }) => (
            <div key={name} className={'table-row' + (activePage === name ? ' active' : '')}
              onClick={() => setActivePage(name)}>
              <div className="table-col-page">{name}</div>
              {LANGS.map(l => {
                const s = langs[l]
                if (!s) return <div key={l} className="table-col-lang" style={{ color: '#ddd' }}>—</div>
                return (
                  <div key={l} className={'table-col-lang ' + pctClass(s.pct)}>
                    {s.pct}%
                  </div>
                )
              })}
            </div>
          ))}
          {pageStatus.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading page data...
            </div>
          )}
        </div>
      </div>

      {activePage && data && (
        <div style={{ width: 420, flexShrink: 0, overflowY: 'auto', borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8, color: 'var(--text)' }}>
            {activePage} — Compare
          </h3>
          <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
            {LANGS.map(l => (
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
    </div>
  )
}

function CompareView({ data, langs, depth }) {
  const ref = langs.find(l => data[l])
  if (!ref) return <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No data</p>
  const refObj = data[ref]

  if (typeof refObj !== 'object' || refObj === null) {
    return <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
      {langs.map(l => (
        <div key={l} style={{
          flex: '1 0 120px', fontSize: 12, padding: '4px 8px',
          background: '#fff', borderRadius: 6, border: '1px solid var(--border)',
        }}>
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
      {refObj.map((_, i) => (
        <div key={i} style={{ marginBottom: 6 }}>
          <span className="tag" style={{ marginBottom: 4 }}>#{i + 1}</span>
          <CompareView data={Object.fromEntries(langs.map(l => [l, data[l]?.[i]]))} langs={langs} depth={depth + 1} />
        </div>
      ))}
    </div>
  }

  return <div style={{ marginLeft: depth > 0 ? 8 : 0 }}>
    {Object.keys(refObj).filter(k => k !== 'quickJump').map(k => {
      const hasChildren = typeof refObj[k] === 'object' && refObj[k] !== null && !Array.isArray(refObj[k])
      const isArray = Array.isArray(refObj[k])
      if (isArray && typeof refObj[k]?.[0] === 'object') return null

      return (
        <div key={k} style={{ marginBottom: depth < 4 ? 8 : 0 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent)', marginBottom: 3, marginTop: depth < 4 ? 4 : 0 }}>
            {k}
          </div>
          {hasChildren ? (
            <CompareView data={Object.fromEntries(langs.map(l => [l, data[l]?.[k]]))} langs={langs} depth={depth + 1} />
          ) : isArray ? (
            <div style={{ display: 'flex', gap: 8 }}>
              {langs.map(l => {
                const arr = data[l]?.[k]
                if (!Array.isArray(arr)) return <div key={l} style={{ flex: 1, fontSize: 11, color: 'var(--danger)' }}>[empty]</div>
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
