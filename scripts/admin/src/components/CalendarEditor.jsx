import { useState, useEffect, useCallback } from 'react'
import { validateCalendarConfig } from '../../../../src/utils/hijriCalendar.js'

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', 'Dhul-Qa\'dah', 'Dhul-Hijjah',
]

function clone(o) { return JSON.parse(JSON.stringify(o)) }

export default function CalendarEditor({ api, show }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validation, setValidation] = useState({ ok: true, errors: [] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.getCalendar())
    } catch (e) { show('Error loading calendar: ' + e.message, 'error') }
    finally { setLoading(false) }
  }, [api, show])

  useEffect(() => { load() }, [load])

  const runValidation = (d) => setValidation(validateCalendarConfig(d))

  const update = (next) => {
    setData(next)
    runValidation(next)
  }

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Loading calendar…</p>
  if (!data) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>No calendar data</p>

  const monthStarts = data.monthStarts || []
  const events = data.events || []

  const setStart = (idx, gregorianStart) => {
    const d = clone(data)
    d.monthStarts[idx].gregorianStart = gregorianStart || null
    update(d)
  }

  const save = async () => {
    const v = validateCalendarConfig(data)
    if (!v.ok) { setValidation(v); show('Cannot save — fix validation errors first', 'error'); return }
    setSaving(true)
    try {
      await api.saveCalendar(data)
      show('Calendar saved!')
    } catch (e) { show('Error: ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  // ---- event helpers ----
  const addEvent = () => {
    const d = clone(data)
    const base = { id: 'event-' + Date.now(), rule: 'hijri-fixed', hijriMonth: 1, hijriDays: [1], label: '', description: '', translations: {} }
    d.events = [...(d.events || []), base]
    update(d)
  }
  const removeEvent = (idx) => {
    const d = clone(data)
    d.events.splice(idx, 1)
    update(d)
  }
  const moveEvent = (from, to) => {
    if (to < 0 || to >= events.length) return
    const d = clone(data)
    const [ev] = d.events.splice(from, 1)
    d.events.splice(to, 0, ev)
    update(d)
  }
  const setEvent = (idx, patch) => {
    const d = clone(data)
    d.events[idx] = { ...d.events[idx], ...patch }
    update(d)
  }
  const setEventDays = (idx, raw) => {
    const nums = raw.split(/[\s,]+/).map(s => parseInt(s, 10)).filter(n => Number.isInteger(n))
    setEvent(idx, { hijriDays: nums.length ? nums : [1] })
  }
  const setEventTranslation = (idx, lang, field, val) => {
    const d = clone(data)
    if (!d.events[idx].translations) d.events[idx].translations = {}
    if (!d.events[idx].translations[lang]) d.events[idx].translations[lang] = {}
    d.events[idx].translations[lang][field] = val
    update(d)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 1100 }}>
      {/* Validation banner */}
      {!validation.ok && (
        <div className="section-card" style={{ border: '1px solid #fecaca', background: '#fef2f2' }}>
          <div style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: 6 }}>Validation errors — fix before saving</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--danger)', fontSize: 12 }}>
            {validation.errors.map((e, i) => <li key={i}>{e}</li>)}
          </ul>
        </div>
      )}

      {/* Month starts */}
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">Month Starts</span>
          <span className="tag">{monthStarts.length} slots · rolling window + boundary</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Enter the Gregorian date each Hijri month begins (per local moon sighting). Leave blank for months not yet confirmed. The last slot is the boundary needed to measure the final covered month.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 8 }}>
          {monthStarts.map((ms, i) => (
            <div key={i} className="field-group" style={{ marginBottom: 0 }}>
              <label className="field-label" htmlFor={`ms-${i}`}>
                {ms.hijriYear} · {HIJRI_MONTHS[ms.hijriMonth - 1]}
              </label>
              <input
                id={`ms-${i}`}
                type="date"
                className="field-input"
                value={ms.gregorianStart || ''}
                onChange={e => setStart(i, e.target.value)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Events */}
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">Events</span>
          <span className="tag">{events.length} events · shared (language-independent)</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Events are defined once and mapped automatically. Use the default label for all languages; add optional per-language overrides below.
        </p>
        {events.map((ev, i) => (
          <div key={i} className="array-item" style={{ marginBottom: 10 }}>
            <div className="array-header">
              <span className="array-badge">#{i + 1}</span>
              <div className="array-controls">
                <button className="btn-icon" onClick={() => moveEvent(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                <button className="btn-icon" onClick={() => moveEvent(i, i + 1)} disabled={i >= events.length - 1} aria-label="Move down">↓</button>
                <button className="btn-icon danger" onClick={() => removeEvent(i)} aria-label="Delete">✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor={`ev-id-${i}`}>ID</label>
                <input id={`ev-id-${i}`} className="field-input" value={ev.id || ''} onChange={e => setEvent(i, { id: e.target.value })} />
              </div>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor={`ev-rule-${i}`}>Rule</label>
                <select id={`ev-rule-${i}`} className="field-select" value={ev.rule} onChange={e => setEvent(i, { rule: e.target.value })}>
                  <option value="hijri-fixed">Fixed Hijri date</option>
                  <option value="hijri-monthly">Monthly (every Hijri month)</option>
                  <option value="gregorian-month-hijri-relative">Hijri days in a Gregorian month</option>
                </select>
              </div>

              {ev.rule === 'hijri-fixed' ? (
                <>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor={`ev-hm-${i}`}>Hijri month</label>
                    <select id={`ev-hm-${i}`} className="field-select" value={String(ev.hijriMonth || 1)} onChange={e => setEvent(i, { hijriMonth: Number(e.target.value) })}>
                      {HIJRI_MONTHS.map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor={`ev-hd-${i}`}>Hijri day(s)</label>
                    <input id={`ev-hd-${i}`} className="field-input" value={(ev.hijriDays || []).join(', ')} onChange={e => setEventDays(i, e.target.value)} />
                  </div>
                </>
              ) : ev.rule === 'hijri-monthly' ? (
                <div className="field-group" style={{ marginBottom: 0 }}>
                  <label className="field-label" htmlFor={`ev-hd-${i}`}>Hijri day(s) each month</label>
                  <input id={`ev-hd-${i}`} className="field-input" value={(ev.hijriDays || []).join(', ')} onChange={e => setEventDays(i, e.target.value)} />
                </div>
              ) : (
                <>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor={`ev-gm-${i}`}>Gregorian month</label>
                    <select id={`ev-gm-${i}`} className="field-select" value={String(ev.gregorianMonth || 1)} onChange={e => setEvent(i, { gregorianMonth: Number(e.target.value) })}>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div className="field-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor={`ev-hd-${i}`}>Hijri day(s)</label>
                    <input id={`ev-hd-${i}`} className="field-input" value={(ev.hijriDays || []).join(', ')} onChange={e => setEventDays(i, e.target.value)} />
                  </div>
                </>
              )}

              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor={`ev-label-${i}`}>Default label</label>
                <input id={`ev-label-${i}`} className="field-input" value={ev.label || ''} onChange={e => setEvent(i, { label: e.target.value })} />
              </div>
              <div className="field-group" style={{ marginBottom: 0 }}>
                <label className="field-label" htmlFor={`ev-desc-${i}`}>Default description</label>
                <input id={`ev-desc-${i}`} className="field-input" value={ev.description || ''} onChange={e => setEvent(i, { description: e.target.value })} />
              </div>
            </div>

            {/* Optional translations */}
            <div style={{ marginTop: 10, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['en', 'hinglish'].map(lang => (
                <div key={lang} style={{ flex: '1 1 300px', padding: 8, border: '1px solid var(--border)', borderRadius: 8 }}>
                  <div className="field-label">{lang} override</div>
                  <input
                    className="field-input" style={{ marginBottom: 4 }}
                    placeholder="Label"
                    value={ev.translations?.[lang]?.label || ''}
                    onChange={e => setEventTranslation(i, lang, 'label', e.target.value)}
                  />
                  <input
                    className="field-input"
                    placeholder="Description"
                    value={ev.translations?.[lang]?.description || ''}
                    onChange={e => setEventTranslation(i, lang, 'description', e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        <button className="btn-add" onClick={addEvent}>+ Add event</button>
      </div>

      {/* Save */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary" onClick={save} disabled={saving || !validation.ok}>
          {saving ? 'Saving…' : '💾 Save Calendar'}
        </button>
        {!validation.ok && <span style={{ color: 'var(--danger)', fontSize: 12 }}>Fix validation errors to enable save</span>}
      </div>
    </div>
  )
}
