import { useState, useEffect, useRef } from 'react'
import { trackCounter, trackSlideView } from '../utils/analytics'
import { useView } from '../context/ViewContext'

export default function ContentView({ items, renderItem, mode, pageKey, jumpTo, onIndexChange, showCounter = true }) {
  const { slideMode, getPageMode } = useView()
  const actualMode = mode || getPageMode(pageKey)
  const isSlide = actualMode === 'slide'
  const [currentIdx, setCurrentIdx] = useState(0)
  const [count, setCount] = useState(0)
  const listRef = useRef(null)
  const slideRef = useRef(null)
  const touchStart = useRef(null)   // { x, y }
  const touchMoved = useRef(false)  // did the finger actually drag?

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

  const resetCount = () => { setCount(0); trackCounter('reset', 0) }
  const incCount = () => { setCount(c => c + 1); trackCounter('inc', count + 1) }
  const decCount = () => { setCount(c => Math.max(0, c - 1)); trackCounter('dec', Math.max(0, count - 1)) }

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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} data-tour="counter">
      <button data-tour="counter-dec" onClick={decCount} style={circleBtn('var(--accent)', 34)} aria-label="Decrease count">−</button>
      <span data-tour="counter-value" style={{
        fontSize: 20, fontWeight: 800, color: 'var(--text-heading)',
        minWidth: 38, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
      }}>{count}</span>
      <button data-tour="counter-inc" onClick={incCount} style={circleBtn('var(--accent)', 34)} aria-label="Increase count">+</button>
      <button data-tour="counter-reset" onClick={resetCount} style={{
        ...circleBtn('var(--accent)', 28), fontSize: 12, borderRadius: 6,
      }} aria-label="Reset count">↺</button>
    </div>
  )

  // LIST MODE
  if (!isSlide) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 66 }}>
          {items.map((item, i) => <div key={i} data-section-index={i}>{renderItem(item, i)}</div>)}
        </div>
        {showCounter && (
          <div style={{
            position: 'fixed', bottom: 'var(--bottom-nav-height, 56px)', left: 0, right: 0,
            display: 'flex', justifyContent: 'center', zIndex: 2,
            pointerEvents: 'none',
          }}>
            <div style={{
              width: '100%', maxWidth: 1200,
              background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
              padding: '10px 0', display: 'flex', justifyContent: 'center',
              boxSizing: 'border-box',
              pointerEvents: 'auto',
            }}>
              {counterSection}
            </div>
          </div>
        )}
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
      <div style={{
        position: 'fixed', bottom: 'var(--bottom-nav-height, 56px)', left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 2,
        pointerEvents: 'none',
      }}>
        <div style={{
          width: '100%', maxWidth: 1200,
          background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
          boxSizing: 'border-box',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px',
          pointerEvents: 'auto',
        }}>
        {/* Slide nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} data-tour="slide-nav">
          <button data-tour="slide-first" onClick={() => goTo(0)} disabled={!hasPrev} style={navBtn(!hasPrev)} aria-label="First">⏮</button>
          <button data-tour="slide-prev" onClick={() => goTo(currentIdx - 1)} disabled={!hasPrev} style={navBtn(!hasPrev)} aria-label="Previous">◀</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, minWidth: 50, textAlign: 'center' }}>
            {currentIdx + 1}/{total}
          </span>
          <button data-tour="slide-next" onClick={() => goTo(currentIdx + 1)} disabled={!hasNext} style={navBtn(!hasNext)} aria-label="Next">▶</button>
          <button data-tour="slide-last" onClick={() => goTo(total - 1)} disabled={!hasNext} style={navBtn(!hasNext)} aria-label="Last">⏭</button>
        </div>
        {/* Counter */}
        {showCounter ? counterSection : null}
        </div>{/* inner */}
      </div>{/* outer */}
    </div>
  )
}

function circleBtn(bg, size) {
  return {
    background: bg, border: 'none', color: '#fff',
    width: size, height: size, borderRadius: '50%', cursor: 'pointer',
    fontSize: 16, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
}

function navBtn(disabled) {
  return {
    background: disabled ? 'var(--bg-card-alt)' : 'var(--accent)',
    border: 'none', color: disabled ? 'var(--text-muted)' : '#fff',
    width: 32, height: 32, borderRadius: 6, cursor: disabled ? 'default' : 'pointer',
    fontSize: 13, opacity: disabled ? 0.4 : 1,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
}
