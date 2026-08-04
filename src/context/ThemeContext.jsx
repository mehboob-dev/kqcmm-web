import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { trackTheme } from '../utils/analytics'

// `swatch` is the two-tone preview shown in the Settings picker circle:
// `bg` is the theme's page background (so Light/Oled read instantly), and
// `accent` is the theme's accent dot. Taken from each theme's CSS variables
// so the choices match what you get.
const themes = [
  { id: 'light', label: 'Light', swatch: { bg: '#f5f5f5', accent: '#4a6cf7' } },
  { id: 'dark', label: 'Dark', swatch: { bg: '#0f0f1a', accent: '#7c5cfc' } },
  { id: 'sepia', label: 'Sepia', swatch: { bg: '#faf0e6', accent: '#b8860b' } },
  { id: 'green', label: 'Green', swatch: { bg: '#e8f5e9', accent: '#2e7d32' } },
  { id: 'rose', label: 'Rose', swatch: { bg: '#fdf0f2', accent: '#c2185b' } },
  { id: 'indigo', label: 'Indigo', swatch: { bg: '#eef1fb', accent: '#4f3fd1' } },
  { id: 'teal', label: 'Teal', swatch: { bg: '#e6f5f2', accent: '#0f766e' } },
  { id: 'oled', label: 'OLED', swatch: { bg: '#000000', accent: '#10b981' } },
]

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Only accept a stored value that matches a known theme id. Anything else
    // (stale id from a removed theme, hand-edited garbage) falls back to the
    // default instead of setting an unknown `data-theme` that has no CSS block
    // — which would silently render an unstyled page with no matching swatch.
    const stored = localStorage.getItem('kqcmm_theme')
    return themes.some(t => t.id === stored) ? stored : 'green'
  })

  const changeTheme = useCallback((id) => {
    setTheme(id)
    localStorage.setItem('kqcmm_theme', id)
    trackTheme(id)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be inside ThemeProvider')
  return ctx
}
