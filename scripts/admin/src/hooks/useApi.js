const BASE = '/api'

async function api(path, opts = {}) {
  const r = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  const body = await r.text()
  let payload = null
  try { payload = body ? JSON.parse(body) : null } catch { /* non-JSON response */ }
  if (!r.ok) {
    const message = payload?.error || payload?.message || body || r.statusText
    throw new Error(message)
  }
  return payload
}

import { useMemo } from 'react'

export function useApi() {
  // Memoized so `api` has a stable identity across renders — otherwise any
  // parent re-render (e.g. the header status badge) would hand editors a new
  // api object, re-triggering their load() and wiping in-progress edits.
  return useMemo(() => ({
    // Pages
    listPages: () => api('/pages'),
    getPage: (name) => api('/page/' + name + '.json'),
    savePage: (name, data) => api('/page/' + name + '.json', { method: 'POST', body: JSON.stringify(data) }),
    createPage: (name, template) => api('/page', { method: 'PUT', body: JSON.stringify({ name, template }) }),
    deletePage: (name) => api('/page/' + name + '.json', { method: 'DELETE' }),
    duplicatePage: (from, to) => api('/page/duplicate', { method: 'POST', body: JSON.stringify({ from, to }) }),
    renamePage: (pageId, newSlug) => api('/page/rename', { method: 'POST', body: JSON.stringify({ pageId, newSlug }) }),

    // Navigation
    getNav: () => api('/nav'),
    saveNav: (data) => api('/nav', { method: 'POST', body: JSON.stringify(data) }),

    // Strings
    getStrings: (lang) => api('/strings/' + lang),
    saveStrings: (lang, data) => api('/strings/' + lang, { method: 'POST', body: JSON.stringify(data) }),
    listStringLangs: () => api('/strings'),

    // View config
    getViewConfig: () => api('/view'),
    saveViewConfig: (data) => api('/view', { method: 'POST', body: JSON.stringify(data) }),

    // Calendar (dedicated, schema-validated editor)
    getCalendar: () => api('/calendar'),
    saveCalendar: (data) => api('/calendar', { method: 'POST', body: JSON.stringify(data) }),

    // Search
    search: (q) => api('/search?q=' + encodeURIComponent(q)),

    // Pages info (metadata for editor)
    getTemplates: () => api('/templates'),

    // Content info (list of languages per page)
    getPageInfo: (name) => api('/page/' + name + '.json/info'),

    // Content language management
    addContentLang: (lang, sourceLang) => api('/content-lang', { method: 'PUT', body: JSON.stringify({ lang, sourceLang }) }),
    removeContentLang: (lang) => api('/content-lang', { method: 'DELETE', body: JSON.stringify({ lang }) }),

    // Language config (LanguageContext.jsx)
    getLangConfig: () => api('/lang-config'),
    saveLangConfig: (langs) => api('/lang-config', { method: 'POST', body: JSON.stringify(langs) }),
  }), [])
}
