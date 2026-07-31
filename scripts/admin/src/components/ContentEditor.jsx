import { useState, useMemo, useEffect } from 'react'

function getPath(o, path) { const keys = String(path).split('.'); let v = o; for (const k of keys) { if (v == null) return undefined; v = /^\d+$/.test(k) ? v[+k] : v[k]; } return v }
function setPath(o, path, val) { const keys = String(path).split('.'); let v = o; for (let i = 0; i < keys.length - 1; i++) v = /^\d+$/.test(keys[i]) ? v[+keys[i]] : v[keys[i]]; const last = /^\d+$/.test(keys[keys.length - 1]) ? +keys[keys.length - 1] : keys[keys.length - 1]; v[last] = val }
function clone(o) { return JSON.parse(JSON.stringify(o)) }

function fieldType(key, val, depth) {
  if (key.endsWith('Index') || key.endsWith('Count')) return 'number'
  if (key === 'title' || key === 'heading' || key === 'label') return 'title'
  if ((key === 'text' || key === 'body' || key === 'intro') && depth < 3) return 'richtext'
  if (typeof val === 'string') return val.length > 60 || val.includes('\\n') ? 'richtext' : 'short'
  return 'auto'
}

export default function ContentEditor({ data, onChange, pageName, initialLang }) {
  const langs = useMemo(() => {
    if (!data) return []
    return Object.keys(data).filter(k => k !== 'quickJump' && typeof data[k] === 'object' && data[k] !== null && !Array.isArray(data[k]))
  }, [data])

  const [activeLang, setActiveLang] = useState(() => {
    if (initialLang && langs.includes(initialLang)) return initialLang
    return langs[0] || 'en'
  })
  const [expanded, setExpanded] = useState({})
  const [showPreview, setShowPreview] = useState(true)

  useEffect(() => {
    if (langs.length && !langs.includes(activeLang)) setActiveLang(langs[0])
  }, [langs, activeLang])

  if (!data || !activeLang) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>No content</p>
  const langData = data[activeLang]
  if (!langData) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>No data for {activeLang}</p>
  // The source array the Quick Jump indices point into (sections / duas / items / verses)
  const sourceKey = MAJOR_COLLECTION.find(k => Array.isArray(langData[k]))

  const toggle = (k) => setExpanded(p => ({ ...p, [k]: !p[k] }))
  const isEx = (k) => expanded[k] !== false

  const langPath = (p) => activeLang + '.' + p
  const handleChange = (path, value) => { const d = clone(data); setPath(d, langPath(path), value); onChange(d) }
  const handleDeleteItem = (arrayPath, index) => { const d = clone(data); const arr = getPath(d, langPath(arrayPath)); if (Array.isArray(arr)) { arr.splice(index, 1); onChange(d) } }
  const handleAddItem = (arrayPath) => { const d = clone(data); const arr = getPath(d, langPath(arrayPath)); if (!Array.isArray(arr)) return; if (arr.length > 0 && typeof arr[0] === 'object' && arr[0] !== null) { const t = {}; for (const k of Object.keys(arr[0])) t[k] = ''; arr.push(t) } else { arr.push('') } onChange(d) }
  const handleMoveItem = (arrayPath, from, to) => { const d = clone(data); const arr = getPath(d, langPath(arrayPath)); if (!Array.isArray(arr) || to < 0 || to >= arr.length) return; const [item] = arr.splice(from, 1); arr.splice(to, 0, item); onChange(d) }

  const ctx = { handleChange, handleDeleteItem, handleAddItem, handleMoveItem, expanded, toggle, isEx }

  // Quick Jump lives once at the top level of the page file (shared by all
  // languages). Labels are derived from the source array's title/heading.
  const quickJump = Array.isArray(data.quickJump) ? data.quickJump : []
  const handleQuickJumpChange = (next) => {
    const d = clone(data)
    d.quickJump = next
    onChange(d)
  }

  return (
    <div className="card-grid" style={{ height: '100%' }}>
      <div className="editor-panel">
        <QuickJumpEditor
          indices={quickJump}
          sourceItems={sourceKey ? langData[sourceKey] : null}
          sourceKey={sourceKey}
          onChange={handleQuickJumpChange}
        />
        <div className="lang-tabs">
          {langs.map(l => (
            <button key={l} className={'lang-tab' + (activeLang === l ? ' active' : '')} onClick={() => setActiveLang(l)}>{l}</button>
          ))}
          <div style={{ flex: 1 }} />
          <button className="lang-tab" style={{ fontSize: 11 }} onClick={() => setShowPreview(p => !p)}>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        </div>
        {renderObject(langData, '', 0, ctx)}
      </div>
      {showPreview && (
        <div className="preview-panel">
          <div className="preview-title">Preview — {activeLang}</div>
          <PreviewPanel data={langData} quickJump={quickJump} sourceKey={sourceKey} />
        </div>
      )}
    </div>
  )
}

const MAJOR_COLLECTION = ['sections', 'duas', 'items', 'verses', 'lineage']

function renderObject(obj, prefix, depth, ctx) {
  if (obj === null || obj === undefined) return null
  if (typeof obj === 'string') return <FieldEditor value={obj} path={prefix} depth={depth} ctx={ctx} />
  if (typeof obj === 'number' || typeof obj === 'boolean') return <FieldEditor value={String(obj)} path={prefix} depth={depth} ctx={ctx} numeric={typeof obj === 'number'} />

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
                  <button className="btn-icon" onClick={() => ctx.handleMoveItem(prefix, i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="btn-icon" onClick={() => ctx.handleMoveItem(prefix, i, i + 1)} disabled={i >= obj.length - 1} aria-label="Move down">↓</button>
                  <button className="btn-icon danger" onClick={() => ctx.handleDeleteItem(prefix, i)} aria-label="Delete item">✕</button>
                </div>
              </div>
              {typeof item === 'string'
                ? <FieldEditor value={item} path={path} depth={depth} ctx={ctx} />
                : renderObject(item, path, depth + 1, ctx)
              }
            </div>
          )
        })}
        <button className="btn-add" onClick={() => ctx.handleAddItem(prefix)}>+ Add item</button>
      </div>
    )
  }

  return (
    <div>
      {Object.entries(obj).map(([key, val]) => {
        const path = prefix ? prefix + '.' + key : key
        const hasChildren = typeof val === 'object' && val !== null
        const isMajor = MAJOR_COLLECTION.includes(key) && Array.isArray(val)
        const isCollapsible = (hasChildren && !Array.isArray(val)) || isMajor
        const isOpen = ctx.isEx(path)

        if (isCollapsible) {
          return (
            <div key={path} style={{ marginBottom: 12 }}>
              <div className="section-group" style={{ cursor: 'pointer' }} onClick={() => ctx.toggle(path)} role="button" tabIndex={0} aria-expanded={isOpen}
                onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && ctx.toggle(path)}>
                {isOpen ? '▼' : '▶'} {key}
                {Array.isArray(val) && <span className="tag" style={{ marginLeft: 6 }}>{val.length} items</span>}
              </div>
              {isOpen && renderObject(val, path, depth + 1, ctx)}
            </div>
          )
        }
        if (hasChildren) {
          return (
            <div key={path} style={{ marginBottom: 8 }}>
              <div className="field-label">{key}</div>
              <div style={{ marginLeft: 12 }}>{renderObject(val, path, depth + 1, ctx)}</div>
            </div>
          )
        }
        return <FieldEditor key={path} value={val} path={path} depth={depth} ctx={ctx} />
      })}
    </div>
  )
}

function FieldEditor({ value, path, depth, ctx, numeric }) {
  const key = path.split('.').pop()
  const ft = numeric ? 'number' : fieldType(key, value, depth)
  const isNum = ft === 'number'
  const isRichtext = ft === 'richtext'
  const isTitle = ft === 'title'
  const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())
  const id = 'f-' + path.replace(/\./g, '-')

  return (
    <div className="field-group">
      <label className="field-label" htmlFor={id}>{label}</label>
      {isTitle && <input id={id} type="text" value={value} onChange={e => ctx.handleChange(path, e.target.value)} className="field-input" style={{ fontWeight: 600 }} />}
      {isNum && <input id={id} type="number" value={value === 'true' || value === 'false' ? 0 : Number(value)} onChange={e => ctx.handleChange(path, Number(e.target.value))} className="field-input" style={{ width: 120 }} />}
      {isRichtext && (
        <textarea id={id} value={value} onChange={e => ctx.handleChange(path, e.target.value)}
          className="field-textarea"
          style={{ minHeight: Math.min(Math.max(String(value).split('\n').length * 22, 70), 400) }}
        />
      )}
      {!isTitle && !isNum && !isRichtext && <input id={id} type="text" value={value} onChange={e => ctx.handleChange(path, e.target.value)} className="field-input" />}
    </div>
  )
}

function PreviewPanel({ data, quickJump, sourceKey }) {
  if (!data) return <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>No data</p>
  const { title, sections, duas, items, verses, intro, ...rest } = data
  const qjSource = quickJump && Array.isArray(quickJump) && quickJump.length > 0
    ? (sections || duas || items || verses || [])
    : []
  const labelOf = (q) => qjSource[q]?.title || qjSource[q]?.heading || `#${q + 1}`

  return (
    <div style={{ maxWidth: 420 }}>
      {title && <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>{title}</h3>}
      {intro && (
        <div className="section-card">
          <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{intro}</div>
        </div>
      )}
      {Array.isArray(sections) && sections.slice(0, 10).map((s, i) => {
        const hasSub = s.text && s.text.includes('|||')
        return (
          <div key={i} className="section-card">
            {s.title && <div className="preview-title" style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{s.title}</div>}
            {s.text && hasSub ? (
              s.text.split('|||').slice(0, 3).map((block, bi) => {
                const [subTitle = '', subText = ''] = block.split('::')
                return (
                  <div key={bi} style={{ marginLeft: bi > 0 ? 12 : 0, paddingLeft: bi > 0 ? 10 : 0, borderLeft: bi > 0 ? '2px solid #e5e7eb' : 'none', marginBottom: 4, fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                    {subTitle && <strong>{subTitle}</strong>}{subTitle && subText ? '\n' : ''}{subText.length > 120 ? subText.slice(0, 120) + '…' : subText}
                  </div>
                )
              })
            ) : (
              <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{s.text?.length > 250 ? s.text.slice(0, 250) + '…' : s.text}</div>
            )}
          </div>
        )
      })}
      {Array.isArray(sections) && sections.length > 10 && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>… and {sections.length - 10} more</p>}
      {Array.isArray(duas) && duas.slice(0, 5).map((d, i) => (
        <div key={i} className="section-card">
          {d.heading && <div className="preview-title" style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{d.heading}</div>}
          {d.text && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{d.text.length > 200 ? d.text.slice(0, 200) + '…' : d.text}</div>}
        </div>
      ))}
      {Array.isArray(verses) && verses.slice(0, 2).map((v, i) => (
        <div key={i} className="section-card">
          {v.title && <div className="preview-title" style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{v.title}</div>}
          {v.text && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{v.text.length > 200 ? v.text.slice(0, 200) + '…' : v.text}</div>}
        </div>
      ))}
      {Array.isArray(items) && items.slice(0, 5).map((item, i) => (
        <div key={i} className="section-card">
          {item.title && <div className="preview-title" style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>{item.title}</div>}
          {item.text && <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-line' }}>{item.text.length > 150 ? item.text.slice(0, 150) + '…' : item.text}</div>}
        </div>
      ))}
      {Array.isArray(quickJump) && quickJump.length > 0 && (
        <div style={{ marginTop: 8, padding: '6px 10px', background: '#f5f3ff', borderRadius: 6, fontSize: 11, color: '#6b7280' }}>
          <strong style={{ color: 'var(--accent)' }}>QuickJump:</strong> {quickJump.map(labelOf).join(', ')}
        </div>
      )}
      {!Array.isArray(sections) && !Array.isArray(duas) && !Array.isArray(items) && !Array.isArray(verses) && Object.keys(rest).length > 0 && (
        <div className="section-card"><pre style={{ fontSize: 11 }}>{JSON.stringify(rest, null, 2).slice(0, 300)}</pre></div>
      )}
    </div>
  )
}

// Shared Quick Jump editor — language-independent list of selection indices.
// Labels come from the source items' title/heading, so there's no per-language
// label duplication to maintain.
function QuickJumpEditor({ indices, sourceItems, sourceKey, onChange }) {
  const items = indices || []
  const setItem = (i, v) => {
    const next = [...items]
    next[i] = Math.max(0, Number(v) || 0)
    onChange(next)
  }
  const addItem = () => onChange([...items, items.length ? Math.max(...items) + 1 : 0])
  const deleteItem = (i) => { const next = [...items]; next.splice(i, 1); onChange(next) }
  const moveItem = (from, to) => {
    if (to < 0 || to >= items.length) return
    const next = [...items]; const [it] = next.splice(from, 1); next.splice(to, 0, it); onChange(next)
  }
  const labelOf = (q) => sourceItems?.[q]?.title || sourceItems?.[q]?.heading || `#${q + 1}`

  const usesDropdown = Array.isArray(sourceItems) && sourceItems.length > 0

  return (
    <div className="section-card" style={{ marginBottom: 16 }}>
      <div className="section-header">
        <span className="section-title">Quick Jump</span>
        <span className="tag">{sourceKey ? `points to "${sourceKey}"` : 'no content array found'} · shared across languages</span>
      </div>
      {items.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
          No quick jump entries yet. Add the sections users should jump to.
        </p>
      )}
      {items.map((q, i) => (
        <div key={i} className="array-item">
          <div className="array-header">
            <span className="array-badge">#{i + 1}</span>
            <div className="array-controls">
              <button className="btn-icon" onClick={() => moveItem(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
              <button className="btn-icon" onClick={() => moveItem(i, i + 1)} disabled={i >= items.length - 1} aria-label="Move down">↓</button>
              <button className="btn-icon danger" onClick={() => deleteItem(i)} aria-label="Delete">✕</button>
            </div>
          </div>
          <label className="field-label" htmlFor={`qj-sel-${i}`}>Jump to</label>
          {usesDropdown ? (
            <select
              id={`qj-sel-${i}`}
              className="field-select"
              value={String(q)}
              onChange={e => setItem(i, e.target.value)}
            >
              {sourceItems.map((s, si) => (
                <option key={si} value={si}>
                  {s.title || s.heading || `#${si + 1}`} (item {si + 1})
                </option>
              ))}
            </select>
          ) : (
            <input
              id={`qj-sel-${i}`}
              type="number"
              min={0}
              className="field-input"
              style={{ width: 160 }}
              value={String(q)}
              onChange={e => setItem(i, e.target.value)}
            />
          )}
          <small className="field-help">
            {usesDropdown ? `Selects "${labelOf(q)}"` : 'Selection index into the content array'}
          </small>
        </div>
      ))}
      <button className="btn-add" onClick={addItem}>+ Add quick jump entry</button>
    </div>
  )
}
