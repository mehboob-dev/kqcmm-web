import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
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
import NotFound from './pages/NotFound'

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
              <Route path="/" element={<Home />} />
              <Route path="/dua" element={<Dua />} />
              <Route path="/hmk" element={<Hmk />} />
              <Route path="/sijrah-nama" element={<SijrahNama />} />
              <Route path="/fateha-khwani" element={<FatehaKhwani />} />
              <Route path="/khatm" element={<Khatm />} />
              <Route path="/salim-pappa" element={<SalimPappa />} />
              <Route path="/about" element={<About />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/roshni" element={<Roshni />} />
              <Route path="/abbajaan" element={<Abbajaan />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          </ViewProvider>
        </FontProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
