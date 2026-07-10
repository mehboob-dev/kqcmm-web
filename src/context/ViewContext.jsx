import { createContext, useContext, useState, useCallback } from 'react'
import viewConfig from '../config/view.json'

const ViewContext = createContext()

export function ViewProvider({ children }) {
  const [slideMode, setSlideMode] = useState(() => {
    const saved = localStorage.getItem('kqcmm_view_mode')
    return saved !== null ? saved === 'slide' : viewConfig.defaultMode === 'slide'
  })

  const toggleSlideMode = useCallback(() => {
    setSlideMode(prev => {
      const next = !prev
      localStorage.setItem('kqcmm_view_mode', next ? 'slide' : 'list')
      return next
    })
  }, [])

  const getPageMode = useCallback((pageKey) => {
    // When user has set a global preference, it overrides everything
    const saved = localStorage.getItem('kqcmm_view_mode')
    if (saved === 'slide') return 'slide'
    if (saved === 'list') return 'list'
    // No global preference → per-page config
    return viewConfig.pages[pageKey] || 'list'
  }, [slideMode])

  return (
    <ViewContext.Provider value={{ slideMode, toggleSlideMode, getPageMode }}>
      {children}
    </ViewContext.Provider>
  )
}

export function useView() {
  const ctx = useContext(ViewContext)
  if (!ctx) throw new Error('useView must be inside ViewProvider')
  return ctx
}
