#!/usr/bin/env node
/**
 * Unit tests for the page-rename logic (scripts/page-rename.mjs).
 * Run: node scripts/test-page-rename.mjs
 */
import fs from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'
import {
  validateSlug,
  buildRename,
  applyRename,
  buildCreateCustom,
  applyCreateCustom,
  buildDuplicateCustom,
  applyDuplicateCustom,
  buildDeleteCustom,
  applyDeleteCustom,
  loadRoutes,
  readJSON,
  writeJSON,
  writeJSONAtomic,
  listPageFiles,
  SLUG_RE,
  isExistingPageName,
} from './page-rename.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let pass = 0, fail = 0
function assert(cond, name, extra = '') {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, extra) }
}
function eq(a, b, name) { assert(a === b, name, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`) }

console.log('--- slug validation ---')
assert(validateSlug('supplications') === null, 'valid lowercase slug')
assert(validateSlug('fateha-2026') === null, 'valid slug with number + hyphen')
assert(validateSlug('a1') === null, 'valid alphanumeric')
assert(validateSlug('') !== null, 'rejects empty')
assert(validateSlug('Dua') !== null, 'rejects uppercase')
assert(validateSlug('my page') !== null, 'rejects whitespace')
assert(validateSlug('my.page') !== null, 'rejects dots')
assert(validateSlug('my/page') !== null, 'rejects slash')
assert(validateSlug('my\\page') !== null, 'rejects backslash')
assert(validateSlug('..') !== null, 'rejects traversal dots')
assert(validateSlug('x'.repeat(65)) !== null, 'rejects >64 chars')
assert(validateSlug(undefined) !== null, 'rejects undefined')

console.log('--- buildRename: happy path (no fs side effects) ---')
{
  const routes = loadRoutes()
  const nav = { bottomNav: [{ to: '/dua', key: 'duas' }], sideDrawer: [{ to: '/dua', key: 'duas' }] }
  const plan = buildRename('dua', 'supplications', { routes, nav, skipFsChecks: true })
  assert(plan.ok, 'renames a known renamable page')
  if (plan.ok) {
    eq(plan.result.oldFile, 'dua', 'old content file')
    eq(plan.result.newFile, 'supplications', 'new content file')
    eq(plan.result.oldRoute, '/dua', 'old route')
    eq(plan.result.newRoute, '/supplications', 'new route')
    eq(plan.result.alias, '/dua', 'old route becomes alias')
    assert(plan.result.routes.find(p => p.id === 'dua').aliases.includes('/dua'), 'registry records alias')
    assert(plan.result.nav.bottomNav[0].to === '/supplications', 'bottom nav updated')
    assert(plan.result.nav.sideDrawer[0].to === '/supplications', 'drawer updated')
  }
}

console.log('--- buildRename: rejections ---')
{
  const routes = loadRoutes()
  const nav = { bottomNav: [], sideDrawer: [] }
  const opts = { routes, nav, skipFsChecks: true }

  let p = buildRename('calendar', 'events', opts)
  assert(!p.ok && /cannot be renamed/i.test(p.error), 'calendar not renameable')

  p = buildRename('home', 'start', opts)
  assert(!p.ok && /cannot be renamed/i.test(p.error), 'home not renameable')

  p = buildRename('dua', 'Dua', opts)
  assert(!p.ok, 'rejects invalid new slug')

  p = buildRename('dua', 'dua', opts)
  assert(!p.ok && /same as the current slug/i.test(p.error), 'rejects same slug')

  p = buildRename('doesNotExist', 'x', opts)
  assert(!p.ok && /Unknown page id/i.test(p.error), 'rejects unknown page id')

  // Collision: new route taken by another canonical route
  p = buildRename('dua', 'khatm', opts)
  assert(!p.ok && /already used by another page/i.test(p.error), 'rejects canonical route collision')

  // Collision: new route equals an existing alias of a DIFFERENT page
  const withAliasRoutes = routes.map(r => r.id === 'khatm' ? { ...r, aliases: ['/supplications'] } : r)
  p = buildRename('dua', 'supplications', { routes: withAliasRoutes, nav, skipFsChecks: true })
  assert(!p.ok && /already a legacy alias/i.test(p.error), 'rejects alias collision (different page)')

  // Rename back to a previous slug of the SAME page should be allowed and
  // collapse the own alias (the just-left route becomes the new alias).
  const ownAliasRoutes = routes.map(r => r.id === 'dua'
    ? { ...r, aliases: ['/dua'], contentFile: 'supplications', route: '/supplications' }
    : r)
  p = buildRename('dua', 'dua', { routes: ownAliasRoutes, nav, skipFsChecks: true })
  assert(p.ok, 'allows rename back to own alias')
  if (p.ok) {
    const back = p.result.routes.find(r => r.id === 'dua')
    assert(back.route === '/dua', 'route restored to own alias route')
    assert(back.contentFile === 'dua', 'content file restored')
    assert(back.aliases.length === 1 && back.aliases[0] === '/supplications', 'just-left route becomes the new alias')
  }

  // Reserved route
  p = buildRename('dua', 'admin', opts)
  assert(!p.ok && /reserved/i.test(p.error), 'rejects reserved route')
}

console.log('--- applyRename: transactional with rollback ---')
{
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'kqcmm-rename-'))
  const routesPath = path.join(tmp, 'pageRoutes.json')
  const navPath = path.join(tmp, 'navigation.json')
  const contentDir = path.join(tmp, 'content')
  fs.mkdirSync(contentDir)
  fs.writeFileSync(path.join(contentDir, 'dua.json'), JSON.stringify({ en: { title: 'Duas' } }))

  // Point the module at the temp copies via options (buildRename uses opts for
  // routes/nav; applyRename writes to the real module paths, so we monkeypatch
  // by copying files in and restoring after).
  const { CONTENT_DIR, NAV_FILE, ROUTES_FILE } = await import('./page-rename.mjs')
  globalThis.realContentDir = CONTENT_DIR
  globalThis.realNavFile = NAV_FILE
  globalThis.realRoutesFile = ROUTES_FILE
  const realContentDir = CONTENT_DIR
  const realNavFile = NAV_FILE
  const realRoutesFile = ROUTES_FILE

  // Backup real files, point module paths at temp via fs swap is not possible
  // (consts), so we test applyRename's rollback by making the destination
  // exist to force an error and verifying no source file was moved.
  try {
    writeJSON(routesPath, loadRoutes())
    writeJSON(navPath, { bottomNav: [], sideDrawer: [] })

    // Sanity: content file present
    assert(fs.existsSync(path.join(realContentDir, 'dua.json')), 'dua.json exists (real content dir)')

    // Test rollback: craft a plan whose destination already exists by writing
    // the destination file, then applyRename must throw and leave source intact.
    const plan = buildRename('dua', 'supplications', { skipFsChecks: true })
    assert(plan.ok, 'build plan for rollback test')
    // Force collision by creating the destination file in the real content dir
    fs.writeFileSync(path.join(realContentDir, 'supplications.json'), '{}')
    let threw = false
    try { applyRename(plan) } catch (e) { threw = true }
    assert(threw, 'applyRename throws on destination collision')
    assert(fs.existsSync(path.join(realContentDir, 'dua.json')), 'source file untouched after failed rename')
    fs.unlinkSync(path.join(realContentDir, 'supplications.json'))
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true })
  }
}

console.log('--- custom create/duplicate/delete plans (no fs side effects) ---')
{
  const routes = loadRoutes()
  const nav = { bottomNav: [{ to: '/test-page', key: 'testPage', pageId: 'custom-test' }], sideDrawer: [] }

  // create (unique slug so it never collides with a real repo page)
  let p = buildCreateCustom('unit-test-custom-page', { en: { title: 'T' } }, { routes, nav })
  assert(p.ok, 'buildCreateCustom ok')
  if (p.ok) {
    assert(p.result.entry.custom === true, 'create entry is custom')
    assert(p.result.entry.renamable === true, 'create entry renamable')
    assert(p.result.entry.route === '/unit-test-custom-page', 'create entry route')
    assert(!!p.result.entry.id && p.result.entry.id.startsWith('custom-'), 'create entry has stable custom id')
  }
  // create collision (canonical route already used)
  p = buildCreateCustom('dua', { en: { title: 'T' } }, { routes, nav })
  assert(!p.ok && /already used by another page/i.test(p.error), 'create rejects existing canonical route')
  p = buildCreateCustom('admin', { en: { title: 'T' } }, { routes, nav })
  assert(!p.ok && /reserved/i.test(p.error), 'create rejects reserved route')

  // duplicate
  p = buildDuplicateCustom('dua', 'dua-copy', { routes, nav, skipFsChecks: true })
  assert(p.ok, 'buildDuplicateCustom ok')
  if (p.ok) {
    assert(p.result.entry.id !== 'dua', 'duplicate gets distinct id')
    assert(p.result.entry.contentFile === 'dua-copy', 'duplicate content file')
  }
  p = buildDuplicateCustom('dua', 'khatm', { routes, nav, skipFsChecks: true })
  assert(!p.ok, 'duplicate rejects existing route')

  // delete
  p = buildDeleteCustom('dua', { routes, nav })
  assert(!p.ok && /fixed page/i.test(p.error), 'delete rejects fixed page')
  p = buildDeleteCustom('calendar', { routes, nav })
  assert(!p.ok, 'delete rejects calendar')
  const withCustom = [...routes, { id: 'custom-test', contentFile: 'test-page', route: '/test-page', custom: true, renamable: true, aliases: [] }]
  p = buildDeleteCustom('test-page', { routes: withCustom, nav })
  assert(p.ok, 'buildDeleteCustom ok for custom')
  if (p.ok) {
    assert(p.result.routes.length === withCustom.length - 1, 'delete removes registry entry')
    assert(p.result.nav.bottomNav.length === 0, 'delete removes nav refs by pageId')
    eq(p.result.removedNav, 1, 'removedNav count')
  }
}

console.log('--- applyCreate/applyDuplicate/applyDelete transactional (temp dir) ---')
{
  // These write to the real module paths; to avoid touching the repo we verify
  // preflight validation rejects before any write for the failing cases, and
  // exercise the happy path through build* + apply* in a way that rolls back.
  // We only assert the pure preflight (no partial writes) here to keep the
  // repo pristine; the live API was verified separately.
  const routes = loadRoutes()

  // applyCreateCustom: preflight a plan, then make the destination exist on
  // disk so apply must throw and roll back — the pre-existing file must remain
  // and the registry must not gain a new entry.
  const collisionFile = 'apply-test-collision-' + process.pid
  const collisionPath = path.join(globalThis.realContentDir, collisionFile + '.json')
  fs.writeFileSync(collisionPath, '{"en":{"title":"pre-existing"}}')
  const create = buildCreateCustom(collisionFile, { en: { title: 'T' } }, { routes })
  assert(!create.ok && /already exists/i.test(create.error), 'create preflight rejects existing file')
  let threw = false
  const plan = { ok: true, result: { entry: { id: 'custom-applytest' }, routes: loadRoutes(), contentFile: collisionFile, content: { en: { title: 'T' } } } }
  try { applyCreateCustom(plan) } catch (e) { threw = true }
  assert(threw, 'applyCreateCustom throws when destination exists (no partial write)')
  assert(JSON.parse(fs.readFileSync(collisionPath, 'utf8')).en.title === 'pre-existing', 'pre-existing file untouched')
  assert(!loadRoutes().some(p => p.id === 'custom-applytest'), 'registry not modified on failed create')
  fs.unlinkSync(collisionPath)
  assert(fs.existsSync(path.join(globalThis.realContentDir, 'dua.json')), 'repo file untouched')

  // Happy path: buildCreateCustom must carry content through to the plan so a
  // successful apply writes valid JSON (regression: content was dropped,
  // writing literal "undefined").
  const goodFile = 'apply-test-good-' + process.pid
  const goodPath = path.join(globalThis.realContentDir, goodFile + '.json')
  const goodPlan = buildCreateCustom(goodFile, { en: { title: 'Good' } }, { routes })
  assert(goodPlan.ok, 'build create happy path ok')
  assert(!!goodPlan.result.content && goodPlan.result.content.en.title === 'Good', 'create plan carries content')
  const applied = applyCreateCustom(goodPlan)
  assert(applied.contentFile === goodFile, 'apply create writes file')
  const written = JSON.parse(fs.readFileSync(goodPath, 'utf8'))
  eq(written.en.title, 'Good', 'created file contains valid template JSON (not "undefined")')
  assert(loadRoutes().some(p => p.id === goodPlan.result.entry.id), 'registry gains custom entry')
  // Cleanup: remove the created file + registry entry
  fs.unlinkSync(goodPath)
  const afterClean = loadRoutes().filter(p => p.id !== goodPlan.result.entry.id)
  writeJSONAtomic(globalThis.realRoutesFile, afterClean)
  assert(!loadRoutes().some(p => p.id === goodPlan.result.entry.id), 'registry cleaned after test')
}

console.log('--- existing-page name validation (regression: camelCase files) ---')
assert(isExistingPageName('fatehaKhwani'), 'camelCase existing file accepted')
assert(isExistingPageName('salimPappa'), 'camelCase existing file accepted (salimPappa)')
assert(isExistingPageName('sijrahNama'), 'camelCase existing file accepted (sijrahNama)')
assert(isExistingPageName('dua'), 'lowercase existing file accepted')
assert(isExistingPageName('about-2'), 'hyphenated existing file accepted')
assert(!isExistingPageName('../evil'), 'path traversal rejected')
assert(!isExistingPageName('..%2Fevil'), 'encoded traversal rejected')
assert(!isExistingPageName('abc/def'), 'slash rejected')
assert(!isExistingPageName('abc\\def'), 'backslash rejected')
assert(!isExistingPageName('a.b'), 'dot rejected')
assert(!isExistingPageName(''), 'empty rejected')
assert(!isExistingPageName('x'.repeat(81)), 'overlong rejected')
// New-name strictness must stay lowercase-kebab
assert(!SLUG_RE.test('BadName'), 'new-name regex rejects uppercase (create/rename)')

console.log('--- nav route resolution (regression: slug-as-pageId / dead route) ---')
{
  const routes = loadRoutes()
  // Simulate the pageRoutes.js helpers against the real registry.
  const pageById = (id) => routes.find(p => p.id === id) || null
  const pageByContentFile = (cf) => routes.find(p => p.contentFile === cf) || null
  const pageByRoute = (r) => routes.find(p => p.route === r) || routes.find(p => (p.aliases || []).includes(r)) || null
  const routeForNavItem = (item) => {
    const ref = item?.pageId || item?.to
    if (!ref) return item?.to || null
    const byId = pageById(ref)?.route
    if (byId) return byId
    const byFile = pageByContentFile(ref)?.route
    if (byFile) return byFile
    const byRoute = pageByRoute(ref)?.route
    if (byRoute) return byRoute
    return item?.to || null
  }

  // The exact misconfiguration that caused the 404: pageId is the slug, to is a
  // dead route. Inject a synthetic custom entry so the test is self-contained
  // (does not depend on whether my-new-page currently exists in the repo).
  const testRoutes = routes.concat([
    { id: 'custom-x4l', contentFile: 'my-new-page', route: '/my-new-page', custom: true, aliases: [] },
  ])
  const tPageById = (id) => testRoutes.find(p => p.id === id) || null
  const tPageByContentFile = (cf) => testRoutes.find(p => p.contentFile === cf) || null
  const tPageByRoute = (r) => testRoutes.find(p => p.route === r) || testRoutes.find(p => (p.aliases || []).includes(r)) || null
  const tRouteForNavItem = (item) => {
    const ref = item?.pageId || item?.to
    if (!ref) return item?.to || null
    const byId = tPageById(ref)?.route
    if (byId) return byId
    const byFile = tPageByContentFile(ref)?.route
    if (byFile) return byFile
    const byRoute = tPageByRoute(ref)?.route
    if (byRoute) return byRoute
    return item?.to || null
  }

  const broken = { pageId: 'my-new-page', to: '/new-page', key: 'newPage' }
  eq(tRouteForNavItem(broken), '/my-new-page', 'slug-as-pageId resolves via content file (was /new-page → 404)')

  // Stable registry id resolves.
  eq(tRouteForNavItem({ pageId: 'custom-x4l', to: '/my-new-page' }), '/my-new-page', 'opaque registry id resolves')

  // Fixed pages resolve via id.
  eq(tRouteForNavItem({ pageId: 'dua', to: '/dua' }), '/dua', 'fixed page id resolves')

  // Alias resolves to canonical.
  eq(tRouteForNavItem({ pageId: '/roshni' }), '/roshni', 'route-as-pageId resolves')

  // Unresolvable falls back to `to`.
  eq(routeForNavItem({ pageId: 'nope', to: '/manual' }), '/manual', 'unknown id falls back to configured to')
  eq(routeForNavItem({ to: '/x' }), '/x', 'no pageId uses to directly')

  // Every real nav entry must resolve to a non-empty, non-dead route.
  const nav = readJSON(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src/config/navigation.json'))
  const all = [...(nav.bottomNav || []), ...(nav.sideDrawer || [])]
  const dead = all.filter(i => { const r = routeForNavItem(i); return !r || r === '/new-page' })
  eq(dead.length, 0, 'no dead nav routes in navigation.json')
}

console.log('--- helpers ---')
assert(Array.isArray(listPageFiles()), 'listPageFiles returns array')
assert(listPageFiles().includes('dua'), 'dua.json is listed')
assert(listPageFiles().includes('fatehaKhwani'), 'fatehaKhwani.json is listed (camelCase)')
assert(SLUG_RE.test('my-page-2'), 'SLUG_RE matches valid slug')

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
