// Scroll reveals — elements below the fold get a hidden .rv state and rise
// into view (.rv-in) when they intersect the viewport. Elements already in
// view at scan time are left untouched: they must stay visible during View
// Transition snapshots and above-fold entry is handled by the route
// transition itself. Slide-mode cards are skipped — the slide stage already
// animates them directionally.

const SELECTOR = ':is(.card, .page-hero, .dash-date, .dash-continue, .dash-dua, .moon-card, .book-card-item)'

export function initReveals(getRoot) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return () => {}
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => {}

  const seen = new WeakSet()
  let timer = 0

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('rv-in')
      io.unobserve(entry.target)
    })
  }, { rootMargin: '0px 0px 8% 0px', threshold: 0.01 })

  const scan = () => {
    const root = getRoot()
    if (!root) return
    root.querySelectorAll(SELECTOR).forEach((el) => {
      if (seen.has(el)) return
      seen.add(el)
      if (el.closest('.slide-stage')) return
      const rect = el.getBoundingClientRect()
      if (rect.height < 28) return
      if (rect.top <= window.innerHeight * 0.85) return
      el.classList.add('rv')
      io.observe(el)
    })
  }

  scan()

  const mo = new MutationObserver(() => {
    clearTimeout(timer)
    timer = setTimeout(scan, 60)
  })
  const startObserving = () => {
    const root = getRoot()
    if (root) mo.observe(root, { childList: true, subtree: true })
  }
  startObserving()

  return () => {
    clearTimeout(timer)
    mo.disconnect()
    io.disconnect()
  }
}
