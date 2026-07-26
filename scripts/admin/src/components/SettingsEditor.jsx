import { useState, useEffect } from 'react'

export default function SettingsEditor({ api, show }) {
  const [view, setView] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { api.getViewConfig().then(setView) }, [])

  const saveView = async () => {
    await api.saveViewConfig(view)
    setDirty(false)
    show('Settings saved!')
  }

  if (!view) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Loading...</p>

  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Default view mode per page. Users can override this in their settings.
      </p>

      <div className="section-card">
        <div className="field-group">
          <label className="field-label">Default View Mode</label>
          <select value={view.defaultMode} onChange={e => { setView({ ...view, defaultMode: e.target.value }); setDirty(true) }}
            className="field-select" style={{ width: 200 }}>
            <option value="list">List</option>
            <option value="slide">Slide</option>
          </select>
        </div>
      </div>

      {view.pages && Object.keys(view.pages).length > 0 && (
        <div className="section-card" style={{ marginTop: 16 }}>
          <div className="section-title" style={{ marginBottom: 12 }}>Per-Page Overrides</div>
          <div className="table-wrap">
            <div className="table-header">
              <div className="table-col-page">Page</div>
              <div className="table-col-lang" style={{ width: 100 }}>Mode</div>
              <div style={{ width: 30 }}></div>
            </div>
            {Object.entries(view.pages).map(([pageKey, mode]) => (
              <div key={pageKey} className="table-row" style={{ cursor: 'default' }}>
                <div className="table-col-page">{pageKey}</div>
                <div style={{ width: 100 }}>
                  <select value={mode} onChange={e => {
                    const pages = { ...view.pages, [pageKey]: e.target.value }
                    setView({ ...view, pages }); setDirty(true)
                  }} className="field-select" style={{ fontSize: 11, padding: '4px 8px' }}>
                    <option value="list">List</option>
                    <option value="slide">Slide</option>
                  </select>
                </div>
                <div style={{ width: 30 }}>
                  <button onClick={() => {
                    const { [pageKey]: _, ...pages } = view.pages
                    setView({ ...view, pages }); setDirty(true)
                  }} className="btn-icon danger" style={{ fontSize: 13 }}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button className={'btn ' + (dirty ? 'btn-primary' : '')}
        style={dirty ? { marginTop: 16 } : { marginTop: 16, background: '#e5e7eb', color: '#9ca3af', cursor: 'default' }}
        onClick={saveView} disabled={!dirty}>
        {dirty ? '💾 Save Settings' : '✓ Saved'}
      </button>
    </div>
  )
}
