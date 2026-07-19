import { useState, useEffect, useRef } from 'react'
import { useView } from '../context/ViewContext'

export default function ContentView({ items, renderItem, mode, pageKey, jumpTo }) {
  const { slideMode, getPageMode } = useView()
  const actualMode = mode || getPageMode(pageKey)
  const isSlide = actualMode === 'slide'
  const [currentIdx, setCurrentIdx] = useState(0)
  const [count, setCount] = useState(0)
  const listRef = useRef(null)

  // Handle external jumpTo signal
  useEffect(() => {
    if (jumpTo === undefined || jumpTo === null) return
    if (isSlide) {
      setCurrentIdx(jumpTo)
    } else {
      // In list mode, scroll the item into view
      const el = listRef.current?.querySelector(`[data-section-index="${jumpTo}"]`)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }
  }, [jumpTo, isSlide])

  const resetCount = () => setCount(0)
  const incCount = () => setCount(c => c + 1)
  const decCount = () => setCount(c => Math.max(0, c - 1))

  if (!items || items.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No content yet.</p>
  }

  const total = items.length
  const goTo = (idx) => setCurrentIdx(Math.max(0, Math.min(idx, total - 1)))
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < total - 1

  // Shared counter component
  const counterSection = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button onClick={decCount} style={circleBtn('var(--accent)', 34)}>−</button>
      <span style={{
        fontSize: 20, fontWeight: 800, color: 'var(--text-heading)',
        minWidth: 38, textAlign: 'center', fontVariantNumeric: 'tabular-nums',
      }}>{count}</span>
      <button onClick={incCount} style={circleBtn('var(--accent)', 34)}>+</button>
      <button onClick={resetCount} style={{
        ...circleBtn('var(--accent)', 28), fontSize: 12, borderRadius: 6,
      }}>↺</button>
    </div>
  )

  // LIST MODE
  if (!isSlide) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 66 }}>
          {items.map((item, i) => <div key={i} data-section-index={i}>{renderItem(item, i)}</div>)}
        </div>
        {/* Fixed counter bar */}
        <div style={{
          position: 'fixed', bottom: 'var(--bottom-nav-height, 56px)', left: '50%', transform: 'translateX(-50%)',
          width: '100%', maxWidth: 1200, zIndex: 2,
          background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
          padding: '10px 0', display: 'flex', justifyContent: 'center',
        }}>
          {counterSection}
        </div>
      </div>
    )
  }

  // SLIDE MODE — combined nav + counter in ONE bar
  const current = items[currentIdx]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      {/* padding for fixed bar */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0,
        animation: 'fadeSlideIn 0.25s ease', paddingBottom: 66 }}>
        {renderItem(current, currentIdx)}
      </div>
      {/* One fixed bar: nav left, counter right */}
      <div style={{
        position: 'fixed', bottom: 'var(--bottom-nav-height, 56px)', left: '50%', transform: 'translateX(-50%)',
        width: '100%', maxWidth: 1200, zIndex: 2,
        background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
        boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px',
      }}>
        {/* Slide nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => goTo(0)} disabled={!hasPrev} style={navBtn(!hasPrev)}>⏮</button>
          <button onClick={() => goTo(currentIdx - 1)} disabled={!hasPrev} style={navBtn(!hasPrev)}>◀</button>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, minWidth: 50, textAlign: 'center' }}>
            {currentIdx + 1}/{total}
          </span>
          <button onClick={() => goTo(currentIdx + 1)} disabled={!hasNext} style={navBtn(!hasNext)}>▶</button>
          <button onClick={() => goTo(total - 1)} disabled={!hasNext} style={navBtn(!hasNext)}>⏭</button>
        </div>
        {/* Counter */}
        {counterSection}
      </div>
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
