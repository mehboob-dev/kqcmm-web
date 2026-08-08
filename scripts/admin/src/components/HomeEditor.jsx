import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

// Icon picker restricted to icons that actually exist in the app's iconMap
// (src/components/FontAwesome.jsx) — choosing any of these guarantees the tile
// renders an FA icon, never a "?" fallback.
const HOME_ICONS = [
  'faHouse', 'faStar', 'faBook', 'faFire', 'faHandsPraying', 'faScroll', 'faMosque',
  'faUser', 'faCircleInfo', 'faCalendar', 'faPeopleGroup', 'faLightbulb', 'faClockRotateLeft',
  'faGear', 'faBars', 'faXmark', 'faShareNodes', 'faCheck',
  'faBookOpen', 'faStarAndCrescent', 'faUserTie', 'faHandHoldingHeart',
]

const ICON_EMOJI = {
  faHouse: '🏠', faStar: '✨', faBook: '📖', faFire: '🔥', faHandsPraying: '🤲',
  faScroll: '📜', faMosque: '🕌', faUser: '👤', faCircleInfo: 'ⓘ', faCalendar: '📅',
  faPeopleGroup: '👥', faLightbulb: '💡', faClockRotateLeft: '🔄', faGear: '⚙️',
  faBars: '☰', faXmark: '✕', faShareNodes: '🔗', faCheck: '✓',
  faBookOpen: '📖', faStarAndCrescent: '☪️', faUserTie: '🧑‍💼', faHandHoldingHeart: '💝',
}

const HomeEditor = forwardRef(function HomeEditor({ api, show, onStatusChange }, ref) {
  const [home, setHome] = useState(null)
  const [routes, setRoutes] = useState([])
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
      setHome(await api.getHome())
      try { setRoutes(await api.getRoutes()) } catch { /* routes optional */ }
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
      await api.saveHome(home)
      setDirty(false)
      show('Home tiles saved!')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const moveItem = (from, to) => {
    const tiles = home.tiles || []
    if (to < 0 || to >= tiles.length) return
    const next = [...tiles]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setHome({ ...home, tiles: next }); setDirty(true)
  }

  const removeItem = (i) => {
    setHome({ ...home, tiles: (home.tiles || []).filter((_, idx) => idx !== i) })
    setDirty(true)
  }

  const addItem = () => {
    setHome({ ...home, tiles: [...(home.tiles || []), { pageId: '', icon: 'faBookOpen' }] })
    setDirty(true)
    show('Pick a page for the new tile below')
  }

  const addPageItem = (page) => {
    setHome({ ...home, tiles: [...(home.tiles || []), { pageId: page.id, icon: 'faBookOpen' }] })
    setDirty(true)
    show(`Added "${page.route}"`)
  }

  const updateItem = (i, field, value) => {
    setHome({ ...home, tiles: (home.tiles || []).map((tile, idx) => idx === i ? { ...tile, [field]: value } : tile) })
    setDirty(true)
  }

  // Tile targets are the registry pages. Exclude home (self-loop) and the
  // bookReader param route, which can't be a tile destination.
  const tileable = routes.filter(r => r.id !== 'home' && !String(r.route).includes(':'))
  const routeById = (id) => routes.find(r => r.id === id)?.route || null

  // Report dirty/saving to App.jsx so the header badge & Save button update.
  useEffect(() => { onStatusChange?.({ dirty, saving }) }, [dirty, saving, onStatusChange])

  // Expose save + status to the App.jsx toolbar (header badge & Save button)
  useImperativeHandle(ref, () => ({ save, dirty, saving }), [dirty, saving, home])

  if (loading) return <div className="section-card"><p style={{ color: 'var(--text-muted)' }}>Loading home tiles...</p></div>
  if (error) return <div className="section-card"><p style={{ color: 'var(--danger)' }}>Failed: {error}</p><button className="btn btn-ghost" onClick={load} style={{ marginTop: 8 }}>Retry</button></div>
  if (!home) return null

  const tiles = home.tiles || []

  return (
    <div style={{ maxWidth: 800 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        The home page shows a grid of quick-link tiles. Rearrange with ↑↓ buttons. Each tile links to a
        registered page and carries a FontAwesome icon. <strong>Labels are automatic</strong> — each tile
        takes its label from the page's localized name, so switching languages re-labels the tiles for free.
      </p>

      {/* Page picker: quickly add a registry page as a tile */}
      <div className="section-card" style={{ marginBottom: 20 }}>
        <div className="section-header">
          <span className="section-title">Add a page to the home grid</span>
          <span className="tag">{tileable.length} tile-able pages</span>
        </div>
        {tileable.length > 0 ? (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 8 }}>
            <select
              className="field-select"
              value=""
              onChange={e => { const p = tileable.find(x => x.id === e.target.value); if (p) addPageItem(p) }}
              style={{ flex: 1 }}
              aria-label="Add a page as a home tile"
            >
              <option value="">Add a page…</option>
              {tileable.map(p => <option key={p.id} value={p.id}>{p.route}{p.custom ? ' (custom)' : ''}</option>)}
            </select>
          </div>
        ) : (
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No registry pages available.</p>
        )}
      </div>

      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
        Home tiles
        <span className="tag" style={{ marginLeft: 8 }}>{tiles.length} tiles</span>
      </h3>
      {tiles.length ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {tiles.map((tile, i) => {
            const known = !!routeById(tile.pageId)
            return (
              <div key={'home-' + i} className="nav-row">
                <span className="tag" style={{ minWidth: 30, textAlign: 'center' }}>#{i + 1}</span>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON_EMOJI[tile.icon] || '🔘'}</span>
                <select
                  value={tile.pageId}
                  onChange={e => updateItem(i, 'pageId', e.target.value)}
                  className="field-select"
                  style={{ flex: 1 }}
                  aria-label="Target page"
                >
                  <option value="">— pick a page —</option>
                  {tileable.map(p => <option key={p.id} value={p.id}>{p.route}</option>)}
                </select>
                {!known && tile.pageId && <span className="tag warning" title="Unknown page id">unknown</span>}
                <select value={tile.icon} onChange={e => updateItem(i, 'icon', e.target.value)}
                  className="field-select" style={{ width: 150, fontSize: 11 }} aria-label="Icon">
                  {HOME_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <button className="btn-icon" onClick={() => moveItem(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="btn-icon" onClick={() => moveItem(i, i + 1)} disabled={i >= tiles.length - 1} aria-label="Move down">↓</button>
                <button className="btn-icon danger" onClick={() => removeItem(i)} aria-label="Remove tile">✕</button>
              </div>
            )
          })}
        </div>
      ) : (
        <p style={{ color: 'var(--text-muted)', fontSize: 12, padding: 8 }}>No tiles yet — add a page above.</p>
      )}
      <button className="btn-add" style={{ marginTop: 6 }} onClick={addItem}>
        + Add blank tile
      </button>

      {/* Live preview — mirrors the home quick-link strip */}
      {tiles.length > 0 && (
        <div className="section-card" style={{ marginTop: 24 }}>
          <div className="section-header">
            <span className="section-title">Preview</span>
            <span className="tag">label comes from the page's localized name</span>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {tiles.map((tile, i) => (
              <div key={'pv-' + i} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8,
                fontSize: 12,
              }}>
                <span style={{ fontSize: 15 }}>{ICON_EMOJI[tile.icon] || '🔘'}</span>
                <span style={{ color: routeById(tile.pageId) ? 'var(--text)' : 'var(--danger)' }}>
                  {routeById(tile.pageId) || tile.pageId || '?'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

export default HomeEditor
