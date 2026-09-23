/**
 * Cloudflare Worker Proxy for NSE India Indices API
 * Free tier: 100,000 requests/day
 *
 * Deploy with:
 *   npx wrangler deploy
 * Or paste directly into the Cloudflare Dashboard Workers editor.
 */

const TARGET_INDICES = {
  'NIFTY 50': 'NIFTY 50',
  'NIFTY 500': 'NIFTY 500',
  'NIFTY MIDCAP 100': 'NIFTY MIDCAP 100',
  'NIFTY SMALLCAP 250': 'NIFTY SMLCAP 250',
  'NIFTY MICROCAP 250': 'NIFTY MICROCAP250'
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Cache-Control',
  'Content-Type': 'application/json'
};

export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS, status: 204 });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return new Response(JSON.stringify({ status: 'ok', workerTime: new Date().toISOString() }), {
        headers: CORS_HEADERS
      });
    }

    try {
      const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

      // 1. Session handshake to obtain Akamai cookies
      const initRes = await fetch('https://www.nseindia.com', {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        cf: { cacheTtl: 30 }
      });

      const cookies = (initRes.headers.getSetCookie ? initRes.headers.getSetCookie() : [initRes.headers.get('set-cookie')])
        .map(c => c ? c.split(';')[0] : '')
        .filter(Boolean)
        .join('; ');

      // 2. Query NSE allIndices
      const apiRes = await fetch('https://www.nseindia.com/api/allIndices', {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.nseindia.com/',
          'Cookie': cookies
        },
        cf: { cacheTtl: 10 } // 10s edge cache
      });

      if (!apiRes.ok) {
        throw new Error(`NSE returned ${apiRes.status}`);
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

      const responsePayload = {
        source: 'NSE India (Official Public API via Cloudflare Worker)',
        timestamp: raw.timestamp,
        fetchedAt: new Date().toISOString(),
        count: filtered.length,
        data: filtered
      };

      return new Response(JSON.stringify(responsePayload, null, 2), {
        headers: {
          ...CORS_HEADERS,
          'Cache-Control': 'public, max-age=10'
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, status: 'error' }), {
        status: 502,
        headers: CORS_HEADERS
      });
    }
  }
};
