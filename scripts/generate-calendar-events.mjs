#!/usr/bin/env node
/**
 * Generate the recovered Blessed-Days calendar events into calendar.json.
 *
 * Reads:
 *   1. The current calendar config (src/config/content/calendar.json)
 *   2. The recovered source records  (scripts/data/events_merged.json)
 *
 * Writes back calendar.json with ALL existing KQCMM events preserved, plus one
 * `hijri-fixed` event per recovered record. Records imported from the source are
 * namespaced with a `thesunniway-` id prefix. Regeneration is deterministic and
 * idempotent: prior generated entries are replaced, never duplicated.
 *
 * Usage:
 *   node scripts/generate-calendar-events.mjs
 *   node scripts/generate-calendar-events.mjs --source <path to events_merged.json>
 *
 * The generator only performs filesystem I/O on the two JSON files above; the
 * recovered JSON is NOT importable by the Vite bundle (it is never under src/).
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '..')

const calendarPath = join(repoRoot, 'src', 'config', 'content', 'calendar.json')
const defaultSource = join(__dirname, 'data', 'events_merged.json')

const SOURCE_PREFIX = 'thesunniway-'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function parseArgs(argv) {
  const args = { source: defaultSource }
  for (let i = 0; i < argv.length; i++) {
    if ((argv[i] === '--source' || argv[i] === '-s') && argv[i + 1]) {
      args.source = resolve(argv[i + 1])
      i++
    }
  }
  return args
}

/** Compose the human-readable event label for a recovered record. */
export function eventLabel(rec) {
  const name = rec.englishName || rec.urduName || `Event ${rec.id}`
  return rec.englishSuffix ? `${name} (${rec.englishSuffix})` : name
}

/** Compose the description: event type + wisal year when present. */
export function eventDescription(rec) {
  const parts = []
  if (rec.eventEnglishName) parts.push(rec.eventEnglishName)
  // Normalize a meaningful numeric wisal year (source uses "-" / "" / "NULL" for n/a).
  const wis = String(rec.wisalDate == null ? '' : rec.wisalDate).trim()
  if (wis && wis !== '-' && !/^(null|none|n\/a)$/i.test(wis)) {
    parts.push(`Wisal: ${wis} AH`)
  }
  return parts.join(' · ')
}

/** Build a calendar event record from a recovered source record. */
function toEvent(rec, idx) {
  const id = rec.id != null ? String(rec.id) : String(idx)
  const month = Number(rec.month)
  const day = Number(rec.day)
  if (!(month >= 1 && month <= 12) || !(day >= 1 && day <= 30)) {
    throw new Error(`Invalid source date for record id ${id}: month=${rec.month} day=${rec.day}`)
  }
  return {
    id: `${SOURCE_PREFIX}${id}`,
    rule: 'hijri-fixed',
    hijriMonth: month,
    hijriDays: [day],
    label: eventLabel(rec),
    description: eventDescription(rec),
  }
}

/** Partition calendar.events into prior generated entries vs. everything else. */
export function splitEvents(events, prefix = SOURCE_PREFIX) {
  const prior = []
  const kept = []
  for (const ev of events || []) {
    if (ev && typeof ev.id === 'string' && ev.id.startsWith(prefix)) prior.push(ev)
    else kept.push(ev)
  }
  return { prior, kept }
}

/** Deterministic sort key: Hijri month, Hijri day, then numeric source id. */
function eventSortKey(ev, recId) {
  const month = ev.hijriMonth || 0
  const day = (ev.hijriDays && ev.hijriDays[0]) || 0
  const num = Number(String(recId == null ? '' : recId).replace(/\D/g, '')) || 0
  return { month, day, num }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const calendar = readJson(calendarPath)
  const source = readJson(args.source)
  if (!Array.isArray(source)) throw new Error(`Source file ${args.source} must be a JSON array of records`)

  const { kept } = splitEvents(calendar.events || [])

  const generated = source
    .map((rec, idx) => ({ rec, ev: toEvent(rec, idx) }))
    .sort((a, b) => {
      const ka = eventSortKey(a.ev, a.rec.id)
      const kb = eventSortKey(b.ev, b.rec.id)
      if (ka.month !== kb.month) return ka.month - kb.month
      if (ka.day !== kb.day) return ka.day - kb.day
      return ka.num - kb.num
    })
    .map(({ ev }) => ev)

  calendar.events = [...kept, ...generated]
  writeFileSync(calendarPath, JSON.stringify(calendar, null, 2) + '\n', 'utf8')

  console.log('calendar.json regenerated:')
  console.log(`  existing events kept  : ${kept.length}`)
  console.log(`  generated events      : ${generated.length}`)
  console.log(`  total events          : ${calendar.events.length}`)
}

main()