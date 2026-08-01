import { useState, useEffect, useCallback, useRef } from 'react'
import { useApi } from './hooks/useApi.js'
import ContentEditor from './components/ContentEditor.jsx'
import NavEditor from './components/NavEditor.jsx'
import StringsEditor from './components/StringsEditor.jsx'
import SettingsEditor from './components/SettingsEditor.jsx'
import LanguageEditor from './components/LanguageEditor.jsx'
import CalendarEditor from './components/CalendarEditor.jsx'
import Modal from './components/ui/Modal.jsx'

const TABS = [
  { key: 'pages',    label: '📄 Pages',    desc: 'Edit page content' },
  { key: 'nav',      label: '🧭 Nav',      desc: 'Bottom nav & drawer' },
  { key: 'strings',  label: '🏷️ Strings',  desc: 'UI labels' },
  { key: 'lang',     label: '🌍 Translate',desc: 'Translation status' },
  { key: 'calendar', label: '📅 Calendar', desc: 'Hijri calendar & events' },
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [dialogValue, setDialogValue] = useState('')
  const [dialogTemplate, setDialogTemplate] = useState('')
  const [dialogError, setDialogError] = useState('')
  const [dialogBusy, setDialogBusy] = useState(false)
  const [pendingLang, setPendingLang] = useState(null)
  const dialogTrigger = useRef(null)
  const searchTimer = useRef(null)
  const pageRequest = useRef(0)
  const toastTimer = useRef(null)

  const show = useCallback((m, type = 'success') => {
    setToast(m)
    setToastType(type)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(''), 2500)
  }, [])

  useEffect(() => () => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  useEffect(() => {
    const closeMobile = event => { if (event.key === 'Escape') setMobileOpen(false) }
    document.addEventListener('keydown', closeMobile)
    return () => document.removeEventListener('keydown', closeMobile)
  }, [])

  const confirmNavigation = (action) => {
    if (!dirty) { action(); return true }
    if (window.confirm('You have unsaved changes. Leave without saving?')) {
      setDirty(false); action(); return true
    }
    return false
  }

  const openDialog = (type, trigger) => {
    dialogTrigger.current = trigger || document.activeElement
    setDialog(type)
    setDialogValue(type === 'duplicate' ? `${activePage}-copy` : '')
    setDialogTemplate('')
    setDialogError('')
  }

  const closeDialog = () => {
    setDialog(null)
    setDialogError('')
    setTimeout(() => dialogTrigger.current?.focus?.(), 0)
  }

  const submitDialog = async () => {
    const value = dialogValue.trim().toLowerCase()
    if (dialog === 'delete') return executeDelete()
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
      setDialogError('Use lowercase letters, numbers, and hyphens only.')
      return
    }
    setDialogBusy(true)
    try {
      if (dialog === 'create') await api.createPage(value, dialogTemplate)
      if (dialog === 'duplicate') await api.duplicatePage(activePage, value)
      setPages(await api.listPages())
      closeDialog()
      if (dialog === 'create' || dialog === 'duplicate') await openPage(value)
      show(dialog === 'create' ? 'Page created!' : 'Page duplicated!')
    } catch (e) { setDialogError(e.message) }
    finally { setDialogBusy(false) }
  }

  const executeDelete = async () => {
    setDialogBusy(true)
    try {
      await api.deletePage(activePage)
      setPages(await api.listPages())
      setActivePage(null); setPageData(null); setDirty(false)
      closeDialog(); show('Page deleted!')
    } catch (e) { setDialogError(e.message) }
    finally { setDialogBusy(false) }
  }

  useEffect(() => {
    api.listPages().then(p => setPages(p)).catch(e => show('Error loading pages: ' + e.message, 'error'))
  }, [])

  const openPage = async (name) => {
    if (!confirmNavigation(() => {})) return
    const requestId = ++pageRequest.current
    setActivePage(name)
    setPageData(null)
    setSearchResults(null)
    setMobileOpen(false)
    try {
      const d = await api.getPage(name)
      if (requestId !== pageRequest.current) return
      setPageData(d)
      setDirty(false)
    } catch (e) { if (requestId === pageRequest.current) show('Error: ' + e.message, 'error') }
  }

  const savePage = async () => {
    if (!activePage || !pageData) return
    try {
      await api.savePage(activePage, pageData)
      setDirty(false)
      show('Saved!')
    } catch (e) { show('Error: ' + e.message, 'error') }
  }

  const handleSearch = (q) => {
    setSearchQ(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setSearchResults(null); return }
    searchTimer.current = setTimeout(async () => {
      try { setSearchResults(await api.search(q)) }
      catch { setSearchResults([]) }
    }, 250)
  }

  const handleCreatePage = (event) => {
    confirmNavigation(() => openDialog('create', event.currentTarget))
  }

  const handleDeletePage = (name, event) => {
    confirmNavigation(() => openDialog('delete', event.currentTarget))
  }

  const handleDuplicatePage = (event) => {
    if (!activePage) return
    confirmNavigation(() => openDialog('duplicate', event.currentTarget))
  }

  const jumpToPage = useCallback((name, lang) => {
    confirmNavigation(() => {
      setPendingLang(lang || null)
      setTab('pages')
      openPage(name)
    })
  }, [])

  const filteredPages = searchResults
    ? pages.filter(p => searchResults.some(r => r.name === p.name))
    : pages.filter(p => p.name.toLowerCase().includes(searchQ.toLowerCase()))

  return (
    <div className="app-layout">
      {mobileOpen && <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} />}
      {/* Sidebar */}
      <aside className={'sidebar' + (mobileOpen ? ' open' : '')}>
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
          <button className="btn btn-ghost menu-button" onClick={() => setMobileOpen(true)} aria-label="Open menu">☰</button>
          <h1 className="toolbar-title">
            {tab === 'pages' && (activePage || 'Select a page')}
            {tab === 'nav' && 'Navigation Editor'}
            {tab === 'strings' && 'Strings Editor'}
            {tab === 'lang' && 'Translation Manager'}
            {tab === 'calendar' && 'Hijri Calendar Editor'}
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
              <button className="btn btn-danger" onClick={event => handleDeletePage(activePage, event)}>
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
            <ContentEditor data={pageData} onChange={d => { setPageData(d); setDirty(true) }} pageName={activePage} initialLang={pendingLang} />
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
          {tab === 'lang' && <LanguageEditor api={api} pages={pages} show={show} onJumpToPage={jumpToPage} />}
          {tab === 'calendar' && <CalendarEditor api={api} show={show} />}
          {tab === 'settings' && <SettingsEditor api={api} show={show} />}
        </div>
      </main>

      <div className={'toast ' + (toast ? 'show ' + toastType : '')} role={toastType === 'error' ? 'alert' : 'status'} aria-live="polite">{toast}</div>
      {dialog === 'create' && (
        <Modal title="Create new page" onClose={closeDialog}
          actions={<><button className="btn btn-ghost" onClick={closeDialog}>Cancel</button><button className="btn btn-primary" onClick={submitDialog} disabled={dialogBusy}>Create</button></>}>
          <div className="field-group"><label className="field-label" htmlFor="page-name">Page name</label><input id="page-name" className="field-input" value={dialogValue} onChange={e => setDialogValue(e.target.value)} placeholder="my-new-page" autoComplete="off" /><small className="field-help">Lowercase letters, numbers, and hyphens.</small></div>
          <div className="field-group"><label className="field-label" htmlFor="page-template">Template</label><select id="page-template" className="field-select" value={dialogTemplate} onChange={e => setDialogTemplate(e.target.value)}><option value="">Plain sections</option><option value="dua">Duas layout</option><option value="fateha">Fateha master-child layout</option></select></div>
          {dialogError && <p className="form-error" role="alert">{dialogError}</p>}
        </Modal>
      )}
      {dialog === 'duplicate' && (
        <Modal title="Duplicate page" onClose={closeDialog}
          actions={<><button className="btn btn-ghost" onClick={closeDialog}>Cancel</button><button className="btn btn-primary" onClick={submitDialog} disabled={dialogBusy}>Duplicate</button></>}>
          <p className="modal-context">Copying <strong>{activePage}</strong></p><div className="field-group"><label className="field-label" htmlFor="duplicate-name">New page name</label><input id="duplicate-name" className="field-input" value={dialogValue} onChange={e => setDialogValue(e.target.value)} /></div>{dialogError && <p className="form-error" role="alert">{dialogError}</p>}
        </Modal>
      )}
      {dialog === 'delete' && (
        <Modal title="Delete page?" danger onClose={closeDialog}
          actions={<><button className="btn btn-ghost" onClick={closeDialog}>Cancel</button><button className="btn btn-danger" onClick={submitDialog} disabled={dialogBusy}>Delete permanently</button></>}>
          <p className="modal-context">This will permanently delete <strong>{activePage}</strong>. This action cannot be undone.</p>{dialogError && <p className="form-error" role="alert">{dialogError}</p>}
        </Modal>
      )}
    </div>
  )
}
