#!/usr/bin/env node
/**
 * Shared page-rename logic for the Admin Panel.
 *
 * A page "slug" is the basename of its content JSON file (src/config/content/)
 * and is what the admin lists as the page name. Because the public app renders
 * fixed pages from a page-route registry (src/config/pageRoutes.json), renaming
 * a page means:
 *
 *   1. Moving the content JSON file: <old>.json → <new>.json
 *   2. Updating the registry entry's `contentFile` + `route`
 *   3. Keeping the old route as a redirect alias in the registry
 *   4. Updating every navigation entry whose route matched the old route
 *
 * The old route stays in the registry's `aliases` so old links keep working
 * (the app renders a <Navigate> redirect for them). The operation is
 * transactional: nothing is persisted until every check passes, and if a later
 * write fails the earlier writes are rolled back.
 *
 * Only fixed pages registered in pageRoutes.json are renameable. Home, the
 * dedicated Calendar editor, and ad-hoc JSON files (which have no public
 * renderer) are not renameable.
 *
 * Run standalone: node scripts/page-rename.mjs <pageId> <newSlug> [--dry-run]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export let ROOT = path.resolve(__dirname, '..')
export let CONTENT_DIR = path.resolve(ROOT, 'src/config/content')
export let NAV_FILE = path.resolve(ROOT, 'src/config/navigation.json')
export let ROUTES_FILE = path.resolve(ROOT, 'src/config/pageRoutes.json')

export function overridePaths(paths) {
  if (paths.contentDir) CONTENT_DIR = paths.contentDir
  if (paths.navFile) NAV_FILE = paths.navFile
  if (paths.routesFile) ROUTES_FILE = paths.routesFile
}

export function restorePaths() {
  CONTENT_DIR = path.resolve(ROOT, 'src/config/content')
  NAV_FILE = path.resolve(ROOT, 'src/config/navigation.json')
  ROUTES_FILE = path.resolve(ROOT, 'src/config/pageRoutes.json')
}

// Reserved paths the app/router already claims (or that would be ambiguous).
const RESERVED_ROUTES = new Set([
  '/', '/settings', '/admin', '/api', '/admin/',
])

// Slugs are lowercase ASCII letters/digits separated by single hyphens.
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
export const MAX_SLUG_LEN = 64

// Existing content files may be camelCase (fatehaKhwani.json, salimPappa.json),
// so path-safety for reads must allow letters/digits/hyphens while rejecting
// traversal separators. New names (create/rename/duplicate) use SLUG_RE above.
export const EXISTING_PAGE_RE = /^[A-Za-z0-9]+(?:[-A-Za-z0-9]*)$/
export const isExistingPageName = (name) =>
  typeof name === 'string' && name.length > 0 && name.length <= 80 && EXISTING_PAGE_RE.test(name)

export const readJSON = (fp) => { try { return JSON.parse(fs.readFileSync(fp, 'utf8')) } catch { return null } }
export const writeJSON = (fp, data) => fs.writeFileSync(fp, JSON.stringify(data, null, 2) + '\n')

// Atomic write: write to a temp sibling then rename into place.
export function writeJSONAtomic(fp, data) {
  const tmp = fp + '.tmp-' + process.pid
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2) + '\n')
  fs.renameSync(tmp, fp)
}

export function getActiveLanguageDirs() {
  try {
    const dirs = fs.readdirSync(CONTENT_DIR, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory() && dirent.name !== '.claude' && dirent.name !== '.git' && dirent.name !== 'scratch')
      .map(dirent => dirent.name)
    return dirs.length ? dirs : ['en']
  } catch {
    return ['en']
  }
}

export function listPageFiles() {
  try {
    const enDir = path.join(CONTENT_DIR, 'en')
    if (!fs.existsSync(enDir)) return []
    return fs.readdirSync(enDir)
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace(/\.json$/, ''))
      .sort()
  } catch { return [] }
}

export function loadRoutes() {
  return readJSON(ROUTES_FILE) || []
}

/** Validate a new slug for the page-name collision rules. Returns error string or null. */
export function validateSlug(slug) {
  if (!slug) return 'Slug is required'
  if (typeof slug !== 'string') return 'Slug must be a string'
  if (slug.length > MAX_SLUG_LEN) return `Slug must be ${MAX_SLUG_LEN} characters or fewer`
  if (!SLUG_RE.test(slug)) return 'Use lowercase letters, numbers, and hyphens only (e.g. my-page-2)'
  return null
}

/** Validate the canonical route a slug would map to (reserved + collisions). */
export function validateRoute(route, routes, aliases) {
  if (RESERVED_ROUTES.has(route)) return `Route "${route}" is reserved`
  if (routes.some(p => p.route === route)) return `Route "${route}" is already used by another page`
  if (aliases.includes(route)) return `Route "${route}" is already a legacy alias for another page`
  return null
}

/**
 * Build the full rename plan without touching the filesystem.
 * @param {string} pageId   stable registry id
 * @param {string} newSlug  desired new content-file basename
 * @param {object} opts     { routes, nav, routeFile, navFile }
 * @returns {{ok:true, result}|{ok:false, error}}
 */
export function buildRename(pageId, newSlug, opts = {}) {
  const routes = opts.routes || loadRoutes()
  const nav = opts.nav || readJSON(NAV_FILE) || { bottomNav: [], sideDrawer: [] }

  const page = routes.find(p => p.id === pageId)
  if (!page) return { ok: false, error: `Unknown page id: "${pageId}"` }
  if (!page.renamable) return { ok: false, error: `Page "${page.id}" cannot be renamed (not a renameable fixed page)` }
  if (!page.contentFile) return { ok: false, error: `Page "${page.id}" has no content file to rename` }

  const slugErr = validateSlug(newSlug)
  if (slugErr) return { ok: false, error: slugErr }

  const oldFile = page.contentFile
  const newFile = newSlug
  if (oldFile === newFile) return { ok: false, error: `New slug is the same as the current slug` }

  const oldRoute = page.route
  const newRoute = '/' + newSlug

  // Filesystem checks (only performed against real state, using 'en' as reference).
  const srcPath = path.join(CONTENT_DIR, 'en', oldFile + '.json')
  if (!opts.skipFsChecks && !fs.existsSync(srcPath)) return { ok: false, error: `Content file "en/${oldFile}.json" not found` }
  const dstPath = path.join(CONTENT_DIR, 'en', newFile + '.json')
  if (!opts.skipFsChecks && fs.existsSync(dstPath)) return { ok: false, error: `A page named "${newSlug}" already exists` }

  // Route collision checks (registry is the source of truth). The page's own
  // aliases are excluded — renaming back to a previous slug of the same page
  // simply collapses the alias (removing it) rather than colliding with it.
  const ownAliases = page.aliases || []
  const otherAliases = routes.flatMap(p => p.id === page.id ? [] : (p.aliases || []))
  const routeErr = validateRoute(newRoute, routes, otherAliases)
  if (routeErr) return { ok: false, error: routeErr }

  // Ensure the destination content-file name isn't taken by an unrelated custom page.
  const pageFiles = listPageFiles()
  if (!opts.skipFsChecks && pageFiles.includes(newFile)) {
    return { ok: false, error: `A page named "${newSlug}" already exists` }
  }

  // New aliases: the old route is added, and any own alias equal to the new
  // route is removed (renaming back to it).
  const aliases = ownAliases
    .filter(a => a !== newRoute)
    .concat(oldRoute)

  const updatedRoutes = routes.map(p => p.id === page.id
    ? { ...p, contentFile: newFile, route: newRoute, aliases }
    : p)

  // Update navigation by stable pageId first, then fall back to matching the
  // old route (legacy entries). This keeps custom-page nav references intact
  // across renames.
  const updateNav = (group) => (nav[group] || []).map(item => {
    if (item.pageId && item.pageId === page.id) return { ...item, to: newRoute }
    if (item.to === oldRoute) return { ...item, to: newRoute }
    return item
  })
  const updatedNav = {
    bottomNav: updateNav('bottomNav'),
    sideDrawer: updateNav('sideDrawer'),
  }

  return {
    ok: true,
    result: {
      pageId: page.id,
      oldFile, newFile, oldRoute, newRoute, alias: oldRoute,
      routes: updatedRoutes,
      nav: updatedNav,
    },
  }
}

/**
 * Apply a rename plan to disk. Validates first, then persists files atomically
 * with rollback on failure.
 * @param {object} plan result from buildRename
 */
export function applyRename(plan) {
  if (!plan || !plan.ok) throw new Error('Invalid rename plan')
  const { oldFile, newFile, routes, nav } = plan.result
  const activeDirs = getActiveLanguageDirs()

  activeDirs.forEach(dir => {
    const src = path.join(CONTENT_DIR, dir, oldFile + '.json')
    const dst = path.join(CONTENT_DIR, dir, newFile + '.json')
    if (!fs.existsSync(src)) throw new Error(`Content file "${dir}/${oldFile}.json" not found`)
    if (fs.existsSync(dst)) throw new Error(`A page named "${newFile}" already exists in ${dir}`)
  })

  const prevRoutes = loadRoutes()
  const prevNav = readJSON(NAV_FILE) || { bottomNav: [], sideDrawer: [] }
  const renamedDirs = []

  try {
    // 1. Move content file in all active language directories
    activeDirs.forEach(dir => {
      const src = path.join(CONTENT_DIR, dir, oldFile + '.json')
      const dst = path.join(CONTENT_DIR, dir, newFile + '.json')
      fs.renameSync(src, dst)
      renamedDirs.push(dir)
    })

    // 2. Registry + nav (atomic writes)
    writeJSONAtomic(ROUTES_FILE, routes)
    writeJSONAtomic(NAV_FILE, nav)
  } catch (e) {
    // Rollback: restore file names + configs
    try {
      renamedDirs.forEach(dir => {
        const src = path.join(CONTENT_DIR, dir, oldFile + '.json')
        const dst = path.join(CONTENT_DIR, dir, newFile + '.json')
        if (fs.existsSync(dst) && !fs.existsSync(src)) fs.renameSync(dst, src)
      })
      writeJSONAtomic(ROUTES_FILE, prevRoutes)
      writeJSONAtomic(NAV_FILE, prevNav)
    } catch (rollbackErr) {
      throw new Error(`Rename failed and rollback also failed: ${rollbackErr.message}`)
    }
    throw e
  }
  return plan.result
}

/**
 * Build a custom-page create plan. Writes the content template file and adds a
 * custom registry entry with a fresh stable ID (never derived from the slug).
 * Does not add the page to navigation (admins do that explicitly).
 * @param {string} slug  new content-file basename / route slug
 * @param {object} content  full content file JSON (per-language template)
 * @param {object} opts  { routes }
 * @returns {{ok:true, result}|{ok:false, error}}
 */
export function buildCreateCustom(slug, content, opts = {}) {
  const routes = opts.routes || loadRoutes()
  const slugErr = validateSlug(slug)
  if (slugErr) return { ok: false, error: slugErr }

  const route = '/' + slug
  const routeErr = validateRoute(route, routes, routes.flatMap(p => (p.aliases || [])))
  if (routeErr) return { ok: false, error: routeErr }

  const files = listPageFiles()
  if (files.includes(slug)) return { ok: false, error: `A page named "${slug}" already exists` }

  const id = 'custom-' + (cryptoIdSeed()).toString(36)
  if (routes.some(p => p.id === id)) return { ok: false, error: 'Could not allocate a unique page id' }

  const entry = {
    id,
    component: 'GenericContentPage',
    contentFile: slug,
    route,
    renderer: 'generic',
    titleKey: null,
    custom: true,
    renamable: true,
    aliases: [],
  }
  return {
    ok: true,
    result: { entry, routes: [...routes, entry], contentFile: slug, route, content },
  }
}

// Deterministic-ish unique id seed without Math.random/Date for testability:
// a monotonic counter seeded per-process.
let idCounter = 0
function cryptoIdSeed() {
  idCounter = (idCounter + 1) % 0xfffff
  return idCounter + (process.pid % 0xffff)
}

/** Apply a create-custom plan to disk (write content + registry atomically). */
export function applyCreateCustom(plan) {
  if (!plan || !plan.ok) throw new Error('Invalid create plan')
  const { entry, routes, contentFile, content } = plan.result
  if (content === undefined || content === null) throw new Error('Create plan has no content')
  
  const activeDirs = getActiveLanguageDirs()
  activeDirs.forEach(dir => {
    const fp = path.join(CONTENT_DIR, dir, contentFile + '.json')
    if (fs.existsSync(fp)) throw new Error(`A page named "${contentFile}" already exists in ${dir}`)
  })

  const prevRoutes = loadRoutes()
  const createdFiles = []
  try {
    activeDirs.forEach(dir => {
      const fp = path.join(CONTENT_DIR, dir, contentFile + '.json')
      const dirPath = path.dirname(fp)
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
      
      const split = {}
      if (content.quickJump) split.quickJump = content.quickJump
      if (content[dir]) {
        split[dir] = content[dir]
      } else {
        const firstKey = Object.keys(content).find(k => k !== 'quickJump' && typeof content[k] === 'object' && content[k] !== null)
        split[dir] = firstKey ? JSON.parse(JSON.stringify(content[firstKey])) : { title: entry.route.replace(/^\//, ''), sections: [] }
      }
      
      writeJSONAtomic(fp, split)
      createdFiles.push(fp)
    })
    
    writeJSONAtomic(ROUTES_FILE, routes)
  } catch (e) {
    try {
      createdFiles.forEach(fp => {
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
      })
      writeJSONAtomic(ROUTES_FILE, prevRoutes)
    } catch (rollbackErr) {
      throw new Error(`Create failed and rollback also failed: ${rollbackErr.message}`)
    }
    throw e
  }
  return { entry, contentFile }
}

/** Build a custom-page duplicate plan (new file + new stable-id registry entry). */
export function buildDuplicateCustom(from, to, opts = {}) {
  const routes = opts.routes || loadRoutes()
  const fromErr = validateSlug(from)
  if (fromErr) return { ok: false, error: fromErr }
  const toErr = validateSlug(to)
  if (toErr) return { ok: false, error: toErr }

  const srcPath = path.join(CONTENT_DIR, 'en', from + '.json')
  if (!opts.skipFsChecks && !fs.existsSync(srcPath)) return { ok: false, error: `Source page "en/${from}.json" not found`, status: 404 }

  const route = '/' + to
  const routeErr = validateRoute(route, routes, routes.flatMap(p => (p.aliases || [])))
  if (routeErr) return { ok: false, error: routeErr }

  const files = listPageFiles()
  if (files.includes(to)) return { ok: false, error: `A page named "${to}" already exists` }

  const id = 'custom-' + (cryptoIdSeed()).toString(36)
  const entry = {
    id,
    component: 'GenericContentPage',
    contentFile: to,
    route,
    renderer: 'generic',
    titleKey: null,
    custom: true,
    renamable: true,
    aliases: [],
  }
  return { ok: true, result: { entry, routes: [...routes, entry], oldFile: from, contentFile: to, route } }
}

/** Apply a duplicate-custom plan (copy file + add registry entry atomically). */
export function applyDuplicateCustom(plan) {
  if (!plan || !plan.ok) throw new Error('Invalid duplicate plan')
  const { entry, routes, oldFile, contentFile } = plan.result
  const activeDirs = getActiveLanguageDirs()

  activeDirs.forEach(dir => {
    const src = path.join(CONTENT_DIR, dir, oldFile + '.json')
    const dst = path.join(CONTENT_DIR, dir, contentFile + '.json')
    if (!fs.existsSync(src)) throw new Error(`Source file not found: ${dir}/${oldFile}.json`)
    if (fs.existsSync(dst)) throw new Error(`Destination already exists: ${dir}/${contentFile}.json`)
  })

  const prevRoutes = loadRoutes()
  const copiedFiles = []
  try {
    activeDirs.forEach(dir => {
      const src = path.join(CONTENT_DIR, dir, oldFile + '.json')
      const dst = path.join(CONTENT_DIR, dir, contentFile + '.json')
      const dirPath = path.dirname(dst)
      if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
      
      fs.copyFileSync(src, dst)
      copiedFiles.push(dst)
    })
    writeJSONAtomic(ROUTES_FILE, routes)
  } catch (e) {
    try {
      copiedFiles.forEach(fp => {
        if (fs.existsSync(fp)) fs.unlinkSync(fp)
      })
      writeJSONAtomic(ROUTES_FILE, prevRoutes)
    } catch (rollbackErr) {
      throw new Error(`Duplicate failed and rollback also failed: ${rollbackErr.message}`)
    }
    throw e
  }
  return { entry, contentFile }
}

/** Build a custom-page delete plan (removes file + registry entry + nav refs). */
export function buildDeleteCustom(contentFile, opts = {}) {
  const routes = opts.routes || loadRoutes()
  const nav = opts.nav || readJSON(NAV_FILE) || { bottomNav: [], sideDrawer: [] }
  const entry = routes.find(p => p.contentFile === contentFile)
  if (!entry) return { ok: false, error: `No page "${contentFile}"`, status: 404 }
  if (!entry.custom) return { ok: false, error: `Page "${contentFile}" is a fixed page and cannot be deleted from here` }

  const cleanNav = (group) => (nav[group] || []).filter(item => !(item.pageId && item.pageId === entry.id))
  const updatedNav = { bottomNav: cleanNav('bottomNav'), sideDrawer: cleanNav('sideDrawer') }
  return {
    ok: true,
    result: {
      entry,
      routes: routes.filter(p => p.id !== entry.id),
      nav: updatedNav,
      contentFile,
      removedNav: (nav.bottomNav || []).filter(i => i.pageId === entry.id).length + (nav.sideDrawer || []).filter(i => i.pageId === entry.id).length,
    },
  }
}

/** Apply a delete-custom plan (remove file + registry + nav references). */
export function applyDeleteCustom(plan) {
  if (!plan || !plan.ok) throw new Error('Invalid delete plan')
  const { routes, nav, contentFile } = plan.result
  const activeDirs = getActiveLanguageDirs()

  activeDirs.forEach(dir => {
    const fp = path.join(CONTENT_DIR, dir, contentFile + '.json')
    if (!fs.existsSync(fp)) throw new Error(`Page file not found: ${dir}/${contentFile}.json`)
  })

  const prevRoutes = loadRoutes()
  const prevNav = readJSON(NAV_FILE) || { bottomNav: [], sideDrawer: [] }
  const deletedFiles = []
  try {
    activeDirs.forEach(dir => {
      const fp = path.join(CONTENT_DIR, dir, contentFile + '.json')
      const data = readJSON(fp)
      fs.unlinkSync(fp)
      deletedFiles.push({ fp, data })
    })
    writeJSONAtomic(ROUTES_FILE, routes)
    writeJSONAtomic(NAV_FILE, nav)
  } catch (e) {
    try {
      deletedFiles.forEach(item => {
        writeJSONAtomic(item.fp, item.data)
      })
      writeJSONAtomic(ROUTES_FILE, prevRoutes)
      writeJSONAtomic(NAV_FILE, prevNav)
    } catch (rollbackErr) {
      throw new Error(`Delete failed and rollback also failed: ${rollbackErr.message}`)
    }
    throw e
  }
  return plan.result
}

/* ── CLI ── */
if (process.argv[1] && path.basename(process.argv[1]) === 'page-rename.mjs') {
  const [pageId, newSlug] = process.argv.slice(2)
  if (!pageId || !newSlug) {
    console.error('Usage: node scripts/page-rename.mjs <pageId> <newSlug> [--dry-run]')
    process.exit(1)
  }
  const plan = buildRename(pageId, newSlug)
  if (!plan.ok) {
    console.error('✗', plan.error)
    process.exit(1)
  }
  if (process.argv.includes('--dry-run')) {
    console.log('Dry run — would rename:')
    console.log(`  ${plan.result.oldFile}.json → ${plan.result.newFile}.json`)
    console.log(`  ${plan.result.oldRoute} → ${plan.result.newRoute} (alias: ${plan.result.alias})`)
    process.exit(0)
  }
  const result = applyRename(plan)
  console.log(`✓ Renamed "${result.pageId}":`)
  console.log(`  ${result.oldFile}.json → ${result.newFile}.json`)
  console.log(`  ${result.oldRoute} → ${result.newRoute} (old route kept as alias)`)
}
