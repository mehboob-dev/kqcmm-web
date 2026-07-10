import { useState } from 'react'
import { useView } from '../context/ViewContext'

export default function ContentView({ items, renderItem, mode, pageKey }) {
  const { slideMode, getPageMode } = useView()
  const actualMode = mode || getPageMode(pageKey)
  const isSlide = actualMode === 'slide'
  const [currentIdx, setCurrentIdx] = useState(0)

  if (!items || items.length === 0) {
    return <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>No content yet.</p>
  }

  // LIST MODE
  if (!isSlide) {
    return <>{items.map((item, i) => renderItem(item, i))}</>
  }

  // SLIDE MODE
  const current = items[currentIdx]
  const total = items.length
  const hasPrev = currentIdx > 0
  const hasNext = currentIdx < total - 1

  const goTo = (idx) => {
    setCurrentIdx(Math.max(0, Math.min(idx, total - 1)))
  }

  const navBtnStyle = (disabled) => ({
    background: disabled ? 'var(--bg-card-alt)' : 'var(--accent)',
    border: 'none',
    color: disabled ? 'var(--text-muted)' : '#fff',
    width: 36,
    height: 36,
    borderRadius: 8,
    cursor: disabled ? 'default' : 'pointer',
    fontSize: 15,
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, minHeight: 0 }}>
      {/* Scrollable card area — fills available space */}
      <div key={currentIdx} style={{
        flex: 1,
        overflowY: 'auto',
        minHeight: 0,
        animation: 'fadeSlideIn 0.25s ease',
        paddingBottom: 56,
      }}>
        {renderItem(current, currentIdx)}
      </div>

      {/* Fixed nav bar — pinned to bottom of viewport */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: '12px 0 4px',
        flexShrink: 0,
        background: 'var(--bg)',
        position: 'fixed',
        bottom: 56,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: '100%',
        maxWidth: 'inherit',
        borderTop: '1px solid var(--border)',
        boxSizing: 'border-box',
      }}>
        <button onClick={() => goTo(0)} disabled={!hasPrev} style={navBtnStyle(!hasPrev)}>⏮</button>
        <button onClick={() => goTo(currentIdx - 1)} disabled={!hasPrev} style={navBtnStyle(!hasPrev)}>◀</button>
        <span style={{
          fontSize: 14, color: 'var(--text-muted)', minWidth: 70,
          textAlign: 'center', fontWeight: 600,
        }}>
          {currentIdx + 1} / {total}
        </span>
        <button onClick={() => goTo(currentIdx + 1)} disabled={!hasNext} style={navBtnStyle(!hasNext)}>▶</button>
        <button onClick={() => goTo(total - 1)} disabled={!hasNext} style={navBtnStyle(!hasNext)}>⏭</button>
      </div>
    </div>
  )
}
