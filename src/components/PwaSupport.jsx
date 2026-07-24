import { useState, useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

export default function PwaSupport() {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [updated, setUpdated] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered() {},
    onRegisterError() {},
    onNeedRefresh() {
      updateServiceWorker(true)
    },
  })

  // Show "✅ Updated" toast briefly after auto-refresh
  useEffect(() => {
    if (!needRefresh) {
      setUpdated(true)
      setTimeout(() => setUpdated(false), 500)
    }
  }, [needRefresh])

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
      {/* Updated toast — shows briefly after auto-update */}
      {updated && (
        <div style={{ ...toastStyle, background: '#2e7d32', color: '#fff' }}>
          ✅ App updated to latest version
        </div>
      )}

      {/* Offline banner — overlay on top */}
      {offline && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0,
          zIndex: 9999,
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
