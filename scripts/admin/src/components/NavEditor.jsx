import { useState, useEffect, useRef } from 'react'

const ICONS = [
  'faHouse', 'faStar', 'faBook', 'faFire', 'faHandsPraying', 'faScroll', 'faMosque',
  'faUser', 'faCircleInfo', 'faCalendar', 'faPeopleGroup', 'faLightbulb', 'faClockRotateLeft',
  'faGear', 'faBars', 'faXmark', 'faHeart', 'faGlobe', 'faLeaf', 'faMoon', 'faSun',
]

const ICON_EMOJI = {
  faHouse: '🏠', faStar: '✨', faBook: '📖', faFire: '🔥', faHandsPraying: '🤲',
  faScroll: '📜', faMosque: '🕌', faUser: '👤', faCircleInfo: 'ⓘ', faCalendar: '📅',
  faPeopleGroup: '👥', faLightbulb: '💡', faClockRotateLeft: '🔄', faGear: '⚙️',
  faBars: '☰', faXmark: '✕', faHeart: '❤️', faGlobe: '🌐', faLeaf: '🍃', faMoon: '🌙', faSun: '☀️',
}

const GROUP_LABELS = { bottomNav: 'Bottom Navigation', sideDrawer: 'Side Drawer' }

export default function NavEditor({ api, show }) {
  const [nav, setNav] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const loadingRef = useRef(false)

  const load = async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)
    try {
      setNav(await api.getNav())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }

  useEffect(() => { load() }, [])

  const save = async () => {
    setSaving(true)
    try {
      await api.saveNav(nav)
      setDirty(false)
      show('Navigation saved!')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const moveItem = (group, from, to) => {
    if (to < 0 || to >= nav[group].length) return
    const d = { ...nav, [group]: [...nav[group]] }
    const [item] = d[group].splice(from, 1)
    d[group].splice(to, 0, item)
    setNav(d); setDirty(true)
  }

  const removeItem = (group, i) => {
    setNav({ ...nav, [group]: nav[group].filter((_, idx) => idx !== i) })
    setDirty(true)
  }

  const addItem = (group) => {
    setNav({ ...nav, [group]: [...nav[group], { to: '/new-page', icon: 'faStar', key: 'newPage' }] })
    setDirty(true)
  }

  const updateItem = (group, i, field, value) => {
    setNav({ ...nav, [group]: nav[group].map((item, idx) => idx === i ? { ...item, [field]: value } : item) })
    setDirty(true)
  }

  if (loading) return <div className="section-card"><p style={{ color: 'var(--text-muted)' }}>Loading navigation...</p></div>
  if (error) return <div className="section-card"><p style={{ color: 'var(--danger)' }}>Failed: {error}</p><button className="btn btn-ghost" onClick={load} style={{ marginTop: 8 }}>Retry</button></div>
  if (!nav) return null

  return (
    <div style={{ maxWidth: 800 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Rearrange using ↑↓ buttons. All changes save independently from page content.
        {dirty && <span className="status-badge unsaved" style={{ marginLeft: 10 }}>Unsaved</span>}
      </p>

      {['bottomNav', 'sideDrawer'].map(group => (
        <div key={group} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
            {GROUP_LABELS[group] || group}
            <span className="tag" style={{ marginLeft: 8 }}>{nav[group]?.length || 0} items</span>
          </h3>
          {nav[group]?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nav[group].map((item, i) => (
                <div key={item.key + i} className="nav-row">
                  <span className="tag" style={{ minWidth: 30, textAlign: 'center' }}>#{i + 1}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON_EMOJI[item.icon] || '🔄'}</span>
                  <input value={item.to} onChange={e => updateItem(group, i, 'to', e.target.value)}
                    className="field-input" style={{ width: 130 }} placeholder="/path" aria-label="Route path" />
                  <input value={item.key} onChange={e => updateItem(group, i, 'key', e.target.value)}
                    className="field-input" style={{ width: 120 }} placeholder="key" aria-label="Key" />
                  <select value={item.icon} onChange={e => updateItem(group, i, 'icon', e.target.value)}
                    className="field-select" style={{ width: 130, fontSize: 11 }} aria-label="Icon">
                    {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                  </select>
                  <button className="btn-icon" onClick={() => moveItem(group, i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                  <button className="btn-icon" onClick={() => moveItem(group, i, i + 1)} disabled={i >= nav[group].length - 1} aria-label="Move down">↓</button>
                  <button className="btn-icon danger" onClick={() => removeItem(group, i)} aria-label="Remove item">✕</button>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>No items in {GROUP_LABELS[group].toLowerCase()}</p>
          )}
          <button className="btn-add" style={{ marginTop: 6 }} onClick={() => addItem(group)}>
            + Add to {GROUP_LABELS[group].toLowerCase()}
          </button>
        </div>
      ))}

      <button className="btn btn-primary" onClick={save} disabled={!dirty || saving} style={{ marginTop: 8 }}>
        {saving ? 'Saving…' : dirty ? '💾 Save Navigation' : '✓ Saved'}
      </button>
    </div>
  )
}
