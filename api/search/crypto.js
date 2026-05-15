// GET /api/search/crypto?q=<query>
// Server-side proxy for CoinGecko /api/v3/search. Browser never talks to
// CoinGecko directly. Returns normalized crypto candidates compatible
// with the existing frontend asset-search/add flow (selectAsset reads
// {ticker, name, type, coinId, marketSymbol}).
//
// Response shape:
//   { results: [{ ticker, name, type:'crypto', coinId, marketSymbol }, ...] }
//
// CoinGecko upstream notes:
//   - free tier: ~30 req/min per IP. Upstream 429 → we return 502 + [].
//   - the `coins` array carries { id, name, symbol, market_cap_rank, ... }.
//     We surface only the fields the frontend uses, so the raw response
//     never reaches the browser.

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';
const MAX_RESULTS    = 12;
const MIN_Q          = 2;
const MAX_Q          = 64;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'method_not_allowed' });

  const q = String(req.query?.q ?? '').trim();
  if (!q || q.length < MIN_Q || q.length > MAX_Q) {
    return res.status(400).json({ error: 'invalid_query', results: [] });
  }

  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`;
    const upstream = await fetch(url, {
      signal:  AbortSignal.timeout(8000),
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Aurix)' },
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: `upstream_${upstream.status}`, results: [] });
    }
    const json  = await upstream.json();
    const coins = Array.isArray(json?.coins) ? json.coins : [];

    // CoinGecko ranks by relevance + market cap. Cap to MAX_RESULTS and
    // strip down to the four fields the frontend actually consumes.
    const seen    = new Set();
    const results = [];
    for (const c of coins) {
      if (!c || typeof c.id !== 'string' || typeof c.symbol !== 'string') continue;
      const ticker = String(c.symbol).toUpperCase().trim();
      if (!ticker) continue;
      // Dedupe by symbol — CoinGecko occasionally returns multiple chains
      // for the same brand (e.g. USDC on different networks). The first
      // hit is usually the canonical one (highest market cap).
      if (seen.has(ticker)) continue;
      seen.add(ticker);
      results.push({
        ticker,
        name:         (typeof c.name === 'string' && c.name) ? c.name : ticker,
        type:         'crypto',
        coinId:       c.id,
        marketSymbol: ticker,
      });
      if (results.length >= MAX_RESULTS) break;
    }
    return res.status(200).json({ results });
  } catch (err) {
    console.error('[API][search-crypto] upstream failure:', err?.message);
    return res.status(502).json({ error: 'upstream_unreachable', results: [] });
  }
}
