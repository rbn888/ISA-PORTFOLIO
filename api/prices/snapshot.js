// GET /api/prices/snapshot?symbols=BTC,AAPL,XAU/USD,^GSPC
// Response: { generatedAt, partial, snapshot: [PriceObject, ...] }
//
// PriceObject = {
//   symbol, assetType, price, currency,
//   change24h, timestamp, source, stale, confidence
// }

import {
  PRICE_CACHE,
  TTL,
  setCache,
  fetchCoinGecko,
  fetchTwelveData,
} from '../prices.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';
const IS_DEV         = process.env.VERCEL_ENV !== 'production';
const MAX_SYMBOLS    = 200;

function log(...args) {
  if (IS_DEV) console.log('[snapshot]', ...args);
}

// ── Minimal symbol registry ────────────────────────────────
// Covers symbols Aurix actively uses today. No FX, no search expansion.
const REGISTRY = {
  // Crypto (coingecko ids) — mirrors frontend CRYPTO_IDS list
  BTC:     { assetType: 'crypto', provider: 'coingecko', providerId: 'bitcoin' },
  ETH:     { assetType: 'crypto', provider: 'coingecko', providerId: 'ethereum' },
  USDT:    { assetType: 'crypto', provider: 'coingecko', providerId: 'tether' },
  BNB:     { assetType: 'crypto', provider: 'coingecko', providerId: 'binancecoin' },
  SOL:     { assetType: 'crypto', provider: 'coingecko', providerId: 'solana' },
  XRP:     { assetType: 'crypto', provider: 'coingecko', providerId: 'ripple' },
  USDC:    { assetType: 'crypto', provider: 'coingecko', providerId: 'usd-coin' },
  ADA:     { assetType: 'crypto', provider: 'coingecko', providerId: 'cardano' },
  AVAX:    { assetType: 'crypto', provider: 'coingecko', providerId: 'avalanche-2' },
  DOGE:    { assetType: 'crypto', provider: 'coingecko', providerId: 'dogecoin' },
  TRX:     { assetType: 'crypto', provider: 'coingecko', providerId: 'tron' },
  DOT:     { assetType: 'crypto', provider: 'coingecko', providerId: 'polkadot' },
  LINK:    { assetType: 'crypto', provider: 'coingecko', providerId: 'chainlink' },
  MATIC:   { assetType: 'crypto', provider: 'coingecko', providerId: 'matic-network' },
  WBTC:    { assetType: 'crypto', provider: 'coingecko', providerId: 'wrapped-bitcoin' },
  SHIB:    { assetType: 'crypto', provider: 'coingecko', providerId: 'shiba-inu' },
  DAI:     { assetType: 'crypto', provider: 'coingecko', providerId: 'dai' },
  LTC:     { assetType: 'crypto', provider: 'coingecko', providerId: 'litecoin' },
  BCH:     { assetType: 'crypto', provider: 'coingecko', providerId: 'bitcoin-cash' },
  UNI:     { assetType: 'crypto', provider: 'coingecko', providerId: 'uniswap' },
  XLM:     { assetType: 'crypto', provider: 'coingecko', providerId: 'stellar' },
  ATOM:    { assetType: 'crypto', provider: 'coingecko', providerId: 'cosmos' },
  OKB:     { assetType: 'crypto', provider: 'coingecko', providerId: 'okb' },
  XMR:     { assetType: 'crypto', provider: 'coingecko', providerId: 'monero' },
  ETC:     { assetType: 'crypto', provider: 'coingecko', providerId: 'ethereum-classic' },
  FIL:     { assetType: 'crypto', provider: 'coingecko', providerId: 'filecoin' },
  HBAR:    { assetType: 'crypto', provider: 'coingecko', providerId: 'hedera-hashgraph' },
  ICP:     { assetType: 'crypto', provider: 'coingecko', providerId: 'internet-computer' },
  VET:     { assetType: 'crypto', provider: 'coingecko', providerId: 'vechain' },
  APT:     { assetType: 'crypto', provider: 'coingecko', providerId: 'aptos' },
  NEAR:    { assetType: 'crypto', provider: 'coingecko', providerId: 'near' },
  AAVE:    { assetType: 'crypto', provider: 'coingecko', providerId: 'aave' },
  ARB:     { assetType: 'crypto', provider: 'coingecko', providerId: 'arbitrum' },
  OP:      { assetType: 'crypto', provider: 'coingecko', providerId: 'optimism' },
  ALGO:    { assetType: 'crypto', provider: 'coingecko', providerId: 'algorand' },
  QNT:     { assetType: 'crypto', provider: 'coingecko', providerId: 'quant-network' },
  GRT:     { assetType: 'crypto', provider: 'coingecko', providerId: 'the-graph' },
  INJ:     { assetType: 'crypto', provider: 'coingecko', providerId: 'injective-protocol' },
  FTM:     { assetType: 'crypto', provider: 'coingecko', providerId: 'fantom' },
  IMX:     { assetType: 'crypto', provider: 'coingecko', providerId: 'immutable-x' },
  THETA:   { assetType: 'crypto', provider: 'coingecko', providerId: 'theta-token' },
  XTZ:     { assetType: 'crypto', provider: 'coingecko', providerId: 'tezos' },
  FLOW:    { assetType: 'crypto', provider: 'coingecko', providerId: 'flow' },
  SAND:    { assetType: 'crypto', provider: 'coingecko', providerId: 'the-sandbox' },
  MANA:    { assetType: 'crypto', provider: 'coingecko', providerId: 'decentraland' },
  AXS:     { assetType: 'crypto', provider: 'coingecko', providerId: 'axie-infinity' },
  EOS:     { assetType: 'crypto', provider: 'coingecko', providerId: 'eos' },
  NEO:     { assetType: 'crypto', provider: 'coingecko', providerId: 'neo' },
  KCS:     { assetType: 'crypto', provider: 'coingecko', providerId: 'kucoin-shares' },
  MKR:     { assetType: 'crypto', provider: 'coingecko', providerId: 'maker' },
  CAKE:    { assetType: 'crypto', provider: 'coingecko', providerId: 'pancakeswap-token' },
  CRV:     { assetType: 'crypto', provider: 'coingecko', providerId: 'curve-dao-token' },
  SNX:     { assetType: 'crypto', provider: 'coingecko', providerId: 'synthetix-network-token' },
  COMP:    { assetType: 'crypto', provider: 'coingecko', providerId: 'compound-governance-token' },
  CHZ:     { assetType: 'crypto', provider: 'coingecko', providerId: 'chiliz' },
  GALA:    { assetType: 'crypto', provider: 'coingecko', providerId: 'gala' },
  ENJ:     { assetType: 'crypto', provider: 'coingecko', providerId: 'enjincoin' },
  '1INCH': { assetType: 'crypto', provider: 'coingecko', providerId: '1inch' },
  LRC:     { assetType: 'crypto', provider: 'coingecko', providerId: 'loopring' },
  BAT:     { assetType: 'crypto', provider: 'coingecko', providerId: 'basic-attention-token' },
  ZIL:     { assetType: 'crypto', provider: 'coingecko', providerId: 'zilliqa' },
  MIOTA:   { assetType: 'crypto', provider: 'coingecko', providerId: 'iota' },
  DASH:    { assetType: 'crypto', provider: 'coingecko', providerId: 'dash' },
  ZEC:     { assetType: 'crypto', provider: 'coingecko', providerId: 'zcash' },
  WAVES:   { assetType: 'crypto', provider: 'coingecko', providerId: 'waves' },
  DCR:     { assetType: 'crypto', provider: 'coingecko', providerId: 'decred' },
  XEM:     { assetType: 'crypto', provider: 'coingecko', providerId: 'nem' },
  BSV:     { assetType: 'crypto', provider: 'coingecko', providerId: 'bitcoin-sv' },
  ONT:     { assetType: 'crypto', provider: 'coingecko', providerId: 'ontology' },
  QTUM:    { assetType: 'crypto', provider: 'coingecko', providerId: 'qtum' },
  ICX:     { assetType: 'crypto', provider: 'coingecko', providerId: 'icon' },
  LSK:     { assetType: 'crypto', provider: 'coingecko', providerId: 'lisk' },
  NANO:    { assetType: 'crypto', provider: 'coingecko', providerId: 'nano' },
  SC:      { assetType: 'crypto', provider: 'coingecko', providerId: 'siacoin' },
  STORJ:   { assetType: 'crypto', provider: 'coingecko', providerId: 'storj' },
  OCEAN:   { assetType: 'crypto', provider: 'coingecko', providerId: 'ocean-protocol' },
  RNDR:    { assetType: 'crypto', provider: 'coingecko', providerId: 'render-token' },
  SUI:     { assetType: 'crypto', provider: 'coingecko', providerId: 'sui' },
  SEI:     { assetType: 'crypto', provider: 'coingecko', providerId: 'sei-network' },
  TIA:     { assetType: 'crypto', provider: 'coingecko', providerId: 'celestia' },
  STRK:    { assetType: 'crypto', provider: 'coingecko', providerId: 'starknet' },
  PYTH:    { assetType: 'crypto', provider: 'coingecko', providerId: 'pyth-network' },
  JTO:     { assetType: 'crypto', provider: 'coingecko', providerId: 'jito-governance-token' },
  W:       { assetType: 'crypto', provider: 'coingecko', providerId: 'wormhole' },
  JUP:     { assetType: 'crypto', provider: 'coingecko', providerId: 'jupiter-exchange-solana' },
  PENDLE:  { assetType: 'crypto', provider: 'coingecko', providerId: 'pendle' },
  FLOKI:   { assetType: 'crypto', provider: 'coingecko', providerId: 'floki' },
  PEPE:    { assetType: 'crypto', provider: 'coingecko', providerId: 'pepe' },
  BONK:    { assetType: 'crypto', provider: 'coingecko', providerId: 'bonk' },
  WIF:     { assetType: 'crypto', provider: 'coingecko', providerId: 'dogwifcoin' },
  OM:      { assetType: 'crypto', provider: 'coingecko', providerId: 'mantra-dao' },
  WLD:     { assetType: 'crypto', provider: 'coingecko', providerId: 'worldcoin-wld' },
  BLUR:    { assetType: 'crypto', provider: 'coingecko', providerId: 'blur' },
  DYDX:    { assetType: 'crypto', provider: 'coingecko', providerId: 'dydx-chain' },
  GMX:     { assetType: 'crypto', provider: 'coingecko', providerId: 'gmx' },
  RPL:     { assetType: 'crypto', provider: 'coingecko', providerId: 'rocket-pool' },
  LDO:     { assetType: 'crypto', provider: 'coingecko', providerId: 'lido-dao' },
  FXS:     { assetType: 'crypto', provider: 'coingecko', providerId: 'frax-share' },
  CVX:     { assetType: 'crypto', provider: 'coingecko', providerId: 'convex-finance' },
  YFI:     { assetType: 'crypto', provider: 'coingecko', providerId: 'yearn-finance' },

  // Stocks
  AAPL:    { assetType: 'stock', provider: 'twelvedata', providerId: 'AAPL'  },
  MSFT:    { assetType: 'stock', provider: 'twelvedata', providerId: 'MSFT'  },
  NVDA:    { assetType: 'stock', provider: 'twelvedata', providerId: 'NVDA'  },
  TSLA:    { assetType: 'stock', provider: 'twelvedata', providerId: 'TSLA'  },
  AMZN:    { assetType: 'stock', provider: 'twelvedata', providerId: 'AMZN'  },
  META:    { assetType: 'stock', provider: 'twelvedata', providerId: 'META'  },
  GOOGL:   { assetType: 'stock', provider: 'twelvedata', providerId: 'GOOGL' },
  JPM:     { assetType: 'stock', provider: 'twelvedata', providerId: 'JPM'   },
  V:       { assetType: 'stock', provider: 'twelvedata', providerId: 'V'     },
  WMT:     { assetType: 'stock', provider: 'twelvedata', providerId: 'WMT'   },
  'BRK.B': { assetType: 'stock', provider: 'twelvedata', providerId: 'BRK.B' },
  JNJ:     { assetType: 'stock', provider: 'twelvedata', providerId: 'JNJ'   },
  PG:      { assetType: 'stock', provider: 'twelvedata', providerId: 'PG'    },
  XOM:     { assetType: 'stock', provider: 'twelvedata', providerId: 'XOM'   },
  BAC:     { assetType: 'stock', provider: 'twelvedata', providerId: 'BAC'   },
  AVGO:    { assetType: 'stock', provider: 'twelvedata', providerId: 'AVGO'  },
  COST:    { assetType: 'stock', provider: 'twelvedata', providerId: 'COST'  },
  KO:      { assetType: 'stock', provider: 'twelvedata', providerId: 'KO'    },
  MCD:     { assetType: 'stock', provider: 'twelvedata', providerId: 'MCD'   },
  NKE:     { assetType: 'stock', provider: 'twelvedata', providerId: 'NKE'   },

  // ETFs
  SPY:  { assetType: 'etf', provider: 'twelvedata', providerId: 'SPY'  },
  QQQ:  { assetType: 'etf', provider: 'twelvedata', providerId: 'QQQ'  },
  VOO:  { assetType: 'etf', provider: 'twelvedata', providerId: 'VOO'  },
  VTI:  { assetType: 'etf', provider: 'twelvedata', providerId: 'VTI'  },
  URTH: { assetType: 'etf', provider: 'twelvedata', providerId: 'URTH' },
  VEA:  { assetType: 'etf', provider: 'twelvedata', providerId: 'VEA'  },

  // Indices
  '^GSPC': { assetType: 'index', provider: 'twelvedata', providerId: '^GSPC' },
  '^IXIC': { assetType: 'index', provider: 'twelvedata', providerId: '^IXIC' },
  '^DJI':  { assetType: 'index', provider: 'twelvedata', providerId: '^DJI'  },

  // Commodities
  'XAU/USD': { assetType: 'commodity', provider: 'twelvedata', providerId: 'XAU/USD' },
  'XAG/USD': { assetType: 'commodity', provider: 'twelvedata', providerId: 'XAG/USD' },
  WTI:       { assetType: 'commodity', provider: 'twelvedata', providerId: 'WTI'     },
  'GC=F':    { assetType: 'commodity', provider: 'twelvedata', providerId: 'GC=F'    },
};

function resolveSymbol(raw) {
  if (REGISTRY[raw]) return { canonical: raw, entry: REGISTRY[raw] };
  const upper = raw.toUpperCase();
  if (REGISTRY[upper]) return { canonical: upper, entry: REGISTRY[upper] };
  return null;
}

function ttlFor(assetType) {
  return assetType === 'crypto' ? TTL.crypto : TTL.stock;
}

// ── Handler ────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'method_not_allowed' });

  const raw = (req.query?.symbols ?? '').toString().trim();
  if (!raw) return res.status(400).json({ error: 'symbols_required' });

  const requested = [...new Set(
    raw.split(',').map(s => s.trim()).filter(Boolean)
  )].slice(0, MAX_SYMBOLS);
  if (requested.length === 0) return res.status(400).json({ error: 'symbols_required' });

  // ── Resolve via registry ─────────────────────────────────
  const resolved   = []; // { canonical, entry }
  const unresolved = []; // raw symbol strings not in registry
  for (const s of requested) {
    const r = resolveSymbol(s);
    if (r) resolved.push(r);
    else unresolved.push(s);
  }

  log('requested:', requested.length, 'resolved:', resolved.length, 'unresolved:', unresolved.length);

  // ── Split: serve from cache vs fetch ─────────────────────
  const cgItems = []; // { provider, id, canonical }
  const tdItems = []; // { provider, symbol: providerId, canonical }
  const cachedHits = new Map(); // canonical → { price, change24h, cachedAt }

  for (const { canonical, entry } of resolved) {
    const provKey = `${entry.provider}:${entry.providerId}`;
    const entryCache = PRICE_CACHE.get(provKey);
    if (entryCache && Date.now() - entryCache.timestamp <= entryCache.ttl) {
      cachedHits.set(canonical, {
        price:     entryCache.value.price,
        change24h: entryCache.value.change24h ?? null,
        cachedAt:  entryCache.timestamp,
      });
      continue;
    }
    if (entry.provider === 'coingecko') {
      cgItems.push({ provider: provKey, id: entry.providerId, canonical });
    } else {
      tdItems.push({ provider: provKey, symbol: entry.providerId, canonical });
    }
  }

  // ── Fetch missing, per-provider isolation ────────────────
  const fresh         = new Map(); // canonical → { price, change24h }
  const failedSymbols = new Set();
  const tasks         = [];

  if (cgItems.length > 0) {
    tasks.push(
      fetchCoinGecko(cgItems)
        .then(result => {
          for (const item of cgItems) {
            const val = result[item.provider];
            if (val) {
              setCache(item.provider, val, TTL.crypto);
              fresh.set(item.canonical, val);
            } else {
              failedSymbols.add(item.canonical);
            }
          }
        })
        .catch(err => {
          log('coingecko error:', err.message);
          for (const item of cgItems) failedSymbols.add(item.canonical);
        })
    );
  }

  if (tdItems.length > 0) {
    const TWELVE_KEY = process.env.TWELVE_API_KEY;
    if (!TWELVE_KEY) {
      log('twelvedata skipped: TWELVE_API_KEY not configured');
      for (const item of tdItems) failedSymbols.add(item.canonical);
    } else {
      tasks.push(
        fetchTwelveData(tdItems, TWELVE_KEY)
          .then(result => {
            for (const item of tdItems) {
              const val = result[item.provider];
              if (val) {
                setCache(item.provider, val, TTL.stock);
                fresh.set(item.canonical, val);
              } else {
                failedSymbols.add(item.canonical);
              }
            }
          })
          .catch(err => {
            log('twelvedata error:', err.message);
            for (const item of tdItems) failedSymbols.add(item.canonical);
          })
      );
    }
  }

  await Promise.all(tasks);

  // ── Build canonical PriceObject[] ────────────────────────
  const now      = Date.now();
  const snapshot = [];

  for (const { canonical, entry } of resolved) {
    const freshHit  = fresh.get(canonical);
    const cacheHit  = cachedHits.get(canonical);

    if (freshHit) {
      snapshot.push({
        symbol:     canonical,
        assetType:  entry.assetType,
        price:      freshHit.price,
        currency:   'USD',
        change24h:  freshHit.change24h ?? null,
        timestamp:  now,
        source:     entry.provider,
        stale:      false,
        confidence: 1.0,
      });
    } else if (cacheHit) {
      const ttl = ttlFor(entry.assetType);
      const age = now - cacheHit.cachedAt;
      snapshot.push({
        symbol:     canonical,
        assetType:  entry.assetType,
        price:      cacheHit.price,
        currency:   'USD',
        change24h:  cacheHit.change24h ?? null,
        timestamp:  cacheHit.cachedAt,
        source:     entry.provider,
        stale:      age > ttl, // defensive — should not happen given the filter
        confidence: 0.7,
      });
    }
    // else: omitted; contributes to partial=true
  }

  const partial =
    unresolved.length > 0 ||
    failedSymbols.size > 0 ||
    snapshot.length < resolved.length;

  log('snapshot:', snapshot.length, 'partial:', partial);

  return res.status(200).json({
    generatedAt: now,
    partial,
    snapshot,
  });
}
