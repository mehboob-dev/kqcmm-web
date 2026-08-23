# GA4 Console Setup Handbook

Everything you configure in the **Google Analytics console** (no code changes).
Terminology: a *property* is your kqcmm-web analytics account in GA4; a *data
stream* is the web stream feeding it. These steps assume you already created the
property + web data stream for `https://mehboob-dev.github.io/kqcmm-web/`.

> **Where is the Measurement ID?** Admin → Data streams → your Web stream →
> top of the page. It's the `G-XXX…` value already in `index.html`.

---

## A. Mark events as conversions (goals)

Converts any collected event into a goal so it shows as a counted number in
reports and can appear in your overview dashboard. **No code needed.**

1. **Admin** (gear, bottom-left) → **Data streams** → your **Web** stream.
2. Scroll to the **"Google tag"** card → click **"Configure tag settings"**.
3. Click **"Show all"** near the list of events.
4. Find the event and toggle **"Mark as conversion"**:
   - `pwa_install` — how many users installed the app ✅ recommended
   - `session_start` — total sessions (usually already a conversion)
   - `select_language`, `select_theme`, `adjust_font_size` — preference changes
   - `counter_use`, `quick_jump_select`, `slide_view` — content engagement
   - `share_used` — how often the app is shared
5. Once marked, view them under **Reports → Engagement → Conversions**, or open
   **Reports → Realtime** and switch the metric.

**To set one as the property's primary conversion** (shows on the dashboard
overview): **Admin → Property → "Conversions"** → set a primary conversion event.

---

## B. Exclude your own / development traffic

Your own testing inflates user counts. Add a **Data Filtering** rule for your IP.

1. **Admin** → **Data filters** (or **Data settings → Data filtering**).
2. Click **Create filter**.
3. Name it e.g. `internal-ip` → filter type **"Internal traffic"**.
4. Choose the stream, set **traffic type** = IP address, and enter your IP
   (or a prefix/range). Your public IP: search "what's my IP".
5. Set the filter **State = Active** and save.

Data rows tagged internal traffic now carry `Aparna` — you can either hide them
in reports via the filter state, or fully drop them once the filter is **Active**
and applied. Give filters up to 24 h to fully apply. Remember your IP may change
(on mobile, or restarting home router) — update the rule then.

---

## E. Register dimensions + build a KQCMM dashboard

Turn custom event params into **dimensions** so you can segment (e.g. see user
counts by theme or language), then save a report.

1. **Register dimensions** — **Admin → Custom definitions → Create custom
   dimension**. Choose **Event** scope. The **param name must exactly match**
   what the code sends (from `src/utils/analytics.js`). Suggested registrations:
   | Event | Params you may want as dimensions |
   |---|---|
   | `select_theme` | `theme` |
   | `select_language` | `language` |
   | `select_view_mode` | `view_mode` |
   | `counter_use` | `counter_action`, `count` |
   | `slide_view` | `section`, `slide_index` |
   | `adjust_font_size` | `font_size` |
   | `select_font_family` | `font_family` |
   | `share_used` | `share_method` |
   | `quick_jump_select` | `page`, `section_index` |
   | `calendar_nav` | `calendar_direction`, `year`, `month` |
   | `calendar_toggle` | `calendar_view` |

   Dimensions begin collecting from the moment they're created — they don't
   backfill historical hits.

2. **Build a saved dashboard:**
   - **Reports → Reports snapshot → "+ New custom report"** (or **Explore** for
     free-form).
   - Add dimensions (e.g. **Language**, **Theme**) and metrics (Users, Active
     Users, Event count).
   - Filter by **Event (event name)** for the events you care about, or use two
     tabs: *Overview* and *Engagement*.
   - **Save** — it appears under **Reports → Library**.

---

## G. Custom Exploration Reports (Users, Locations & Actions)

The **Explore** workspace in GA4 is the most flexible tool to analyze locations and custom interactions dynamically:

1. Click on **Explore** (compass icon, left-hand menu) → Click **Blank** to start a new exploration.
2. **Add Dimensions (Variables column):**
   - Click **`+`** next to **Dimensions**.
   - Search and import geographic dimensions: **City**, **Country**, and **Region**.
   - Search and import custom dimensions: **Language**, **Theme**, **View Mode**, and **Counter Action**.
3. **Add Metrics (Variables column):**
   - Click **`+`** next to **Metrics**.
   - Search and import metrics: **Active users**, **Event count**, and **Event count per active user**.
4. **Build the Table (Settings column):**
   - **Rows:** Drag and drop **City** or **Country** (to see geographical traffic) or your custom dimensions (to see preferences/actions) into the **ROWS** box.
   - **Values:** Drag and drop **Active users** and **Event count** into the **VALUES** box.

---

## H. Troubleshooting "(not set)" & Missing Data

When viewing custom dimensions or location data, you will often see **`(not set)`** or notice missing countries/cities (like Canada or Dhaka). Here is why and how to handle it:

### 1. Custom Dimensions do not backfill past data
* **Why:** GA4 only maps custom dimensions *after* they are registered in the console. Historical data will always show as `(not set)`.
* **Fix:** Wait 24–48 hours for new traffic to flow in.

### 2. Typo in Event Parameter name
* **Why:** If the Event Parameter configured in the GA4 Console does not match the lowercase keys emitted by the React code in `src/utils/analytics.js`, it will stay `(not set)`.
* **Fix:** In **Admin → Custom definitions**, edit your dimension and verify the parameter matches:
  - Theme: **`theme`**
  - Language: **`language`**
  - View Mode: **`view_mode`**
  - Counter Action: **`counter_action`**

### 3. Data Thresholding (Low Traffic Privacy)
* **Why:** In geographic reports, if you have low traffic (e.g., <50 active users) and only a few visitors from a specific city (like Dhaka or Toronto), Google's privacy rules automatically hide those rows to protect user identities. They are either omitted from the list or grouped under `(not set)`.
* **Fix:** View the report at the **Country** or **Region** level instead of **City**, which aggregates the data and bypasses the thresholding limit. Alternatively, verify live traffic in the **Realtime** report (which does not apply thresholding).

### 4. Privacy & Network Routing
* **Why:** Users using VPNs, Apple iCloud Private Relay, or privacy-oriented browsers (like Brave with Shields Up) block or mask network metadata and IP addresses, forcing GA4 to record them as `(not set)`.

---

## F. Enhanced measurement events (built-in, recommend turning on)

GA4's **Enhanced measurement** turns on common events with no code. It's
sometimes partially enabled for a new Web stream already — enable the rest.

1. **Admin → Data streams** → your **Web** stream.
2. Click **Google tag → "Configure tag settings"**.
3. Select **Enhanced measurement** → toggle events ON:
   - **Page views** — usually already on
   - **Scrolls** — records `scroll` (90% depth)
   - **Outbound clicks** — `click` on external links (e.g. YouTube/spiritual talks)
   - **Site search** — `view_search_results` (only if you add search later)
   - **File downloads** — `file_download`
   - **Form interactions** — engagement (if you add a contact form later)

These appear automatically in Events reports; no code needed. Note: since KQCMM
is a SPA, the built-in **Page views** and the `page_view` you already send from
`Layout.jsx` both report — GA4 dedupes them, so keeping both is fine.

---

## Quick summary

| Action | Where | Code? |
|---|---|---|
| A. Conversions | Admin → Data streams → Configure tag settings | No |
| B. Exclude own IP | Admin → Data filters → Internal traffic | No |
| C. Error tracking | `src/utils/analytics.js` + `main.jsx` | **Yes** ✅ done |
| D. More events | various components | **Yes** ✅ done |
| E. Dimensions + dashboard | Admin → Custom definitions + Explore | No |
| F. Enhanced measurement | Admin → Data streams → tag settings | No |
| G. Explore reports | Explore → Blank → drag Dimensions & Metrics | No |
| H. Debug "(not set)" | Admin → Custom definitions / Geography level | No |