// Content loader.
//
// Page components resolve content through this loader by content-file basename
// (from the page-route registry) rather than importing a specific JSON file, so
// a rename can move the file on disk and update the registry without touching
// component source. Content files are statically included at build time via
// Vite's eager glob — a file created or renamed by the Admin Panel is only
// included in the bundle after `npm run build`.
const contentModules = import.meta.glob('./*.json', {
  eager: true,
  import: 'default',
})

export function hasContent(contentFile) {
  return !!contentModules[`./${contentFile}.json`]
}

export function getContent(contentFile) {
  const data = contentModules[`./${contentFile}.json`]
  if (!data) throw new Error(`Missing content file: ${contentFile}.json`)
  return data
}

// Re-export the pure locale resolver (also available standalone for tests).
export { resolveLocale } from './locale.js'
