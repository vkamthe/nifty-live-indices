/**
 * Vercel Serverless Function: GET /api/indices
 */

const TARGET_INDICES = {
  'NIFTY 50': 'NIFTY 50',
  'NIFTY 500': 'NIFTY 500',
  'NIFTY MIDCAP 100': 'NIFTY MIDCAP 100',
  'NIFTY SMALLCAP 250': 'NIFTY SMLCAP 250',
  'NIFTY MICROCAP 250': 'NIFTY MICROCAP250'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Cache-Control');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36';

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

    const apiRes = await fetch('https://www.nseindia.com/api/allIndices', {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www.nseindia.com/',
        'Cookie': cookies
      }
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

    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=30');
    return res.status(200).json({
      source: 'NSE India (Official Public API via Vercel Serverless Proxy)',
      timestamp: raw.timestamp,
      fetchedAt: new Date().toISOString(),
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    return res.status(502).json({ error: error.message });
  }
}
