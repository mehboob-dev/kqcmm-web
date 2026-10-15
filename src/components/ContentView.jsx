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
  const [dir, setDir] = useState(1)   // slide direction: 1 = forward, -1 = back
  const listRef = useRef(null)
  const slideRef = useRef(null)
  const wrapRef = useRef(null)
  const drag = useRef(null)          // live touch gesture { x, y, active, startedAt }
  const settleTimer = useRef(null)   // pending navigation / spring-back timer

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

  // Swipe gestures for slide mode (7.1.0) — the slide now FOLLOWS the finger
  // as it drags (with rubber-band resistance at the ends), then either springs
  // back or completes the navigation based on distance or flick velocity.
  const stageEl = () => wrapRef.current?.querySelector('.slide-stage')

  const cancelSettle = () => {
    if (settleTimer.current) {
      clearTimeout(settleTimer.current)
      settleTimer.current = null
    }
  }

  const handleTouchStart = (e) => {
    cancelSettle()
    const t = e.touches[0]
    drag.current = { x: t.clientX, y: t.clientY, active: false, startedAt: Date.now() }
  }

  const handleTouchMove = (e) => {
    const d = drag.current
    if (!d) return
    const t = e.touches[0]
    const dx = t.clientX - d.x
    const dy = t.clientY - d.y
    if (!d.active) {
      // Arm the drag only once horizontal movement clearly beats vertical
      // scrolling — taps and list scrolling never translate the slide.
      if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        d.active = true
        const stage = stageEl()
        if (stage) {
          stage.style.animation = 'none'
          stage.style.willChange = 'transform'
        }
      } else {
        return
      }
    }
    const atEdge = (dx < 0 && !hasNext) || (dx > 0 && !hasPrev)
    const shift = atEdge ? dx * 0.35 : dx
    const stage = stageEl()
    if (stage) {
      stage.style.transition = 'none'
      stage.style.transform = `translateX(${shift}px)`
      stage.style.opacity = String(Math.max(0.35, 1 - Math.abs(shift) / 900))
    }
  }

  const handleTouchEnd = (e) => {
    const d = drag.current
    drag.current = null
    if (!d || !d.active) return   // tap or vertical scroll — never navigate
    const dx = e.changedTouches[0].clientX - d.x
    const dt = Math.max(1, Date.now() - d.startedAt)
    const velocity = Math.abs(dx) / dt          // px per ms
    const forward = dx < 0
    const canNav = forward ? hasNext : hasPrev
    const commit = (Math.abs(dx) > 72 || velocity > 0.55) && canNav
    const stage = stageEl()
    if (commit) {
      const target = forward ? currentIdx + 1 : currentIdx - 1
      if (stage) {
        stage.style.transition = 'transform 0.16s ease-in, opacity 0.16s ease-in'
        stage.style.transform = `translateX(${forward ? -26 : 26}%)`
        stage.style.opacity = '0'
      }
      settleTimer.current = setTimeout(() => {
        settleTimer.current = null
        goTo(target)
      }, 130)
    } else if (stage) {
      stage.style.transition = 'transform 0.45s var(--ease-spring), opacity 0.3s ease'
      stage.style.transform = ''
      stage.style.opacity = ''
      settleTimer.current = setTimeout(() => {
        settleTimer.current = null
        const s = stageEl()
        if (s) s.style.willChange = ''
      }, 480)
    }
  }

  useEffect(() => () => cancelSettle(), [])

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
    if (target !== currentIdx) {
      trackSlideView(pageKey, target)
      setDir(target > currentIdx ? 1 : -1)
    }
    setCurrentIdx(target)
    onIndexChange?.(target)
  }
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < total - 1

  // Shared counter component
  const counterSection = (
    <div className="counter-group" data-tour="counter">
      <button data-tour="counter-dec" onClick={decCount} className="cnt-btn" aria-label="Decrease count">−</button>
      <span data-tour="counter-value" className="cnt-value">
        <span key={count} className="cnt-digit">{count}</span>
        {count > 0 && <span key={'p' + count} className="cnt-pulse" aria-hidden="true" />}
      </span>
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
        <div ref={listRef} className="cv-list" style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 66 }}>
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
      onTouchCancel={handleTouchEnd}
    >
      {/* padding for fixed bar */}
      <div ref={wrapRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 66 }}>
        <div
          key={currentIdx}
          className={`slide-stage ${dir > 0 ? 'from-right' : 'from-left'}`}
        >
          {renderItem(current, currentIdx)}
        </div>
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
