import { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { validateCalendarConfig } from '../../../../src/utils/hijriCalendar.js'

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', 'Dhul-Qa\'dah', 'Dhul-Hijjah',
]

const thStyle = {
  textAlign: 'left', padding: '8px 10px', fontSize: 11,
  textTransform: 'uppercase', letterSpacing: '0.4px', color: 'var(--text-muted)',
  borderBottom: '1px solid var(--border)', background: 'var(--bg-card-alt)',
}
const tdStyle = { padding: '6px 10px', verticalAlign: 'middle' }

function clone(o) { return JSON.parse(JSON.stringify(o)) }

const CalendarEditor = forwardRef(function CalendarEditor({ api, show, onStatusChange }, ref) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validation, setValidation] = useState({ ok: true, errors: [] })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await api.getCalendar())
      setDirty(false)
    } catch (e) { show('Error loading calendar: ' + e.message, 'error') }
    finally { setLoading(false) }
  }, [api, show])

  useEffect(() => { load() }, [load])

  const runValidation = (d) => setValidation(validateCalendarConfig(d))

  const update = (next) => {
    setData(next)
    setDirty(true)
    runValidation(next)
  }

  const save = async () => {
    // Auto-sort month starts by Hijri year+month so the stored list is always
    // ordered (validation then sees a clean sequence). Duplicates are still
    // rejected, not silently dropped.
    if (!data) return
    const sorted = clone(data)
    sorted.monthStarts = (sorted.monthStarts || [])
      .slice()
      .sort((a, b) => (a.hijriYear - b.hijriYear) || (a.hijriMonth - b.hijriMonth))
    const v = validateCalendarConfig(sorted)
    if (!v.ok) { setValidation(v); show('Cannot save — fix validation errors first', 'error'); return }
    setData(sorted)
    setSaving(true)
    try {
      await api.saveCalendar(sorted)
      setDirty(false)
      show('Calendar saved!')
    } catch (e) { show('Error: ' + e.message, 'error') }
    finally { setSaving(false) }
  }

  // Report dirty/saving to App.jsx so the header badge & Save button update.
  useEffect(() => { onStatusChange?.({ dirty, saving }) }, [dirty, saving, onStatusChange])

  // Expose save + status to the App.jsx toolbar (header badge & Save button).
  // MUST be before the early returns (rules of hooks) AND after `save` is
  // declared (the callback runs during render, so `save` must be initialized).
  useImperativeHandle(ref, () => ({ save, dirty, saving }), [dirty, saving, data])

  if (loading) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>Loading calendar…</p>
  if (!data) return <p style={{ color: 'var(--text-muted)', padding: 20 }}>No calendar data</p>

  const monthStarts = data.monthStarts || []
  const events = data.events || []

  // ---- month-start helpers (free-form list) ----
  const setStartField = (idx, field, value) => {
    const d = clone(data)
    d.monthStarts[idx][field] = value
    update(d)
  }
  const addMonthStart = (insertAt = null) => {
    const d = clone(data)
    const list = d.monthStarts || []
    // Auto-number so the new row does NOT collide with an existing one.
    //  - Append (insertAt null): month AFTER the last row.
    //  - Insert at top (insertAt 0): month BEFORE the first row (extends
    //    backward, e.g. 1448-1 -> 1447-12).
    //  - Insert in the middle: month AFTER the row that currently sits at
    //    (insertAt - 1).
    let year, month
    if (insertAt === 0 && list.length) {
      const first = list[0]
      year = first.hijriMonth === 1 ? first.hijriYear - 1 : first.hijriYear
      month = first.hijriMonth === 1 ? 12 : first.hijriMonth - 1
    } else if (insertAt !== null && insertAt > 0 && list.length) {
      const base = list[Math.min(insertAt - 1, list.length - 1)]
      year = base.hijriMonth === 12 ? base.hijriYear + 1 : base.hijriYear
      month = base.hijriMonth === 12 ? 1 : base.hijriMonth + 1
    } else if (list.length) {
      const last = list[list.length - 1]
      year = last.hijriMonth === 12 ? last.hijriYear + 1 : last.hijriYear
      month = last.hijriMonth === 12 ? 1 : last.hijriMonth + 1
    } else {
      year = 1448; month = 1
    }
    const row = { hijriYear: year, hijriMonth: month, gregorianStart: null }
    if (insertAt !== null) {
      list.splice(insertAt, 0, row)
    } else {
      list.push(row)
    }
    d.monthStarts = list
    update(d)
  }
  const removeMonthStart = (idx) => {
    const d = clone(data)
    d.monthStarts.splice(idx, 1)
    update(d)
  }
  const moveMonthStart = (from, to) => {
    if (to < 0 || to >= (data.monthStarts || []).length) return
    const d = clone(data)
    const [it] = d.monthStarts.splice(from, 1)
    d.monthStarts.splice(to, 0, it)
    update(d)
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

      {/* Month starts — free-form, compact table */}
      <div className="section-card">
        <div className="section-header">
          <span className="section-title">Month Starts</span>
          <span className="tag">{monthStarts.length} months · {monthStarts.filter(m => m.gregorianStart).length} configured</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12 }}>
          Enter the Gregorian date each Hijri month begins (per local moon sighting). Add or remove any month — leave dates blank until confirmed. A month needs the next month's start to place day-30 events.
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className="btn-add" style={{ flex: 1 }} onClick={() => addMonthStart(0)}>+ Add month at top</button>
        </div>

        <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)' }}>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Hijri Year</th>
                <th style={thStyle}>Hijri Month</th>
                <th style={thStyle}>Gregorian Start</th>
                <th style={{ ...thStyle, width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {monthStarts.map((ms, i) => (
                <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                  <td style={tdStyle}><span className="tag">{i + 1}</span></td>
                  <td style={tdStyle}>
                    <input
                      type="number" min={1} className="field-input"
                      style={{ width: 90 }}
                      value={ms.hijriYear}
                      onChange={e => setStartField(i, 'hijriYear', Number(e.target.value) || 1)}
                    />
                  </td>
                  <td style={tdStyle}>
                    <select
                      className="field-select"
                      style={{ width: 150 }}
                      value={String(ms.hijriMonth)}
                      onChange={e => setStartField(i, 'hijriMonth', Number(e.target.value))}
                    >
                      {HIJRI_MONTHS.map((m, mi) => <option key={mi} value={mi + 1}>{m}</option>)}
                    </select>
                  </td>
                  <td style={tdStyle}>
                    <input
                      type="date" className="field-input"
                      style={{ width: 160 }}
                      value={ms.gregorianStart || ''}
                      onChange={e => setStartField(i, 'gregorianStart', e.target.value || null)}
                    />
                  </td>
                  <td style={tdStyle}>
                    <div className="array-controls">
                      <button className="btn-icon" onClick={() => moveMonthStart(i, i - 1)} disabled={i === 0} aria-label="Move up">↑</button>
                      <button className="btn-icon" onClick={() => moveMonthStart(i, i + 1)} disabled={i >= monthStarts.length - 1} aria-label="Move down">↓</button>
                      <button className="btn-icon danger" onClick={() => removeMonthStart(i)} aria-label="Remove month">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button className="btn-add" style={{ marginTop: 10 }} onClick={addMonthStart}>+ Add month</button>
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

      {/* Validation hint (save lives in the header) */}
      {!validation.ok && (
        <div style={{ color: 'var(--danger)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="status-badge unsaved">⚠ Fix validation errors to enable save</span>
        </div>
      )}
    </div>
  )
})

export default CalendarEditor

