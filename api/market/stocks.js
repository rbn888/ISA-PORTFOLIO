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

async function fetchBatch(batch, apiKey, batchIndex) {
  await sleep(batchIndex * 100);
  const url = `https://api.twelvedata.com/price?symbol=${batch.join(',')}&apikey=${apiKey}`;
  const r   = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error(`TwelveData HTTP ${r.status}`);

  const data  = await r.json();
  const items = [];

  if (batch.length === 1) {
    const price = parseFloat(data.price);
    if (!isNaN(price)) items.push({ symbol: batch[0], name: batch[0], price, change24h: null, image: null });
  } else {
    for (const symbol of batch) {
      const price = parseFloat(data[symbol]?.price);
      if (!isNaN(price)) items.push({ symbol, name: symbol, price, change24h: null, image: null });
    }
  }

  return items;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('[DEBUG] API_KEY exists:', !!process.env.TWELVE_API_KEY);
  console.log('[DEBUG] STOCK_SYMBOLS length:', STOCK_SYMBOLS.length);

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'method_not_allowed' });

  const API_KEY = process.env.TWELVE_API_KEY;
  if (!API_KEY) return res.status(200).json({ data: [] });

  const batches = [];
  for (let i = 0; i < STOCK_SYMBOLS.length; i += BATCH_SIZE) {
    batches.push(STOCK_SYMBOLS.slice(i, i + BATCH_SIZE));
  }

  const settled = await Promise.all(
    batches.map((batch, idx) =>
      fetchBatch(batch, API_KEY, idx).catch(e => {
        console.error(`[API][stocks] batch ${idx} failed:`, e.message);
        return [];
      })
    )
  );

  const data = settled.flat();
  return res.status(200).json({ data });
}
