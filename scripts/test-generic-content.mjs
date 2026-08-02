#!/usr/bin/env node
/**
 * Unit tests for the generic-content helpers (src/components/genericContent.js)
 * and the locale resolver (src/config/content/index.js). These are pure
 * functions, so they run in plain Node.
 * Run: node scripts/test-generic-content.mjs
 */
import {
  parseBlock,
  parseMasterChild,
  pickField,
  normalizeGenericContent,
  toPlainNodes,
  cardForItem,
  COLLECTIONS,
} from '../src/components/genericContent.js'
import { resolveLocale } from '../src/config/content/locale.js'

let pass = 0, fail = 0
function assert(cond, name, extra = '') {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, extra) }
}
function eq(a, b, name) { assert(a === b, name, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`) }

console.log('--- delimiter parsing ---')
{
  const b = parseBlock('Title::Body text')
  assert(typeof b === 'object' && b.title === 'Title' && b.text === 'Body text', 'parseBlock returns {title,text}')
}
{
  const b = parseBlock('Title::Body')
  eq(b.title, 'Title', 'block title')
  eq(b.text, 'Body', 'block text')
}
{
  const b = parseBlock('NoColon')
  eq(b.title, 'NoColon', 'block without :: has title')
  eq(b.text, '', 'block without :: has empty text')
}
{
  const b = parseBlock('A::B::C')
  eq(b.title, 'A', 'only first :: splits title')
  eq(b.text, 'B::C', 'extra :: preserved in body')
}
{
  const blocks = parseMasterChild('Bismillah::\n|||\nSura::verse text\n|||\nDarood::O Allah')
  eq(blocks.length, 3, 'master-child splits into 3 blocks')
  eq(blocks[1].title, 'Sura', 'second block title')
}

console.log('--- pickField ---')
eq(pickField({ heading: 'H', title: 'T' }, ['title', 'heading']), 'T', 'title wins over heading')
eq(pickField({ heading: 'H' }, ['title', 'heading']), 'H', 'heading used when no title')
eq(pickField({ text: 0 }, ['text']), '0', 'number coerced to string')
eq(pickField(null, ['title']), '', 'null safe')

console.log('--- normalizeGenericContent ---')
{
  const locale = { title: 'Page', intro: 'Hi', sections: [{ title: 'A', text: 'x' }], meta: 'skip' }
  const n = normalizeGenericContent(locale, { quickJump: [0, 5, -1, 0] })
  eq(n.title, 'Page', 'title')
  eq(n.intro, 'Hi', 'intro')
  eq(n.primaryKey, 'sections', 'primary key')
  eq(n.primary.length, 1, 'primary collection')
  eq(JSON.stringify(n.quickJump), JSON.stringify([0]), 'quickJump bounds-filtered + deduped')
}
{
  const locale = { title: 'D', duas: [{ heading: '1st', text: 'x' }] }
  const n = normalizeGenericContent(locale)
  eq(n.primaryKey, 'duas', 'duas collection picked')
}
{
  const n = normalizeGenericContent(null)
  assert(n === null, 'null locale returns null')
}
{
  const n = normalizeGenericContent({ title: 'Empty' })
  assert(n.primary === null, 'no collection -> primary null')
}

console.log('--- toPlainNodes (safe text) ---')
{
  const nodes = toPlainNodes('<script>alert(1)</script>')
  assert(nodes[0].type === 'text', 'HTML-looking string is text node')
  eq(nodes[0].label, '<script>alert(1)</script>', 'raw HTML preserved as text (not markup)')
}
{
  const nodes = toPlainNodes({ a: 1, b: [1, 2] })
  assert(nodes.every(n => n.type === 'group'), 'object -> group nodes')
}
{
  const nodes = toPlainNodes('x'.repeat(25000))
  eq(nodes[0].label.length, 20000 + 1, 'long string truncated with ellipsis')
}
{
  const nodes = toPlainNodes(null)
  eq(nodes.length, 0, 'null -> empty')
}

console.log('--- cardForItem ---')
{
  const card = cardForItem({ title: 'T', text: 'B' })
  eq(card.kind, 'plain', 'plain card')
  eq(card.title, 'T', 'plain card title')
  eq(card.body, 'B', 'plain card body')
}
{
  const card = cardForItem({ title: 'M', text: 'Bismillah::\n|||\nSura::verse' })
  eq(card.kind, 'masterChild', 'masterChild card')
  eq(card.blocks.length, 2, 'masterChild blocks parsed')
}
{
  const card = cardForItem(42)
  eq(card.kind, 'plain', 'scalar card')
  eq(card.body, '42', 'scalar body')
}
{
  const card = cardForItem(null)
  eq(card.kind, 'empty', 'null item empty')
}

console.log('--- COLLECTIONS order ---')
eq(COLLECTIONS[0], 'sections', 'sections first priority')

console.log('--- locale resolver ---')
{
  const data = { quickJump: [0], en: { title: 'EN' }, hinglish: { title: 'HI' } }
  eq(resolveLocale(data, 'hinglish').title, 'HI', 'requested language wins')
  eq(resolveLocale(data, 'fr').title, 'EN', 'unknown lang falls back to en')
  eq(resolveLocale(data, undefined).title, 'EN', 'defaults to en')
}
{
  const data = { quickJump: [0], fr: { title: 'FR' } }
  eq(resolveLocale(data, 'en').title, 'FR', 'no en -> first available locale')
}
{
  const data = { quickJump: [0] }
  assert(resolveLocale(data, 'en') === null, 'no locale objects -> null')
}
{
  const data = null
  assert(resolveLocale(data, 'en') === null, 'null data -> null')
}
{
  // quickJump must never be treated as a locale object: requesting it falls
  // back to en, and it is never returned as a locale payload.
  const data = { quickJump: [1, 2], en: { title: 'E' } }
  const result = resolveLocale(data, 'quickJump')
  assert(result && result.title === 'E', 'quickJump not a locale (falls back to en)')
  assert(resolveLocale({ quickJump: [1, 2] }, 'en') === null, 'quickJump-only data has no locale')
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail > 0) process.exit(1)
