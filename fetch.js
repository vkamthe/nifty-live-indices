#!/usr/bin/env node

/**
 * Fetch latest indices from NSE and update data.json
 */

const fs = require('fs');
const path = require('path');

const TARGET_INDICES = {
  'NIFTY 50': 'NIFTY 50',
  'NIFTY 500': 'NIFTY 500',
  'NIFTY MIDCAP 100': 'NIFTY MIDCAP 100',
  'NIFTY SMALLCAP 250': 'NIFTY SMLCAP 250',
  'NIFTY MICROCAP 250': 'NIFTY MICROCAP250'
};

async function main() {
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

  console.log('Connecting to NSE India...');
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

  console.log('Fetching allIndices...');
  const apiRes = await fetch('https://www.nseindia.com/api/allIndices', {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://www.nseindia.com/',
      'Cookie': cookies
    }
  });

  if (!apiRes.ok) {
    throw new Error(`NSE returned status ${apiRes.status}`);
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
      console.log(`  ✓ ${item.index.padEnd(20)} ${item.last.toFixed(2)} (${item.variation > 0 ? '+' : ''}${item.variation} / ${item.percentChange}%)`);
    }
  }

  const dataPath = path.join(__dirname, 'data.json');
  try {
    if (fs.existsSync(dataPath)) {
      const existing = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      if (
        existing.timestamp === raw.timestamp &&
        JSON.stringify(existing.data) === JSON.stringify(filtered)
      ) {
        console.log(`\nSnapshot is identical to current data.json (${raw.timestamp}). Skipping write.`);
        return;
      }
    }
  } catch (e) {
    // Proceed with write if read or parse fails
  }

  const payload = {
    source: 'NSE India (Official Public API via Proxy)',
    timestamp: raw.timestamp,
    fetchedAt: new Date().toISOString(),
    count: filtered.length,
    data: filtered
  };

  fs.writeFileSync(dataPath, JSON.stringify(payload, null, 2));
  console.log(`\nUpdated ${dataPath} at ${payload.timestamp}`);
}

main().catch(err => {
  console.error('Fetch error:', err.message);
  process.exit(1);
});
