const BASE = '/api'

async function api(path, opts = {}) {
  const r = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...opts.headers },
    ...opts,
  })
  if (!r.ok) {
    const body = await r.text()
    throw new Error(body || r.statusText)
  }
  return r.json()
}

export function useApi() {
  return {
    // Pages
    listPages: () => api('/pages'),
    getPage: (name) => api('/page/' + name + '.json'),
    savePage: (name, data) => api('/page/' + name + '.json', { method: 'POST', body: JSON.stringify(data) }),
    createPage: (name, template) => api('/page', { method: 'PUT', body: JSON.stringify({ name, template }) }),
    deletePage: (name) => api('/page/' + name + '.json', { method: 'DELETE' }),
    duplicatePage: (from, to) => api('/page/duplicate', { method: 'POST', body: JSON.stringify({ from, to }) }),

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

    // Search
    search: (q) => api('/search?q=' + encodeURIComponent(q)),

    // Pages info (metadata for editor)
    getTemplates: () => api('/templates'),

    // Content info (list of languages per page)
    getPageInfo: (name) => api('/page/' + name + '.json/info'),
  }
}
