// GET /api/search/assets?q=<query>
// Server-side proxy for Yahoo Finance search. No CORS concerns from the
// backend, so the browser never needs corsproxy.io / allorigins fallbacks.
//
// Response shape matches what the frontend caller already expects:
//   { results: [{ ticker, name, type, marketSymbol }, ...] }
// where type is 'stock' | 'etf' | 'index' | 'fund'.
//
// MC-2B: indices (^GSPC, ^GDAXI, ^IBEX, ^N225, ^FTSE, …) are surfaced with
// type:'index' so search returns "S&P 500", "DAX", "IBEX 35", "Nikkei",
// "FTSE 100", etc. Pricing for indices outside the snapshot REGISTRY
// (^GSPC / ^IXIC / ^DJI today) is out of scope for this change.
//
// MC-6: mutual funds (Yahoo quoteType 'MUTUALFUND') are surfaced with
// type:'fund'. Yahoo serves the NAV under opaque Morningstar codes
// (0P*) — the symbol is passed through verbatim; the snapshot router
// recognises the 0P* shape and routes to Yahoo with daily-NAV TTL.

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';
const MAX_RESULTS    = 7;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'method_not_allowed' });

  const q = String(req.query?.q ?? '').trim();
  if (!q || q.length > 64) return res.status(400).json({ error: 'invalid_query' });

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search` +
                `?q=${encodeURIComponent(q)}&quotesCount=8&newsCount=0&listsCount=0`;
    const upstream = await fetch(url, {
      signal:  AbortSignal.timeout(8000),
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (Aurix)' },
    });
    if (!upstream.ok) {
      return res.status(502).json({ error: `upstream_${upstream.status}`, results: [] });
    }
    const json    = await upstream.json();
    const quotes  = Array.isArray(json?.quotes) ? json.quotes : [];
    const results = quotes
      .filter(qt => qt.quoteType === 'EQUITY' || qt.quoteType === 'ETF'
                 || qt.quoteType === 'INDEX'  || qt.quoteType === 'MUTUALFUND')
      .slice(0, MAX_RESULTS)
      .map(qt => {
        const type = qt.quoteType === 'ETF'        ? 'etf'
                   : qt.quoteType === 'INDEX'      ? 'index'
                   : qt.quoteType === 'MUTUALFUND' ? 'fund'
                                                   : 'stock';
        return {
          ticker:       qt.symbol,
          name:         qt.longname || qt.shortname || qt.symbol,
          type,
          marketSymbol: qt.symbol,
        };
      });
    return res.status(200).json({ results });
  } catch (err) {
    console.error('[API][search] upstream failure:', err?.message);
    return res.status(502).json({ error: 'upstream_unreachable', results: [] });
  }
}
