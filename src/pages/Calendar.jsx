import SeoHead from '../components/SeoHead'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { loadStrings } from '../config/strings'
import data from '../config/content/calendar.json'
import {
  todayLocal,
  todayHijri,
  enumerateOccurrences,
  nextOccurrence,
  localizedEvent,
  hijriLabel,
  formatISODate,
  buildMonthGrid,
  hijriMonthOf,
  buildGregorianMonthGrid,
  gregorianMonthOf,
  splitUpcomingPast,
} from '../utils/hijriCalendar'

// Weekday header labels (3 letters) — Sunday-first. Localized via toLocaleDateString
// when available, but a static 3-letter set keeps the grid compact across languages.
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const GREG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDisplayDate({ y, m, d }) {
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDayMonth({ y, m, d }) {
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function Calendar() {
  const { lang } = useLanguage()
  const [strings, setStrings] = useState(null)
  const [today, setToday] = useState(() => todayLocal())
  // view mode: 'hijri' (Hijri month grid) or 'gregorian' (Gregorian month grid)
  // Persisted like app settings so the choice survives reloads.
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('kqcmm_calendar_view')
    return saved === 'gregorian' ? 'gregorian' : 'hijri'
  })
  // viewed month { year, month } — init to the month containing today
  const [view, setView] = useState(null)

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

  useEffect(() => {
    const id = setInterval(() => setToday(todayLocal()), 60000)
    return () => clearInterval(id)
  }, [])

  // Initialize view to the current month (Hijri or Gregorian) based on viewMode
  useEffect(() => {
    if (!view) {
      if (viewMode === 'gregorian') {
        setView(gregorianMonthOf(todayLocal()))
        return
      }
      const cur = hijriMonthOf(data.monthStarts, todayLocal())
      const fallback = (data.monthStarts || []).find(ms => ms.gregorianStart)
      const target = cur || (fallback ? { year: fallback.hijriYear, month: fallback.hijriMonth } : null)
      if (target) setView(target)
    }
  }, [view, viewMode])

  // Reset view when toggling modes so nav starts at the current month
  const switchMode = (mode) => {
    if (mode === viewMode) return
    setViewMode(mode)
    localStorage.setItem('kqcmm_calendar_view', mode)
    if (mode === 'gregorian') setView(gregorianMonthOf(todayLocal()))
    else {
      const cur = hijriMonthOf(data.monthStarts, todayLocal())
      const fallback = (data.monthStarts || []).find(ms => ms.gregorianStart)
      setView(cur || (fallback ? { year: fallback.hijriYear, month: fallback.hijriMonth } : null))
    }
  }

  const content = data[lang] || data.en
  const title = content.title

  const todayH = todayHijri(data.monthStarts)
  const monthNames = data.monthNames?.[lang] || data.monthNames?.en || []
  const monthNamesShort = data.monthNamesShort?.[lang] || data.monthNamesShort?.en || []
  const occurrences = enumerateOccurrences(data)
  const next = nextOccurrence(occurrences, today)
  const cal = strings?.calendar || {}

  // Map event ids -> Gregorian day ordinal for marking grid cells
  const dayOrdKey = ({ y, m, d }) => `${y}-${m}-${d}`
  const eventByOrd = new Map()
  occurrences.filter(o => o.available && o.gregorianStart).forEach(o => {
    const k = dayOrdKey(o.gregorianStart)
    eventByOrd.set(k, (eventByOrd.get(k) || []).concat(o))
  })

  const grid = view
    ? (viewMode === 'gregorian'
        ? buildGregorianMonthGrid(data.monthStarts, view, today)
        : buildMonthGrid(data.monthStarts, view, today))
    : { hasData: false }
  if (grid.hasData) {
    grid.cells.forEach(cell => {
      cell.events = eventByOrd.get(dayOrdKey(cell.gregorian)) || []
    })
  }

  const currentMonth = viewMode === 'gregorian'
    ? gregorianMonthOf(today)
    : hijriMonthOf(data.monthStarts, today)
  const isCurrentView = view && currentMonth && view.year === currentMonth.year && view.month === currentMonth.month

  // Available occurrences sorted by start date (ascending)
  const available = occurrences
    .filter(o => o.available && o.gregorianStart)
    .sort((a, b) => formatISODate(a.gregorianStart) < formatISODate(b.gregorianStart) ? -1 : 1)
  const unavailable = occurrences.filter(o => !o.available)

  const { eventList, pastEvents } = splitUpcomingPast(available, today)

  const eventById = (id) => data.events.find(e => e.id === id)

  // Configured min/max Hijri months (only slots with a set gregorianStart)
  const configured = (data.monthStarts || []).filter(ms => ms.gregorianStart)
  const minMonth = configured.length
    ? { year: configured[0].hijriYear, month: configured[0].hijriMonth }
    : null
  const maxMonth = configured.length
    ? { year: configured[configured.length - 1].hijriYear, month: configured[configured.length - 1].hijriMonth }
    : null
  const keyOf = (m) => m ? `${m.year}-${m.month}` : ''
  // Hijri mode: bound nav to configured min/max. Gregorian mode: unbounded.
  const canPrev = viewMode === 'gregorian' ? !!view : !!(minMonth && view && keyOf(view) > keyOf(minMonth))
  const canNext = viewMode === 'gregorian' ? !!view : !!(maxMonth && view && keyOf(view) < keyOf(maxMonth))

  const shiftMonth = (prev, delta) => {
    if (!prev) return prev
    if (delta === -1 && prev.month === 1) return { year: prev.year - 1, month: 12 }
    if (delta === 1 && prev.month === 12) return { year: prev.year + 1, month: 1 }
    return { ...prev, month: prev.month + delta }
  }
  const goPrev = () => setView(prev => {
    const next = shiftMonth(prev, -1)
    // bound to configured min in Hijri mode
    if (viewMode === 'hijri' && minMonth && keyOf(next) < keyOf(minMonth)) return prev
    return next
  })
  const goNext = () => setView(prev => {
    const next = shiftMonth(prev, 1)
    // bound to configured max in Hijri mode
    if (viewMode === 'hijri' && maxMonth && keyOf(next) > keyOf(maxMonth)) return prev
    return next
  })
  const goToday = () => { if (currentMonth) setView(currentMonth) }

  const renderEventCard = (occ, past) => {
    const e = eventById(occ.id)
    const loc = localizedEvent(e, lang, monthNames)
    const dayBadge = occ.hijriDays.length === 1 ? occ.hijriDays[0] : `${occ.hijriDays[0]}–${occ.hijriDays[occ.hijriDays.length - 1]}`
    return (
      <div key={occ.id + '-' + occ.hijriYear + '-' + occ.hijriMonth} className={'cal-ev' + (past ? ' cal-ev-past' : '')}>
        <div className="cal-ev-date">
          <span className="cal-ev-day">{dayBadge}</span>
          <span className="cal-ev-mon">{monthNamesShort[occ.hijriMonth - 1] || occ.hijriMonth}</span>
        </div>
        <div className="cal-ev-body">
          <div className="cal-ev-title">{loc.label}</div>
          {loc.description && <div className="cal-ev-desc">{loc.description}</div>}
          <div className="cal-ev-greg">{formatDisplayDate(occ.gregorianStart)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="content-page">
      <SeoHead title="Islamic Calendar" path="/calendar" description="Upcoming Islamic events, important dates, and spiritual observances from the Chishti tradition." />
      <h2 className="page-title">{title}</h2>

      {/* MONTH GRID */}
      <div className="cal-grid-card">
        <div className="cal-grid-nav">
          <button className="cal-nav-btn" onClick={goPrev} disabled={!canPrev} aria-label="Previous month">‹</button>
          <div className="cal-grid-title">
            <div className="cal-grid-month">
              {grid.hasData
                ? (viewMode === 'gregorian'
                    ? `${GREG_MONTHS[grid.month - 1] || grid.month} ${grid.year}`
                    : `${monthNames[grid.month - 1] || grid.month} ${grid.year}`)
                : ''}
            </div>
            <div className="cal-grid-sub">
              {grid.hasData && isCurrentView && todayH.ok
                ? hijriLabel(todayH.hijriYear, todayH.hijriMonth, todayH.hijriDay, monthNames)
                : ''}
            </div>
          </div>
          <button className="cal-nav-btn" onClick={goNext} disabled={!canNext} aria-label="Next month">›</button>
        </div>

        {/* View mode toggle */}
        <div className="cal-grid-toggle">
          <button
            className={'cal-toggle-btn' + (viewMode === 'hijri' ? ' active' : '')}
            onClick={() => switchMode('hijri')}
          >Hijri</button>
          <button
            className={'cal-toggle-btn' + (viewMode === 'gregorian' ? ' active' : '')}
            onClick={() => switchMode('gregorian')}
          >Gregorian</button>
        </div>

        {grid.hasData ? (
          <>
            <div className="cal-grid-weekdays">
              {WEEKDAYS.map((w, i) => <div key={i} className="cal-grid-wd">{w}</div>)}
            </div>
            <div className="cal-grid-days">
              {Array.from({ length: grid.firstWeekday }).map((_, i) => <div key={'b' + i} className="cal-grid-day cal-grid-blank" />)}
              {grid.cells.map(cell => (
                <div
                  key={viewMode === 'gregorian' ? cell.day : cell.hijriDay}
                  className={'cal-grid-day' + (cell.isToday ? ' is-today' : '') + (cell.events.length ? ' has-event' : '') + (viewMode === 'gregorian' && cell.hijriDay === null ? ' no-hijri' : '')}
                  title={cell.events.length ? cell.events.map(o => eventById(o.id)?.label || o.id).join(' · ') : ''}
                >
                  {viewMode === 'gregorian' ? (
                    <>
                      <span className="cal-grid-daynum">{cell.day}</span>
                      <span className="cal-grid-greg">{cell.hijriDay != null ? `${cell.hijriDay} ${monthNamesShort[cell.hijriMonth - 1] || ''}` : ''}</span>
                    </>
                  ) : (
                    <>
                      <span className="cal-grid-daynum">{cell.hijriDay}</span>
                      <span className="cal-grid-greg">{formatDayMonth(cell.gregorian)}</span>
                    </>
                  )}
                  {cell.events.length > 0 && (
                    <span className="cal-grid-dots">
                      {cell.events.map((o, i) => <span key={i} className="cal-grid-dot" />)}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <div className="cal-grid-legend">
              <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot-today" /> {cal.todayLabel || 'Today'}</span>
              <span className="cal-legend-item"><span className="cal-legend-dot cal-legend-dot-event" /> Event</span>
            </div>
          </>
        ) : (
          <div className="cal-grid-empty">{cal.unavailable || 'Not yet configured'}</div>
        )}

        {!isCurrentView && (
          <div className="cal-grid-todaybar">
            <button className="cal-today-btn" onClick={goToday}>← {cal.todayLabel || 'Today'}</button>
          </div>
        )}
      </div>

      {/* NEXT EVENT STRIP */}
      {next ? (
        <div className="cal-nextstrip">
          <div className="cal-nextstrip-body">
            <div className="cal-nextstrip-label">{cal.nextEvent || 'Next Event'}</div>
            <div className="cal-nextstrip-title">
              {(() => { const e = eventById(next.occurrence.id); return localizedEvent(e, lang, monthNames).label })()}
            </div>
            <div className="cal-nextstrip-date">
              {hijriLabel(next.occurrence.hijriYear, next.occurrence.hijriMonth, next.occurrence.hijriDays[0], monthNames)}
              <span className="cal-nextstrip-sep">·</span>
              {formatDisplayDate(next.occurrence.gregorianStart)}
            </div>
          </div>
          <div className="cal-nextstrip-count">
            {next.daysUntil === 0
              ? <span className="cal-nextstrip-num cal-nextstrip-now">{cal.todayLabel || 'Today'}</span>
              : (<>
                <span className="cal-nextstrip-num">{next.daysUntil}</span>
                <span className="cal-nextstrip-unit">{cal.inDays ? (cal.inDays.split('{n}')[1] || '').trim() : 'days'}</span>
              </>)}
          </div>
        </div>
      ) : (
        <div className="cal-nextstrip cal-nextstrip-empty">
          <div className="cal-nextstrip-label">{cal.nextEvent || 'Next Event'}</div>
          <div className="cal-unavailable">{cal.noUpcoming || 'No upcoming events scheduled'}</div>
        </div>
      )}

      {/* UPCOMING */}
      {eventList.length > 0 && (
        <>
          <div className="cal-sec-head">
            <h3 className="cal-sec-title">{cal.eventList || 'Upcoming Events'}</h3>
            <span className="cal-sec-count">{eventList.length}</span>
          </div>
          <div className="cal-ev-list">
            {eventList.map(occ => renderEventCard(occ, false))}
          </div>
        </>
      )}

      {/* PAST */}
      {pastEvents.length > 0 && (
        <>
          <div className="cal-sec-head">
            <h3 className="cal-sec-title">{cal.pastEvents || 'Past Events'}</h3>
            <span className="cal-sec-count">{pastEvents.length}</span>
          </div>
          <div className="cal-ev-list">
            {pastEvents.map(occ => renderEventCard(occ, true))}
          </div>
        </>
      )}

      {/* UNAVAILABLE */}
      {unavailable.length > 0 && (
        <div className="cal-unavail">
          <div className="cal-unavail-title">{cal.unavailable || 'Not yet configured'}</div>
          <div className="cal-unavail-chips">
            {unavailable.map((occ, i) => {
              const e = eventById(occ.id)
              const loc = localizedEvent(e, lang, monthNames)
              return <span key={i} className="cal-unavail-chip">{loc.label}</span>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
