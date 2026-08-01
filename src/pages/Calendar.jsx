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
} from '../utils/hijriCalendar'

function formatDisplayDate({ y, m, d }) {
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function Calendar() {
  const { lang } = useLanguage()
  const [strings, setStrings] = useState(null)
  const [today, setToday] = useState(() => todayLocal())

  useEffect(() => {
    loadStrings(lang).then(setStrings)
  }, [lang])

  // Recompute "today" if the page stays open across midnight
  useEffect(() => {
    const id = setInterval(() => setToday(todayLocal()), 60000)
    return () => clearInterval(id)
  }, [])

  const content = data[lang] || data.en
  const title = content.title

  const todayH = todayHijri(data.monthStarts)
  const monthNames = data.monthNames?.[lang] || data.monthNames?.en || []
  const occurrences = enumerateOccurrences(data)
  const next = nextOccurrence(occurrences, today)
  const cal = strings?.calendar || {}

  // Available occurrences sorted by start date (ascending)
  const available = occurrences
    .filter(o => o.available && o.gregorianStart)
    .sort((a, b) => formatISODate(a.gregorianStart) < formatISODate(b.gregorianStart) ? -1 : 1)
  // Unavailable events (for reference)
  const unavailable = occurrences.filter(o => !o.available)

  // Split into future (>= today) and past (< today), de-duplicated by event id.
  // The NEXT-event card already covers the earliest future occurrence; the
  // upcoming list shows each event's earliest FUTURE occurrence, and the past
  // list shows each event's latest PAST occurrence.
  const todayStr = formatISODate(today)
  const seenUp = new Set(), seenPast = new Set()
  const eventList = available.filter(o => {
    if (o.gregorianStart && formatISODate(o.gregorianStart) < todayStr) return false // skip past here
    if (seenUp.has(o.id)) return false
    seenUp.add(o.id)
    return true
  })
  const pastEvents = [...available]
    .reverse()
    .filter(o => {
      if (!(o.gregorianStart && formatISODate(o.gregorianStart) < todayStr)) return false
      if (seenPast.has(o.id)) return false
      seenPast.add(o.id)
      return true
    })
    .reverse()

  const eventById = (id) => data.events.find(e => e.id === id)

  return (
    <div className="content-page">
      <SeoHead title="Islamic Calendar" path="/calendar" description="Upcoming Islamic events, important dates, and spiritual observances from the Chishti tradition." />
      <h2 className="page-title">{title}</h2>

      {/* TODAY CARD */}
      <div className="cal-today">
        <div className="cal-today-label">{cal.today || 'Today'}</div>
        {todayH.ok ? (
          <>
            <div className="cal-today-hijri">{hijriLabel(todayH.hijriYear, todayH.hijriMonth, todayH.hijriDay, monthNames)}</div>
            <div className="cal-today-gregorian">{formatDisplayDate(today)}</div>
          </>
        ) : (
          <div className="cal-unavailable">
            <div>{cal.unavailable || 'Not yet configured'}</div>
            <div className="cal-unavailable-hint">{cal.unavailableHint || ''}</div>
          </div>
        )}
      </div>

      {/* NEXT EVENT CARD */}
      {next ? (
        <div className="cal-next">
          <div className="cal-next-label">{cal.nextEvent || 'Next Event'}</div>
          <div className="cal-next-title">
            {(() => { const e = eventById(next.occurrence.id); return localizedEvent(e, lang, monthNames).label })()}
          </div>
          <div className="cal-next-date">
            {hijriLabel(next.occurrence.hijriYear, next.occurrence.hijriMonth, next.occurrence.hijriDays[0], monthNames)}
            {' · '}
            {formatDisplayDate(next.occurrence.gregorianStart)}
          </div>
          <div className="cal-next-count">
            {next.daysUntil === 0
              ? (cal.todayLabel || 'Today')
              : (cal.inDays || 'in {n} days').replace('{n}', String(next.daysUntil))}
          </div>
        </div>
      ) : (
        <div className="cal-next">
          <div className="cal-next-label">{cal.nextEvent || 'Next Event'}</div>
          <div className="cal-unavailable">{cal.noUpcoming || 'No upcoming events scheduled'}</div>
        </div>
      )}

      {/* UPCOMING EVENT LIST */}
      <h3 className="cal-section-title">{cal.eventList || 'Upcoming Events'}</h3>
      {eventList.length === 0 ? (
        <p className="cal-empty">{cal.noUpcoming || 'No upcoming events scheduled'}</p>
      ) : (
        <div className="calendar-grid">
          {eventList.map(occ => {
            const e = eventById(occ.id)
            const loc = localizedEvent(e, lang, monthNames)
            const dayBadge = occ.hijriDays.length === 1 ? occ.hijriDays[0] : `${occ.hijriDays[0]}–${occ.hijriDays[occ.hijriDays.length - 1]}`
            return (
              <div key={occ.id + '-' + occ.hijriYear + '-' + occ.hijriMonth} className="cal-event">
                <div className="cal-date">
                  {dayBadge}
                  <span className="cal-month">{monthNames[occ.hijriMonth - 1] || occ.hijriMonth}</span>
                </div>
                <div className="cal-info">
                  <div className="cal-event-title">{loc.label}</div>
                  <div className="cal-event-desc">{loc.description}</div>
                  <div className="cal-event-date">
                    {formatISODate(occ.gregorianStart)}
                    {occ.gregorianStart && occ.gregorianEnd && formatISODate(occ.gregorianStart) !== formatISODate(occ.gregorianEnd)
                      ? ' – ' + formatISODate(occ.gregorianEnd)
                      : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* PAST EVENTS */}
      {pastEvents.length > 0 && (
        <>
          <h3 className="cal-section-title">{cal.pastEvents || 'Past Events'}</h3>
          <div className="calendar-grid">
            {pastEvents.map(occ => {
              const e = eventById(occ.id)
              const loc = localizedEvent(e, lang, monthNames)
              const dayBadge = occ.hijriDays.length === 1 ? occ.hijriDays[0] : `${occ.hijriDays[0]}–${occ.hijriDays[occ.hijriDays.length - 1]}`
              return (
                <div key={occ.id + '-' + occ.hijriYear + '-' + occ.hijriMonth} className="cal-event cal-event-past">
                  <div className="cal-date">
                    {dayBadge}
                    <span className="cal-month">{monthNames[occ.hijriMonth - 1] || occ.hijriMonth}</span>
                  </div>
                  <div className="cal-info">
                    <div className="cal-event-title">{loc.label}</div>
                    <div className="cal-event-desc">{loc.description}</div>
                    <div className="cal-event-date">
                      {formatISODate(occ.gregorianStart)}
                      {occ.gregorianStart && occ.gregorianEnd && formatISODate(occ.gregorianStart) !== formatISODate(occ.gregorianEnd)
                        ? ' – ' + formatISODate(occ.gregorianEnd)
                        : ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* UNAVAILABLE EVENTS */}
      {unavailable.length > 0 && (
        <div className="cal-unavailable-list">
          <div className="cal-unavailable-list-title">{cal.unavailable || 'Not yet configured'}</div>
          {unavailable.map((occ, i) => {
            const e = eventById(occ.id)
            const loc = localizedEvent(e, lang, monthNames)
            return (
              <div key={i} className="cal-unavailable-item">
                {loc.label} — {cal.unavailableHint || ''}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
