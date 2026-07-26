import { useState, useMemo } from 'react'

function getPath(o, path) {
  const keys = String(path).split('.')
  let v = o
  for (const k of keys) {
    if (v == null) return undefined
    v = Array.isArray(v) && /^\d+$/.test(k) ? v[+k] : v[k]
  }
  return v
}
function setPath(o, path, val) {
  const keys = String(path).split('.')
  let v = o
  for (let i = 0; i < keys.length - 1; i++) {
    const k = /^\d+$/.test(keys[i]) ? +keys[i] : keys[i]
    v = v[k]
  }
  const last = /^\d+$/.test(keys[keys.length - 1]) ? +keys[keys.length - 1] : keys[keys.length - 1]
  v[last] = val
}

function fieldType(key, val, depth) {
  if (key.endsWith('Index') || key.endsWith('Count')) return 'number'
  if (key === 'title' || key === 'heading' || key === 'label') return 'title'
  if ((key === 'text' || key === 'body' || key === 'intro') && depth < 3) return 'richtext'
  if (typeof val === 'string') return val.length > 60 || val.includes('\\n') ? 'richtext' : 'short'
  return 'auto'
}

export default function ContentEditor({ data, onChange, pageName }) {
  const langs = useMemo(() => {
    if (!data) return []
    return Object.keys(data).filter(k => k !== 'quickJump' && typeof data[k] === 'object' && data[k] !== null && !Array.isArray(data[k]))
  }, [data])

  const [activeLang, setActiveLang] = useState(langs[0] || 'en')
  const [expandedKeys, setExpandedKeys] = useState({})
  const [showPreview, setShowPreview] = useState(true)

  if (!langs.includes(activeLang) && langs.length) {
    if (activeLang !== langs[0]) setActiveLang(langs[0])
  }
  if (!data || !activeLang) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>No content</p>

  const langData = data[activeLang]
  if (!langData) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>No data for {activeLang}</p>

  const toggleKey = (k) => setExpandedKeys(p => ({ ...p, [k]: !p[k] }))

  const handleChange = (path, value) => {
    const d = JSON.parse(JSON.stringify(data))
    setPath(d, path, value)
    onChange(d)
  }
  const handleDeleteItem = (arrayPath, index) => {
    const d = JSON.parse(JSON.stringify(data))
    const arr = getPath(d, arrayPath)
    if (!Array.isArray(arr)) return
    arr.splice(index, 1)
    onChange(d)
  }
  const handleAddItem = (arrayPath) => {
    const d = JSON.parse(JSON.stringify(data))
    const arr = getPath(d, arrayPath)
    if (!Array.isArray(arr)) return
    if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) {
      const t = {}
      for (const k of Object.keys(arr[0])) t[k] = ''
      arr.push(t)
    } else { arr.push('') }
    onChange(d)
  }
  const handleMoveItem = (arrayPath, from, to) => {
    const d = JSON.parse(JSON.stringify(data))
    const arr = getPath(d, arrayPath)
    if (!Array.isArray(arr)) return
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    onChange(d)
  }

  return (
    <div className="card-grid" style={{ height: '100%' }}>
      <div className="editor-panel">
        <div className="lang-tabs">
          {langs.map(l => (
            <button key={l} className={'lang-tab' + (activeLang === l ? ' active' : '')}
              onClick={() => setActiveLang(l)}>{l}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="lang-tab" onClick={() => setShowPreview(p => !p)}
            style={{ fontSize: 11 }}>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        {renderObject(langData, activeLang, '', 0, handleChange, handleDeleteItem, handleAddItem, handleMoveItem, expandedKeys, toggleKey)}
      </div>
      {showPreview && (
        <div className="preview-panel">
          <div className="preview-title">Preview — {activeLang}</div>
          <PreviewPanel data={langData} />
        </div>
      )}
    </div>
  )
}

function renderObject(obj, prefix, depth, onChange, onDelete, onAdd, onMove, expanded, toggle) {
  if (obj === null || obj === undefined) return null

  if (typeof obj === 'string') {
    return <FieldEditor value={obj} path={prefix} onChange={onChange} depth={depth} />
  }
  if (Array.isArray(obj)) {
    return (
      <div style={{ marginBottom: 8 }}>
        {obj.map((item, i) => {
          const path = prefix ? prefix + '.' + i : '' + i
          return (
            <div key={path} className="array-item">
              <div className="array-header">
                <span className="array-badge">#{i + 1}</span>
                <div className="array-controls">
                  <button className="btn-icon" onClick={() => onMove(prefix, i, i - 1)} disabled={i === 0}>↑</button>
                  <button className="btn-icon" onClick={() => onMove(prefix, i, i + 1)} disabled={i >= obj.length - 1}>↓</button>
                  <button className="btn-icon danger" onClick={() => onDelete(prefix, i)}>✕</button>
                </div>
              </div>
              {typeof item === 'string'
                ? <FieldEditor value={item} path={path} onChange={onChange} depth={depth} />
                : renderObject(item, path, depth + 1, onChange, onDelete, onAdd, onMove, expanded, toggle)
              }
            </div>
          )
        })}
        <button className="btn-add" onClick={() => onAdd(prefix)}>+ Add item</button>
      </div>
    )
  }
  if (typeof obj === 'object') {
    return (
      <div>
        {Object.entries(obj).map(([key, val]) => {
          const path = prefix ? prefix + '.' + key : key
          const hasChildren = typeof val === 'object' && val !== null

          if (key === 'quickJump' && Array.isArray(val)) {
            return (
              <div key={path} style={{ marginBottom: 10 }}>
                <div className="field-label">{key} ({val.length} items)</div>
                {renderObject(val, path, depth + 1, onChange, onDelete, onAdd, onMove, expanded, toggle)}
              </div>
            )
          }
          if (hasChildren && (key === 'sections' || key === 'duas' || key === 'items')) {
            return (
              <div key={path} style={{ marginBottom: 16 }}>
                <div className="section-group">📋 {key} ({Array.isArray(val) ? val.length : '•'})</div>
                {renderObject(val, path, depth + 1, onChange, onDelete, onAdd, onMove, expanded, toggle)}
              </div>
            )
          }
          if (hasChildren) {
            return (
              <div key={path} style={{ marginBottom: 8 }}>
                <div className="field-label">{key}</div>
                <div style={{ marginLeft: 12 }}>
                  {renderObject(val, path, depth + 1, onChange, onDelete, onAdd, onMove, expanded, toggle)}
                </div>
              </div>
            )
          }
          return <FieldEditor key={path} value={val} path={path} onChange={onChange} depth={depth} />
        })}
      </div>
    )
  }
  return <FieldEditor value={String(obj)} path={prefix} onChange={onChange} depth={depth} />
}

function FieldEditor({ value, path, onChange, depth }) {
  const key = path.split('.').pop()
  const ft = fieldType(key, value, depth)
  const isNum = ft === 'number'
  const isRichtext = ft === 'richtext'
  const isTitle = ft === 'title'
  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())

  const handleChange = (e) => onChange(path, isNum ? Number(e.target.value) : e.target.value)

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      {isTitle && <input type="text" value={value} onChange={handleChange} className="field-input" style={{ fontWeight: 600 }} />}
      {isNum && <input type="number" value={value} onChange={handleChange} className="field-input" style={{ width: 120 }} />}
      {isRichtext && (
        <textarea value={value} onChange={handleChange}
          className={'field-textarea' + (value.length > 200 ? ' code' : '')}
          style={{ minHeight: Math.min(Math.max(value.split('\n').length * 20, 70), 400) }}
        />
      )}
      {!isTitle && !isNum && !isRichtext && <input type="text" value={value} onChange={handleChange} className="field-input" />}
    </div>
  )
}

/* Preview */
function PreviewPanel({ data }) {
  if (!data) return <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No data</p>
  const { title, sections, duas, items, intro, heading, text, quickJump, ...rest } = data

  return (
    <div style={{ maxWidth: 420 }}>
      {title && <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#111' }}>{title}</h3>}
      {intro && (
        <div className="section-card">
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line', color: '#374151' }}>{intro}</div>
        </div>
      )}
      {Array.isArray(sections) && sections.slice(0, 8).map((s, i) => (
        <div key={i} className="section-card">
          {s.title && <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>{s.title}</div>}
          {s.text && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line', color: '#374151' }}>{s.text.length > 200 ? s.text.slice(0, 200) + '…' : s.text}</div>}
        </div>
      ))}
      {Array.isArray(sections) && sections.length > 8 && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>… and {sections.length - 8} more sections</p>}

      {Array.isArray(duas) && duas.slice(0, 5).map((d, i) => (
        <div key={i} className="section-card">
          {d.heading && <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, paddingBottom: 4, borderBottom: '1px solid #f3f4f6' }}>{d.heading}</div>}
          {d.text && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line', color: '#374151' }}>{d.text.length > 150 ? d.text.slice(0, 150) + '…' : d.text}</div>}
        </div>
      ))}

      {Array.isArray(items) && items.slice(0, 5).map((item, i) => (
        <div key={i} className="section-card">
          {item.title && <div style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', marginBottom: 4, borderBottom: '1px solid #f3f4f6', paddingBottom: 4 }}>{item.title}</div>}
          {item.text && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.text.length > 150 ? item.text.slice(0, 150) + '…' : item.text}</div>}
        </div>
      ))}

      {!Array.isArray(sections) && !Array.isArray(duas) && !Array.isArray(items) && Object.keys(rest).length > 0 && (
        <div className="section-card"><pre style={{ fontSize: 11 }}>{JSON.stringify(rest, null, 2).slice(0, 300)}</pre></div>
      )}

      {Array.isArray(quickJump) && quickJump.length > 0 && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#f5f3ff', borderRadius: 6, fontSize: 11, color: '#6b7280' }}>
          <strong style={{ color: 'var(--accent)' }}>QuickJump:</strong> {quickJump.map(q => q.label).join(', ')}
        </div>
      )}
    </div>
  )
}
