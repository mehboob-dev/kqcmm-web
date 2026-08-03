import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'

const data = getContent('calendar')
import {
  todayLocal,
  todayHijri,
  enumerateOccurrences,
  hijriLabel,
  formatISODate,
} from '../utils/hijriCalendar'

// Maximum number of event dots shown in the strip. When there are more events
// than this, render the cap plus a "+" dot so the user knows the count is higher
// without crowding the strip.
const MAX_DOTS = 3

/**
 * Thin, app-wide strip rendered below the header on every page.
 * Shows today's Hijri date, Gregorian date, and a small dot cluster when
 * there are events mapped to today (no event text — the label would crowd the
 * strip and is one tap away on the calendar page).
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

  const eventCount = todayEvents.length
  const showDots = eventCount > 0
  const shownDots = Math.min(eventCount, MAX_DOTS)
  const hasMore = eventCount > MAX_DOTS

  const gregLabel = new Date(today.y, today.m - 1, today.d)
    .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <button
      className="hijri-strip"
      onClick={() => navigate(routeForPage('calendar'))}
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
      {showDots && (
        <span className="hijri-strip-event">
          {Array.from({ length: shownDots }).map((_, i) => (
            <span key={i} className="hijri-strip-event-dot" />
          ))}
          {hasMore && <span className="hijri-strip-more">+{eventCount - MAX_DOTS}</span>}
        </span>
      )}
    </button>
  )
}
