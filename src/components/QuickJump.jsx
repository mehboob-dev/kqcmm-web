import { useState } from 'react'
import { trackQuickJumpOpen, trackQuickJumpSelect } from '../utils/analytics'
import { hapticTap } from '../utils/haptics'
import Icon from './FontAwesome'

// QuickJump is language-independent: `indices` is a shared list of selection
// indices (same across all languages). Labels are derived from the source
// items (e.g. sections/duas) so each language automatically shows its own
// title/heading without storing duplicate labels in the content JSON.
export default function QuickJump({ indices, sourceItems, labelKey, onJump, page }) {
  const [open, setOpen] = useState(false)

  const items = (indices || [])
    .map(idx => ({
      idx,
      label: (sourceItems && sourceItems[idx] && sourceItems[idx][labelKey]) || `#${idx + 1}`,
    }))
    .filter(item => item.idx >= 0)

  if (!items || items.length === 0) return null

  const handleSelect = (idx) => {
    hapticTap(12)
    onJump(idx)
    trackQuickJumpSelect(page, idx)
    setOpen(false)
  }

  return (
    <>
      {/* FAB — floating book icon */}
      <button
        className="qj-fab"
        onClick={() => { hapticTap(10); trackQuickJumpOpen(page); setOpen(true) }}
        aria-label="Quick jump"
      >
        <Icon name="faBookOpen" />
      </button>

      {/* Backdrop */}
      {open && (
        <div className="qj-backdrop" onClick={() => setOpen(false)} />
      )}

      {/* Bottom sheet */}
      <div className={`qj-sheet${open ? '' : ' closed'}`}>
        <span className="qj-handle" aria-hidden="true" />
        <div className="qj-head">
          <span className="qj-title">
            Quick Jump
            <span className="qj-count">{items.length}</span>
          </span>
          <button
            onClick={() => setOpen(false)}
            className="qj-close"
            aria-label="Close"
          >✕</button>
        </div>

        {/* Items */}
        <div className="qj-list">
          {items.map((item) => (
            <button
              key={item.idx}
              onClick={() => handleSelect(item.idx)}
              className="qj-item"
            >
              <span className="qj-item-num">{item.idx + 1}</span>
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
