/**
 * Hijri calendar logic — pure, dependency-free, timezone-safe.
 *
 * The admin maintains a rolling table of Gregorian start dates for each Hijri
 * month. Everything else (today's Hijri date, event mapping, countdown) is
 * derived from that table. No location, API, or browser-calendar fallback.
 *
 * Key rules:
 *  - A Gregorian date is treated as a LOCAL civil date ("YYYY-MM-DD"). We never
 *    call `new Date('YYYY-MM-DD')` (which parses as UTC in some engines).
 *  - Day arithmetic uses UTC ordinals so DST shifts never change day counts.
 *  - A month's length is only known when its own start AND the next start are
 *    set. Without both, the month is "unavailable" — we never guess.
 */

// ---------- date primitives ----------

const ISO_DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/** Parse "YYYY-MM-DD" into { y, m, d } (1-based month/day). Returns null if invalid. */
export function parseISODate(s) {
  if (typeof s !== 'string') return null
  const m = ISO_DAY_RE.exec(s)
  if (!m) return null
  const y = +m[1], mo = +m[2], d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  // Reject impossible dates like 2026-02-31
  const date = new Date(y, mo - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null
  return { y, m: mo, d }
}

/** Return { y, m, d } for "today" in local time. */
export function todayLocal() {
  const now = new Date()
  return { y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() }
}

/** Days since epoch for a civil date, using UTC math so DST never skews it. */
export function dayOrdinal({ y, m, d }) {
  return Date.UTC(y, m - 1, d) / 86400000
}

/** Convert an ordinal back to a local civil date object { y, m, d }. */
export function ordinalToDate(ord) {
  const d = new Date(ord * 86400000)
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() }
}

/** Whole-day difference: b - a in calendar days (DST-safe). */
export function daysBetween(a, b) {
  return dayOrdinal(b) - dayOrdinal(a)
}

/** Add `n` whole days to a civil date. */
export function addDays(date, n) {
  return ordinalToDate(dayOrdinal(date) + n)
}

/** Format a civil date as "YYYY-MM-DD". */
export function formatISODate({ y, m, d }) {
  const mm = String(m).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${y}-${mm}-${dd}`
}

/** Compare two civil dates. Returns -1, 0, or 1. */
export function compareDates(a, b) {
  const oa = dayOrdinal(a), ob = dayOrdinal(b)
  return oa < ob ? -1 : oa > ob ? 1 : 0
}

// ---------- calendar config lookup ----------

/**
 * Given the calendar config's `monthStarts` array (each with hijriYear,
 * hijriMonth, gregorianStart|null), build a lookup by `${year}-${month}`.
 */
function monthIndex(monthStarts) {
  const idx = new Map()
  for (const ms of monthStarts) {
    idx.set(`${ms.hijriYear}-${ms.hijriMonth}`, ms)
  }
  return idx
}

/** Parse a gregorianStart string into a civil date, or null if unset/invalid. */
function anchorDate(ms) {
  if (!ms || typeof ms.gregorianStart !== 'string') return null
  return parseISODate(ms.gregorianStart)
}

// ---------- validation ----------

/**
 * Validate a calendar config object. Returns { ok: true } or
 * { ok: false, errors: string[] }.
 */
export function validateCalendarConfig(cfg) {
  const errors = []
  const monthStarts = Array.isArray(cfg?.monthStarts) ? cfg.monthStarts : []

  if (monthStarts.length < 2) {
    errors.push('monthStarts must contain at least 2 entries (a month and its next boundary)')
  }

  // Ordering & duplicates (only among non-null starts)
  let lastOrd = -Infinity
  const seen = new Set()
  for (let i = 0; i < monthStarts.length; i++) {
    const ms = monthStarts[i]
    const key = `${ms?.hijriYear}-${ms?.hijriMonth}`
    if (seen.has(key)) errors.push(`duplicate month slot: ${key}`)
    seen.add(key)
    if (ms?.hijriYear < 1 || ms?.hijriMonth < 1 || ms?.hijriMonth > 12) {
      errors.push(`invalid Hijri slot at index ${i}: ${key}`)
    }
    const d = anchorDate(ms)
    if (!d) continue // null/unset is allowed (unavailable)
    const ord = dayOrdinal(d)
    if (ord <= lastOrd) errors.push(`gregorianStart not strictly increasing at ${key}`)
    lastOrd = ord
  }

  // Consecutive month lengths must be 29 or 30 days
  for (let i = 0; i + 1 < monthStarts.length; i++) {
    const a = anchorDate(monthStarts[i])
    const b = anchorDate(monthStarts[i + 1])
    if (!a || !b) continue
    const len = daysBetween(a, b)
    if (len !== 29 && len !== 30) {
      errors.push(`month length invalid: ${monthStarts[i].hijriYear}-${monthStarts[i].hijriMonth} is ${len} days (expected 29 or 30)`)
    }
  }

  // Events
  const events = Array.isArray(cfg?.events) ? cfg.events : []
  const eventIds = new Set()
  for (let i = 0; i < events.length; i++) {
    const ev = events[i]
    const where = `events[${i}] (${ev?.id || '?'})`
    if (!ev || typeof ev !== 'object') { errors.push(`${where}: not an object`); continue }
    if (typeof ev.id !== 'string' || !ev.id) errors.push(`${where}: missing id`)
    if (eventIds.has(ev.id)) errors.push(`${where}: duplicate id`)
    eventIds.add(ev.id)
    if (ev.rule === 'hijri-fixed') {
      if (ev.hijriMonth < 1 || ev.hijriMonth > 12) errors.push(`${where}: hijriMonth must be 1..12`)
      if (!Array.isArray(ev.hijriDays) || ev.hijriDays.length === 0 ||
          ev.hijriDays.some(d => !Number.isInteger(d) || d < 1 || d > 30)) {
        errors.push(`${where}: hijriDays must be non-empty integers 1..30`)
      }
    } else if (ev.rule === 'hijri-monthly') {
      // Repeats on the given Hijri day(s) every month — only hijriDays required.
      if (!Array.isArray(ev.hijriDays) || ev.hijriDays.length === 0 ||
          ev.hijriDays.some(d => !Number.isInteger(d) || d < 1 || d > 30)) {
        errors.push(`${where}: hijriDays must be non-empty integers 1..30`)
      }
    } else if (ev.rule === 'gregorian-month-hijri-relative') {
      if (ev.gregorianMonth < 1 || ev.gregorianMonth > 12) errors.push(`${where}: gregorianMonth must be 1..12`)
      if (!Array.isArray(ev.hijriDays) || ev.hijriDays.length === 0 ||
          ev.hijriDays.some(d => !Number.isInteger(d) || d < 1 || d > 30)) {
        errors.push(`${where}: hijriDays must be non-empty integers 1..30`)
      }
    } else {
      errors.push(`${where}: unknown rule "${ev?.rule}"`)
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true }
}

// ---------- Gregorian -> Hijri ----------

/** Result of a Hijri lookup. `ok:false` means data is missing/invalid. */
function unavailable() {
  return { ok: false }
}

/**
 * Convert a civil date to Hijri using the month-start table.
 *
 * Requires BOTH the containing month's start and the next month's start to be
 * known (the latter to prove the day fits). Returns:
 *  { ok:true, hijriYear, hijriMonth, hijriDay, gregorian: {y,m,d} }
 * or { ok:false }.
 *
 * Today's Hijri date needs ONLY the current month's start. The next month's
 * boundary is NOT required here — the admin sets each month's start as the moon
 * is sighted, and today's date should resolve as soon as the current month is
 * set (rather than waiting for the following month). Day is capped at 30 so a
 * date past the month's known start doesn't show a bogus day 31+; once the next
 * month's start is set, the exact 29/30-day length kicks in for event mapping.
 */
export function gregorianToHijri(date, monthStarts) {
  const ord = dayOrdinal(date)
  const idx = monthIndex(monthStarts)
  let anchor = null
  let anchorOrd = -Infinity

  for (const ms of monthStarts) {
    const d = anchorDate(ms)
    if (!d) continue
    const o = dayOrdinal(d)
    if (o <= ord && o > anchorOrd) {
      anchor = ms
      anchorOrd = o
    }
  }
  if (!anchor) return unavailable()

  const hijriDay = ord - anchorOrd + 1
  if (hijriDay < 1 || hijriDay > 30) return unavailable()

  return {
    ok: true,
    hijriYear: anchor.hijriYear,
    hijriMonth: anchor.hijriMonth,
    hijriDay,
    gregorian: { ...date },
  }
}

/** Get the Hijri date for today's local date. */
export function todayHijri(monthStarts) {
  return gregorianToHijri(todayLocal(), monthStarts)
}

// ---------- event mapping ----------

/**
 * Compute the Gregorian range for a fixed Hijri event within a given
 * Hijri month slot.
 *
 * Only the month's own start is required to place days 1–29 (every Hijri month
 * has at least 29 days, so start + (day-1) is always valid). The next month's
 * boundary is needed ONLY for day 30, because a 29-day month has no day 30.
 * Without the boundary, day 30 is treated as unavailable rather than guessed.
 *
 * Returns { ok:true, gregorianStart, gregorianEnd, hijriDays } or { ok:false }.
 */
function mapFixedEventToMonth(ev, ms, nextMs) {
  const start = anchorDate(ms)
  if (!start) return unavailable()
  const startOrd = dayOrdinal(start)
  const next = anchorDate(nextMs)
  const monthLen = next ? dayOrdinal(next) - startOrd : 30 // optimistic 30 until proven

  const gregorianDays = ev.hijriDays
    .map(d => ({ d, ord: startOrd + d - 1 }))
    // Day 30 defaults to valid: every month is treated as 30 days long until a
    // next-month boundary proves otherwise. Only when the boundary is set and
    // shows this month is genuinely 29 days is day 30 excluded.
    .filter(({ d }) => d <= 29 || !next || monthLen >= 30)
    .map(({ d, ord }) => ({ d, date: ordinalToDate(ord) }))
    .sort((a, b) => a.d - b.d)

  if (gregorianDays.length === 0) return unavailable()
  const dates = gregorianDays.map(g => g.date)

  return {
    ok: true,
    gregorianStart: dates[0],
    gregorianEnd: dates[dates.length - 1],
    hijriDays: ev.hijriDays,
    hijriYear: ms.hijriYear,
    hijriMonth: ms.hijriMonth,
  }
}

/**
 * Compute occurrences for a `gregorian-month-hijri-relative` event.
 * For each Gregorian calendar year in the covered span, find the single Hijri
 * month whose configured hijriDays all land inside the target Gregorian month.
 * Zero matches -> unavailable. More than one match -> invalid (never pick).
 */
function mapGregorianRelativeEvent(ev, monthStarts) {
  const results = []
  const idx = monthIndex(monthStarts)
  // Candidate months = every month with both anchors set
  const candidates = []
  for (let i = 0; i < monthStarts.length - 1; i++) {
    const ms = monthStarts[i]
    const start = anchorDate(ms)
    const next = anchorDate(monthStarts[i + 1])
    if (start && next) candidates.push({ ms, start, next })
  }

  // Group candidates by the Gregorian year they produce event dates in.
  // The mapping is: candidate month's hijriDays -> gregorian dates; accept if
  // all those dates fall in `gregorianMonth` AND in the same Gregorian year.
  for (const cand of candidates) {
    const startOrd = dayOrdinal(cand.start)
    const monthLen = dayOrdinal(cand.next) - startOrd
    const gregorianDays = ev.hijriDays
      .filter(d => d >= 1 && d <= monthLen)
      .map(d => ordinalToDate(startOrd + d - 1))

    if (gregorianDays.length !== ev.hijriDays.length) continue // some day out of range

    const allInTargetMonth = gregorianDays.every(g => g.m === ev.gregorianMonth)
    const sameYear = gregorianDays.every(g => g.y === gregorianDays[0].y)
    if (!allInTargetMonth || !sameYear) continue

    results.push({
      ok: true,
      gregorianStart: gregorianDays[0],
      gregorianEnd: gregorianDays[gregorianDays.length - 1],
      hijriYear: cand.ms.hijriYear,
      hijriMonth: cand.ms.hijriMonth,
      hijriDays: ev.hijriDays,
      targetGregorianYear: gregorianDays[0].y,
    })
  }

  // Group results by target Gregorian year; a year with >1 candidate is invalid
  const byYear = new Map()
  for (const r of results) {
    if (!byYear.has(r.targetGregorianYear)) byYear.set(r.targetGregorianYear, [])
    byYear.get(r.targetGregorianYear).push(r)
  }
  const out = []
  for (const [year, list] of byYear) {
    if (list.length === 1) out.push(list[0])
    // multiple matches in one Gregorian year => invalid, skip silently (caller treats as unavailable)
  }
  return out
}

/**
 * Enumerate all occurrences for every event across the covered Hijri window.
 * Returns an array of normalized occurrence records:
 *  { id, event, rule, hijriYear, hijriMonth, hijriDays, gregorianStart, gregorianEnd, available }
 * Unavailable events are included with available:false so the UI can show the
 * "not configured" state.
 */
export function enumerateOccurrences(cfg) {
  const monthStarts = cfg?.monthStarts || []
  const events = cfg?.events || []
  const out = []

  for (const ev of events) {
    if (ev.rule === 'hijri-fixed' || ev.rule === 'hijri-monthly') {
      const isMonthly = ev.rule === 'hijri-monthly'
      // hijri-fixed maps against the slot for ITS month only (never a different
      // month). hijri-monthly maps against EVERY month slot (recurs monthly),
      // including the last configured month (days 1-29 need no boundary).
      for (let i = 0; i < monthStarts.length - 1; i++) {
        const ms = monthStarts[i]
        if (!isMonthly && ms.hijriMonth !== ev.hijriMonth) continue
        const nextMs = monthStarts[i + 1]
        const r = mapFixedEventToMonth(ev, ms, nextMs)
        if (r.ok) {
          out.push({ id: ev.id, rule: ev.rule, hijriYear: r.hijriYear, hijriMonth: r.hijriMonth, hijriDays: r.hijriDays, gregorianStart: r.gregorianStart, gregorianEnd: r.gregorianEnd, available: true })
        } else if (anchorDate(ms)) {
          // month start exists but event days don't fit / boundary missing
          out.push({ id: ev.id, rule: ev.rule, hijriYear: ms.hijriYear, hijriMonth: ms.hijriMonth, hijriDays: ev.hijriDays, available: false })
        }
      }
      // The LAST configured month has no following boundary, so the loop above
      // skips it. Days 1-29 of a month need only the month's own start (every
      // Hijri month has at least 29 days; day 30 stays unavailable without a
      // boundary). Map the last month for BOTH rules when it applies — otherwise
      // a fixed event landing in the final configured month would never show
      // (e.g. Eid Milad-un-Nabi in Rabi' al-Awwal 1448, the last slot in the
      // table). Mirror the loop's unavailable handling too, so a day-30 event
      // in the last month surfaces as "not configured" instead of vanishing.
      if (monthStarts.length) {
        const ms = monthStarts[monthStarts.length - 1]
        if (ms.gregorianStart && (isMonthly || ms.hijriMonth === ev.hijriMonth)) {
          const r = mapFixedEventToMonth(ev, ms, null)
          if (r.ok) {
            out.push({ id: ev.id, rule: ev.rule, hijriYear: r.hijriYear, hijriMonth: r.hijriMonth, hijriDays: r.hijriDays, gregorianStart: r.gregorianStart, gregorianEnd: r.gregorianEnd, available: true })
          } else {
            out.push({ id: ev.id, rule: ev.rule, hijriYear: ms.hijriYear, hijriMonth: ms.hijriMonth, hijriDays: ev.hijriDays, available: false })
          }
        }
      }
    } else if (ev.rule === 'gregorian-month-hijri-relative') {
      const occs = mapGregorianRelativeEvent(ev, monthStarts)
      if (occs.length === 0) {
        // No match: show one unavailable record so admins/users see the rule exists
        out.push({ id: ev.id, rule: ev.rule, hijriDays: ev.hijriDays, gregorianMonth: ev.gregorianMonth, available: false })
      } else {
        for (const r of occs) {
          out.push({ id: ev.id, rule: ev.rule, hijriYear: r.hijriYear, hijriMonth: r.hijriMonth, hijriDays: r.hijriDays, gregorianStart: r.gregorianStart, gregorianEnd: r.gregorianEnd, available: true })
        }
      }
    }
  }

  return out
}

/** Pick the label/description for an event in a given language. */
export function localizedEvent(event, lang, monthNames) {
  const t = event?.translations?.[lang]
  const label = t?.label || event?.label || event?.id
  const description = t?.description || event?.description || ''
  return { label, description, monthNames }
}

/** Human Hijri label, e.g. "10 Muharram 1448". */
export function hijriLabel(hijriYear, hijriMonth, hijriDay, monthNames) {
  const names = monthNames || []
  const monthName = names[hijriMonth - 1] || String(hijriMonth)
  return `${hijriDay} ${monthName} ${hijriYear}`
}

/**
 * Find the earliest occurrence at or after `today` (a civil date) among the
 * available ones. Returns { occurrence, daysUntil } or null if none.
 */
export function nextOccurrence(occurrences, today) {
  const tOrd = dayOrdinal(today)
  let best = null
  let bestOrd = Infinity
  for (const occ of occurrences) {
    if (!occ.available || !occ.gregorianStart) continue
    const o = dayOrdinal(occ.gregorianStart)
    if (o >= tOrd && o < bestOrd) {
      bestOrd = o
      best = occ
    }
  }
  if (!best) return null
  return { occurrence: best, daysUntil: bestOrd - tOrd }
}

/**
 * Build a weekday-aligned grid for a specific Hijri month.
 * Returns { hasData, year, month, monthLen, firstWeekday, cells } where each
 * cell is { hijriDay, gregorian, isToday, eventIds }.
 *
 * - `target` = { year, month } (the Hijri month to render). The target's start
 *   must be set to build the grid.
 * - `today` = today's civil date, used to mark the "today" cell when the target
 *   is the current month.
 * - Month length is 30 cells (the 30th day is only "confirmed" when the next
 *   boundary proves 30 days; without it day-30 events stay unavailable, but the
 *   day is still shown).
 * - Each cell's `gregorian` is the mapped civil date, so the UI can show both
 *   Hijri day and Gregorian date.
 * - Weekday alignment uses the Gregorian weekday of Hijri day 1 (0=Sun..6=Sat).
 * - `hasData:false` if the target month's start isn't set.
 */
export function buildMonthGrid(monthStarts, target, today) {
  const anchor = monthStarts.find(ms => ms.hijriYear === target.year && ms.hijriMonth === target.month)
  if (!anchor) return { hasData: false }
  const start = anchorDate(anchor)
  if (!start) return { hasData: false }

  const next = monthStarts.find(ms =>
    (ms.hijriYear === target.year && ms.hijriMonth === target.month + 1) ||
    (ms.hijriYear === target.year + 1 && target.month === 12 && ms.hijriMonth === 1)
  )
  const nextStart = next ? anchorDate(next) : null
  const startOrd = dayOrdinal(start)
  // Month length: default to 30 (optimistic — treat every month as 30 days until
  // the next boundary is set). Once the boundary is set, cap the grid at the
  // proven length so a 29-day month does NOT render a phantom day 30 that spills
  // into the next month (e.g. "30 Muharram" = actually 1 Safar in the Gregorian view).
  const monthLen = nextStart ? dayOrdinal(nextStart) - startOrd : 30

  const todayOrd = today ? dayOrdinal(today) : -Infinity
  const firstWeekday = new Date(start.y, start.m - 1, start.d).getDay()

  const cells = []
  for (let hijriDay = 1; hijriDay <= monthLen; hijriDay++) {
    const g = ordinalToDate(startOrd + hijriDay - 1)
    const gOrd = dayOrdinal(g)
    cells.push({ hijriDay, gregorian: g, isToday: gOrd === todayOrd, eventIds: [] })
  }
  return { hasData: true, year: target.year, month: target.month, monthLen, firstWeekday, cells }
}

/** The Hijri { year, month } that contains a civil date, or null if unknown. */
export function hijriMonthOf(monthStarts, date) {
  const ord = dayOrdinal(date)
  let anchor = null
  let anchorOrd = -Infinity
  for (const ms of monthStarts) {
    const d = anchorDate(ms)
    if (!d) continue
    const o = dayOrdinal(d)
    if (o <= ord && o > anchorOrd) { anchor = ms; anchorOrd = o }
  }
  return anchor ? { year: anchor.hijriYear, month: anchor.hijriMonth } : null
}

/**
 * Build a weekday-aligned grid for a Gregorian month. Each cell is
 * { day, gregorian, hijriDay, hijriMonth, hijriYear, isToday }.
 *
 * - `target` = { year, month } (Gregorian; month is 1-based).
 * - The Gregorian month's weekday alignment comes from its own day 1.
 * - Each Gregorian day is converted to a Hijri day using the month-start table;
 *   `hijriDay` is null if that date isn't within a configured month.
 * - `hasData:false` is never returned — a Gregorian month always exists — but
 *   cells whose Hijri mapping is unknown have `hijriDay: null`.
 */
export function buildGregorianMonthGrid(monthStarts, target, today) {
  const y = target.year
  const m = target.month // 1-based
  const daysInMonth = new Date(y, m, 0).getDate()
  const firstWeekday = new Date(y, m - 1, 1).getDay()
  const todayOrd = today ? dayOrdinal(today) : -Infinity

  const cells = []
  for (let day = 1; day <= daysInMonth; day++) {
    const g = { y, m, d: day }
    const hijri = gregorianToHijri(g, monthStarts)
    cells.push({
      day,
      gregorian: g,
      hijriDay: hijri.ok ? hijri.hijriDay : null,
      hijriMonth: hijri.ok ? hijri.hijriMonth : null,
      hijriYear: hijri.ok ? hijri.hijriYear : null,
      isToday: dayOrdinal(g) === todayOrd,
    })
  }
  return { hasData: true, year: y, month: m, daysInMonth, firstWeekday, cells }
}

/** The Gregorian { year, month } (1-based) that contains a civil date. */
export function gregorianMonthOf(date) {
  return { year: date.y, month: date.m }
}

/**
 * Split available occurrences into upcoming (>= today) and past (< today)
 * lists for display, applying the right dedup:
 *  - Fixed events produce one occurrence per Hijri year, so only a single
 *    representative should be listed (dedup by id).
 *  - Monthly events produce a distinct occurrence per Hijri month. The UPCOMING
 *    list shows only the next one (dedup by id, to avoid flooding), but the
 *    PAST list shows EVERY past occurrence (each is a real past date).
 *
 * Input `available` should already be sorted ascending by gregorianStart.
 * Returns { eventList, pastEvents }. `eventList` is ascending (earliest future
 * first); `pastEvents` is DESCENDING (newest past first).
 */
export function splitUpcomingPast(available, today) {
  const todayStr = formatISODate(today)
  const seenUp = new Set(), seenPast = new Set()
  const eventList = available.filter(o => {
    if (o.gregorianStart && formatISODate(o.gregorianStart) < todayStr) return false
    if (seenUp.has(o.id)) return false
    seenUp.add(o.id)
    return true
  })
  // Walk available in reverse (newest past first), dedup, and DON'T reverse back —
  // so pastEvents comes out descending (newest first).
  const pastEvents = [...available]
    .reverse()
    .filter(o => {
      if (!(o.gregorianStart && formatISODate(o.gregorianStart) < todayStr)) return false
      const k = o.rule === 'hijri-monthly' ? `${o.id}#${o.hijriYear}-${o.hijriMonth}` : o.id
      if (seenPast.has(k)) return false
      seenPast.add(k)
      return true
    })
  return { eventList, pastEvents }
}
