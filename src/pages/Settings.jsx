import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import { useFont } from '../context/FontContext'
import { useOutletContext } from 'react-router-dom'

function SettingGroup({ title, children }) {
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="card-title" style={{ marginBottom: 10, color: 'var(--accent, #7c5cfc)' }}>{title}</div>
      {children}
    </div>
  )
}

function OptionRow({ label, options, value, onChange }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: '0.85em', color: 'var(--text-muted, #888)', marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map(opt => (
          <button
            key={opt.id || opt.code}
            onClick={() => onChange(opt.id || opt.code)}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: value === (opt.id || opt.code) ? '2px solid var(--accent, #7c5cfc)' : '1px solid var(--border, #2a2a3e)',
              background: value === (opt.id || opt.code) ? 'var(--accent-bg, rgba(124,92,252,0.15))' : 'transparent',
              color: 'var(--text, #e0e0e0)',
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

export default function Settings() {
  const { strings } = useOutletContext()
  const { lang, changeLang, languages } = useLanguage()
  const { theme, changeTheme, themes } = useTheme()
  const { fontFamily, fontSize, changeFontFamily, changeFontSize, fontFamilies, fontSizes } = useFont()

  return (
    <div className="content-page">
      <h2 className="page-title">{strings.settings.title}</h2>

      <SettingGroup title={strings.settings.language}>
        <OptionRow
          label=""
          options={languages}
          value={lang}
          onChange={changeLang}
        />
      </SettingGroup>

      <SettingGroup title={strings.settings.theme}>
        <OptionRow
          label=""
          options={themes}
          value={theme}
          onChange={changeTheme}
        />
      </SettingGroup>

      <SettingGroup title={strings.settings.fontFamily}>
        <OptionRow
          label=""
          options={fontFamilies}
          value={fontFamily}
          onChange={changeFontFamily}
        />
      </SettingGroup>

      <SettingGroup title={strings.settings.fontSize}>
        <OptionRow
          label=""
          options={fontSizes}
          value={fontSize}
          onChange={changeFontSize}
        />
      </SettingGroup>
    </div>
  )
}
