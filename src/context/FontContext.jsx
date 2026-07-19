import { createContext, useContext, useState, useCallback } from 'react'

const fontFamilies = [
  { id: 'system', label: 'System Default', family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif' },
  { id: 'serif', label: 'Serif', family: 'Georgia, "Times New Roman", serif' },
  { id: 'sans', label: 'Sans Serif', family: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: 'mono', label: 'Monospace', family: '"Courier New", Courier, monospace' },
  { id: 'bookman', label: 'Bookman', family: '"Bookman Old Style", "Bookman", Georgia, serif' },
  { id: 'garamond', label: 'Garamond', family: '"EB Garamond", Garamond, "Times New Roman", serif' },
  { id: 'palatino', label: 'Palatino', family: 'Palatino, "Palatino Linotype", serif' },
  { id: 'georgia', label: 'Georgia', family: 'Georgia, "Times New Roman", serif' },
  { id: 'tahoma', label: 'Tahoma', family: 'Tahoma, "Segoe UI", Arial, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet', family: '"Trebuchet MS", "Lucida Grande", sans-serif' },
  { id: 'verdana', label: 'Verdana', family: 'Verdana, Geneva, sans-serif' },
  { id: 'times', label: 'Times New Roman', family: '"Times New Roman", Times, serif' },
  { id: 'courier', label: 'Courier New', family: '"Courier New", Courier, monospace' },
  { id: 'lucida', label: 'Lucida Console', family: '"Lucida Console", Monaco, monospace' },
  { id: 'urdu-nastaliq', label: 'Urdu Nastaliq', family: '"Noto Nastaliq Urdu", "Jameel Noori Nastaleeq", "Traditional Arabic", serif' },
  { id: 'urdu-naskh', label: 'Urdu Naskh', family: '"Noto Naskh Arabic", "Al Qalam", Scheherazade New, serif' },
  { id: 'mehr-nastaliq', label: 'Mehr Nastaliq', family: '"Mehr Nastaliq", "Noto Nastaliq Urdu", serif' },
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
    return localStorage.getItem('kqcmm_font_family') || 'times'
  })
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('kqcmm_font_size') || 'large'
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
