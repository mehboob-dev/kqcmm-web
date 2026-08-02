// Page-route registry helpers.
//
// The registry (pageRoutes.json) is the single source of truth for page
// identity: a stable `id`, the current content-file basename, the canonical
// public `route`, the localized title key, `renderer`, whether the page is a
// `custom` admin-created page, `renamable`, and any legacy `aliases`. Keeping
// this in one place lets a page be renamed by editing the registry rather than
// rewriting imports/routes across the app. The admin server reads the same JSON
// file (scripts/content-editor.mjs).
import pageRoutes from './pageRoutes.json'

export function pageById(id) {
  return pageRoutes.find(p => p.id === id) || null
}

export function pageByContentFile(contentFile) {
  return pageRoutes.find(p => p.contentFile === contentFile) || null
}

export function pageByRoute(route) {
  // Canonical routes take precedence; aliases resolve to their owning page.
  return pageRoutes.find(p => p.route === route)
    || pageRoutes.find(p => (p.aliases || []).includes(route))
    || null
}

export function routeForPage(id) {
  return pageById(id)?.route || null
}

// Resolve the canonical route for a navigation entry. A nav item's pageId may
// be the stable registry id (custom-x4l), the content-file basename (my-new-page),
// or an alias; fall back to the configured `to` if none match. This keeps nav
// working even when a pageId was entered as a slug instead of the opaque id.
export function routeForNavItem(item) {
  const ref = item?.pageId || item?.to
  if (!ref) return item?.to || null
  const byId = pageById(ref)?.route
  if (byId) return byId
  const byFile = pageByContentFile(ref)?.route
  if (byFile) return byFile
  // pageId may itself be a route (e.g. "/my-new-page") or alias
  const byRoute = pageByRoute(ref)?.route
  if (byRoute) return byRoute
  return item?.to || null
}

export function isCustomPage(id) {
  return !!pageById(id)?.custom
}

/** Resolve every public route (canonical + aliases), deduplicated, in order. */
export function allPublicRoutes() {
  const set = []
  const seen = new Set()
  const push = (r) => { if (r && !seen.has(r)) { seen.add(r); set.push(r) } }
  pageRoutes.forEach(p => { push(p.route); (p.aliases || []).forEach(push) })
  return set
}

export default pageRoutes
