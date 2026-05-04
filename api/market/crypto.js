// GET /api/market/crypto
// Response: { data: [{ symbol, name, price, change24h, market_cap, image }] }

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';

const CG_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'method_not_allowed' });

  try {
    const res2 = await fetch(CG_URL, { signal: AbortSignal.timeout(8000) });
    if (!res2.ok) throw new Error(`CoinGecko HTTP ${res2.status}`);

    const raw  = await res2.json();
    const data = raw.map(item => ({
      symbol:    item.symbol.toUpperCase(),
      name:      item.name,
      price:     item.current_price,
      change24h: item.price_change_percentage_24h,
      market_cap: item.market_cap,
      image:     item.image,
    }));

    return res.status(200).json({ data });
  } catch {
    return res.status(200).json({ data: [] });
  }
}
