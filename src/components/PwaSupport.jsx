import { useState, useEffect, useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { trackInstall } from '../utils/analytics'

// Rendered once at the top of the app (above the splash gate in App.jsx) so
// the service-worker registration — and therefore the update check — starts
// as soon as the site opens. `ready` is false while the splash shows; the
// toasts are gated on it so they never cover the splash art. A real update
// still auto-reloads and its "updated" toast shows once the app is ready.
export default function PwaSupport({ ready = false }) {
  const [offline, setOffline] = useState(!navigator.onLine)
  const [updated, setUpdated] = useState(false)
  const updatedOnce = useRef(false)

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

  // Show "✅ Updated" toast briefly after an auto-update reload — and only
  // after a real update, never on a plain mount. `needRefresh` starts false,
  // so without the flag the effect fired on every app open.
  useEffect(() => {
    if (updatedOnce.current) return
    if (ready && !needRefresh) {
      updatedOnce.current = true
      setUpdated(true)
      setTimeout(() => setUpdated(false), 500)
    }
  }, [needRefresh, ready])

  useEffect(() => {
    const handleOnline = () => setOffline(false)
    const handleOffline = () => setOffline(true)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    const handleAppInstalled = () => trackInstall()
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('appinstalled', handleAppInstalled)
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

  if (!ready) return null

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
