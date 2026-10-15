import { useState, useEffect, useRef } from 'react'
import { trackCounter, trackSlideView } from '../utils/analytics'
import { useView } from '../context/ViewContext'
import { hapticTap } from '../utils/haptics'
import Icon from './FontAwesome'

export default function ContentView({ items, renderItem, mode, pageKey, jumpTo, onIndexChange, showCounter = true }) {
  const { slideMode, getPageMode } = useView()
  const actualMode = mode || getPageMode(pageKey)
  const isSlide = actualMode === 'slide'
  const [currentIdx, setCurrentIdx] = useState(0)
  const [count, setCount] = useState(0)
  const [zen, setZen] = useState(false)
  const listRef = useRef(null)
  const slideRef = useRef(null)
  const touchStart = useRef(null)   // { x, y }
  const touchMoved = useRef(false)  // did the finger actually drag?

  // Focus ("zen") reading mode: hides the top chrome, bottom dock and quick-jump
  // FAB via a body class so the page becomes pure content. Exits on unmount
  // (route change) so a new page always starts in the normal shell.
  useEffect(() => {
    document.body.classList.toggle('zen', zen)
    return () => document.body.classList.remove('zen')
  }, [zen])

  // Report the active item index when it changes (used by e.g. book progress
  // tracking). In slide mode this is the current slide; in list mode it's the
  // section crossing the viewport band.
  useEffect(() => {
    if (isSlide) return
    const els = listRef.current?.querySelectorAll('[data-section-index]')
    if (!els || els.length === 0) return
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const i = Number(entry.target.getAttribute('data-section-index'))
          if (Number.isInteger(i)) onIndexChange?.(i)
        }
      })
    }, { rootMargin: '-40% 0px -55% 0px' })
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [items, isSlide, onIndexChange])

  // Handle external jumpTo signal
  useEffect(() => {
    if (jumpTo === undefined || jumpTo === null) return
    if (isSlide) {
      setCurrentIdx(jumpTo)
      onIndexChange?.(jumpTo)
    } else {
      const el = listRef.current?.querySelector(`[data-section-index="${jumpTo}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [jumpTo, isSlide, onIndexChange])

  // Swipe handlers for slide mode — improved sensitivity: requires a real
  // horizontal drag that exceeds vertical movement (to avoid accidental triggers
  // while scrolling) and raises the threshold so taps never navigate.
  const handleTouchStart = (e) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
    touchMoved.current = false
  }

  const handleTouchMove = (e) => {
    if (!touchStart.current) return
    const t = e.touches[0]
    const dx = Math.abs(t.clientX - touchStart.current.x)
    const dy = Math.abs(t.clientY - touchStart.current.y)
    // Only mark as "moved" when horizontal drag clearly exceeds vertical scroll
    if (dx > 10 && dx > dy * 1.5) {
      touchMoved.current = true
    }
  }

  const handleTouchEnd = (e) => {
    if (!touchStart.current) return
    if (!touchMoved.current) {
      // Tap / vertical scroll — don't navigate
      touchStart.current = null
      return
    }
    const diff = e.changedTouches[0].clientX - touchStart.current.x
    const threshold = 80
    if (Math.abs(diff) > threshold) {
      if (diff < 0 && hasNext) setCurrentIdx(i => i + 1)
      else if (diff > 0 && hasPrev) setCurrentIdx(i => i - 1)
    }
    touchStart.current = null
    touchMoved.current = false
  }

  const resetCount = () => {
    setCount(0)
    trackCounter('reset', 0)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25) } catch (e) { /* ignore */ }
    }
  }
  const incCount = () => {
    setCount(c => c + 1)
    trackCounter('inc', count + 1)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(15) } catch (e) { /* ignore */ }
    }
  }
  const decCount = () => {
    setCount(c => Math.max(0, c - 1))
    trackCounter('dec', Math.max(0, count - 1))
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(15) } catch (e) { /* ignore */ }
    }
  }

  if (!items || items.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No content yet.</p>
  }

  const total = items.length
  const goTo = (idx) => {
    const target = Math.max(0, Math.min(idx, total - 1))
    if (target !== currentIdx) trackSlideView(pageKey, target)
    setCurrentIdx(target)
    onIndexChange?.(target)
  }
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < total - 1

  // Shared counter component
  const counterSection = (
    <div className="counter-group" data-tour="counter">
      <button data-tour="counter-dec" onClick={decCount} className="cnt-btn" aria-label="Decrease count">−</button>
      <span data-tour="counter-value" className="cnt-value">{count}</span>
      <button data-tour="counter-inc" onClick={incCount} className="cnt-btn" aria-label="Increase count">+</button>
      <button data-tour="counter-reset" onClick={resetCount} className="cnt-btn cnt-reset" aria-label="Reset count">↺</button>
    </div>
  )

  // Focus-mode toggle — dims the shell chrome for distraction-free reading
  // (also rendered when the counter is hidden, e.g. books).
  const zenButton = (
    <button
      className="zen-btn"
      onClick={() => { hapticTap(10); setZen(z => !z) }}
      aria-pressed={zen}
      aria-label={zen ? 'Exit focus mode' : 'Focus mode'}
      title={zen ? 'Exit focus mode' : 'Focus mode'}
    >
      <Icon name={zen ? 'faCompress' : 'faExpand'} />
    </button>
  )

  // LIST MODE
  if (!isSlide) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 66 }}>
          {items.map((item, i) => <div key={i} data-section-index={i}>{renderItem(item, i)}</div>)}
        </div>
        <div className="reading-bar">
          <div className="reading-bar-inner">
            {showCounter && counterSection}
            {zenButton}
          </div>
        </div>
      </div>
    )
  }

  // SLIDE MODE — combined nav + counter in ONE bar
  const current = items[currentIdx]

  return (
    <div
      ref={slideRef}
      style={{
        display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0,
        touchAction: 'pan-y',              // ← let the browser scroll vertically, we handle horizontal
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* padding for fixed bar */}
      <div style={{
        flex: 1, overflowY: 'auto', minHeight: 0,
        animation: 'fadeSlideIn 0.25s ease', paddingBottom: 66,
      }}>
        {renderItem(current, currentIdx)}
      </div>
      {/* One fixed bar: nav left, counter right */}
      <div className="reading-bar">
        <div className="reading-bar-inner is-split">
        {/* Slide nav */}
        <div className="slide-group" data-tour="slide-nav">
          <button data-tour="slide-first" onClick={() => goTo(0)} disabled={!hasPrev} className="slide-btn" aria-label="First">⏮</button>
          <button data-tour="slide-prev" onClick={() => goTo(currentIdx - 1)} disabled={!hasPrev} className="slide-btn" aria-label="Previous">◀</button>
          <span className="slide-pos">
            {currentIdx + 1}/{total}
          </span>
          <button data-tour="slide-next" onClick={() => goTo(currentIdx + 1)} disabled={!hasNext} className="slide-btn" aria-label="Next">▶</button>
          <button data-tour="slide-last" onClick={() => goTo(total - 1)} disabled={!hasNext} className="slide-btn" aria-label="Last">⏭</button>
        </div>
        {/* Counter */}
        {showCounter ? counterSection : null}
        {zenButton}
        </div>{/* inner */}
      </div>{/* outer */}
    </div>
  )
}
