# Hijri Calendar & Islamic Events — Implementation Plan

> **✅ Status: v1 implemented (2026-08-01).** The app now ships an admin-maintained
> Hijri calendar where the admin sets the Gregorian start date of each Hijri month.
> See [Content System](content.md) and [Components](components.md) for the current
> schema and Calendar page. The options below describe the evolution path; the v1
> approach is documented first.

---

## The Problem

The Islamic calendar is lunar — months start based on actual moon sighting, which varies by location. A pre-calculated calendar (like Umm al-Qura) gives a "close enough" date, but a user in Mumbai may observe Eid on a different day than one in Mecca. We need a system that:

1. Shows today's Hijri date
2. Highlights upcoming Islamic events (Ramadan, Eid, Shab-e-Barat, etc.)
3. Can be adjusted per city/region for moon sighting differences
4. Works offline as much as possible

---

## v1 (Implemented): Admin-Maintained Month Starts (Recommended)

**Data source:** None — the admin directly enters the Gregorian date each Hijri month begins, based on local moon sighting. No location, API, or pre-calculated table.

**Schema** (`src/config/content/{lang}/calendar.json`, `schemaVersion: 1`; `en/` is the source of truth for `monthStarts` and carries the event `translations` map):
- Top-level `monthStarts`: a **free-form** list of `{ hijriYear, hijriMonth, gregorianStart }` entries — admins add/remove any months they need (not a fixed window). `gregorianStart` may be `null` until the admin confirms it.
- Top-level `events`: shared, language-independent rules. Each has a stable `id`, a `rule`, and optional language `translations`.
- `en`/`hinglish` hold only the localized page title (no duplicated event arrays).

**Event rules:**
```json
{ "id": "ashura", "rule": "hijri-fixed", "hijriMonth": 1, "hijriDays": [10], "label": "Ashura" }
```
```json
{ "id": "dec-event", "rule": "gregorian-month-hijri-relative", "gregorianMonth": 12, "hijriDays": [15, 16, 17], "label": "December Observance" }
```

- **Fixed Hijri:** always maps to the given Hijri month/day each year.
- **Gregorian-month-relative:** finds the Hijri month whose configured days **all** fall inside the target Gregorian month. Zero matches → unavailable; more than one → invalid (never guessed).

**Derivation** (`src/utils/hijriCalendar.js`, pure, no deps):
- Strict `YYYY-MM-DD` local-date parsing (never `new Date('YYYY-MM-DD')`).
- UTC-ordinal day arithmetic so DST never changes day counts.
- **Today's date** needs only the current month's start (`start + (day−1)`, day capped at 30).
- **Event days 1–29** map from the month's own start alone. **Day 30 defaults to valid**: every month is treated as 30 days long until a next-month boundary is set. Once set, only the proven length renders — a 29-day month excludes day 30 (that date doesn't exist that year), and the last configured month with no boundary still shows day 30.
- **Fixed events map only against their own `hijriMonth`** — never a different month's start.
- Produces today's Hijri date, mapped event occurrences (split into upcoming / past), and next-event countdown (0 = today).

**Admin editor:** A dedicated **📅 Calendar** tab in the admin panel edits `monthStarts` as a free-form add/remove/sort table (Hijri year + month + Gregorian start per row) and shared events with rule-specific controls (fixed / monthly / Gregorian-relative), validates before saving, and writes via `/api/calendar` (server-side schema validation). `calendar.json` is hidden from the generic Pages editor.

**Migration:** The old string-date events (`{ date: "12", month: "Rabi' al-Awwal" }`) were converted to fixed Hijri rules with IDs and translations preserved.

---

## Evolution Options (future)

The options below were considered for v1 and remain future paths if regional accuracy is ever needed.

### Option 1: Pre-calculated Umm al-Qura (one-size-fits-all)

---

## Option 1: Pre-calculated Umm al-Qura (one-size-fits-all)

**Data source:** Umm al-Qura calendar — pre-calculated mathematically for years ahead. Saudi Arabia's official calendar.

**Update mechanism:** Static JSON bundled with the app. Update once a year via `npm run build`.

**Location handling:** None — one calendar for everyone.

**Events:** Fixed dates relative to Hijri (Ramadan 1, Shawwal 1, Dhul Hijjah 10, etc.) computed from the pre-calculated table.

**How it works:**
```
public/hijri.json (pre-generated for 2026-2030)
  → src/utils/hijri.js converts today's Gregorian → Hijri
  → Calendar page highlights today + upcoming events
```

| Pros | Cons |
|---|---|
| Zero runtime deps | Doesn't match local moon sighting |
| Works offline perfectly | Eid might be 1 day off for many users |
| Trivial complexity | |

**Complexity:** 🟢 Very Low

---

## Option 2: Multiple pre-calculated calendars by region

**Data source:** Same pre-calculated approach but maintain 3–5 regional variants:
- Umm al-Qura (ME/Africa)
- Diyanet (Turkey/Europe)
- SPI (South Asia — India/Pakistan/Bangladesh)
- Fiqh Council (North America)
- Custom (user's local mosque)

**Update mechanism:** Static JSON with a regional key. Updated yearly.

**Location handling:** User picks their region in settings (or auto-detect from timezone/locale).

**Events:** Same events, different dates per region JSON.

**How it works:**
```
/hijri    /regions  Data
└── me.json     ← Umm al-Qura
└── tr.json     ← Diyanet
└── in.json     ← SPI South Asia
└── us.json     ← Fiqh Council NA
└── custom.json ← Manual offsets

User selects "South Asia" in settings → calendar loads in.json
```

| Pros | Cons |
|---|---|
| More accurate for more users | Still pre-calculated, could be wrong |
| Works offline | More JSON to maintain |
| User feels in control | |

**Complexity:** 🟡 Low-Medium

---

## Option 3: API-based (live moon data)

**Data source:** An Islamic calendar API such as [Aladhan API](https://aladhan.com/islamic-calendar-api) or [IslamicNetwork API](https://api.islamic.network/).

**Flow:**
```
App loads → gets user GPS (or manual city)
  → calls Aladhan API: /gToH?date=2026-07-24&city=Mumbai
  → API returns: { hijri: { day: 8, month: { number: 2, en: "Safar" }, year: 1448 } }
  → Calendar page renders events relative to returned Hijri date
```

**Update mechanism:** Every app launch or once a day — fetch from API. Cache result in localStorage for offline use for the remainder of the day.

**Location handling:**
- GPS → reverse geocode → city name → API call
- Or manual city search in settings
- City matters because moon sighting differs — Aladhan supports `city` + `country` params

**Events:** Compute from the API's returned Hijri date, or use a separate API endpoint for upcoming events.

| Pros | Cons |
|---|---|
| Most accurate — uses actual calculations per city | Requires internet on first load |
| No manual maintenance | API could go down |
| Always up to date | Rate limits |

**Complexity:** 🟠 Medium

---

## Option 4: Community-based / crowd-sourced sightings

**Data source:** Real moon sighting reports from users or local authorities.

**Flow:**
```
Admin dashboard (or script):
  1. On 29th of month, admin checks local moon sighting reports
  2. If moon sighted → month ends at 29 days
  3. If not sighted → month ends at 30 days
  4. Sets a flag in a config JSON → app picks it up

App:
  - Checks the sighting config on load
  - Adjusts calendar accordingly
  - Shows "Eid-al-Fitr confirmed: [date]" banner
```

**Update mechanism:** Firebase Realtime DB or a simple JSON hosted somewhere. Admin updates it twice a month.

**Location handling:** Per-city sighting records. Admin maintains a list of cities with their sighting status.

| Pros | Cons |
|---|---|
| Matches actual local moon sighting perfectly | Requires active admin |
| Community feels involved | Needs a backend (Firebase or similar) |
| Authoritative for the local community | Admin burden — 2 updates per month |

**Complexity:** 🔴 High

---

## Option 5: Hybrid — Pre-calculated + Manual Offset (superseded by v1)

**Data source:** Start with one pre-calculated calendar (e.g., SPI for South Asia since the app's audience is likely South Asian based on Urdu/Hinglish content).

**Offset mechanism:** Admin can set a **monthly offset** in a small JSON file:

```json
{
  "1448-02": 0,    // Safar — on schedule
  "1448-03": -1,   // Rabi I — 1 day earlier than calculated
  "1448-04": 1     // Rabi II — 1 day later
}
```

**Update flow:**
1. Admin checks local moon sighting news on 29th of each month
2. If needed, updates `offset.json` with `+1` or `-1` for the next month
3. Rebuild + deploy — or host the offset JSON on GitHub Pages as a separate file that the app fetches at runtime

**Location handling:** A single offset file per supported city/region. Users pick their city → app uses that city's offset.

**Long-term:** Offsets accumulate — if Rabi I was -1, next month's calculation starts from the adjusted date, not the original.

**Events:** All fixed Islamic events auto-adjust based on the cumulative offset.

| Pros | Cons |
|---|---|
| Offline-first (base calendar bundled) | Needs admin attention twice a month |
| Accurate once offset is set | Slight delay — admin must publish offset |
| Minimal complexity | |
| User picks their city | |
| No external API dependency | |

**Complexity:** 🟡 Low-Medium

---

## Why Option 5 was originally preferred (now superseded)

1. **Audience fit** — South Asian (Urdu/Hinglish) audience maps naturally to an SPI-based calendar
2. **Works offline** — base calendar bundled, only a small offset JSON needs occasional fetching
3. **Admin-controlled** — same workflow as editing content JSONs, less frequent
4. **No external API dependency** — no rate limits, downtime, or maintenance of API keys
5. **Progressive** — start with one city, add more later

**Why v1 replaced it:** the offset model requires cumulative math and admin thinking in
"±1 days from the base table". The v1 model (admin directly enters each month's Gregorian
start) matches how a local mosque actually works, has no accumulation bugs, and was smaller
to build. Offsets could return later if per-region variants are ever wanted.

---

## Implementation Notes (v1 shipped)

The v1 build followed a different, simpler shape than Option 5's steps:

| Area | What shipped | Location |
|---|---|---|
| Data | `monthStarts` (free-form list, nullable) + `events` (with per-language `translations`) | `src/config/content/{lang}/calendar.json` (`en/` is source of truth) |
| Logic | Pure conversion + event mapping + countdown | `src/utils/hijriCalendar.js` |
| Tests | 126 unit tests (no framework) | `scripts/test-hijri-calendar.mjs` (`npm test`) |
| Public UI | Today card, next-event countdown, event list | `src/pages/Calendar.jsx` |
| Admin | Dedicated 📅 Calendar tab, validated save | `scripts/admin/src/components/CalendarEditor.jsx` + `/api/calendar` |
| Tooling | fetch/translate scripts skip calendar (admin-managed) | `scripts/fetch-content.mjs`, `scripts/translate-content.mjs` |

---

## Blessed Days Dataset (recovered, v5.10.0)

The Islamic calendar now ships with **2,364 events**: the original 14 admin-managed events plus **2,350 individual `hijri-fixed` events** imported from the Blessed Days (thesunniway) dataset.

**Source of truth** — `scripts/data/events_merged.json` (2,350 records, ~1.9 MB). Each record has `id`, `englishName`/`urduName`, `day` (1–30), `month` (1–12), `wisalDate`, `eventType`/`eventEnglishName` (`PASSING OF` ×2,343, `BIRTHDAY OF` ×5, `BIG NIGHT` ×2), and `englishSuffix` honorifics.

**Generator** — `scripts/generate-calendar-events.mjs` (`npm run calendar:gen`):
- Reads `scripts/data/events_merged.json` + current `calendar.json`; deterministic + idempotent.
- Preserves all existing events; appends one event per record, id `thesunniway-<source id>`, `rule: hijri-fixed`, `hijriMonth`/`hijriDays` from source month/day.
- Label = `englishName` + `(englishSuffix)`; description = event type + `Wisal: N AH` when a meaningful year exists. No `translations` — source Urdu is preserved in `scripts/data/` only, not exposed as Hinglish.
- Sorted by month, day, numeric source id. The raw JSON lives under `scripts/` so it is **never bundled** into the Vite output.

**Regeneration:** after editing the source, run `npm run calendar:gen` and commit both the generator output and any script changes. Tests (`scripts/test-hijri-calendar.mjs`) assert count, uniqueness, 1:1 source mapping, and the label/description policy.

**Edge cases:** day-30 events in a month whose boundary proves 29 days are year-dependently excluded (the month has no 30th that year) — correct per the "default to 30 until proven" rule. The "Not yet configured" section was removed from the UI; the grid caps event dots at 3 with a `+N` marker, and the Hijri strip shows a capped dot cluster instead of event text.

---

## App Features That Could Use This

| Feature | What It Enables |
|---|---|
| **Hijri date in header** | "8 Safar 1448" shown on every page |
| **Calendar page** | Highlighted events with countdown, per-city adjustment |
| **Upcoming event banner** | "Eid al-Fitr in 14 days" on home page |
| **Splash screen** | Show today's Hijri date during splash |
| **Push notification** | (future) Notify on events |

---

## Related Docs
- [Architecture Overview](architecture.md)
- [Content System](content.md)
- [Suggestions](suggestions.md)
