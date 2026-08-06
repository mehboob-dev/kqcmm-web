#!/usr/bin/env node
/**
 * Unit tests for src/utils/bookProgress.js (pure, no framework).
 * Run: node scripts/test-book-progress.mjs
 */
import {
  readProgressMap,
  readProgress,
  saveProgress,
  progressPct,
} from '../src/utils/bookProgress.js'

let pass = 0, fail = 0
function assert(cond, name, extra = '') {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, extra) }
}
function eq(a, b, name) { assert(a === b, name, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`) }

// In-memory fake storage.
function fakeStorage(seed = {}) {
  const map = new Map(Object.entries(seed))
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
    removeItem: (k) => map.delete(k),
  }
}

console.log('--- readProgressMap / readProgress ---')
assert(Object.keys(readProgressMap(fakeStorage())).length === 0, 'empty storage -> {}')
eq(readProgress('meraj', fakeStorage()), -1, 'never read -> -1')
const seeded = fakeStorage({ kqcmm_book_progress: '{"meraj":3,"milad":0}' })
eq(readProgress('meraj', seeded), 3, 'reads saved index')
eq(readProgress('milad', seeded), 0, 'reads index 0')
eq(readProgress('jesus', seeded), -1, 'missing slug -> -1')
assert(Object.keys(readProgressMap(fakeStorage({ kqcmm_book_progress: 'not-json' }))).length === 0, 'malformed -> {}')
assert(Object.keys(readProgressMap(null)).length === 0, 'null storage -> {}')

console.log('--- saveProgress ---')
const s1 = fakeStorage()
saveProgress('meraj', 2, s1)
eq(JSON.parse(s1.getItem('kqcmm_book_progress')).meraj, 2, 'saves index')
saveProgress('meraj', 5, s1)
eq(JSON.parse(s1.getItem('kqcmm_book_progress')).meraj, 5, 'overwrites index')
saveProgress('milad', 0, s1)
eq(JSON.parse(s1.getItem('kqcmm_book_progress')).meraj, 5, 'preserves other slugs')
saveProgress('x', -1, s1)
assert(!('x' in JSON.parse(s1.getItem('kqcmm_book_progress'))), 'ignores negative index')
saveProgress('', 2, s1)
assert(!('' in JSON.parse(s1.getItem('kqcmm_book_progress'))), 'ignores empty slug')

console.log('--- storage failure tolerance ---')
const throwing = { getItem: () => { throw new Error('blocked') }, setItem: () => { throw new Error('blocked') }, removeItem: () => { throw new Error('blocked') } }
let threw = false
try { saveProgress('a', 1, throwing) } catch { threw = true }
assert(!threw, 'saveProgress does not throw on blocked storage')
assert(Object.keys(readProgressMap(throwing)).length === 0, 'readProgressMap returns {} on blocked storage')

console.log('--- progressPct ---')
eq(progressPct('meraj', 0, fakeStorage()), 0, 'no chapters -> 0')
eq(progressPct('meraj', 5, fakeStorage()), 0, 'never read -> 0')
const s2 = fakeStorage({ kqcmm_book_progress: '{"meraj":0}' })
eq(progressPct('meraj', 5, s2), 20, 'chapter 0 of 5 -> 20%')
const s3 = fakeStorage({ kqcmm_book_progress: '{"meraj":4}' })
eq(progressPct('meraj', 5, s3), 100, 'last chapter of 5 -> 100%')
const s4 = fakeStorage({ kqcmm_book_progress: '{"meraj":99}' })
eq(progressPct('meraj', 5, s4), 100, 'index beyond range capped at 100%')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
