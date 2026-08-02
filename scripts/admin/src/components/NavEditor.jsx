import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

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

const NavEditor = forwardRef(function NavEditor({ api, show, onStatusChange }, ref) {
  const [nav, setNav] = useState(null)
  const [pages, setPages] = useState([])
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
      try { setPages(await api.listPages()) } catch { /* pages optional */ }
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
    // Blank manual entry — use the registry's "add page" picker (above) for a
    // real page. Keep this row editable but avoid a dead /new-page route.
    setNav({ ...nav, [group]: [...nav[group], { pageId: '', to: '', icon: 'faStar', key: '' }] })
    setDirty(true)
    show('Fill in the route/path and page id, or use "Add a page" above')
  }

  const addPageItem = (group, page) => {
    const key = page.route.replace(/^\//, '').replace(/-/g, '')
    setNav({ ...nav, [group]: [...nav[group], { pageId: page.pageId || '', to: page.route, icon: 'faBook', key }] })
    setDirty(true)
    show(`Added "${page.route}"`)
  }

  const updateItem = (group, i, field, value) => {
    setNav({ ...nav, [group]: nav[group].map((item, idx) => idx === i ? { ...item, [field]: value } : item) })
    setDirty(true)
  }

  // Report dirty/saving to App.jsx so the header badge & Save button update.
  useEffect(() => { onStatusChange?.({ dirty, saving }) }, [dirty, saving, onStatusChange])

  // Expose save + status to the App.jsx toolbar (header badge & Save button)
  useImperativeHandle(ref, () => ({ save, dirty, saving }), [dirty, saving, nav])

  if (loading) return <div className="section-card"><p style={{ color: 'var(--text-muted)' }}>Loading navigation...</p></div>
  if (error) return <div className="section-card"><p style={{ color: 'var(--danger)' }}>Failed: {error}</p><button className="btn btn-ghost" onClick={load} style={{ marginTop: 8 }}>Retry</button></div>
  if (!nav) return null

  return (
    <div style={{ maxWidth: 800 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Rearrange using ↑↓ buttons. All changes save independently from page content.
        <strong> pageId</strong> = the page's stable id (e.g. <code>custom-x4l</code>) — but you can also type
        the page slug (e.g. <code>my-new-page</code>); the app resolves both to the live route.
      </p>

      {/* Page picker: quickly add a registry page (fixed or custom) to a nav group */}
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Add a page to navigation</span>
          <span className="tag">{pages.length} registry pages</span>
        </div>
        {pages.length > 0 ? (
          ['bottomNav', 'sideDrawer'].map(group => (
            <div key={group} style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 110 }}>{GROUP_LABELS[group]}</span>
              <select
                className="field-select"
                value=""
                onChange={e => { const p = pages.find(x => x.name === e.target.value); if (p) addPageItem(group, p) }}
                style={{ flex: 1 }}
                aria-label={`Add page to ${group}`}
              >
                <option value="">Add a page…</option>
                {pages.map(p => <option key={p.name} value={p.name}>{p.route || '/' + p.name}{p.custom ? ' (custom)' : ''}</option>)}
              </select>
            </div>
          ))
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No registry pages available.</p>
        )}
      </div>

      {['bottomNav', 'sideDrawer'].map(group => (
        <div key={group} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
            {GROUP_LABELS[group] || group}
            <span className="tag" style={{ marginLeft: 8 }}>{nav[group]?.length || 0} items</span>
          </h3>
          {nav[group]?.length ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nav[group].map((item, i) => (
                // Stable key (index only) so editing the `key` field does not
                // remount the row and steal focus on every keystroke.
                <div key={'nav-' + group + '-' + i} className="nav-row">
                  <span className="tag" style={{ minWidth: 30, textAlign: 'center' }}>#{i + 1}</span>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON_EMOJI[item.icon] || '🔄'}</span>
                  <input value={item.pageId || ''} onChange={e => updateItem(group, i, 'pageId', e.target.value)}
                    className="field-input" style={{ width: 130 }} placeholder="pageId" aria-label="Page id" />
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
    </div>
  )
})

export default NavEditor
