# GA4 Custom Exploration Reports & Troubleshooting

This handbook guides you through creating custom analytical reports in the Google Analytics 4 **Explore** workspace, tracking geographic traffic, and troubleshooting missing values or `(not set)` rows.

---

## 1. Custom Exploration Reports (Users, Locations & Actions)

The **Explore** workspace in GA4 is the most flexible tool to analyze locations and custom interactions dynamically:

### Step A: Start a new exploration
1. Log in to your [Google Analytics Console](https://analytics.google.com/).
2. Select the **KQCMM** property.
3. Click on **Explore** (compass icon, left-hand menu).
4. Click **Blank** to start a new exploration.

### Step B: Add Dimensions (Variables column)
1. In the left-hand **Variables** panel, click **`+`** next to **Dimensions**.
2. Search, select, and import geographic dimensions:
   - **City** (under the *Geography* category)
   - **Country**
   - **Region**
3. Search, select, and import custom dimensions (these must be registered first in Admin under *Custom Definitions*):
   - **Language**
   - **Theme**
   - **View Mode**
   - **Counter Action**
4. Click the blue **Import** button in the top-right corner.

### Step C: Add Metrics (Variables column)
1. Click **`+`** next to **Metrics** in the **Variables** panel.
2. Search, select, and import:
   - **Active users**
   - **Event count**
   - **Event count per active user**
3. Click the blue **Import** button in the top-right corner.

### Step D: Build the Table (Settings column)
1. **Rows:** Drag and drop **City** or **Country** (to see geographical traffic) or your custom dimensions (e.g., **Theme** to see custom swatches preferences) into the **ROWS** box.
2. **Values:** Drag and drop **Active users** and **Event count** into the **VALUES** box.

The center report will immediately generate a custom spreadsheet-style report tailored to these coordinates.

---

## 2. Troubleshooting "(not set)" & Missing Data

When viewing custom dimensions or location data, you will often see **`(not set)`** or notice missing countries/cities (like Canada or Dhaka). Here is why and how to handle it:

### A. Custom Dimensions do not backfill past data
* **Why:** GA4 only maps custom dimensions *after* they are registered in the console. Historical data will always show as `(not set)`.
* **Fix:** Verify you have registered the dimension in **Admin → Custom Definitions** and wait 24–48 hours for new traffic to flow in.

### B. Typo in Event Parameter name
* **Why:** If the Event Parameter configured in the GA4 Console does not match the lowercase keys emitted by the React code in `src/utils/analytics.js`, it will stay `(not set)`.
* **Fix:** Go to **Admin → Custom definitions**, edit your custom dimension, and verify the **Event parameter** matches exactly:
  - Theme: **`theme`**
  - Language: **`language`**
  - View Mode: **`view_mode`**
  - Counter Action: **`counter_action`**

### C. Data Thresholding (Low Traffic Privacy)
* **Why:** In geographic reports, if you have low traffic (e.g., <50 active users) and only a few visitors from a specific city (like Dhaka or Toronto), Google's privacy rules automatically hide those rows to protect user identities. They are either omitted from the list or grouped under `(not set)`.
* **Fix:** View the report at the **Country** or **Region** level instead of **City**, which aggregates the data and bypasses the thresholding limit. Alternatively, verify live traffic in the **Realtime** report (which does not apply thresholding).

### D. Privacy & Network Routing
* **Why:** Users using VPNs, Apple iCloud Private Relay, or privacy-oriented browsers (like Brave with Shields Up) block or mask network metadata and IP addresses, forcing GA4 to record them as `(not set)`.
