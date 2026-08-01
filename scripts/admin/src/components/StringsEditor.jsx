import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react'

const KNOWN_LANGS = ['en', 'hinglish', 'urdu']

const StringsEditor = forwardRef(function StringsEditor({ api, show, onStatusChange }, ref) {
  const [lang, setLang] = useState('en')
  const [data, setData] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [allLangs, setAllLangs] = useState(KNOWN_LANGS)
  const loadingRef = useRef(false)

  const load = useCallback(async (l) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      const [strings, langCodes] = await Promise.all([api.getStrings(l), api.listStringLangs()])
      setData(strings)
      setAllLangs(langCodes)
      setDirty(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [api])

  useEffect(() => { load(lang) }, [lang, load])

  const save = async () => {
    setSaving(true)
    try {
      await api.saveStrings(lang, data)
      setDirty(false)
      show('Strings saved!')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (path, value) => {
    const d = JSON.parse(JSON.stringify(data))
    setPath(d, path, value)
    setData(d)
    setDirty(true)
  }

  // Report dirty/saving to App.jsx so the header badge & Save button update.
  useEffect(() => { onStatusChange?.({ dirty, saving }) }, [dirty, saving, onStatusChange])

  // Expose save + status to the App.jsx toolbar (header badge & Save button).
  // MUST be before the early returns (rules of hooks).
  useImperativeHandle(ref, () => ({ save, dirty, saving }), [dirty, saving, data, lang])

  if (loading) return <div className="section-card"><p style={{ color: 'var(--text-muted)' }}>Loading strings...</p></div>
  if (error) return <div className="section-card"><p style={{ color: 'var(--danger)' }}>Failed: {error}</p><button className="btn btn-ghost" onClick={() => load(lang)} style={{ marginTop: 8 }}>Retry</button></div>
  if (!data) return null

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="lang-tabs">
        {(allLangs.length ? allLangs : KNOWN_LANGS).map(l => (
          <button key={l} className={'lang-tab' + (lang === l ? ' active' : '')} onClick={() => setLang(l)}>{l}</button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        UI labels for navigation, settings, and other interface text.
      </p>
      <div className="section-card" style={{ padding: 16 }}>
        {renderStrings(data, '', handleChange)}
      </div>
    </div>
  )
})

export default StringsEditor

function renderStrings(obj, prefix, onChange) {
  if (typeof obj !== 'object' || obj === null) {
    const key = prefix.split('.').pop()
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
    const isLong = typeof obj === 'string' && (obj.length > 80 || obj.includes('\n'))
    return (
      <div className="field-group">
        <label className="field-label">{label}</label>
        {isLong
          ? <textarea className="field-textarea" value={obj || ''} onChange={e => onChange(prefix, e.target.value)} style={{ minHeight: 60 }} />
          : <input type="text" className="field-input" value={obj === null ? '' : obj} onChange={e => onChange(prefix, e.target.value)} />
        }
      </div>
    )
  }
  if (Array.isArray(obj)) {
    return <div style={{ margin: '0 0 8px 8px' }}>
      <div className="field-label">{prefix} [{obj.length} items]</div>
      {obj.map((item, i) => <div key={i}>{renderStrings(item, prefix + '.' + i, onChange)}</div>)}
    </div>
  }
  return <div style={{ marginLeft: prefix ? 8 : 0 }}>
    {Object.entries(obj).map(([k, v]) => (
      <div key={k}>
        {typeof v === 'object' && v !== null && !Array.isArray(v) && (
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginTop: 12, marginBottom: 6 }}>▸ {k}</div>
        )}
        {renderStrings(v, prefix ? prefix + '.' + k : k, onChange)}
      </div>
    ))}
  </div>
}

function setPath(o, path, val) {
  const keys = path.split('.')
  let v = o
  for (let i = 0; i < keys.length - 1; i++) {
    if (v[keys[i]] === undefined) v[keys[i]] = {}
    v = v[keys[i]]
  }
  v[keys[keys.length - 1]] = val
}
