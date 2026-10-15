import SeoHead from '../components/SeoHead'
import ContentSkeleton from '../components/ContentSkeleton'
import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '../context/LanguageContext'
import { trackCalendarNav, trackCalendarToggle } from '../utils/analytics'
import { loadStrings } from '../config/strings'
import { usePageContent } from '../config/content'
import { routeForPage } from '../config/pageRoutes'
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

// Maximum number of event dots shown on a single grid cell. Days can hold many
// events (up to ~27 from the recovered dataset), so cap the dots and show a
// "+N" marker instead of flooding the cell.
const GRID_MAX_DOTS = 3

const GREG_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDisplayDate({ y, m, d }) {
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatDayMonth({ y, m, d }) {
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// A vertical column (Monthly / Other) that scrolls its list within a fixed
// height — keeps the page compact no matter how many events exist.
// Capped at 50 initially for past events to avoid mounting thousands of DOM elements.
function EventColumn({ title, count, items, past, renderEventCard, moreLabel }) {
  const [limit, setLimit] = useState(50)
  const isCapped = past && items.length > limit
  const visibleItems = isCapped ? items.slice(0, limit) : items

  return (
    <div className="cal-col">
      <div className="cal-col-head">{title} <span className="cal-sec-count">{count}</span></div>
      {items.length ? (
        <div className="cal-ev-scroll">
          <div className="cal-ev-list">
            {visibleItems.map(occ => renderEventCard(occ, past))}
          </div>
          {isCapped && (
            <button
              type="button"
              className="cal-more-btn"
              onClick={() => setLimit(prev => prev + 50)}
            >
              {moreLabel || 'Show more (+50)'}
            </button>
          )}
        </div>
      ) : (
        <div className="cal-col-empty">—</div>
      )}
    </div>
  )
}

export default function Calendar() {
  const { lang } = useLanguage()
  const { data, loading } = usePageContent(lang, 'calendar')
  const [strings, setStrings] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all') // 'all' | 'major' | 'urs' | 'monthly'
  const [selectedDay, setSelectedDay] = useState(null) // null or cell object from grid
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
    if (!data) return
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
  }, [view, viewMode, data])

  // Reset view when toggling modes so nav starts at the current month
  const switchMode = (mode) => {
    if (!data) return
    if (mode === viewMode) return
    setViewMode(mode)
    localStorage.setItem('kqcmm_calendar_view', mode)
    trackCalendarToggle(mode)
    if (mode === 'gregorian') setView(gregorianMonthOf(todayLocal()))
    else {
      const cur = hijriMonthOf(data.monthStarts, todayLocal())
      const fallback = (data.monthStarts || []).find(ms => ms.gregorianStart)
      setView(cur || (fallback ? { year: fallback.hijriYear, month: fallback.hijriMonth } : null))
    }
  }

  // Memoize occurrence derivation: enumerateOccurrences builds brand-new object
  // identities every render. Without memoization the 60s today-tick re-render
  // would recompute + re-sort the lists, and an inconsistent sort comparator
  // (ties returning 1 both ways) could reorder equal-date items — causing React
  // to move DOM nodes and snap scroll back to the top mid-scroll.
  const occurrences = useMemo(() => {
    if (!data) return []
    return enumerateOccurrences(data)
  }, [data])

  const todayStr = formatISODate(today)
  const todayEvents = useMemo(() => {
    if (!occurrences) return []
    return occurrences.filter(o => o.available && o.gregorianStart && formatISODate(o.gregorianStart) === todayStr)
  }, [occurrences, todayStr])

  // Available occurrences sorted by start date (ascending). The comparator must
  // return 0 for equal dates (and tie-break by id) so equal-date items keep a
  // deterministic order — an inconsistent comparator can reorder same-day events
  // on re-render, which remounts list rows and resets the scroll position.
  const available = useMemo(() => {
    if (!occurrences) return []
    return occurrences
      .filter(o => o.available && o.gregorianStart)
      .sort((a, b) => {
        const sa = formatISODate(a.gregorianStart), sb = formatISODate(b.gregorianStart)
        if (sa < sb) return -1
        if (sa > sb) return 1
        return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
      })
  }, [occurrences])

  // Map event ids -> Gregorian day ordinal for marking grid cells
  const dayOrdKey = ({ y, m, d }) => `${y}-${m}-${d}`
  const eventByOrd = useMemo(() => {
    const map = new Map()
    if (!occurrences) return map
    occurrences.filter(o => o.available && o.gregorianStart).forEach(o => {
      const k = dayOrdKey(o.gregorianStart)
      const existing = map.get(k)
      if (existing) {
        existing.push(o)
      } else {
        map.set(k, [o])
      }
    })
    return map
  }, [occurrences])

  const grid = useMemo(() => {
    if (!view || !data) return { hasData: false }
    const g = viewMode === 'gregorian'
        ? buildGregorianMonthGrid(data.monthStarts, view, today)
        : buildMonthGrid(data.monthStarts, view, today)
    if (g.hasData) {
      const mappedCells = g.cells.map(cell => ({
        ...cell,
        events: eventByOrd.get(dayOrdKey(cell.gregorian)) || []
      }))
      return { ...g, cells: mappedCells }
    }
    return g
  }, [view, viewMode, data, today, eventByOrd])

  const eventMap = useMemo(() => {
    const map = new Map()
    if (!data?.events) return map
    for (const e of data.events) {
      if (e?.id) map.set(e.id, e)
    }
    return map
  }, [data])
  const eventById = (id) => eventMap.get(id)

  const monthNames = data?.monthNames || []

  // Filtered available occurrences based on search query and category filter
  const filteredAvailable = useMemo(() => {
    if (!available) return []
    const q = searchQuery.trim().toLowerCase()
    return available.filter(occ => {
      // Category filter
      if (activeFilter === 'monthly' && occ.rule !== 'hijri-monthly') return false
      if (activeFilter === 'major' && (occ.rule === 'hijri-monthly' || !occ.id?.startsWith('event-'))) return false
      if (activeFilter === 'urs' && !occ.id?.startsWith('blessed-')) return false
      // Search query
      if (!q) return true
      const ev = eventById(occ.id)
      const loc = localizedEvent(ev, lang, monthNames)
      return (loc.label && loc.label.toLowerCase().includes(q)) ||
             (loc.description && loc.description.toLowerCase().includes(q))
    })
  }, [available, searchQuery, activeFilter, lang, monthNames, eventMap])

  if (loading || !data) {
    return <ContentSkeleton rows={5} />
  }

  const content = data[lang] || data.en
  const title = content.title

  const todayH = todayHijri(data.monthStarts)
  const monthNamesShort = data.monthNamesShort || []

  const next = nextOccurrence(occurrences, today)
  const cal = strings?.calendar || {}

  const isMonthly = (occ) => occ.rule === 'hijri-monthly'

  const todayMonthly = todayEvents.filter(isMonthly)
  const todayOther = todayEvents.filter(o => !isMonthly(o))

  const currentMonth = viewMode === 'gregorian'
    ? gregorianMonthOf(today)
    : hijriMonthOf(data.monthStarts, today)
  const isCurrentView = view && currentMonth && view.year === currentMonth.year && view.month === currentMonth.month

  // Filtered available occurrences based on search query and category filter
  const isSearchingOrFiltering = Boolean(searchQuery.trim() || activeFilter !== 'all')

  const { eventList, pastEvents } = splitUpcomingPast(filteredAvailable, today)

  // Split events by type: monthly (recurring every month) vs. other (one-off).
  const monthlyUpcoming = eventList.filter(isMonthly)
  const otherUpcoming = eventList.filter(o => !isMonthly(o))
  const monthlyPast = pastEvents.filter(isMonthly)
  const otherPast = pastEvents.filter(o => !isMonthly(o))

  // Configured min/max Hijri months (only slots with a set gregorianStart)
  const configured = (data.monthStarts || []).filter(ms => ms.gregorianStart)
  const minMonth = configured.length
    ? { year: configured[0].hijriYear, month: configured[0].hijriMonth }
    : null
  const maxMonth = configured.length
    ? { year: configured[configured.length - 1].hijriYear, month: configured[configured.length - 1].hijriMonth }
    : null
  // Numeric month key for chronological comparisons. A string like
  // `${year}-${month}` sorts incorrectly (e.g. "1447-11" < "1447-3"
  // lexicographically), which disabled backward navigation past month 12 of
  // 1447 — making the first configured month unreachable in the Hijri grid.
  const keyOf = (m) => m ? m.year * 100 + m.month : 0
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
    trackCalendarNav('prev', next.year, next.month)
    return next
  })
  const goNext = () => setView(prev => {
    const next = shiftMonth(prev, 1)
    // bound to configured max in Hijri mode
    if (viewMode === 'hijri' && maxMonth && keyOf(next) > keyOf(maxMonth)) return prev
    trackCalendarNav('next', next.year, next.month)
    return next
  })
  const goToday = () => { if (currentMonth) { trackCalendarNav('today', currentMonth.year, currentMonth.month); setView(currentMonth) } }

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
      <SeoHead title="Islamic Calendar" path={routeForPage('calendar')} description="Upcoming Islamic events, important dates, and spiritual observances from the Chishti tradition." />
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
                ? hijriLabel(todayH.hijriYear, todayH.hijriMonth, todayH.hijriDay, monthNames, lang)
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
              {grid.cells.map(cell => {
                const isSelected = selectedDay && (
                  viewMode === 'gregorian'
                    ? selectedDay.day === cell.day
                    : selectedDay.hijriDay === cell.hijriDay
                )
                return (
                  <div
                    key={viewMode === 'gregorian' ? cell.day : cell.hijriDay}
                    className={'cal-grid-day' + (cell.isToday ? ' is-today' : '') + (cell.events.length ? ' has-event' : '') + (viewMode === 'gregorian' && cell.hijriDay === null ? ' no-hijri' : '') + (isSelected ? ' is-selected' : '')}
                    onClick={() => setSelectedDay(isSelected ? null : cell)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedDay(isSelected ? null : cell) } }}
                    title={cell.events.length ? `${cell.events.length} event${cell.events.length > 1 ? 's' : ''}` : ''}
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
                        {Array.from({ length: Math.min(cell.events.length, GRID_MAX_DOTS) }).map((_, i) =>
                          <span key={i} className="cal-grid-dot" />
                        )}
                        {cell.events.length > GRID_MAX_DOTS && (
                          <span className="cal-grid-more">+{cell.events.length - GRID_MAX_DOTS}</span>
                        )}
                      </span>
                    )}
                  </div>
                )
              })}
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

      {/* DAY INSPECTOR SHEET — shown when a day cell is clicked */}
      {selectedDay && (
        <div className="cal-day-inspector">
          <div className="cal-day-inspector-head">
            <div>
              <div className="cal-day-inspector-sub">
                {viewMode === 'gregorian'
                  ? (selectedDay.hijriDay != null ? hijriLabel(selectedDay.hijriYear, selectedDay.hijriMonth, selectedDay.hijriDay, monthNames, lang) : '')
                  : formatDisplayDate(selectedDay.gregorian)}
              </div>
              <div className="cal-day-inspector-title">
                {viewMode === 'gregorian'
                  ? formatDisplayDate(selectedDay.gregorian)
                  : `${selectedDay.hijriDay} ${monthNames[selectedDay.hijriMonth - 1] || ''} ${selectedDay.hijriYear}`}
              </div>
            </div>
            <button
              className="cal-day-inspector-close"
              onClick={() => setSelectedDay(null)}
              aria-label="Close day view"
            >✕</button>
          </div>
          <div className="cal-day-inspector-body">
            {selectedDay.events && selectedDay.events.length > 0 ? (
              <div className="cal-ev-list">
                {selectedDay.events.map(occ => renderEventCard(occ, false))}
              </div>
            ) : (
              <div className="cal-day-inspector-empty">
                {cal.noUpcoming || 'No events on this day'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SEARCH & CATEGORY FILTER BAR */}
      <div className="cal-filter-bar">
        <div className="cal-search-box">
          <span className="cal-search-icon" aria-hidden="true">🔍</span>
          <input
            type="search"
            className="cal-search-input"
            placeholder={cal.searchPlaceholder || 'Search 2,360+ events, saints, occasions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search events"
          />
          {searchQuery && (
            <button
              type="button"
              className="cal-search-clear"
              onClick={() => setSearchQuery('')}
              aria-label={cal.clearSearch || 'Clear search'}
            >✕</button>
          )}
        </div>
        <div className="cal-filter-chips">
          {[
            { key: 'all', label: cal.filterAll || 'All' },
            { key: 'major', label: cal.filterMajor || 'Festivals' },
            { key: 'urs', label: cal.filterUrs || 'Blessed Saints / Urs' },
            { key: 'monthly', label: cal.filterMonthly || 'Monthly' },
          ].map(f => (
            <button
              key={f.key}
              type="button"
              className={'cal-filter-chip' + (activeFilter === f.key ? ' active' : '')}
              onClick={() => setActiveFilter(f.key)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* WHEN FILTERING / SEARCHING: SHOW ACTIVE RESULTS */}
      {isSearchingOrFiltering ? (
        <div className="cal-row">
          <div className="cal-sec-head">
            <h3 className="cal-sec-title">
              {searchQuery ? `Search: "${searchQuery}"` : (cal.filterAll || 'Filtered Events')}
            </h3>
            <span className="cal-sec-count">{filteredAvailable.length}</span>
          </div>
          {filteredAvailable.length > 0 ? (
            <div className="cal-col-grid">
              <EventColumn
                title={cal.eventList || 'Upcoming Events'}
                count={eventList.length}
                items={eventList}
                past={false}
                renderEventCard={renderEventCard}
              />
              <EventColumn
                title={cal.pastEvents || 'Past Events'}
                count={pastEvents.length}
                items={pastEvents}
                past
                renderEventCard={renderEventCard}
                moreLabel={cal.showMore}
              />
            </div>
          ) : (
            <div className="cal-no-results">
              <p>{cal.noMatch || 'No events match your search'}</p>
              <button
                type="button"
                className="cal-clear-filters-btn"
                onClick={() => { setSearchQuery(''); setActiveFilter('all') }}
              >
                {cal.clearSearch || 'Clear search'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* TODAY'S EVENTS — all events mapped to today, split into
              Monthly | Other columns. When none are scheduled today, show the
              next upcoming event as a countdown strip instead. */}
          {todayEvents.length > 0 ? (
            <div className="cal-row">
              <div className="cal-sec-head">
                <h3 className="cal-sec-title">{cal.todayEvents || "Today's Events"}</h3>
                <span className="cal-sec-count">{todayEvents.length}</span>
              </div>
              <div className="cal-col-grid">
                <EventColumn title={cal.monthlyEvents || 'Monthly'} count={todayMonthly.length} items={todayMonthly} past={false} renderEventCard={renderEventCard} />
                <EventColumn title={cal.otherEvents || 'Other Events'} count={todayOther.length} items={todayOther} past={false} renderEventCard={renderEventCard} />
              </div>
            </div>
          ) : next ? (
            <div className="cal-nextstrip">
              <div className="cal-nextstrip-body">
                <div className="cal-nextstrip-label">{cal.nextEvent || 'Next Event'}</div>
                <div className="cal-nextstrip-title">
                  {(() => { const e = eventById(next.occurrence.id); return localizedEvent(e, lang, monthNames).label })()}
                </div>
                <div className="cal-nextstrip-date">
                  {hijriLabel(next.occurrence.hijriYear, next.occurrence.hijriMonth, next.occurrence.hijriDays[0], monthNames, lang)}
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

          {/* UPCOMING + PAST — both always visible; each shows Monthly | Other
              as two side-by-side vertical columns */}
          {(eventList.length > 0 || pastEvents.length > 0) && (
            <>
              {/* Upcoming */}
              {eventList.length > 0 && (
                <div className="cal-row">
                  <div className="cal-sec-head">
                    <h3 className="cal-sec-title">{cal.eventList || 'Upcoming Events'}</h3>
                    <span className="cal-sec-count">{eventList.length}</span>
                  </div>
                  <div className="cal-col-grid">
                    <EventColumn title={cal.monthlyEvents || 'Monthly'} count={monthlyUpcoming.length} items={monthlyUpcoming} past={false} renderEventCard={renderEventCard} />
                    <EventColumn title={cal.otherEvents || 'Other Events'} count={otherUpcoming.length} items={otherUpcoming} past={false} renderEventCard={renderEventCard} />
                  </div>
                </div>
              )}

              {/* Past */}
              {pastEvents.length > 0 && (
                <div className="cal-row">
                  <div className="cal-sec-head">
                    <h3 className="cal-sec-title">{cal.pastEvents || 'Past Events'}</h3>
                    <span className="cal-sec-count">{pastEvents.length}</span>
                  </div>
                  <div className="cal-col-grid">
                    <EventColumn title={cal.monthlyEvents || 'Monthly'} count={monthlyPast.length} items={monthlyPast} past renderEventCard={renderEventCard} moreLabel={cal.showMore} />
                    <EventColumn title={cal.otherEvents || 'Other Events'} count={otherPast.length} items={otherPast} past renderEventCard={renderEventCard} moreLabel={cal.showMore} />
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
