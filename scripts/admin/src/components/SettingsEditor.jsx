import { useState, useEffect } from 'react'

export default function SettingsEditor({ api, show }) {
  const [view, setView] = useState(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [newOverride, setNewOverride] = useState('')

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setView(await api.getViewConfig())
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const saveView = async () => {
    setSaving(true)
    try {
      await api.saveViewConfig(view)
      setDirty(false)
      show('Settings saved!')
    } catch (e) {
      show(e.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const addOverride = () => {
    const pageKey = newOverride.trim().toLowerCase().replace(/\s+/g, '-')
    if (!pageKey) return
    setView({ ...view, pages: { ...(view.pages || {}), [pageKey]: 'list' } })
    setNewOverride('')
    setDirty(true)
  }

  const removeOverride = (pageKey) => {
    const { [pageKey]: _, ...pages } = view.pages || {}
    setView({ ...view, pages })
    setDirty(true)
  }

  if (loading) return <div className="section-card"><p style={{ color: 'var(--text-muted)' }}>Loading settings…</p></div>
  if (error) return <div className="section-card"><p style={{ color: 'var(--danger)' }}>Failed: {error}</p><button className="btn btn-ghost" onClick={load} style={{ marginTop: 8 }}>Retry</button></div>
  if (!view) return null

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Default view mode per page. Users can override this in their app settings.
        {dirty && <span className="status-badge unsaved" style={{ marginLeft: 10 }}>Unsaved</span>}
      </p>

      <div className="section-card">
        <div className="field-group">
          <label className="field-label">Global Default Mode</label>
          <select value={view.defaultMode} onChange={e => { setView({ ...view, defaultMode: e.target.value }); setDirty(true) }} className="field-select" style={{ width: 200 }}>
            <option value="list">List</option>
            <option value="slide">Slide</option>
          </select>
        </div>
      </div>

      <div className="section-card" style={{ marginTop: 16 }}>
        <div className="section-title" style={{ marginBottom: 12 }}>Per-Page Overrides</div>
        {view.pages && Object.keys(view.pages).length > 0 ? (
          <div className="table-wrap" style={{ marginBottom: 12 }}>
            <div className="table-header">
              <div className="table-col-page">Page</div>
              <div style={{ width: 100 }}>Mode</div>
              <div style={{ width: 30 }}></div>
            </div>
            {Object.entries(view.pages).map(([pageKey, mode]) => (
              <div key={pageKey} className="table-row" style={{ cursor: 'default' }}>
                <div className="table-col-page">{pageKey}</div>
                <div style={{ width: 100 }}>
                  <select value={mode} onChange={e => {
                    setView({ ...view, pages: { ...view.pages, [pageKey]: e.target.value } }); setDirty(true)
                  }} className="field-select" style={{ fontSize: 11, padding: '4px 8px' }}>
                    <option value="list">List</option>
                    <option value="slide">Slide</option>
                  </select>
                </div>
                <div style={{ width: 30 }}>
                  <button className="btn-icon danger" onClick={() => removeOverride(pageKey)} aria-label={`Remove override for ${pageKey}`} style={{ fontSize: 13 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 12 }}>No page overrides configured.</p>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={newOverride} onChange={e => setNewOverride(e.target.value)} placeholder="page-key" className="field-input" style={{ width: 160 }} />
          <button className="btn btn-ghost" onClick={addOverride} disabled={!newOverride.trim()}>Add</button>
        </div>
      </div>

      <button className="btn btn-primary" onClick={saveView} disabled={!dirty || saving} style={{ marginTop: 16 }}>
        {saving ? 'Saving…' : dirty ? '💾 Save Settings' : '✓ Saved'}
      </button>
    </div>
  )
}
