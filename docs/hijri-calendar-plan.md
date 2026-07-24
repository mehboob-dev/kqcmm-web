# Hijri Calendar & Islamic Events — Implementation Plan

How to add a Hijri calendar with Islamic events, moon-sighting accuracy, and location-aware dates.

---

## The Problem

The Islamic calendar is lunar — months start based on actual moon sighting, which varies by location. A pre-calculated calendar (like Umm al-Qura) gives a "close enough" date, but a user in Mumbai may observe Eid on a different day than one in Mecca. We need a system that:

1. Shows today's Hijri date
2. Highlights upcoming Islamic events (Ramadan, Eid, Shab-e-Barat, etc.)
3. Can be adjusted per city/region for moon sighting differences
4. Works offline as much as possible

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

## Option 5: Hybrid — Pre-calculated + Manual Offset (★ Recommended)

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

## Why Option 5 is Recommended

1. **Audience fit** — South Asian (Urdu/Hinglish) audience maps naturally to an SPI-based calendar with monthly offsets
2. **Works offline** — base calendar bundled, only the small offset JSON needs occasional fetching
3. **Admin-controlled** — same workflow as editing content JSONs, less frequent
4. **No external API dependency** — no rate limits, downtime, or maintenance of API keys
5. **Progressive** — start with one city, add more later

---

## Implementation Steps (Option 5)

| Step | What | Notes |
|---|---|---|
| 1 | Generate a Hijri calendar JSON (2026–2030) | Use `hijri-js` library or pre-computed table |
| 2 | Build a `useHijriDate()` hook | Converts today → Hijri using calendar + any active offset |
| 3 | Create `config/calendar-offset.json` | Admin adjustments — empty to start |
| 4 | Add city/region picker in settings | Default to auto-detect from locale/timezone |
| 5 | Rewrite Calendar page | Live Hijri dates + event lookup from `calendar.json` |
| 6 | Host offset JSON on GitHub Pages | Fetchable URL so admin can update without rebuilding |

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
