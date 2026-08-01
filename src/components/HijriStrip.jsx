import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import data from '../config/content/calendar.json'
import {
  todayLocal,
  todayHijri,
  enumerateOccurrences,
  localizedEvent,
  hijriLabel,
  formatISODate,
} from '../utils/hijriCalendar'

/**
 * Thin, app-wide strip rendered below the header on every page.
 * Shows today's Hijri date, Gregorian date, and a small indicator when
 * there is an event mapped to today.
 */
export default function HijriStrip({ lang }) {
  const navigate = useNavigate()
  const [today, setToday] = useState(() => todayLocal())

  // Refresh across midnight
  useEffect(() => {
    const id = setInterval(() => setToday(todayLocal()), 60000)
    return () => clearInterval(id)
  }, [])

  const monthNames = data.monthNames?.[lang] || data.monthNames?.en || []
  const todayH = todayHijri(data.monthStarts)
  const todayStr = formatISODate(today)

  const todayEvents = enumerateOccurrences(data)
    .filter(o => o.available && o.gregorianStart && formatISODate(o.gregorianStart) === todayStr)

  const todayEventLabel = (() => {
    if (todayEvents.length === 0) return null
    const ev = data.events.find(e => e.id === todayEvents[0].id)
    return ev ? localizedEvent(ev, lang, monthNames).label : todayEvents[0].id
  })()

  const gregLabel = new Date(today.y, today.m - 1, today.d)
    .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <button
      className="hijri-strip"
      onClick={() => navigate('/calendar')}
      aria-label="Open Islamic calendar"
      title="Open Islamic calendar"
    >
      {todayH.ok ? (
        <span className="hijri-strip-hijri">{hijriLabel(todayH.hijriYear, todayH.hijriMonth, todayH.hijriDay, monthNames)}</span>
      ) : (
        <span className="hijri-strip-hijri hijri-strip-na">—</span>
      )}
      <span className="hijri-strip-sep">·</span>
      <span className="hijri-strip-greg">{gregLabel}</span>
      {todayEventLabel && (
        <span className="hijri-strip-event" title={todayEventLabel}>
          <span className="hijri-strip-event-dot" />
          {todayEventLabel}
        </span>
      )}
    </button>
  )
}
