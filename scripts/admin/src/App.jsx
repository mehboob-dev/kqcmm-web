import { useState, useEffect, useCallback } from 'react'
import { useApi } from './hooks/useApi.js'
import ContentEditor from './components/ContentEditor.jsx'
import NavEditor from './components/NavEditor.jsx'
import StringsEditor from './components/StringsEditor.jsx'
import SettingsEditor from './components/SettingsEditor.jsx'
import LanguageEditor from './components/LanguageEditor.jsx'

const TABS = [
  { key: 'pages',    label: '📄 Pages',    desc: 'Edit page content' },
  { key: 'nav',      label: '🧭 Nav',      desc: 'Bottom nav & drawer' },
  { key: 'strings',  label: '🏷️ Strings',  desc: 'UI labels' },
  { key: 'lang',     label: '🌍 Translate',desc: 'Translation status' },
  { key: 'settings', label: '⚙️ Settings', desc: 'View config' },
]

export default function App() {
  const api = useApi()
  const [tab, setTab] = useState('pages')
  const [pages, setPages] = useState([])
  const [activePage, setActivePage] = useState(null)
  const [pageData, setPageData] = useState(null)
  const [searchQ, setSearchQ] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [toast, setToast] = useState('')
  const [toastType, setToastType] = useState('success')
  const [dirty, setDirty] = useState(false)

  const show = useCallback((m, type = 'success') => {
    setToast(m)
    setToastType(type)
    setTimeout(() => setToast(''), 2500)
  }, [])

  useEffect(() => {
    api.listPages().then(p => setPages(p)).catch(e => show('Error loading pages: ' + e.message, 'error'))
  }, [])

  const openPage = async (name) => {
    setActivePage(name)
    setSearchResults(null)
    try {
      const d = await api.getPage(name)
      setPageData(d)
      setDirty(false)
    } catch (e) { show('Error: ' + e.message, 'error') }
  }

  const savePage = async () => {
    if (!activePage || !pageData) return
    try {
      await api.savePage(activePage, pageData)
      setDirty(false)
      show('Saved!')
    } catch (e) { show('Error: ' + e.message, 'error') }
  }

  const handleSearch = async (q) => {
    setSearchQ(q)
    if (!q.trim()) { setSearchResults(null); return }
    try { setSearchResults(await api.search(q)) }
    catch { setSearchResults([]) }
  }

  const handleCreatePage = async () => {
    const name = prompt('Page name (filename, no spaces, lowercase):')
    if (!name) return
    const template = prompt('Template:\n(blank) = sections\n"dua" = duas\n"fateha" = master-child') || ''
    try {
      await api.createPage(name, template)
      setPages(await api.listPages())
      openPage(name)
      show('Page created!')
    } catch (e) { show('Error: ' + e.message, 'error') }
  }

  const handleDeletePage = async (name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await api.deletePage(name)
      setPages(await api.listPages())
      if (activePage === name) { setActivePage(null); setPageData(null) }
      show('Deleted!')
    } catch (e) { show('Error: ' + e.message, 'error') }
  }

  const handleDuplicatePage = async () => {
    if (!activePage) return
    const to = prompt(`Copy "${activePage}" to new page name:`, activePage + '-copy')
    if (!to || to === activePage) return
    try {
      await api.duplicatePage(activePage, to)
      setPages(await api.listPages())
      openPage(to)
      show('Duplicated!')
    } catch (e) { show('Error: ' + e.message, 'error') }
  }

  const filteredPages = searchResults
    ? pages.filter(p => searchResults.some(r => r.name === p.name))
    : pages.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()))

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">K</div>
          <div>
            <div className="sidebar-title">KQCMM</div>
            <div className="sidebar-subtitle">Admin Panel</div>
          </div>
        </div>

        <nav className="sidebar-tabs">
          {TABS.map(t => (
            <button key={t.key}
              className={'sidebar-tab' + (tab === t.key ? ' active' : '')}
              onClick={() => setTab(t.key)}
              title={t.desc}>
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'pages' && (
          <div className="sidebar-pages">
            <div className="sidebar-search">
              <span className="search-icon">🔍</span>
              <input
                placeholder="Search pages..."
                value={searchQ}
                onChange={e => handleSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="page-list">
              {filteredPages.map(p => (
                <button key={p.name}
                  className={'page-item' + (activePage === p.name ? ' active' : '')}
                  onClick={() => openPage(p.name)}>
                  <span className="page-icon">📄</span>
                  {p.name}
                </button>
              ))}
              {filteredPages.length === 0 && (
                <div className="page-empty">No pages found</div>
              )}
            </div>
            <button className="btn-create" onClick={handleCreatePage}>
              + New Page
            </button>
          </div>
        )}
      </aside>

      {/* Main */}
      <main className="main-area">
        <header className="toolbar">
          <h1 className="toolbar-title">
            {tab === 'pages' && (activePage || 'Select a page')}
            {tab === 'nav' && 'Navigation Editor'}
            {tab === 'strings' && 'Strings Editor'}
            {tab === 'lang' && 'Translation Manager'}
            {tab === 'settings' && 'Settings'}
          </h1>
          {tab === 'pages' && activePage && (
            <div className="toolbar-actions">
              <span className={'status-badge ' + (dirty ? 'unsaved' : 'saved')}>
                {dirty ? '● Unsaved' : 'Saved'}
              </span>
              <button className="btn btn-ghost" onClick={handleDuplicatePage} title="Duplicate this page">
                📋 Duplicate
              </button>
              <button className="btn btn-danger" onClick={() => handleDeletePage(activePage)}>
                🗑 Delete
              </button>
              <button className="btn btn-primary" onClick={savePage} disabled={!dirty}>
                💾 Save
              </button>
            </div>
          )}
        </header>

        <div className="content-area">
          {tab === 'pages' && activePage && pageData && (
            <ContentEditor data={pageData} onChange={d => { setPageData(d); setDirty(true) }} pageName={activePage} />
          )}
          {tab === 'pages' && !activePage && (
            <div className="empty-state">
              <div className="empty-icon">📄</div>
              <div className="empty-text">Select a page from the sidebar to start editing</div>
              <div className="empty-hint">Choose from the list on the left, or create a new page</div>
            </div>
          )}
          {tab === 'nav' && <NavEditor api={api} show={show} />}
          {tab === 'strings' && <StringsEditor api={api} show={show} />}
          {tab === 'lang' && <LanguageEditor api={api} pages={pages} show={show} />}
          {tab === 'settings' && <SettingsEditor api={api} show={show} />}
        </div>
      </main>

      <div className={'toast ' + (toast ? 'show ' + toastType : '')}>{toast}</div>
    </div>
  )
}
