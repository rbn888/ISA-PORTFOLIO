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

// ── Observability ───────────────────────────────────────────
// Lightweight in-memory counters. Per-Vercel-instance (cold start resets).
// Shared with api/prices/snapshot.js and api/debug/health.js via named export.
const OBSERVABILITY = {
  startedAt: Date.now(),
  pricing: {
    providerRequests:  { coingecko: 0, twelvedata: 0, yahoo: 0 },
    providerFailures:  { coingecko: 0, twelvedata: 0, yahoo: 0 },
    providerLatencyMs: {
      coingecko:  { sum: 0, count: 0 },
      twelvedata: { sum: 0, count: 0 },
      yahoo:      { sum: 0, count: 0 },
    },
    cacheHits:        0,
    cacheMisses:      0,
    partialResponses: 0,
    rateLimitHits:    0,
  },
  snapshot: {
    requestCount:     0,
    symbolsRequested: 0,
    resolvedTotal:    0,
    partialResponses: 0,
    latencyMs: { sum: 0, count: 0 },
  },
};

// ── Cache policy ────────────────────────────────────────────
// Single backend cache, keyed by provider_id (e.g. coingecko:bitcoin,
// twelvedata:AAPL). Owner: this module. Shared with api/prices/snapshot.js
// via named export. Each entry stores { value, timestamp, ttl }; reads
// past `ttl` return null (no stale-serve). TTLs are per-asset-class —
// the snapshot picks the right bucket via the symbol registry.
const PRICE_CACHE = new Map();

const TTL = {
  crypto:    30  * 1000,   // 24/7 markets, fast-moving
  stock:     60  * 1000,   // intraday tick
  etf:       60  * 1000,   // intraday tick
  index:     60  * 1000,   // intraday tick
  commodity: 300 * 1000,   // slower-moving (XAU/USD, WTI)
  fund:      6 * 60 * 60 * 1000, // mutual funds: daily NAV, refresh every 6h
  fx:        300 * 1000,   // not used today, reserved
};

function getCached(providerId) {
  const entry = PRICE_CACHE.get(providerId);
  if (!entry) { OBSERVABILITY.pricing.cacheMisses++; return null; }
  if (Date.now() - entry.timestamp > entry.ttl) {
    OBSERVABILITY.pricing.cacheMisses++;
    return null;
  }
  OBSERVABILITY.pricing.cacheHits++;
  return entry.value;
}

function setCache(providerId, value, ttl) {
  PRICE_CACHE.set(providerId, { value, timestamp: Date.now(), ttl });
}

// ── Rate limit ─────────────────────────────────────────────
const rateLimits   = new Map(); // ip → [timestamps]
const RATE_LIMIT   = 10;
const RATE_WINDOW  = 10_000; // 10 s

// ── Parsing ────────────────────────────────────────────────

function parseProviders(providers) {
  const coingecko  = [];
  const twelvedata = [];
  const yahoo      = [];

  for (const p of providers) {
    if (typeof p !== 'string') continue;
    const sep = p.indexOf(':');
    if (sep < 1) continue;
    const ns = p.slice(0, sep);
    const id = p.slice(sep + 1).trim();
    if (!id) continue;
    if (ns === 'coingecko')       coingecko.push({ provider: p, id });
    else if (ns === 'twelvedata') twelvedata.push({ provider: p, symbol: id });
    else if (ns === 'yahoo')      yahoo.push({ provider: p, symbol: id });
  }

  return { coingecko, twelvedata, yahoo };
}

// ── Fetchers ───────────────────────────────────────────────

async function fetchCoinGecko(items) {
  const ids = items.map(i => i.id).join(',');
  log('coingecko ids:', ids);
  const t0 = Date.now();
  OBSERVABILITY.pricing.providerRequests.coingecko++;

  const url = `https://api.coingecko.com/api/v3/simple/price` +
              `?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
  } catch (err) {
    OBSERVABILITY.pricing.providerFailures.coingecko++;
    throw err;
  }

  const data   = await res.json();
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

  OBSERVABILITY.pricing.providerLatencyMs.coingecko.sum += Date.now() - t0;
  OBSERVABILITY.pricing.providerLatencyMs.coingecko.count++;
  return result;
}

async function fetchTwelveData(items, apiKey) {
  const symbols = items.map(i => i.symbol).join(',');
  log('twelvedata symbols:', symbols);
  const t0 = Date.now();
  OBSERVABILITY.pricing.providerRequests.twelvedata++;

  const url = `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${apiKey}`;

  let res;
  try {
    res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`TwelveData HTTP ${res.status}`);
  } catch (err) {
    OBSERVABILITY.pricing.providerFailures.twelvedata++;
    throw err;
  }

  const data   = await res.json();

  // ── TwelveData application-level error detection ────────────
  // TwelveData often returns HTTP 200 with an error body shape:
  //   { code: 401|429|400|..., status: "error", message: "..." }
  // Without this guard, parseFloat(undefined) silently returns NaN and
  // the empty result {} masks the real failure (quota exhausted, key
  // revoked, plan limitation). Re-route through the existing handler
  // .catch so logError surfaces the cause and providerFailures counter
  // reflects reality.
  if (data && data.status === 'error') {
    OBSERVABILITY.pricing.providerFailures.twelvedata++;
    throw new Error(
      `TwelveData app-error code=${data.code ?? '?'} ${data.message ?? ''}`.trim()
    );
  }

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

  OBSERVABILITY.pricing.providerLatencyMs.twelvedata.sum += Date.now() - t0;
  OBSERVABILITY.pricing.providerLatencyMs.twelvedata.count++;
  return result;
}

async function fetchYahoo(items) {
  // Yahoo Finance /v8/finance/chart is single-symbol. Fan out in parallel —
  // free, no API key, covers stocks/ETFs/indices (^GSPC) and commodity
  // futures (GC=F, SI=F, CL=F). One fetchYahoo call counts as one
  // providerRequest for parity with batch fetchers above.
  const symbols = items.map(i => i.symbol).join(',');
  log('yahoo symbols:', symbols);
  const t0 = Date.now();
  OBSERVABILITY.pricing.providerRequests.yahoo++;

  try {
    const settled = await Promise.allSettled(
      items.map(async ({ provider, symbol }) => {
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/` +
                    `${encodeURIComponent(symbol)}?range=1d&interval=1d`;
        const res = await fetch(url, {
          signal:  AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'Mozilla/5.0 (Aurix)', Accept: 'application/json' },
        });
        if (!res.ok) throw new Error(`Yahoo HTTP ${res.status}`);
        const data = await res.json();

        // ── Yahoo application-level error detection ─────────────
        // Chart endpoint returns HTTP 200 with `{ chart: { error: {...} } }`
        // on invalid symbols / rate limits. Mirrors the TwelveData guard
        // above so the empty-result path doesn't mask real failures.
        if (data?.chart?.error) {
          throw new Error(
            `Yahoo app-error ${data.chart.error.code || '?'} ${data.chart.error.description || ''}`.trim()
          );
        }

        const meta  = data?.chart?.result?.[0]?.meta;
        const price = meta?.regularMarketPrice;
        if (!Number.isFinite(price)) throw new Error(`Yahoo no price for ${symbol}`);

        const prev = Number.isFinite(meta.chartPreviousClose) ? meta.chartPreviousClose
                   : Number.isFinite(meta.previousClose)      ? meta.previousClose
                   : null;
        const change24h = (prev && prev > 0) ? ((price - prev) / prev) * 100 : null;

        return { provider, price, change24h };
      })
    );

    const result = {};
    for (const s of settled) {
      if (s.status === 'fulfilled') {
        result[s.value.provider] = { price: s.value.price, change24h: s.value.change24h };
      } else {
        logError('yahoo', s.reason?.message || 'unknown');
      }
    }

    OBSERVABILITY.pricing.providerLatencyMs.yahoo.sum += Date.now() - t0;
    OBSERVABILITY.pricing.providerLatencyMs.yahoo.count++;

    // Parity with batch fetchers: if every symbol failed, surface as a
    // provider failure so the handler's .catch logs it and the per-batch
    // failure counter increments. Partial success returns normally.
    if (Object.keys(result).length === 0 && items.length > 0) {
      const firstErr = settled.find(s => s.status === 'rejected');
      throw new Error(`Yahoo all-failed: ${firstErr?.reason?.message || 'unknown'}`);
    }

    return result;
  } catch (err) {
    OBSERVABILITY.pricing.providerFailures.yahoo++;
    throw err;
  }
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
  if (hits.length >= RATE_LIMIT) {
    OBSERVABILITY.pricing.rateLimitHits++;
    return res.status(429).json({ error: 'rate_limit' });
  }
  hits.push(now);
  rateLimits.set(ip, hits);

  const { providers } = req.body ?? {};
  if (!Array.isArray(providers) || providers.length === 0) {
    return res.status(400).json({ error: 'providers_required' });
  }

  log('request start · providers:', providers.length);

  const { coingecko, twelvedata, yahoo } = parseProviders(providers);
  const prices     = {};
  const TWELVE_KEY = process.env.TWELVE_API_KEY;
  const tasks      = [];

  // ── Serve cached, collect uncached ────────────────────
  const uncachedCG  = [];
  const uncachedTD  = [];
  const uncachedYH  = [];

  for (const item of coingecko) {
    const hit = getCached(item.provider);
    if (hit) prices[item.provider] = hit;
    else uncachedCG.push(item);
  }

  for (const item of twelvedata) {
    const hit = getCached(item.provider);
    if (hit) prices[item.provider] = hit;
    else uncachedTD.push(item);
  }

  for (const item of yahoo) {
    const hit = getCached(item.provider);
    if (hit) prices[item.provider] = hit;
    else uncachedYH.push(item);
  }

  // ── Fetch only what's missing ──────────────────────────
  if (uncachedCG.length > 0) {
    tasks.push(
      fetchCoinGecko(uncachedCG)
        .then(r => {
          for (const [id, val] of Object.entries(r)) {
            setCache(id, val, TTL.crypto);
            prices[id] = val;
          }
        })
        .catch(err => logError('coingecko', err.message))
    );
  }

  if (uncachedTD.length > 0) {
    if (!TWELVE_KEY) {
      logError('twelvedata', 'TWELVE_API_KEY not configured in env');
    } else {
      tasks.push(
        fetchTwelveData(uncachedTD, TWELVE_KEY)
          .then(r => {
            for (const [id, val] of Object.entries(r)) {
              setCache(id, val, TTL.stock);
              prices[id] = val;
            }
          })
          .catch(err => logError('twelvedata', err.message))
      );
    }
  }

  if (uncachedYH.length > 0) {
    // PR-2A: per-symbol assetType is not known at this handler level —
    // snapshot.js owns the registry. TTL.stock matches the existing
    // TwelveData policy; PR-2B will route via the snapshot registry
    // with per-assetType TTL buckets.
    tasks.push(
      fetchYahoo(uncachedYH)
        .then(r => {
          for (const [id, val] of Object.entries(r)) {
            setCache(id, val, TTL.stock);
            prices[id] = val;
          }
        })
        .catch(err => logError('yahoo', err.message))
    );
  }

  await Promise.all(tasks);

  if (Object.keys(prices).length < providers.length) {
    OBSERVABILITY.pricing.partialResponses++;
  }

  log('success · prices returned:', Object.keys(prices).length);
  return res.status(200).json({ prices });
}

// ── Named exports for reuse by other backend endpoints ─────
// (e.g., api/prices/snapshot.js — does not affect default handler)
export { PRICE_CACHE, TTL, getCached, setCache, fetchCoinGecko, fetchTwelveData, fetchYahoo, OBSERVABILITY };
