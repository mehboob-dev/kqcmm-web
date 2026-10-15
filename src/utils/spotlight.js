// Pointer spotlight — one document-level listener sets --spot-x/--spot-y on
// the card under the cursor so a soft accent light follows it (see the
// SPATIAL SHELL rules in styles.css). Desktop/hover devices only; no-op for
// touch-only devices and reduced-motion users.

const SELECTOR = '.card, .quick-link, .dash-continue, .dash-dua, .moon-card, .book-card-item'

export function initSpotlight() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}
  if (window.matchMedia('(hover: none)').matches) return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  let current = null
  let raf = 0
  let mx = 0
  let my = 0

  const apply = () => {
    raf = 0
    if (!current) return
    const r = current.getBoundingClientRect()
    current.style.setProperty('--spot-x', Math.round(mx - r.left) + 'px')
    current.style.setProperty('--spot-y', Math.round(my - r.top) + 'px')
  }

  const onMove = (e) => {
    const target = e.target instanceof Element ? e.target.closest(SELECTOR) : null
    current = target
    if (!target) return
    mx = e.clientX
    my = e.clientY
    if (!raf) raf = requestAnimationFrame(apply)
  }

  document.addEventListener('pointermove', onMove, { passive: true })
  return () => {
    document.removeEventListener('pointermove', onMove)
    if (raf) cancelAnimationFrame(raf)
  }
}
