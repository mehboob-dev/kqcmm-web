import { useState, useEffect, useCallback } from 'react'
import { trackSplashSkip } from '../utils/analytics'
import config from '../config/splash.json'

export default function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false)
  const [count, setCount] = useState(config.duration)

  const skip = useCallback(() => {
    trackSplashSkip()
    setFadeOut(true)
    setTimeout(() => onDone(), config.fadeTransition || 400)
  }, [onDone])

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const elapsed = Math.round((Date.now() - start) / 1000)
      const remaining = Math.max(config.duration - elapsed, 0)
      setCount(remaining)
      if (remaining <= 0) clearInterval(interval)
    }, 200)

    const totalMs = config.duration * 1000
    const fadeTimer = setTimeout(() => setFadeOut(true), totalMs - config.fadeTransition)
    const removeTimer = setTimeout(() => onDone(), totalMs)

    return () => { clearTimeout(fadeTimer); clearTimeout(removeTimer); clearInterval(interval) }
  }, [])

  if (!config.enabled) {
    onDone()
    return null
  }

  const base = import.meta.env.BASE_URL || './'

  return (
    <div
      onClick={skip}
      className="splash"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: `opacity ${config.fadeTransition}ms ease`,
      }}
    >
      <img
        src={base + config.image.replace(/^\//, '')}
        alt="KQCMM"
        className="splash-img"
      />
      <div className="splash-shade" />
      <div className="splash-count">
        {config.message} {count > 0 ? count : ''}
        {count > 0 ? [...Array(count)].map((_, i) => '.').join('') : ''}
      </div>
    </div>
  )
}
