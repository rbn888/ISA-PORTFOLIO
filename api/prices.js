// POST /api/prices
// Body:     { providers: ["coingecko:bitcoin", "twelvedata:AAPL", ...] }
// Response: { prices: { [provider_id]: { price: number, change24h: number|null } } }

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';
const IS_DEV         = process.env.VERCEL_ENV !== 'production';

function log(...args) {
  if (IS_DEV) console.log('[API]', ...args);
}

function logError(provider, message) {
  console.error(`[API][ERROR][${provider}] ${new Date().toISOString()} ${message}`);
}

// ── Cache ──────────────────────────────────────────────────
const cache      = new Map(); // key → { data, ts }
const CACHE_TTL  = 15_000;   // 15 s

// ── Rate limit ─────────────────────────────────────────────
const rateLimits   = new Map(); // ip → [timestamps]
const RATE_LIMIT   = 10;
const RATE_WINDOW  = 10_000; // 10 s

// ── Parsing ────────────────────────────────────────────────

function parseProviders(providers) {
  const coingecko  = [];
  const twelvedata = [];

  for (const p of providers) {
    if (typeof p !== 'string') continue;
    const sep = p.indexOf(':');
    if (sep < 1) continue;
    const ns = p.slice(0, sep);
    const id = p.slice(sep + 1).trim();
    if (!id) continue;
    if (ns === 'coingecko')    coingecko.push({ provider: p, id });
    else if (ns === 'twelvedata') twelvedata.push({ provider: p, symbol: id });
  }

  return { coingecko, twelvedata };
}

// ── Fetchers ───────────────────────────────────────────────

async function fetchCoinGecko(items) {
  const ids = items.map(i => i.id).join(',');
  log('coingecko ids:', ids);

  const url = `https://api.coingecko.com/api/v3/simple/price` +
              `?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);

  const data  = await res.json();
  const result = {};

  for (const { provider, id } of items) {
    const entry = data[id];
    if (entry) {
      result[provider] = {
        price:     entry.usd             ?? null,
        change24h: entry.usd_24h_change  ?? null,
      };
    }
  }

  return result;
}

async function fetchTwelveData(items, apiKey) {
  const symbols = items.map(i => i.symbol).join(',');
  log('twelvedata symbols:', symbols);

  const url = `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${apiKey}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);

  const data   = await res.json();
  const result = {};

  if (items.length === 1) {
    // Single symbol → { price: "210.13" }
    const price = parseFloat(data.price);
    if (!isNaN(price)) result[items[0].provider] = { price, change24h: null };
  } else {
    // Batch → { AAPL: { price: "210.13" }, VOO: { price: "498.00" }, ... }
    for (const { provider, symbol } of items) {
      const entry = data[symbol];
      if (entry?.price) {
        const price = parseFloat(entry.price);
        if (!isNaN(price)) result[provider] = { price, change24h: null };
      }
    }
  }

  return result;
}

// ── Handler ────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST')   return res.status(405).json({ error: 'method_not_allowed' });

  // ── Rate limit ─────────────────────────────────────────
  const ip  = req.headers['x-forwarded-for']?.split(',')[0].trim()
              || req.socket?.remoteAddress
              || 'unknown';
  const now = Date.now();
  const hits = (rateLimits.get(ip) || []).filter(t => now - t < RATE_WINDOW);
  if (hits.length >= RATE_LIMIT) return res.status(429).json({ error: 'rate_limit' });
  hits.push(now);
  rateLimits.set(ip, hits);

  const { providers } = req.body ?? {};
  if (!Array.isArray(providers) || providers.length === 0) {
    return res.status(400).json({ error: 'providers_required' });
  }

  // ── Cache ──────────────────────────────────────────────
  const cacheKey = JSON.stringify(providers);
  const cached   = cache.get(cacheKey);
  if (cached && now - cached.ts < CACHE_TTL) {
    return res.status(200).json(cached.data);
  }

  log('request start · providers:', providers.length);

  const { coingecko, twelvedata } = parseProviders(providers);
  const prices    = {};
  const TWELVE_KEY = process.env.TWELVE_API_KEY;
  const tasks      = [];

  if (coingecko.length > 0) {
    tasks.push(
      fetchCoinGecko(coingecko)
        .then(r  => Object.assign(prices, r))
        .catch(err => logError('coingecko', err.message))
    );
  }

  if (twelvedata.length > 0) {
    if (!TWELVE_KEY) {
      logError('twelvedata', 'TWELVE_API_KEY not configured in env');
    } else {
      tasks.push(
        fetchTwelveData(twelvedata, TWELVE_KEY)
          .then(r  => Object.assign(prices, r))
          .catch(err => logError('twelvedata', err.message))
      );
    }
  }

  await Promise.all(tasks);

  const data = { prices };
  cache.set(cacheKey, { data, ts: Date.now() });

  log('success · prices returned:', Object.keys(prices).length);
  return res.status(200).json(data);
}
