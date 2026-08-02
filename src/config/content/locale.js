// Pure locale-resolution helper (no Vite glob — unit-testable in plain Node).
//
// Content files are keyed by language code, with `quickJump` (and future shared
// metadata) at the top level. The resolver picks the requested language, falls
// back to English, then the first available locale object, and never treats
// shared metadata as a language.

// Top-level keys that are shared metadata, not per-language content.
const SHARED_KEYS = new Set(['quickJump'])

function isLocaleObject(v) {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function resolveLocale(data, requestedLang) {
  if (!data || typeof data !== 'object') return null
  const langs = Object.keys(data).filter(k => !SHARED_KEYS.has(k) && isLocaleObject(data[k]))
  const pick = (code) => (langs.includes(code) ? data[code] : null)
  const requested = requestedLang && pick(requestedLang)
  if (requested) return requested
  if (pick('en')) return data.en
  const first = langs[0] && data[langs[0]]
  return first || null
}
