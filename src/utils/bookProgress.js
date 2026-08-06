/**
 * Book reading-progress persistence — pure, unit-testable.
 *
 * Stores the last-read chapter index per book in localStorage under a single
 * key: { slug: lastChapterIndex }. Storage failures are tolerated so the
 * reader never breaks on private-mode / blocked storage.
 */
const KEY = 'kqcmm_book_progress'

function storageAvailable(storage) {
  try {
    const t = '__kqcmm_progress_test__'
    storage.setItem(t, '1')
    storage.removeItem(t)
    return true
  } catch {
    return false
  }
}

/** Read the whole progress map ({} if none / malformed / blocked). */
export function readProgressMap(storage = globalThis.localStorage) {
  if (!storage || !storageAvailable(storage)) return {}
  try {
    const raw = storage.getItem(KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

/** Last-read chapter index for a book, or -1 if never read. */
export function readProgress(slug, storage = globalThis.localStorage) {
  const map = readProgressMap(storage)
  const v = map[slug]
  return Number.isInteger(v) && v >= 0 ? v : -1
}

/** Save the last-read chapter index for a book. */
export function saveProgress(slug, chapterIndex, storage = globalThis.localStorage) {
  if (!slug || !Number.isInteger(chapterIndex) || chapterIndex < 0) return
  if (!storage || !storageAvailable(storage)) return
  try {
    const map = readProgressMap(storage)
    map[slug] = chapterIndex
    storage.setItem(KEY, JSON.stringify(map))
  } catch {
    /* ignore */
  }
}

/** Percentage through a book given the saved index and chapter count. */
export function progressPct(slug, totalChapters, storage = globalThis.localStorage) {
  if (!totalChapters || totalChapters <= 0) return 0
  const idx = readProgress(slug, storage)
  if (idx < 0) return 0
  // idx is a chapter index (0-based); show completion as (idx+1)/total.
  return Math.min(100, Math.round(((idx + 1) / totalChapters) * 100))
}
