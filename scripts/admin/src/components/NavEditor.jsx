import { useState, useEffect } from 'react'

const ICONS = [
  'faHouse', 'faStar', 'faBook', 'faFire', 'faHandsPraying', 'faScroll', 'faMosque',
  'faUser', 'faCircleInfo', 'faCalendar', 'faPeopleGroup', 'faLightbulb', 'faClockRotateLeft',
  'faGear', 'faBars', 'faXmark', 'faHeart', 'faGlobe', 'faLeaf', 'faMoon', 'faSun',
]

const ICON_EMOJI = {
  faHouse: '🏠', faStar: '✨', faBook: '📖', faFire: '🔥', faHandsPraying: '🤲',
  faScroll: '📜', faMosque: '🕌', faUser: '👤', faCircleInfo: 'ⓘ', faCalendar: '📅',
  faPeopleGroup: '👥', faLightbulb: '💡', faClockRotateLeft: '🔄', faGear: '⚙️',
  faBars: '☰', faXmark: '✕', faHeart: '❤️', faGlobe: '🌐', faLeaf: '🍃', faMoon: '🌙', faSun: '☀️',
}

export default function NavEditor({ api, show }) {
  const [nav, setNav] = useState(null)
  const [dirty, setDirty] = useState(false)

  useEffect(() => { api.getNav().then(setNav) }, [])

  const save = async () => {
    await api.saveNav(nav)
    setDirty(false)
    show('Navigation saved!')
  }

  const moveItem = (group, from, to) => {
    if (to < 0 || to >= nav[group].length) return
    const d = { ...nav, [group]: [...nav[group]] }
    const [item] = d[group].splice(from, 1)
    d[group].splice(to, 0, item)
    setNav(d); setDirty(true)
  }

  const removeItem = (group, i) => {
    setNav({ ...nav, [group]: nav[group].filter((_, idx) => idx !== i) })
    setDirty(true)
  }

  const addItem = (group) => {
    setNav({ ...nav, [group]: [...nav[group], { to: '/new-page', icon: 'faStar', key: 'newPage' }] })
    setDirty(true)
  }

  const updateItem = (group, i, field, value) => {
    setNav({ ...nav, [group]: nav[group].map((item, idx) => idx === i ? { ...item, [field]: value } : item) })
    setDirty(true)
  }

  if (!nav) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Loading...</p>

  return (
    <div style={{ maxWidth: 800 }}>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
        Rearrange items using ↑↓ buttons. Edit fields inline. Changes are saved independently from page content.
      </p>

      {['bottomNav', 'sideDrawer'].map(group => (
        <div key={group} style={{ marginBottom: 28 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
            {group === 'bottomNav' ? 'Bottom Navigation' : 'Side Drawer'}
            <span className="tag" style={{ marginLeft: 8 }}>{nav[group].length} items</span>
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {nav[group].map((item, i) => (
              <div key={i} className="nav-row">
                <span className="tag" style={{ minWidth: 30, textAlign: 'center' }}>#{i + 1}</span>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{ICON_EMOJI[item.icon] || '🔄'}</span>
                <input value={item.to} onChange={e => updateItem(group, i, 'to', e.target.value)}
                  className="field-input" style={{ width: 130 }} placeholder="/path" />
                <input value={item.key} onChange={e => updateItem(group, i, 'key', e.target.value)}
                  className="field-input" style={{ width: 120 }} placeholder="key" />
                <select value={item.icon} onChange={e => updateItem(group, i, 'icon', e.target.value)}
                  className="field-select" style={{ width: 130, fontSize: 11 }}>
                  {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <button className="btn-icon" onClick={() => moveItem(group, i, i - 1)} disabled={i === 0}>↑</button>
                <button className="btn-icon" onClick={() => moveItem(group, i, i + 1)} disabled={i >= nav[group].length - 1}>↓</button>
                <button className="btn-icon danger" onClick={() => removeItem(group, i)}>✕</button>
              </div>
            ))}
          </div>
          <button className="btn-add" style={{ marginTop: 6 }} onClick={() => addItem(group)}>
            + Add to {group === 'bottomNav' ? 'bottom nav' : 'side drawer'}
          </button>
        </div>
      ))}

      <button className={'btn ' + (dirty ? 'btn-primary' : '')}
        style={dirty ? {} : { background: '#e5e7eb', color: '#9ca3af', cursor: 'default' }}
        onClick={save} disabled={!dirty}>
        {dirty ? '💾 Save Navigation' : '✓ Saved'}
      </button>
    </div>
  )
}
