// GET /api/market/stocks
// Response: { data: [{ symbol, name, price, change24h, image }] }
//
// TwelveData charges 1 credit per symbol on /price, batched or not. The live
// universe is right-sized to one batched request against the curated core
// set so each visit consumes a bounded, predictable number of credits.

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';

// Core live coverage — top-20 megacaps. One request, 20 credits per call.
const CORE_STOCK_SYMBOLS = [
  'AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','JPM','V','WMT',
  'BRK.B','JNJ','PG','XOM','BAC','AVGO','COST','KO','MCD','NKE',
];

// Extended universe retained for future expansion (paid tier or on-demand
// hydration). Not fetched by the default live endpoint.
const EXTENDED_STOCK_SYMBOLS = [
  'UNH','HD','CVX','ABBV','LLY','MRK','PEP','TMO','CSCO','ACN',
  'ABT','DHR','NEE','PM','TXN','QCOM','HON','SPGI','INTU','ISRG',
  'AMAT','ADI','REGN','VRTX','PANW','KLAC','LRCX','MRVL','SNPS','CDNS',
];

async function fetchStocksBatch(symbols, apiKey) {
  const url = `https://api.twelvedata.com/price?symbol=${symbols.join(',')}&apikey=${apiKey}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (r.status === 429) throw new Error('rate_limit');
  if (!r.ok)             throw new Error(`http_${r.status}`);
  const json = await r.json();
  if (json && (json.status === 'error' || json.code)) {
    throw new Error(`provider:${json.code ?? ''} ${json.message ?? ''}`.trim());
  }
  return json;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'method_not_allowed' });

  const API_KEY = process.env.TWELVE_API_KEY;
  if (!API_KEY) {
    console.error('[API][stocks] TWELVE_API_KEY not configured');
    return res.status(200).json({ data: [] });
  }

  let payload;
  try {
    payload = await fetchStocksBatch(CORE_STOCK_SYMBOLS, API_KEY);
  } catch (e) {
    console.error('[API][stocks] provider failure:', e.message);
    return res.status(200).json({ data: [] });
  }

  const data = [];
  for (const symbol of CORE_STOCK_SYMBOLS) {
    const entry = payload?.[symbol];
    if (!entry || entry.status === 'error' || entry.code) {
      console.error(`[API][stocks] ${symbol} invalid or missing in response`);
      continue;
    }
    const price = parseFloat(entry.price);
    if (!isFinite(price) || price <= 0) {
      console.error(`[API][stocks] ${symbol} non-numeric price:`, entry.price);
      continue;
    }
    data.push({ symbol, name: symbol, price, change24h: null, image: null });
  }

  return res.status(200).json({ data });
}

export { CORE_STOCK_SYMBOLS, EXTENDED_STOCK_SYMBOLS };
