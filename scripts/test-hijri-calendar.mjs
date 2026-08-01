#!/usr/bin/env node
/**
 * Unit tests for src/utils/hijriCalendar.js (pure, no framework).
 * Run: node scripts/test-hijri-calendar.mjs
 */
import {
  parseISODate,
  todayLocal,
  dayOrdinal,
  ordinalToDate,
  daysBetween,
  addDays,
  formatISODate,
  compareDates,
  validateCalendarConfig,
  gregorianToHijri,
  todayHijri,
  enumerateOccurrences,
  localizedEvent,
  hijriLabel,
  nextOccurrence,
  buildMonthGrid,
  hijriMonthOf,
} from '../src/utils/hijriCalendar.js'

let pass = 0, fail = 0
function assert(cond, name, extra = '') {
  if (cond) { pass++; console.log('  ✓', name) }
  else { fail++; console.log('  ✗', name, extra) }
}
function eq(a, b, name) { assert(a === b, name, `(got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`) }

console.log('--- date primitives ---')
assert(parseISODate('2026-07-15') !== null, 'parses valid ISO')
assert(parseISODate('2026-02-31') === null, 'rejects impossible day')
assert(parseISODate('2026-13-01') === null, 'rejects month 13')
assert(parseISODate('2026-01-1') === null, 'rejects non-zero-padded')
assert(parseISODate(null) === null, 'rejects null')
const p = parseISODate('2026-07-15')
eq(p.y, 2026, 'parse year'); eq(p.m, 7, 'parse month'); eq(p.d, 15, 'parse day')

// Day arithmetic
const d1 = parseISODate('2026-01-01'), d2 = parseISODate('2026-01-31')
eq(daysBetween(d1, d2), 30, 'days between Jan1-Jan31')
eq(formatISODate(addDays(d1, 30)), '2026-01-31', 'addDays Jan1+30')
eq(formatISODate(ordinalToDate(dayOrdinal(d1))), '2026-01-01', 'ordinal roundtrip')
eq(compareDates(d1, d2), -1, 'compare less')
eq(compareDates(d2, d1), 1, 'compare greater')
eq(compareDates(d1, d1), 0, 'compare equal')
// Leap year
const leap = parseISODate('2024-02-28')
eq(daysBetween(leap, parseISODate('2024-03-01')), 2, 'leap year Feb 28->Mar1')
// DST: date arithmetic must ignore DST (US DST Mar 2026)
const pre = parseISODate('2026-03-01'), post = parseISODate('2026-03-31')
eq(daysBetween(pre, post), 30, 'DST month span still 30 days')

console.log('--- validation ---')
const baseConfig = {
  monthStarts: [
    { hijriYear: 1447, hijriMonth: 1, gregorianStart: '2026-06-26' },
    { hijriYear: 1447, hijriMonth: 2, gregorianStart: '2026-07-26' },
    { hijriYear: 1447, hijriMonth: 3, gregorianStart: '2026-08-25' },
    { hijriYear: 1447, hijriMonth: 4, gregorianStart: '2026-09-24' },
  ],
  events: [{ id: 'a', rule: 'hijri-fixed', hijriMonth: 1, hijriDays: [10] }],
}
let v = validateCalendarConfig(baseConfig)
assert(v.ok, 'valid config passes')

const badOrder = {
  ...baseConfig,
  monthStarts: [
    { hijriYear: 1447, hijriMonth: 1, gregorianStart: '2026-07-26' },
    { hijriYear: 1447, hijriMonth: 2, gregorianStart: '2026-06-26' },
  ],
}
v = validateCalendarConfig(badOrder)
assert(!v.ok, 'rejects non-increasing starts')

const badLen = {
  ...baseConfig,
  monthStarts: [
    { hijriYear: 1447, hijriMonth: 1, gregorianStart: '2026-06-26' },
    { hijriYear: 1447, hijriMonth: 2, gregorianStart: '2026-07-01' }, // 5 days
  ],
}
v = validateCalendarConfig(badLen)
assert(!v.ok, 'rejects invalid month length (5 days)')

const dupId = { ...baseConfig, events: [...baseConfig.events, { id: 'a', rule: 'hijri-fixed', hijriMonth: 2, hijriDays: [1] }] }
v = validateCalendarConfig(dupId)
assert(!v.ok, 'rejects duplicate event id')

const badRule = { ...baseConfig, events: [{ id: 'x', rule: 'nope', hijriMonth: 1, hijriDays: [1] }] }
v = validateCalendarConfig(badRule)
assert(!v.ok, 'rejects unknown rule')

console.log('--- gregorian->Hijri ---')
// Muharram 1447 starts 2026-06-26. Jun 26 = 1 Muharram, Jul 1 = 6 Muharram.
const h1 = gregorianToHijri(parseISODate('2026-06-26'), baseConfig.monthStarts)
assert(h1.ok, 'first day of month maps')
eq(h1.hijriDay, 1, 'day 1'); eq(h1.hijriMonth, 1, 'month 1'); eq(h1.hijriYear, 1447, 'year 1447')
const h2 = gregorianToHijri(parseISODate('2026-07-01'), baseConfig.monthStarts)
assert(h2.ok && h2.hijriDay === 6, 'day 6 of Muharram (Jul 1)')
// After last covered month start (boundary not set) -> still resolves to that month's day
// (today's date only needs the containing month's start)
const h3 = gregorianToHijri(parseISODate('2026-10-01'), baseConfig.monthStarts)
assert(h3.ok, 'date after last covered month start still resolves (last month day 8)')
eq(h3.hijriDay, 8, 'h3 is 8th of 1447-4')
// Missing next boundary -> today's date still resolves (needs only current month start)
const missingNext = {
  monthStarts: [
    { hijriYear: 1447, hijriMonth: 1, gregorianStart: '2026-06-26' },
    { hijriYear: 1447, hijriMonth: 2, gregorianStart: null },
  ],
}
const h4 = gregorianToHijri(parseISODate('2026-06-30'), missingNext.monthStarts)
assert(h4.ok, 'month without next boundary still resolves today (day 5 of Muharram)')
eq(h4.hijriDay, 5, 'h4 is Muharram 5')
// Date beyond 30 days from start (no boundary) -> unavailable (can't be valid day)
const h5 = gregorianToHijri(parseISODate('2026-08-01'), missingNext.monthStarts)
assert(!h5.ok, 'date >30 days from start without boundary is unavailable')

console.log('--- event mapping: fixed ---')
const occs = enumerateOccurrences(baseConfig)
const ashura = occs.filter(o => o.id === 'a')
assert(ashura.length >= 1, 'fixed event has occurrences')
const firstAshura = ashura[0]
eq(formatISODate(firstAshura.gregorianStart), '2026-07-05', 'Ashura (Muharram 10) = Jun26+9 = Jul5')
assert(firstAshura.available, 'fixed event available')

console.log('--- event mapping: no boundary needed for days 1-29 ---')
// User scenario: only 1 Safar is set. "20 Safar" = start + 19 days, no boundary needed.
const singleMonth = {
  monthStarts: [
    { hijriYear: 1448, hijriMonth: 2, gregorianStart: '2026-07-16' },
    { hijriYear: 1448, hijriMonth: 3, gregorianStart: null }, // next month unknown
  ],
  events: [
    { id: 'safar20', rule: 'hijri-fixed', hijriMonth: 2, hijriDays: [20] },
    { id: 'safar29', rule: 'hijri-fixed', hijriMonth: 2, hijriDays: [29] },
    { id: 'safar30', rule: 'hijri-fixed', hijriMonth: 2, hijriDays: [30] }, // needs boundary
  ],
}
const smOccs = enumerateOccurrences(singleMonth)
const s20 = smOccs.find(o => o.id === 'safar20')
assert(s20.available, 'day 20 maps without boundary (Safar 1 + 19)')
eq(formatISODate(s20.gregorianStart), '2026-08-04', '20 Safar = 2026-07-16 + 19 = 2026-08-04')
const s29 = smOccs.find(o => o.id === 'safar29')
assert(s29.available, 'day 29 maps without boundary')
eq(formatISODate(s29.gregorianStart), '2026-08-13', '29 Safar = 2026-07-16 + 28 = 2026-08-13')
const s30 = smOccs.find(o => o.id === 'safar30')
assert(!s30.available, 'day 30 stays unavailable without boundary (could be a 29-day month)')

console.log('--- event mapping: gregorian-month-hijri-relative ---')
// Find a Hijri month whose days 15,16,17 all fall in December 2026.
// Muharram 1447 = Jun26..Jul25; Safar = Jul26..Aug24; RabiI=Aug25..Sep23; RabiII=Sep24..Oct23;
// JumI=Oct24..Nov22; JumII=Nov23..Dec22; Rajab=Dec23..Jan21 2027.
// Rajab days 15,16,17 = Dec 23+14=Jan6? No: Rajab starts Dec23, day15 = Dec23+14 = Jan6 2027.
// Jumada al-Thani starts Nov23; day15 = Nov23+14 = Dec7; day16=Dec8; day17=Dec9 -> all in December! ✓
const decConfig = {
  monthStarts: [
    { hijriYear: 1447, hijriMonth: 1, gregorianStart: '2026-06-26' },
    { hijriYear: 1447, hijriMonth: 2, gregorianStart: '2026-07-26' },
    { hijriYear: 1447, hijriMonth: 3, gregorianStart: '2026-08-25' },
    { hijriYear: 1447, hijriMonth: 4, gregorianStart: '2026-09-24' },
    { hijriYear: 1447, hijriMonth: 5, gregorianStart: '2026-10-24' },
    { hijriYear: 1447, hijriMonth: 6, gregorianStart: '2026-11-23' },
    { hijriYear: 1447, hijriMonth: 7, gregorianStart: '2026-12-23' },
  ],
  events: [
    { id: 'dec-event', rule: 'gregorian-month-hijri-relative', gregorianMonth: 12, hijriDays: [15, 16, 17] },
  ],
}
const decOccs = enumerateOccurrences(decConfig)
const decAvail = decOccs.filter(o => o.available)
eq(decAvail.length, 1, 'exactly one December-relative match')
if (decAvail[0]) {
  eq(formatISODate(decAvail[0].gregorianStart), '2026-12-07', 'Jumada II 15 = Dec 7')
  eq(formatISODate(decAvail[0].gregorianEnd), '2026-12-09', 'Jumada II 17 = Dec 9')
  eq(decAvail[0].hijriMonth, 6, 'matches Jumada al-Thani (month 6)')
}

// Zero-match: hijriDays 28,29,30 in December — JumII day28=Dec20, day29=Dec21, day30=Dec22 all in Dec!
// Actually that also matches. Try days that spill: hijriDays [1,2,3] of a month starting late Dec.
const zeroConfig = {
  monthStarts: decConfig.monthStarts,
  events: [{ id: 'never', rule: 'gregorian-month-hijri-relative', gregorianMonth: 12, hijriDays: [1, 2, 3] }],
}
// JumII days 1,2,3 = Nov23,24,25 (Nov, not Dec). Rajab days 1,2,3 = Dec23,24,25 (Dec!).
// So Rajab would match. Need a config with NO month where 1,2,3 all fall in Dec.
// JumII days1-3 in Nov. Rajab days1-3 in Dec. So 1 match. To force zero, use hijriDays [10,11,12]:
// JumII: Nov23+9=Dec2, Dec3, Dec4 -> all Dec! match again. Hard to force zero with full 12 months.
// Use a sparse config with only months that DON'T cover Dec days.
const zeroSparse = {
  monthStarts: [
    { hijriYear: 1447, hijriMonth: 1, gregorianStart: '2026-06-26' },
    { hijriYear: 1447, hijriMonth: 2, gregorianStart: '2026-07-26' },
  ],
  events: [{ id: 'never', rule: 'gregorian-month-hijri-relative', gregorianMonth: 12, hijriDays: [15, 16, 17] }],
}
const zeroOccs = enumerateOccurrences(zeroSparse)
eq(zeroOccs.filter(o => o.available).length, 0, 'zero-match relative event has no available occurrences')
assert(zeroOccs.some(o => !o.available), 'zero-match emits an unavailable record')

console.log('--- next occurrence + countdown ---')
const cfg4 = {
  monthStarts: decConfig.monthStarts,
  events: [
    { id: 'ashura', rule: 'hijri-fixed', hijriMonth: 1, hijriDays: [10] },
    { id: 'eid', rule: 'hijri-fixed', hijriMonth: 12, hijriDays: [10] },
  ],
}
const all = enumerateOccurrences(cfg4)
const today = parseISODate('2026-07-01')
const next = nextOccurrence(all, today)
assert(next !== null, 'finds a next occurrence')
assert(next.daysUntil >= 0, 'countdown is non-negative')
// Ashura (Jul 5) is the next after Jul 1
eq(formatISODate(next.occurrence.gregorianStart), '2026-07-05', 'next is Ashura Jul5')
eq(next.daysUntil, 4, 'countdown = 4 days')

// Today itself
const today2 = parseISODate('2026-07-05')
const next2 = nextOccurrence(all, today2)
eq(next2.daysUntil, 0, 'event today => 0 days')

// local helpers
assert(todayLocal().y >= 2026, 'todayLocal works')
const lbl = hijriLabel(1447, 1, 10, ['Muharram'])
eq(lbl, '10 Muharram 1447', 'hijriLabel format')
const loc = localizedEvent({ id: 'ashura', label: 'Ashura', translations: { hinglish: { label: 'Ashura ka din' } } }, 'hinglish', [])
eq(loc.label, 'Ashura ka din', 'localizedEvent override')
const loc2 = localizedEvent({ id: 'x', label: 'Default' }, 'urdu', [])
eq(loc2.label, 'Default', 'localizedEvent fallback to default label')

console.log('--- month grid ---')
// Safar 1448 starts 2026-07-16; today 2026-08-01 is in Safar.
const gridCfg = {
  monthStarts: [
    { hijriYear: 1448, hijriMonth: 1, gregorianStart: '2026-06-17' },
    { hijriYear: 1448, hijriMonth: 2, gregorianStart: '2026-07-16' },
    { hijriYear: 1448, hijriMonth: 3, gregorianStart: '2026-08-15' },
  ],
}
const g = buildMonthGrid(gridCfg.monthStarts, { year: 1448, month: 2 }, parseISODate('2026-08-01'))
assert(g.hasData, 'grid builds')
eq(g.year, 1448, 'grid year')
eq(g.month, 2, 'grid month is Safar')
eq(g.monthLen, 30, 'grid renders 30 cells')
eq(g.cells.length, 30, 'cell count')
const todayCell = g.cells.find(c => c.isToday)
assert(todayCell, 'grid has a today cell')
eq(todayCell.hijriDay, 17, 'today is Safar 17')
// Safar 1 = 2026-07-16 which is a Thursday (2026-07-16 weekday)
eq(g.firstWeekday, new Date(2026, 6, 16).getDay(), 'first weekday matches')
// First & last Gregorian mapping
eq(formatISODate(g.cells[0].gregorian), '2026-07-16', 'Safar 1 -> 2026-07-16')
eq(formatISODate(g.cells[29].gregorian), '2026-08-14', 'Safar 30 -> 2026-08-14')

// Navigate to a different month (Muharram 1448)
const g2 = buildMonthGrid(gridCfg.monthStarts, { year: 1448, month: 1 }, parseISODate('2026-08-01'))
assert(g2.hasData, 'previous month grid builds')
eq(g2.cells.length, 30, 'Muharram also 30 cells')
eq(formatISODate(g2.cells[0].gregorian), '2026-06-17', 'Muharram 1 -> 2026-06-17')
assert(!g2.cells.some(c => c.isToday), 'no today cell when viewing a past month')

// No month start set -> hasData false
const emptyGrid = buildMonthGrid([], { year: 1448, month: 2 }, parseISODate('2026-08-01'))
assert(!emptyGrid.hasData, 'grid without data returns hasData:false')

// hijriMonthOf
const mo = hijriMonthOf(gridCfg.monthStarts, parseISODate('2026-08-01'))
eq(mo.year, 1448, 'hijriMonthOf year')
eq(mo.month, 2, 'hijriMonthOf month (Safar)')

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
