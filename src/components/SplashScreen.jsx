import { useState, useEffect } from 'react'
import config from '../config/splash.json'

export default function SplashScreen({ onDone }) {
  const [fadeOut, setFadeOut] = useState(false)
  const [count, setCount] = useState(config.duration)

  useEffect(() => {
    const start = Date.now()

    // Countdown: duration → duration-1 → ... → 1
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      opacity: fadeOut ? 0 : 1,
      transition: `opacity ${config.fadeTransition}ms ease`,
    }}>
      <img
        src={config.image}
        alt="KQCMM"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'fill',
        }}
      />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        color: '#fff',
        padding: '10px 28px',
        borderRadius: 30,
        fontSize: 20,
        fontWeight: 600,
        letterSpacing: 1,
      }}>
        {config.message} {count > 0 ? count : ''}
        {count > 0 ? [...Array(count)].map((_, i) => '.').join('') : ''}
      </div>
    </div>
  )
}
