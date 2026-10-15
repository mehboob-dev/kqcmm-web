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
  const pct = config.duration > 0 ? count / config.duration : 1

  return (
    <div
      onClick={skip}
      className="splash"
      style={{
        opacity: fadeOut ? 0 : 1,
        transition: `opacity ${config.fadeTransition}ms ease`,
      }}
    >
      {/* Living backdrop — shows through while the full image loads */}
      <div className="splash-aurora" aria-hidden="true" />
      <div className="splash-stars" aria-hidden="true" />

      {/* Full-bleed splash image — never cropped */}
      <img
        src={base + config.image.replace(/^\//, '')}
        alt="KQCMM"
        className="splash-img"
      />
      <div className="splash-shade" />

      <div className="splash-count" style={{ '--splash-pct': pct }}>
        <span className="splash-count-text">{config.message}</span>
        {count > 0 && (
          <span className="splash-count-num">
            <span className="splash-count-n">{count}</span>
          </span>
        )}
      </div>
    </div>
  )
}
