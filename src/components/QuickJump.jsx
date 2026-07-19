import { useState } from 'react'

export default function QuickJump({ items, onJump }) {
  const [open, setOpen] = useState(false)

  if (!items || items.length === 0) return null

  const handleSelect = (idx) => {
    onJump(idx)
    setOpen(false)
  }

  return (
    <>
      {/* FAB — floating book icon */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 'calc(var(--bottom-nav-height, 56px) + 56px)',
          right: 16,
          width: 44, height: 44,
          borderRadius: '50%',
          background: 'var(--accent)',
          color: '#fff',
          border: 'none',
          fontSize: 18,
          cursor: 'pointer',
          zIndex: 10,
          boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-label="Quick jump"
      >
        📖
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 99,
          }}
        />
      )}

      {/* Bottom sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%', transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(100%)',
        width: '100%', maxWidth: 1200,
        zIndex: 100,
        background: 'var(--bg-card)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
        maxHeight: '60vh',
        overflowY: 'auto',
        transition: 'transform 0.25s ease',
        paddingBottom: 'calc(var(--bottom-nav-height, 46px) + 8px)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 20px 8px',
          borderBottom: '1px solid var(--border)',
          position: 'sticky', top: 0,
          background: 'var(--bg-card)',
          zIndex: 1,
        }}>
          <span style={{
            fontSize: 16, fontWeight: 700, color: 'var(--text-heading)',
          }}>Quick Jump</span>
          <button
            onClick={() => setOpen(false)}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer',
              padding: 4, lineHeight: 1,
            }}
            aria-label="Close"
          >✕</button>
        </div>

        {/* Items */}
        <div style={{ padding: '4px 0' }}>
          {items.map((item, i) => (
            <button
              key={i}
              onClick={() => handleSelect(item.sectionIndex)}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '12px 20px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text)',
                fontSize: 15,
                borderBottom: '1px solid var(--border)',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
