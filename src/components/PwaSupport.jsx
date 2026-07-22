import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaSupport() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [readyOffline, setReadyOffline] = useState(false)

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {
      if (!sessionStorage.getItem('kqcmm_offline_ready')) {
        setReadyOffline(true)
        sessionStorage.setItem('kqcmm_offline_ready', '1')
        setTimeout(() => setReadyOffline(false), 4000)
      }
    },
    onRegisterError() {
      // SW registration failed — app works normally online
    },
  })

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRefresh = () => {
    updateServiceWorker(true)
    setNeedRefresh(false)
  }

  const toastStyle = {
    position: 'fixed',
    bottom: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 9999,
    padding: '12px 20px',
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    maxWidth: 'calc(100% - 40px)',
    animation: 'fadeSlideIn 0.3s ease',
  }

  return (
    <>
      {/* Update available */}
      {needRefresh && (
        <div style={{ ...toastStyle, background: 'var(--accent)', color: '#fff' }}>
          <span>🔄 New version available</span>
          <button
            onClick={handleRefresh}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 13,
              whiteSpace: 'nowrap',
            }}
          >
            Refresh
          </button>
          <button
            onClick={() => setNeedRefresh(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 16,
              padding: 0,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Ready for offline */}
      {readyOffline && (
        <div style={{ ...toastStyle, background: '#2e7d32', color: '#fff' }}>
          ✅ App ready for offline use
        </div>
      )}

      {/* Offline banner — pushes content down */}
      {offline && (
        <div style={{
          background: '#b71c1c',
          color: '#fff',
          textAlign: 'center',
          padding: '6px 12px',
          fontSize: 13,
          fontWeight: 600,
          animation: 'fadeSlideIn 0.3s ease',
        }}>
          📡 You're offline — showing cached content
        </div>
      )}
    </>
  )
}
