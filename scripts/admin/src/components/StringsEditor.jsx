import { useState, useEffect } from 'react'

const LANGS = ['en', 'hinglish', 'urdu']

export default function StringsEditor({ api, show }) {
  const [lang, setLang] = useState('en')
  const [data, setData] = useState(null)
  const [original, setOriginal] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    api.getStrings(lang).then(d => {
      setData(JSON.parse(JSON.stringify(d)))
      setOriginal(JSON.parse(JSON.stringify(d)))
      setDirty(false)
    })
  }, [lang])

  const save = async () => {
    await api.saveStrings(lang, data)
    setOriginal(JSON.parse(JSON.stringify(data)))
    setDirty(false)
    show('Strings saved!')
  }

  const handleChange = (path, value) => {
    const d = JSON.parse(JSON.stringify(data))
    setPath(d, path, value)
    setData(d)
    setDirty(true)
  }

  if (!data) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Loading...</p>

  return (
    <div style={{ maxWidth: 700 }}>
      <div className="lang-tabs">
        {LANGS.map(l => (
          <button key={l} className={'lang-tab' + (lang === l ? ' active' : '')} onClick={() => setLang(l)}>{l}</button>
        ))}
      </div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        UI labels used in navigation, settings, and other interface text.
      </p>
      <div className="section-card" style={{ padding: 16 }}>
        {renderStrings(data, '', handleChange)}
      </div>
      <button className={'btn ' + (dirty ? 'btn-primary' : '')}
        style={dirty ? { marginTop: 12 } : { marginTop: 12, background: '#e5e7eb', color: '#9ca3af', cursor: 'default' }}
        onClick={save} disabled={!dirty}>
        {dirty ? '💾 Save Strings' : '✓ Saved'}
      </button>
    </div>
  )
}

function renderStrings(obj, prefix, onChange) {
  if (typeof obj === 'string') {
    const key = prefix.split('.').pop()
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
    return (
      <div className="field-group">
        <label className="field-label">{label}</label>
        <input type="text" value={obj} onChange={e => onChange(prefix, e.target.value)} className="field-input" />
      </div>
    )
  }
  if (Array.isArray(obj)) {
    return <div style={{ marginLeft: 8, marginBottom: 8 }}>
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
  for (let i = 0; i < keys.length - 1; i++) v = v[keys[i]]
  v[keys[keys.length - 1]] = val
}
