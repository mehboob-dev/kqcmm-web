// Pure helpers for rendering admin-created custom pages safely and generically.
//
// Custom content files can contain a mix of known collection shapes and
// arbitrary JSON (the Admin editor edits arbitrary JSON). The public renderer
// must: (1) recognize the documented shapes, (2) render anything else as safe
// plain text with bounded depth, and (3) never interpret user-authored JSON as
// HTML/Markdown. All functions here are pure so they can be unit-tested in Node.

// Keys that are implementation metadata, not content, for a locale payload.
const META_KEYS = new Set(['quickJump'])

// Collection shapes the generic renderer understands (order = priority).
const COLLECTIONS = [
  'sections',
  'duas',
  'items',
  'verses',
  'lineage',
  'paragraphs',
]

// Card title/body fields, in priority order.
const TITLE_KEYS = ['title', 'heading', 'label']
const BODY_KEYS = ['text', 'body', 'translation', 'arabic']

// Reasonable safety bounds for rendering arbitrary JSON.
const MAX_DEPTH = 6
const MAX_ARRAY_ITEMS = 200
const MAX_STRING_LEN = 20000

/** Parse a Fateha-style block into { title, text } splitting only the first `::`. */
export function parseBlock(block) {
  const [title, ...rest] = String(block).split('::')
  return { title: title.trim(), text: rest.join('::').trim() }
}

/** Split master/child cards from a `|||`-separated text block. */
export function parseMasterChild(text) {
  return String(text).split('|||').map(parseBlock)
}

/** Pick the first defined scalar for a list of keys, else ''. */
export function pickField(obj, keys) {
  if (!obj || typeof obj !== 'object') return ''
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null) return typeof v === 'string' ? v : String(v)
  }
  return ''
}

function looksMasterChild(obj) {
  return typeof obj.text === 'string' && obj.text.includes('|||')
}

/**
 * Normalize a locale payload for the generic renderer.
 * @param {object} locale data[lang] from a content file
 * @param {object} opts   { quickJump } shared top-level indices
 * @returns {{ title, intro, primary, primaryKey, quickJump, extra }}
 */
export function normalizeGenericContent(locale, opts = {}) {
  if (!locale || typeof locale !== 'object') return null

  const title = pickField(locale, TITLE_KEYS) || ''
  const intro = typeof locale.intro === 'string' ? locale.intro : ''

  // Pick the primary card collection by priority.
  let primaryKey = COLLECTIONS.find(k => Array.isArray(locale[k]))
  let primary = primaryKey ? locale[primaryKey] : null

  const extra = {}
  Object.keys(locale).forEach(k => {
    if (META_KEYS.has(k) || k === 'title' || k === 'intro' || COLLECTIONS.includes(k)) return
    extra[k] = locale[k]
  })

  // Bounds-filter quickJump indices against the primary collection.
  const rawJump = Array.isArray(opts.quickJump) ? opts.quickJump : []
  const total = Array.isArray(primary) ? primary.length : 0
  const quickJump = rawJump
    .filter(idx => Number.isInteger(idx) && idx >= 0 && idx < total)
    .filter((idx, i, a) => a.indexOf(idx) === i)

  return { title, intro, primary, primaryKey, quickJump, extra }
}

/** Render an arbitrary value as a safe plain-text node structure. */
export function toPlainNodes(value, depth = 0) {
  if (depth > MAX_DEPTH) return [{ type: 'text', label: '…' }]
  if (value === null || value === undefined) return []
  if (typeof value === 'string') {
    if (value.length > MAX_STRING_LEN) return [{ type: 'text', label: value.slice(0, MAX_STRING_LEN) + '…' }]
    return [{ type: 'text', label: value }]
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return [{ type: 'text', label: String(value) }]
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return []
    return value.slice(0, MAX_ARRAY_ITEMS).map((item, i) => ({
      type: 'group',
      label: `#${i + 1}`,
      children: toPlainNodes(item, depth + 1),
    }))
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value)
    if (entries.length === 0) return []
    return entries.map(([k, v]) => ({
      type: 'group',
      label: k,
      children: toPlainNodes(v, depth + 1),
    }))
  }
  return [{ type: 'text', label: String(value) }]
}

/** Return a normalized card descriptor for one item in the primary collection. */
export function cardForItem(item) {
  if (item === null || item === undefined) return { kind: 'empty' }
  if (typeof item !== 'object') return { kind: 'plain', title: '', body: String(item), masterChild: false }

  const title = pickField(item, TITLE_KEYS)
  const body = pickField(item, BODY_KEYS)

  if (looksMasterChild(item)) {
    return { kind: 'masterChild', title, blocks: parseMasterChild(item.text) }
  }
  return { kind: 'plain', title, body, masterChild: false }
}

export { COLLECTIONS, TITLE_KEYS, BODY_KEYS }
