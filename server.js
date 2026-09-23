const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const CACHE_TTL_MS = 10 * 1000; // 10 seconds cache to protect NSE endpoint

let cache = {
  data: null,
  timestamp: 0
};

const TARGET_INDICES = {
  'NIFTY 50': 'NIFTY 50',
  'NIFTY 500': 'NIFTY 500',
  'NIFTY MIDCAP 100': 'NIFTY MIDCAP 100',
  'NIFTY SMALLCAP 250': 'NIFTY SMLCAP 250',
  'NIFTY MICROCAP 250': 'NIFTY MICROCAP250'
};

async function fetchNSEIndices() {
  const now = Date.now();
  if (cache.data && (now - cache.timestamp < CACHE_TTL_MS)) {
    return { ...cache.data, cached: true, cacheAgeMs: now - cache.timestamp };
  }

  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

  // Step 1: Handshake with NSE homepage to get cookies
  const initRes = await fetch('https://www.nseindia.com', {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  const cookies = (initRes.headers.getSetCookie ? initRes.headers.getSetCookie() : [initRes.headers.get('set-cookie')])
    .map(c => c ? c.split(';')[0] : '')
    .filter(Boolean)
    .join('; ');

  // Step 2: Fetch all indices with session cookies
  const apiRes = await fetch('https://www.nseindia.com/api/allIndices', {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.nseindia.com/',
      'Cookie': cookies
    }
  });

  if (!apiRes.ok) {
    throw new Error(`NSE API returned status ${apiRes.status}`);
  }

  const raw = await apiRes.json();
  const filtered = [];

  for (const item of (raw.data || [])) {
    if (TARGET_INDICES[item.index]) {
      filtered.push({
        name: item.index,
        displayName: TARGET_INDICES[item.index],
        last: item.last,
        variation: item.variation,
        percentChange: item.percentChange,
        open: item.open,
        high: item.high,
        low: item.low,
        previousClose: item.previousClose,
        yearHigh: item.yearHigh,
        yearLow: item.yearLow,
        pe: item.pe,
        pb: item.pb,
        dy: item.dy,
        advances: item.advances,
        declines: item.declines,
        unchanged: item.unchanged,
        perChange30d: item.perChange30d,
        perChange365d: item.perChange365d,
        chartTodayPath: item.chartTodayPath
      });
    }
  }

  const result = {
    source: 'NSE India (Official Public API via Node Backend Proxy)',
    timestamp: raw.timestamp,
    fetchedAt: new Date().toISOString(),
    count: filtered.length,
    data: filtered
  };

  cache = {
    data: result,
    timestamp: now
  };

  return { ...result, cached: false };
}

const server = http.createServer(async (req, res) => {
  // Add CORS headers so frontend on GitHub Pages or localhost can query freely
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/api/indices') {
    try {
      const data = await fetchNSEIndices();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data, null, 2));
    } catch (err) {
      console.error('Error fetching from NSE:', err.message);
      // Fallback to local data.json if available
      try {
        const fallback = fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8');
        const parsed = JSON.parse(fallback);
        parsed.source = 'NSE India (Local Snapshot Fallback)';
        parsed.error = err.message;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(parsed, null, 2));
      } catch (fallbackErr) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    }
    return;
  }

  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', serverTime: new Date().toISOString() }));
    return;
  }

  // Serve static files for local preview (index.html, data.json, etc.)
  let filePath = path.join(__dirname, url.pathname === '/' ? 'index.html' : url.pathname);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png'
    };
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`NSE Indices Backend Proxy running on port ${PORT}`);
  console.log(`- Web Dashboard:   http://localhost:${PORT}`);
  console.log(`- Proxy API:       http://localhost:${PORT}/api/indices`);
  console.log(`- Health Check:    http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});
