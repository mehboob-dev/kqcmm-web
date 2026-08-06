import { useState, useEffect } from 'react'

// Code-split dynamic content loader.
//
// Page components load content dynamically by language and filename. Vite splits
// each language's JSON files into separate chunks, so clients only download
// the active language's data for the current page.

// `./**/*.json` matches both the per-language page files (en/dua.json) and
// nested content like books (en/books/meraj-un-nabi.json).
const contentModules = import.meta.glob('./**/*.json', { import: 'default' })

export function hasContent(lang, contentFile) {
  const path = `./${lang}/${contentFile}.json`
  return !!contentModules[path] || !!contentModules[`./en/${contentFile}.json`]
}

export async function getContent(lang, contentFile) {
  const path = `./${lang}/${contentFile}.json`
  const loadFn = contentModules[path]
  if (loadFn) {
    const data = await loadFn()
    // Empty shell (e.g. hinglish books/ shells) → fall back to English
    // rather than render a blank page. An empty object is a placeholder,
    // not real content.
    if (data && typeof data === 'object' && Object.keys(data).length > 0) {
      return data
    }
  }
  // Fallback to English (missing file or empty shell)
  const fallbackPath = `./en/${contentFile}.json`
  const fallbackFn = contentModules[fallbackPath]
  if (!fallbackFn) throw new Error(`Missing content file: ${contentFile}.json`)
  return await fallbackFn()
}

// React Hook to fetch page content dynamically.
export function usePageContent(lang, contentFile) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    if (!contentFile) {
      setData(null)
      setLoading(false)
      return
    }
    getContent(lang, contentFile)
      .then(res => {
        if (active) {
          setData(res)
          setLoading(false)
        }
      })
      .catch(err => {
        if (active) {
          setError(err)
          setLoading(false)
        }
      })
    return () => { active = false }
  }, [lang, contentFile])

  return { data, loading, error }
}

// Re-export the pure locale resolver (also available standalone for tests).
export { resolveLocale } from './locale.js'
