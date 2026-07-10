import { createContext, useContext, useState, useCallback } from 'react'

const languages = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'hinglish', label: 'Hinglish', dir: 'ltr' },
  { code: 'urdu', label: 'اردو', dir: 'rtl' },
]

const LanguageContext = createContext()

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('kqcmm_lang') || 'en'
  })

  const changeLang = useCallback((code) => {
    setLang(code)
    localStorage.setItem('kqcmm_lang', code)
    document.documentElement.dir = languages.find(l => l.code === code)?.dir || 'ltr'
    document.documentElement.lang = code
  }, [])

  // Set initial dir/lang
  const current = languages.find(l => l.code === lang)
  if (current) {
    document.documentElement.dir = current.dir
    document.documentElement.lang = lang
  }

  return (
    <LanguageContext.Provider value={{ lang, changeLang, languages, current }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider')
  return ctx
}
