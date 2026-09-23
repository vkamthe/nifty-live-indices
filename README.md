# 📈 NIFTY Live Indices Tracker (NSE India)

Live, responsive stock market dashboard tracking key National Stock Exchange of India (NSE) indices in real-time. Built to fulfill **Method 2: Direct NSE India Public API with a Backend Proxy** and hosted directly on **GitHub Pages**.

🔗 **Live GitHub Page:** [https://vkamthe.github.io/nifty-live-indices/](https://vkamthe.github.io/nifty-live-indices/)

---

## 🎯 Indices Tracked

The dashboard actively tracks all 5 requested benchmark & broad market indices:
1. **NIFTY 50** (`NIFTY 50`) — India's benchmark blue-chip index
2. **NIFTY MIDCAP 100** (`NIFTY MIDCAP 100`) — Top 100 mid-sized companies
3. **NIFTY SMLCAP 250** (`NIFTY SMALLCAP 250`) — Small-cap universe
4. **NIFTY MICROCAP 250** (`NIFTY MICROCAP 250`) — Emerging micro-cap companies
5. **NIFTY 500** (`NIFTY 500`) — Top 500 companies representing ~95% of market cap

---

## ⚡ How It Works (Method 2 Architecture)

```
[Browser Client (GitHub Pages)]
       │
       ▼ (polls every 1 min while page is active)
[Backend Proxy (Localhost / Cloudflare Worker / Vercel)]
       │
       ▼ (Akamai Cookie Handshake + /api/allIndices)
[NSE India (Official Public API)]
```

### Why a Backend Proxy is Required
1. **CORS Restrictions:** Web browsers block direct client-side JavaScript requests to `https://www.nseindia.com/api/allIndices` due to Cross-Origin Resource Sharing policies.
2. **Akamai Bot Defense:** NSE requires a preliminary cookie handshake from `https://www.nseindia.com` before serving index data.
3. **GitHub Pages is Static:** GitHub Pages only serves static files (HTML/CSS/JS). The proxy bridges the browser and NSE by handling headers, session cookies, and adding `Access-Control-Allow-Origin: *`.

---

## ⏱️ Auto-Update Features

- **1-Minute Automatic Polling:** While the page is open, the dashboard automatically fetches fresh data every 60 seconds.
- **Tab Visibility Aware:** Utilizes the HTML5 `Page Visibility API` (`document.visibilityState`). If you switch to another tab or minimize the browser, the countdown timer **pauses** to save battery and network bandwidth. As soon as you switch back, it refreshes immediately!
- **Tick Flashes:** When index prices update, changed values briefly pulse green (if price rose) or red (if price declined).
- **Graceful Fallback:** If no backend proxy is running locally, the page seamlessly serves the bundled `data.json` snapshot so the UI is never blank.

---

## 🚀 Running the Project

### Option A: Local Node.js Proxy (Recommended for Local Dev)
The repository includes a zero-dependency Node.js proxy server using native Node 18+ `fetch`:

```bash
# Clone the repository
git clone https://github.com/vkamthe/nifty-live-indices.git
cd nifty-live-indices

# Start the proxy server (runs on http://localhost:3000)
npm start
```

Open `http://localhost:3000` in your browser. The dashboard will automatically query `http://localhost:3000/api/indices`.

---

### Option B: 100% Free Cloudflare Worker (Global Edge Proxy)
Deploy the included `worker.js` to Cloudflare Workers (100,000 requests/day free):

1. Install Wrangler CLI (if not already installed):
   ```bash
   npx wrangler login
   ```
2. Deploy the worker:
   ```bash
   npx wrangler deploy
   ```
3. Cloudflare will give you a URL like:
   `https://nifty-indices-proxy.<subdomain>.workers.dev/api/indices`
4. Open your GitHub Page, click the **⚙️ Settings** icon in the header, paste your worker URL, and click **Save**.

---

### Option C: Vercel Serverless Function
If you link this GitHub repository to [Vercel](https://vercel.com):
- The `api/indices.js` serverless function deploys automatically.
- Your proxy endpoint will be: `https://<your-project>.vercel.app/api/indices`.

---

### Option D: Manual Snapshot Fetch (CLI)
You can refresh the offline snapshot file (`data.json`) anytime by running:
```bash
node fetch.js
```
A GitHub Actions workflow (`.github/workflows/update.yml`) is also configured to run hourly during NSE trading sessions (Mon-Fri 09:15 - 15:30 IST) to keep `data.json` fresh.

---

## 🛠️ Project Structure

```
nifty-live-indices/
├── index.html                  # Responsive Dark-mode Financial Dashboard (GitHub Pages)
├── server.js                   # Node.js backend proxy with in-memory caching & CORS
├── worker.js                   # Cloudflare Worker script for serverless edge proxying
├── wrangler.toml               # Cloudflare Worker config
├── fetch.js                    # CLI script to download fresh data.json from NSE
├── data.json                   # Snapshot dataset of all 5 target indices
├── package.json                # npm scripts & metadata
├── api/
│   └── indices.js              # Vercel Serverless Function endpoint
└── .github/
    └── workflows/
        └── update.yml          # GitHub Actions cron to update data.json during market hours
```

---

## 📊 Sample Output Data (NSE India)

```json
[
  { "name": "NIFTY 50", "last": 23446.80, "variation": 117.80, "percentChange": 0.50 },
  { "name": "NIFTY MIDCAP 100", "last": 62396.45, "variation": 433.30, "percentChange": 0.70 },
  { "name": "NIFTY SMALLCAP 250", "last": 18411.40, "variation": 150.80, "percentChange": 0.83 },
  { "name": "NIFTY MICROCAP 250", "last": 26794.10, "variation": 342.20, "percentChange": 1.29 },
  { "name": "NIFTY 500", "last": 22935.10, "variation": 140.90, "percentChange": 0.62 }
]
```

---

## ⚖️ License
MIT License. Created by Vikram Kamthe.
