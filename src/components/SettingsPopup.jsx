import { useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useFont } from '../context/FontContext'
import { useView } from '../context/ViewContext'

function OptionRow({ label, options, value, onChange }) {
  const isSwatch = options.some(opt => opt.swatch)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => {
          const selected = value === (opt.id || opt.code)
          if (isSwatch) {
            return (
              <button
                key={opt.id || opt.code}
                onClick={() => onChange(opt.id || opt.code)}
                title={opt.label}
                aria-label={`${opt.label} theme`}
                aria-pressed={selected}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  padding: 4,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <span
                  role="img"
                  aria-hidden="true"
                  style={{
                    width: 34, height: 34, borderRadius: '50%',
                    border: selected ? '2px solid var(--text)' : '1px solid var(--border)',
                    outline: selected ? '2px solid var(--bg-card)' : 'none',
                    outlineOffset: -5,
                    boxShadow: selected
                      ? '0 0 0 3px var(--accent)'
                      : 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                    background: opt.swatch.bg,
                    position: 'relative',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%', top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 14, height: 14, borderRadius: '50%',
                      background: opt.swatch.accent,
                    }}
                  />
                </span>
                <span style={{ fontSize: '0.72em', fontWeight: selected ? 700 : 400, color: selected ? 'var(--text-heading)' : 'var(--text-muted)' }}>
                  {opt.label}
                </span>
              </button>
            )
          }
          return (
            <button
              key={opt.id || opt.code}
              onClick={() => onChange(opt.id || opt.code)}
              style={{
                padding: '6px 14px',
                borderRadius: 8,
                border: selected ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: selected ? 'var(--accent-bg)' : 'transparent',
                color: 'var(--text)',
                fontSize: '0.9em',
                cursor: 'pointer',
                fontFamily: opt.family || 'inherit',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SettingsPopup({ strings, onClose, onReplayTour }) {
  const { lang, changeLang, languages } = useLanguage()
  const { theme, changeTheme, themes } = useTheme()
  const { fontFamily, fontSize, changeFontFamily, changeFontSize, fontFamilies, fontSizes } = useFont()
  const { slideMode, toggleSlideMode } = useView()

  useEffect(() => {
    document.body.classList.add('settings-open')
    return () => {
      document.body.classList.remove('settings-open')
    }
  }, [])

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 300,
          background: 'rgba(0,0,0,0.5)',
        }}
      />
      {/* popup */}
      <div className="settings-modal-card">
        {/* fixed header row */}
        <div className="settings-modal-header">
          <h3 className="settings-modal-title">{strings.settings.title}</h3>
          <button className="settings-modal-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        {/* scrollable body */}
        <div style={{ padding: '16px 20px 24px', overflowY: 'auto' }}>

        {/* Replay walkthrough */}
        {onReplayTour && (
          <button
            onClick={onReplayTour}
            style={{
              width: '100%', marginBottom: 14, padding: '10px 14px', borderRadius: 10,
              cursor: 'pointer', fontSize: '0.9em', fontFamily: 'inherit', fontWeight: 600,
              background: 'var(--accent-bg)', color: 'var(--accent)',
              border: '1px solid var(--accent)', transition: 'all 0.15s ease',
            }}
          >{strings.onboarding?.replay || 'Replay walkthrough'}</button>
        )}

        {/* Language */}
        <div className="settings-section-card">
          <div className="settings-section-label">{strings.settings.language}</div>
          <OptionRow label="" options={languages} value={lang} onChange={changeLang} />
        </div>

        {/* Theme */}
        <div className="settings-section-card">
          <div className="settings-section-label">{strings.settings.theme}</div>
          <OptionRow label="" options={themes} value={theme} onChange={changeTheme} />
        </div>

        {/* Font Family */}
        <div className="settings-section-card">
          <div className="settings-section-label">{strings.settings.fontFamily}</div>
          <OptionRow label="" options={fontFamilies} value={fontFamily} onChange={changeFontFamily} />
        </div>

        {/* Font Size */}
        <div className="settings-section-card">
          <div className="settings-section-label">{strings.settings.fontSize}</div>
          <OptionRow label="" options={fontSizes} value={fontSize} onChange={changeFontSize} />
        </div>

        {/* View Mode */}
        <div className="settings-section-card" style={{ marginBottom: 0 }}>
          <div className="settings-section-label">View Mode</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { if (slideMode) toggleSlideMode() }}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9em', fontWeight: 600,
                border: !slideMode ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: !slideMode ? 'var(--accent-bg)' : 'transparent',
                color: !slideMode ? 'var(--accent)' : 'var(--text)',
                transition: 'all 0.15s ease',
              }}
            >📋 List</button>
            <button
              onClick={() => { if (!slideMode) toggleSlideMode() }}
              style={{
                flex: 1, padding: '10px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9em', fontWeight: 600,
                border: slideMode ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: slideMode ? 'var(--accent-bg)' : 'transparent',
                color: slideMode ? 'var(--accent)' : 'var(--text)',
                transition: 'all 0.15s ease',
              }}
            >📖 Slide</button>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
