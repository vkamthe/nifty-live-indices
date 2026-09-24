# 📈 NIFTY Live Indices Tracker (NSE India)

Clean, responsive financial dashboard tracking key National Stock Exchange of India (NSE) indices. Hosted 100% free on **GitHub Pages** with automated data updates powered by **GitHub Actions** (no external accounts, servers, or paid proxies required).

🔗 **Live Dashboard:** [https://vkamthe.github.io/nifty-live-indices/](https://vkamthe.github.io/nifty-live-indices/)

---

## 🎯 Indices Tracked

The dashboard tracks all 5 benchmark and broad market indices:
1. **NIFTY 50** (`NIFTY 50`) — India's benchmark blue-chip index
2. **NIFTY MIDCAP 100** (`NIFTY MIDCAP 100`) — Top 100 mid-sized companies
3. **NIFTY SMLCAP 250** (`NIFTY SMALLCAP 250`) — Small-cap universe
4. **NIFTY MICROCAP 250** (`NIFTY MICROCAP 250`) — Emerging micro-cap companies
5. **NIFTY 500** (`NIFTY 500`) — Top 500 companies representing ~95% of market cap

---

## ⚡ Architecture (Pure GitHub Pages + GitHub Actions)

```
[Browser Client (GitHub Pages)]
       │
       ▼ (polls data.json with cache-busting)
[data.json (Repository Snapshot)]
       ▲
       │ (cron runs every 15 mins during NSE market hours)
[GitHub Actions (.github/workflows/update.yml)]
       │
       ▼ (session cookie handshake + /api/allIndices)
[NSE India Official API]
```

### Why This Architecture?
- **Zero Third-Party Accounts:** Runs entirely within GitHub—no Cloudflare, Vercel, or external servers needed.
- **Bypasses Browser CORS:** GitHub Actions runs in an isolated runner environment, safely handling the NSE session handshake and writing clean JSON to `data.json`.
- **Cache-Busted Client:** The web dashboard fetches `data.json?t=<timestamp>` with `cache: 'no-store'`, guaranteeing you never receive stale browser-cached data.

---

## ⏱️ Features

- **Automated Market-Hours Cron:** GitHub Actions automatically runs every 15 minutes during NSE trading sessions (**Mon–Fri 09:15 to 15:45 IST** / `03:45 to 10:15 UTC`).
- **Tab Visibility Aware:** Utilizes HTML5 `Page Visibility API`. Refresh timers pause when the tab is inactive or minimized, and refresh immediately when you switch back.
- **Market Status Indicator:** Automatically detects market hours (09:15–15:30 IST) and pauses polling when the market is closed or on weekends.
- **Theme Support:** One-click toggle between **Dark Mode** and **Light Mode** with persistence in `localStorage`.
- **Configurable Refresh Rate:** Choose auto-refresh intervals (1m, 2m, 5m, 15m, or Manual) in Dashboard Preferences (`⚙️`).
- **Tick Flashes:** Price cards flash green (gains) or red (declines) when new prices load.

---

## 🛠️ Project Structure

```
nifty-live-indices/
├── index.html                  # Responsive Financial Dashboard (GitHub Pages)
├── fetch.js                    # Fetch script querying NSE India and generating data.json
├── data.json                   # Latest market snapshot dataset (5 indices)
├── package.json                # Project metadata and fetch script
└── .github/
    └── workflows/
        └── update.yml          # GitHub Actions cron updating data.json every 15 mins
```

---

## 🚀 Running / Fetching Locally

To manually update the local `data.json` snapshot:

```bash
# Clone the repository
git clone https://github.com/vkamthe/nifty-live-indices.git
cd nifty-live-indices

# Fetch the latest indices from NSE India
npm run fetch
```

To preview the dashboard locally, simply open `index.html` in any web browser or run:
```bash
npx serve .
```

---

## 📊 Sample Output Data (`data.json`)

```json
{
  "source": "NSE India (Official Public API via Proxy)",
  "timestamp": "24-Sep-2026 14:56",
  "fetchedAt": "2026-09-24T09:28:15.000Z",
  "count": 5,
  "data": [
    { "name": "NIFTY 50", "last": 23115.70, "variation": -331.10, "percentChange": -1.41 },
    { "name": "NIFTY 500", "last": 22597.65, "variation": -337.45, "percentChange": -1.47 },
    { "name": "NIFTY MIDCAP 100", "last": 61092.65, "variation": -1303.80, "percentChange": -2.09 },
    { "name": "NIFTY SMALLCAP 250", "last": 18173.35, "variation": -238.05, "percentChange": -1.29 },
    { "name": "NIFTY MICROCAP 250", "last": 26444.45, "variation": -349.65, "percentChange": -1.30 }
  ]
}
```

---

## ⚖️ License
MIT License. Created by Vikram Kamthe.
