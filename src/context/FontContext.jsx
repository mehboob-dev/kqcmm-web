import { createContext, useContext, useState, useCallback } from 'react'

const fontFamilies = [
  { id: 'system', label: 'System Default', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' },
  { id: 'serif', label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { id: 'sans', label: 'Sans Serif', family: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: 'mono', label: 'Monospace', family: '"Courier New", Courier, monospace' },
  { id: 'urdu-nastaliq', label: 'Urdu Nastaliq', family: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Traditional Arabic", serif', lang: ['urdu'] },
  { id: 'urdu-naskh', label: 'Urdu Naskh', family: '"Noto Naskh Arabic", "Al Qalam", Scheherazade New, serif', lang: ['urdu'] },
  { id: 'mehr-nastaliq', label: 'Mehr Nastaliq', family: '"Mehr Nastaliq", "Noto Nastaliq Urdu", serif', lang: ['urdu'] },
]

const fontSizes = [
  { id: 'small', label: 'Small', size: '14px' },
  { id: 'medium', label: 'Medium', size: '16px' },
  { id: 'large', label: 'Large', size: '18px' },
  { id: 'xlarge', label: 'X-Large', size: '21px' },
]

const FontContext = createContext()

export function FontProvider({ children }) {
  const [fontFamily, setFontFamily] = useState(() => {
    return localStorage.getItem('kqcmm_font_family') || 'system'
  })
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('kqcmm_font_size') || 'medium'
  })

  const changeFontFamily = useCallback((id) => {
    setFontFamily(id)
    localStorage.setItem('kqcmm_font_family', id)
  }, [])

  const changeFontSize = useCallback((id) => {
    setFontSize(id)
    localStorage.setItem('kqcmm_font_size', id)
  }, [])

  const currentFont = fontFamilies.find(f => f.id === fontFamily) || fontFamilies[0]
  const currentSize = fontSizes.find(s => s.id === fontSize) || fontSizes[1]

  return (
    <FontContext.Provider value={{
      fontFamily, fontSize,
      changeFontFamily, changeFontSize,
      fontFamilies, fontSizes,
      currentFont, currentSize
    }}>
      {children}
    </FontContext.Provider>
  )
}

export function useFont() {
  const ctx = useContext(FontContext)
  if (!ctx) throw new Error('useFont must be inside FontProvider')
  return ctx
}
