// GET /api/market/stocks
// Response: { data: [{ symbol, name, price, change24h, image }] }

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';

const STOCK_SYMBOLS = [
  'AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','JPM','V','WMT',
  'BRK.B','JNJ','PG','UNH','HD','BAC','XOM','CVX','ABBV','LLY',
  'AVGO','COST','MRK','PEP','KO','TMO','CSCO','ACN','MCD','ABT',
  'NKE','DHR','NEE','PM','TXN','QCOM','HON','SPGI','INTU','ISRG',
  'AMAT','ADI','REGN','VRTX','PANW','KLAC','LRCX','MRVL','SNPS','CDNS',
];

const BATCH_SIZE = 8;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'method_not_allowed' });

  const API_KEY = process.env.TWELVE_API_KEY;
  if (!API_KEY) return res.status(200).json({ data: [] });

  const results = [];

  for (let i = 0; i < STOCK_SYMBOLS.length; i += BATCH_SIZE) {
    const batch = STOCK_SYMBOLS.slice(i, i + BATCH_SIZE);

    try {
      const url = `https://api.twelvedata.com/price?symbol=${batch.join(',')}&apikey=${API_KEY}`;
      const r   = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`TwelveData HTTP ${r.status}`);

      const data = await r.json();

      if (batch.length === 1) {
        const price = parseFloat(data.price);
        if (!isNaN(price)) {
          results.push({ symbol: batch[0], name: batch[0], price, change24h: null, image: null });
        }
      } else {
        for (const symbol of batch) {
          const entry = data[symbol];
          const price = parseFloat(entry?.price);
          if (!isNaN(price)) {
            results.push({ symbol, name: symbol, price, change24h: null, image: null });
          }
        }
      }
    } catch (e) {
      console.error(`[API][stocks] batch ${i / BATCH_SIZE} failed:`, e.message);
    }

    await sleep(500);
  }

  return res.status(200).json({ data: results });
}
