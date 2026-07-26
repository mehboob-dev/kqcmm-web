import { useEffect, useRef } from 'react'

export default function Modal({ title, children, onClose, actions, danger = false }) {
  const dialogRef = useRef(null)
  const previousFocus = useRef(document.activeElement)

  useEffect(() => {
    const dialog = dialogRef.current
    const first = dialog?.querySelector('input, select, textarea, button')
    first?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !dialog) return
      const focusable = [...dialog.querySelectorAll('input, select, textarea, button:not(:disabled)')]
      if (!focusable.length) return
      const firstItem = focusable[0]
      const lastItem = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === firstItem) {
        event.preventDefault(); lastItem.focus()
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault(); firstItem.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocus.current?.focus?.()
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={event => { if (event.target === event.currentTarget) onClose() }}>
      <section className={'modal' + (danger ? ' modal-danger' : '')} ref={dialogRef}
        role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close dialog">✕</button>
        </header>
        <div className="modal-body">{children}</div>
        {actions && <footer className="modal-actions">{actions}</footer>}
      </section>
    </div>
  )
}
