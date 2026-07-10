import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useFont } from '../context/FontContext'
import { useView } from '../context/ViewContext'

function OptionRow({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: '0.85em', color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => (
          <button
            key={opt.id || opt.code}
            onClick={() => onChange(opt.id || opt.code)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: value === (opt.id || opt.code) ? '2px solid var(--accent)' : '1px solid var(--border)',
              background: value === (opt.id || opt.code) ? 'var(--accent-bg)' : 'transparent',
              color: 'var(--text)',
              fontSize: '0.9em',
              cursor: 'pointer',
              fontFamily: opt.family || 'inherit',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function SettingsPopup({ strings, onClose }) {
  const { lang, changeLang, languages } = useLanguage()
  const { theme, changeTheme, themes } = useTheme()
  const { fontFamily, fontSize, changeFontFamily, changeFontSize, fontFamilies, fontSizes } = useFont()
  const { slideMode, toggleSlideMode } = useView()

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
      <div
        style={{
          position: 'fixed', zIndex: 301,
          top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 'calc(100% - 32px)', maxWidth: 400, maxHeight: '80vh',
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 8px 40px var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* fixed header row */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px 0 24px',
          flexShrink: 0,
        }}>
          <h3 style={{ color: 'var(--text-heading)', fontSize: 18, fontWeight: 700, margin: 0 }}>{strings.settings.title}</h3>
          <button onClick={onClose} style={{
            background: 'var(--bg-card-alt)', border: 'none', color: 'var(--text)',
            width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>✕</button>
        </div>

        {/* scrollable body */}
        <div style={{ padding: '12px 24px 24px', overflowY: 'auto' }}>

        {/* Language */}
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 8, color: 'var(--accent)', fontSize: 13 }}>{strings.settings.language}</div>
          <OptionRow label="" options={languages} value={lang} onChange={changeLang} />
        </div>

        {/* Theme */}
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 8, color: 'var(--accent)', fontSize: 13 }}>{strings.settings.theme}</div>
          <OptionRow label="" options={themes} value={theme} onChange={changeTheme} />
        </div>

        {/* Font Family */}
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 8, color: 'var(--accent)', fontSize: 13 }}>{strings.settings.fontFamily}</div>
          <OptionRow label="" options={fontFamilies} value={fontFamily} onChange={changeFontFamily} />
        </div>

        {/* Font Size */}
        <div className="card" style={{ padding: 14, marginBottom: 12 }}>
          <div className="card-title" style={{ marginBottom: 8, color: 'var(--accent)', fontSize: 13 }}>{strings.settings.fontSize}</div>
          <OptionRow label="" options={fontSizes} value={fontSize} onChange={changeFontSize} />
        </div>

        {/* View Mode */}
        <div className="card" style={{ padding: 14, marginBottom: 0 }}>
          <div className="card-title" style={{ marginBottom: 8, color: 'var(--accent)', fontSize: 13 }}>View Mode</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { if (slideMode) toggleSlideMode() }}
              style={{
                flex: 1, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9em',
                border: !slideMode ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: !slideMode ? 'var(--accent-bg)' : 'transparent',
                color: 'var(--text)',
              }}
            >📋 List</button>
            <button
              onClick={() => { if (!slideMode) toggleSlideMode() }}
              style={{
                flex: 1, padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: '0.9em',
                border: slideMode ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: slideMode ? 'var(--accent-bg)' : 'transparent',
                color: 'var(--text)',
              }}
            >📖 Slide</button>
          </div>
        </div>
        </div>
      </div>
    </>
  )
}
