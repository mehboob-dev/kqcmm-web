import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { FontProvider } from './context/FontContext'
import { ViewProvider } from './context/ViewContext'
import SplashScreen from './components/SplashScreen'
import PwaSupport from './components/PwaSupport'
import Layout from './components/Layout'
import Home from './pages/Home'
import Dua from './pages/Dua'
import Hmk from './pages/Hmk'
import SijrahNama from './pages/SijrahNama'
import FatehaKhwani from './pages/FatehaKhwani'
import Khatm from './pages/Khatm'
import SalimPappa from './pages/SalimPappa'
import About from './pages/About'
import Calendar from './pages/Calendar'
import Roshni from './pages/Roshni'
import Abbajaan from './pages/Abbajaan'
import Changelog from './pages/Changelog'
import GenericContentPage from './pages/GenericContentPage'
import NotFound from './pages/NotFound'
import pageRoutes from './config/pageRoutes.json'
import BooksIndex from './pages/BooksIndex'
import BookReader from './pages/BookReader'

// Map registry `component`/`renderer` names to the actual React components.
// Custom pages (renderer: "generic") all resolve to the generic renderer; this
// map is explicit — never a dynamic import driven by user-controlled JSON.
const components = {
  Home, Dua, Hmk, SijrahNama, FatehaKhwani, Khatm,
  SalimPappa, About, Calendar, Roshni, Abbajaan, Changelog,
  BooksIndex, BookReader,
  GenericContentPage,
}
const componentFor = (page) =>
  page.renderer === 'generic' ? GenericContentPage : components[page.component]

export default function App() {
  const [splashDone, setSplashDone] = useState(() => {
    // Skip if already seen (prevents flash on return visits and helps prerender)
    if (sessionStorage.getItem('kqcmm_splash')) return true
    return false
  })

  const handleSplashDone = () => {
    sessionStorage.setItem('kqcmm_splash', '1')
    setSplashDone(true)
  }

  if (!splashDone) {
    return <SplashScreen onDone={handleSplashDone} />
  }

  return (
    <ThemeProvider>
      <LanguageProvider>
        <FontProvider>
          <ViewProvider>
          <PwaSupport />
          <Routes>
            <Route element={<Layout />}>
              {pageRoutes.map(page => {
                const Element = componentFor(page)
                if (!Element) return null
                return (
                  <Route key={page.id} path={page.route} element={<Element />} />
                )
              })}
              {/* Legacy aliases — old slugs redirect to the current canonical route */}
              {pageRoutes.flatMap(page => (page.aliases || []).map(alias => (
                <Route key={'alias-' + page.id + alias} path={alias} element={<Navigate to={page.route} replace />} />
              )))}
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </ViewProvider>
        </FontProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
