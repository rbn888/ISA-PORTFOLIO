// GET /api/prices/snapshot?symbols=BTC,AAPL,XAU/USD,^GSPC
// Response: { generatedAt, partial, snapshot: [PriceObject, ...] }
//
// PriceObject = {
//   symbol, assetType, price, currency,
//   change24h, timestamp, source, stale, confidence
// }
//
// ── Provider routing ──────────────────────────────────────
//   crypto                        → CoinGecko (no fallback)
//   stocks / ETFs / indices       → Yahoo primary
//   commodities                   → Yahoo proxy primary
//                                   (XAU/USD → GC=F, XAG/USD → SI=F, WTI → CL=F)
//   TwelveData                    → fallback only, attempted on Yahoo failure
//                                   and gated on TWELVE_API_KEY presence
//
// The canonical symbol (registry key) is preserved in the response
// regardless of which proxy actually served the value.

import {
  PRICE_CACHE,
  TTL,
  setCache,
  fetchCoinGecko,
  fetchTwelveData,
  fetchYahoo,
  OBSERVABILITY,
} from '../prices.js';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://rbn888.github.io';
const IS_DEV         = process.env.VERCEL_ENV !== 'production';
const MAX_SYMBOLS    = 200;

function log(...args) {
  if (IS_DEV) console.log('[snapshot]', ...args);
}

// ── Symbol registry ────────────────────────────────────────
// Each entry's `providers` is an ordered chain: primary → fallback.
// The dispatcher attempts each tier in turn; the first provider that
// returns a usable price wins. The canonical symbol (registry key) is
// what the API returns regardless of which provider proxy served the
// value (e.g. XAU/USD canonical may resolve via yahoo:GC=F internally).
// TwelveData fallback is only attempted when TWELVE_API_KEY is set.
const REGISTRY = {
  // Crypto (CoinGecko, no fallback)
  BTC:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'bitcoin' }] },
  ETH:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'ethereum' }] },
  USDT:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'tether' }] },
  BNB:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'binancecoin' }] },
  SOL:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'solana' }] },
  XRP:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'ripple' }] },
  USDC:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'usd-coin' }] },
  ADA:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'cardano' }] },
  AVAX:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'avalanche-2' }] },
  DOGE:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'dogecoin' }] },
  TRX:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'tron' }] },
  DOT:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'polkadot' }] },
  LINK:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'chainlink' }] },
  MATIC:   { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'matic-network' }] },
  WBTC:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'wrapped-bitcoin' }] },
  SHIB:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'shiba-inu' }] },
  DAI:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'dai' }] },
  LTC:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'litecoin' }] },
  BCH:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'bitcoin-cash' }] },
  UNI:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'uniswap' }] },
  XLM:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'stellar' }] },
  ATOM:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'cosmos' }] },
  OKB:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'okb' }] },
  XMR:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'monero' }] },
  ETC:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'ethereum-classic' }] },
  FIL:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'filecoin' }] },
  HBAR:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'hedera-hashgraph' }] },
  ICP:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'internet-computer' }] },
  VET:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'vechain' }] },
  APT:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'aptos' }] },
  NEAR:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'near' }] },
  AAVE:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'aave' }] },
  ARB:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'arbitrum' }] },
  OP:      { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'optimism' }] },
  ALGO:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'algorand' }] },
  QNT:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'quant-network' }] },
  GRT:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'the-graph' }] },
  INJ:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'injective-protocol' }] },
  FTM:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'fantom' }] },
  IMX:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'immutable-x' }] },
  THETA:   { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'theta-token' }] },
  XTZ:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'tezos' }] },
  FLOW:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'flow' }] },
  SAND:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'the-sandbox' }] },
  MANA:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'decentraland' }] },
  AXS:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'axie-infinity' }] },
  EOS:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'eos' }] },
  NEO:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'neo' }] },
  KCS:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'kucoin-shares' }] },
  MKR:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'maker' }] },
  CAKE:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'pancakeswap-token' }] },
  CRV:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'curve-dao-token' }] },
  SNX:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'synthetix-network-token' }] },
  COMP:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'compound-governance-token' }] },
  CHZ:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'chiliz' }] },
  GALA:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'gala' }] },
  ENJ:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'enjincoin' }] },
  '1INCH': { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: '1inch' }] },
  LRC:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'loopring' }] },
  BAT:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'basic-attention-token' }] },
  ZIL:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'zilliqa' }] },
  MIOTA:   { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'iota' }] },
  DASH:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'dash' }] },
  ZEC:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'zcash' }] },
  WAVES:   { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'waves' }] },
  DCR:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'decred' }] },
  XEM:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'nem' }] },
  BSV:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'bitcoin-sv' }] },
  ONT:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'ontology' }] },
  QTUM:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'qtum' }] },
  ICX:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'icon' }] },
  LSK:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'lisk' }] },
  NANO:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'nano' }] },
  SC:      { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'siacoin' }] },
  STORJ:   { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'storj' }] },
  OCEAN:   { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'ocean-protocol' }] },
  RNDR:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'render-token' }] },
  SUI:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'sui' }] },
  SEI:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'sei-network' }] },
  TIA:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'celestia' }] },
  STRK:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'starknet' }] },
  PYTH:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'pyth-network' }] },
  JTO:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'jito-governance-token' }] },
  W:       { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'wormhole' }] },
  JUP:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'jupiter-exchange-solana' }] },
  PENDLE:  { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'pendle' }] },
  FLOKI:   { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'floki' }] },
  PEPE:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'pepe' }] },
  BONK:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'bonk' }] },
  WIF:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'dogwifcoin' }] },
  OM:      { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'mantra-dao' }] },
  WLD:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'worldcoin-wld' }] },
  BLUR:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'blur' }] },
  DYDX:    { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'dydx-chain' }] },
  GMX:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'gmx' }] },
  RPL:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'rocket-pool' }] },
  LDO:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'lido-dao' }] },
  FXS:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'frax-share' }] },
  CVX:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'convex-finance' }] },
  YFI:     { assetType: 'crypto', providers: [{ provider: 'coingecko', providerId: 'yearn-finance' }] },

  // Stocks: yahoo → twelvedata
  AAPL:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'AAPL'  }, { provider: 'twelvedata', providerId: 'AAPL'  }] },
  MSFT:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'MSFT'  }, { provider: 'twelvedata', providerId: 'MSFT'  }] },
  NVDA:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'NVDA'  }, { provider: 'twelvedata', providerId: 'NVDA'  }] },
  TSLA:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'TSLA'  }, { provider: 'twelvedata', providerId: 'TSLA'  }] },
  AMZN:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'AMZN'  }, { provider: 'twelvedata', providerId: 'AMZN'  }] },
  META:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'META'  }, { provider: 'twelvedata', providerId: 'META'  }] },
  GOOGL:   { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'GOOGL' }, { provider: 'twelvedata', providerId: 'GOOGL' }] },
  JPM:     { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'JPM'   }, { provider: 'twelvedata', providerId: 'JPM'   }] },
  V:       { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'V'     }, { provider: 'twelvedata', providerId: 'V'     }] },
  WMT:     { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'WMT'   }, { provider: 'twelvedata', providerId: 'WMT'   }] },
  'BRK.B': { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'BRK-B' }, { provider: 'twelvedata', providerId: 'BRK.B' }] },
  JNJ:     { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'JNJ'   }, { provider: 'twelvedata', providerId: 'JNJ'   }] },
  PG:      { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'PG'    }, { provider: 'twelvedata', providerId: 'PG'    }] },
  XOM:     { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'XOM'   }, { provider: 'twelvedata', providerId: 'XOM'   }] },
  BAC:     { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'BAC'   }, { provider: 'twelvedata', providerId: 'BAC'   }] },
  AVGO:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'AVGO'  }, { provider: 'twelvedata', providerId: 'AVGO'  }] },
  COST:    { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'COST'  }, { provider: 'twelvedata', providerId: 'COST'  }] },
  KO:      { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'KO'    }, { provider: 'twelvedata', providerId: 'KO'    }] },
  MCD:     { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'MCD'   }, { provider: 'twelvedata', providerId: 'MCD'   }] },
  NKE:     { assetType: 'stock', providers: [{ provider: 'yahoo', providerId: 'NKE'   }, { provider: 'twelvedata', providerId: 'NKE'   }] },

  // ETFs: yahoo → twelvedata
  SPY:  { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'SPY'  }, { provider: 'twelvedata', providerId: 'SPY'  }] },
  QQQ:  { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'QQQ'  }, { provider: 'twelvedata', providerId: 'QQQ'  }] },
  VOO:  { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VOO'  }, { provider: 'twelvedata', providerId: 'VOO'  }] },
  VTI:  { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VTI'  }, { provider: 'twelvedata', providerId: 'VTI'  }] },
  URTH: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'URTH' }, { provider: 'twelvedata', providerId: 'URTH' }] },
  VEA:  { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VEA'  }, { provider: 'twelvedata', providerId: 'VEA'  }] },
  // MC-3: UCITS / European-listed ETFs. Canonical key is the bare ticker
  // (IWDA, VWCE, …); providerId carries the most-liquid exchange-suffixed
  // form Yahoo expects. resolveSymbol() additionally strips
  // 1-3-letter exchange suffixes so inputs like 'IWDA.L', 'IWDA.AS',
  // 'EUNL.DE' all converge to the same canonical entry.
  IWDA: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'IWDA.AS' }, { provider: 'twelvedata', providerId: 'IWDA.AS' }] },
  SWDA: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'SWDA.L'  }, { provider: 'twelvedata', providerId: 'SWDA.L'  }] },
  EUNL: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'EUNL.DE' }, { provider: 'twelvedata', providerId: 'EUNL.DE' }] },
  VWCE: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VWCE.DE' }, { provider: 'twelvedata', providerId: 'VWCE.DE' }] },
  VWRL: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VWRL.L'  }, { provider: 'twelvedata', providerId: 'VWRL.L'  }] },
  VWRA: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VWRA.L'  }, { provider: 'twelvedata', providerId: 'VWRA.L'  }] },
  VUSA: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VUSA.L'  }, { provider: 'twelvedata', providerId: 'VUSA.L'  }] },
  VUAA: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VUAA.L'  }, { provider: 'twelvedata', providerId: 'VUAA.L'  }] },
  CSPX: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'CSPX.L'  }, { provider: 'twelvedata', providerId: 'CSPX.L'  }] },
  SXR8: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'SXR8.DE' }, { provider: 'twelvedata', providerId: 'SXR8.DE' }] },
  EQQQ: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'EQQQ.L'  }, { provider: 'twelvedata', providerId: 'EQQQ.L'  }] },
  CNDX: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'CNDX.L'  }, { provider: 'twelvedata', providerId: 'CNDX.L'  }] },
  CW8:  { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'CW8.PA'  }, { provider: 'twelvedata', providerId: 'CW8.PA'  }] },
  LCWD: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'LCWD.DE' }, { provider: 'twelvedata', providerId: 'LCWD.DE' }] },
  EIMI: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'EIMI.L'  }, { provider: 'twelvedata', providerId: 'EIMI.L'  }] },
  VFEM: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VFEM.L'  }, { provider: 'twelvedata', providerId: 'VFEM.L'  }] },
  AGGH: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'AGGH.L'  }, { provider: 'twelvedata', providerId: 'AGGH.L'  }] },
  VAGF: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'VAGF.L'  }, { provider: 'twelvedata', providerId: 'VAGF.L'  }] },
  SGLN: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'SGLN.L'  }, { provider: 'twelvedata', providerId: 'SGLN.L'  }] },
  PHAU: { assetType: 'etf', providers: [{ provider: 'yahoo', providerId: 'PHAU.L'  }, { provider: 'twelvedata', providerId: 'PHAU.L'  }] },

  // Indices: yahoo → twelvedata
  '^GSPC':     { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^GSPC'     }, { provider: 'twelvedata', providerId: '^GSPC'     }] },
  '^IXIC':     { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^IXIC'     }, { provider: 'twelvedata', providerId: '^IXIC'     }] },
  '^DJI':      { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^DJI'      }, { provider: 'twelvedata', providerId: '^DJI'      }] },
  // MC-2C: major international indices. Yahoo chart serves all of these
  // on the caret symbol; TwelveData is the gateway fallback when
  // TWELVE_API_KEY is set.
  '^IBEX':     { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^IBEX'     }, { provider: 'twelvedata', providerId: '^IBEX'     }] },
  '^GDAXI':    { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^GDAXI'    }, { provider: 'twelvedata', providerId: '^GDAXI'    }] },
  '^FCHI':     { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^FCHI'     }, { provider: 'twelvedata', providerId: '^FCHI'     }] },
  '^N225':     { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^N225'     }, { provider: 'twelvedata', providerId: '^N225'     }] },
  '^FTSE':     { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^FTSE'     }, { provider: 'twelvedata', providerId: '^FTSE'     }] },
  '^STOXX50E': { assetType: 'index', providers: [{ provider: 'yahoo', providerId: '^STOXX50E' }, { provider: 'twelvedata', providerId: '^STOXX50E' }] },

  // Commodities. Yahoo serves futures (GC=F, SI=F, CL=F) as proxies for the
  // spot canonical (XAU/USD, XAG/USD, WTI). Yahoo's bare "WTI" ticker is the
  // W&T Offshore stock — must use CL=F. TwelveData spot is the fallback.
  'XAU/USD': { assetType: 'commodity', providers: [{ provider: 'yahoo', providerId: 'GC=F' }, { provider: 'twelvedata', providerId: 'XAU/USD' }] },
  'XAG/USD': { assetType: 'commodity', providers: [{ provider: 'yahoo', providerId: 'SI=F' }, { provider: 'twelvedata', providerId: 'XAG/USD' }] },
  WTI:       { assetType: 'commodity', providers: [{ provider: 'yahoo', providerId: 'CL=F' }, { provider: 'twelvedata', providerId: 'WTI'     }] },
  'GC=F':    { assetType: 'commodity', providers: [{ provider: 'yahoo', providerId: 'GC=F' }] },
};

function resolveSymbol(raw) {
  if (REGISTRY[raw]) return { canonical: raw, entry: REGISTRY[raw] };
  const upper = raw.toUpperCase();
  if (REGISTRY[upper]) return { canonical: upper, entry: REGISTRY[upper] };
  // MC-3: tolerate Yahoo exchange suffixes. UCITS ETFs cross-list across
  // exchanges (IWDA on .AS/.L, EUNL on .DE, etc.); the canonical REGISTRY
  // entry stores ONE provider chain and any suffixed input converges to
  // that entry. Restricted to 1-3 uppercase letters so we don't strip
  // anything from index tickers (^GSPC) or futures (GC=F).
  const stripped = upper.replace(/\.[A-Z]{1,3}$/, '');
  if (stripped !== upper && REGISTRY[stripped]) {
    return { canonical: stripped, entry: REGISTRY[stripped] };
  }
  return null;
}

function ttlFor(assetType) {
  return TTL[assetType] ?? TTL.stock;
}

// ── Handler ────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin',  ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')     return res.status(405).json({ error: 'method_not_allowed' });

  const _t0 = Date.now();
  OBSERVABILITY.snapshot.requestCount++;

  const raw = (req.query?.symbols ?? '').toString().trim();
  if (!raw) return res.status(400).json({ error: 'symbols_required' });

  const requested = [...new Set(
    raw.split(',').map(s => s.trim()).filter(Boolean)
  )].slice(0, MAX_SYMBOLS);
  if (requested.length === 0) return res.status(400).json({ error: 'symbols_required' });

  OBSERVABILITY.snapshot.symbolsRequested += requested.length;

  // ── Resolve via registry ─────────────────────────────────
  const resolved   = []; // { canonical, entry }
  const unresolved = [];
  for (const s of requested) {
    const r = resolveSymbol(s);
    if (r) resolved.push(r);
    else unresolved.push(s);
  }

  log('requested:', requested.length, 'resolved:', resolved.length, 'unresolved:', unresolved.length);

  // ── Cache pre-pass: scan the entire chain per symbol, first hit wins ──
  // Serving from a fallback's cache when the primary's cache expired but
  // the fallback's is still warm is the desired behaviour — TTLs are
  // per-assetType so the freshness window is identical.
  const cachedHits = new Map(); // canonical → { price, change24h, cachedAt, source }
  const needFetch  = [];        // { canonical, entry, tier }

  for (const { canonical, entry } of resolved) {
    let hit = null;
    for (const p of entry.providers) {
      const c = PRICE_CACHE.get(`${p.provider}:${p.providerId}`);
      if (c && Date.now() - c.timestamp <= c.ttl) {
        hit = {
          price:     c.value.price,
          change24h: c.value.change24h ?? null,
          cachedAt:  c.timestamp,
          source:    p.provider,
        };
        break;
      }
    }
    if (hit) cachedHits.set(canonical, hit);
    else needFetch.push({ canonical, entry, tier: 0 });
  }

  // ── Tier-based fetch: primary first, fallback only on miss ─────────
  // Each tier batches all symbols at that depth by provider, runs them
  // in parallel, then advances anything still unresolved to the next
  // tier. TwelveData is gated on TWELVE_API_KEY presence — if absent it
  // is skipped silently so Yahoo failures don't drag down other prices.
  const TWELVE_KEY = process.env.TWELVE_API_KEY;
  const fresh      = new Map(); // canonical → { price, change24h, source }
  let queue        = needFetch;

  while (queue.length > 0) {
    const byProvider = { yahoo: [], coingecko: [], twelvedata: [] };
    for (const item of queue) {
      const p = item.entry.providers[item.tier];
      if (!p) continue;
      if (p.provider === 'twelvedata' && !TWELVE_KEY) continue;
      if (!byProvider[p.provider]) continue;
      byProvider[p.provider].push({
        ...item,
        providerKey: `${p.provider}:${p.providerId}`,
        providerId:  p.providerId,
      });
    }

    const tasks = [];

    if (byProvider.yahoo.length > 0) {
      const items = byProvider.yahoo.map(i => ({ provider: i.providerKey, symbol: i.providerId }));
      tasks.push(
        fetchYahoo(items)
          .then(result => {
            for (const it of byProvider.yahoo) {
              const val = result[it.providerKey];
              if (val) {
                setCache(it.providerKey, val, ttlFor(it.entry.assetType));
                fresh.set(it.canonical, { price: val.price, change24h: val.change24h ?? null, source: 'yahoo' });
              }
            }
          })
          .catch(err => log('yahoo error:', err.message))
      );
    }

    if (byProvider.coingecko.length > 0) {
      const items = byProvider.coingecko.map(i => ({ provider: i.providerKey, id: i.providerId }));
      tasks.push(
        fetchCoinGecko(items)
          .then(result => {
            for (const it of byProvider.coingecko) {
              const val = result[it.providerKey];
              if (val) {
                setCache(it.providerKey, val, ttlFor(it.entry.assetType));
                fresh.set(it.canonical, { price: val.price, change24h: val.change24h ?? null, source: 'coingecko' });
              }
            }
          })
          .catch(err => log('coingecko error:', err.message))
      );
    }

    if (byProvider.twelvedata.length > 0) {
      const items = byProvider.twelvedata.map(i => ({ provider: i.providerKey, symbol: i.providerId }));
      tasks.push(
        fetchTwelveData(items, TWELVE_KEY)
          .then(result => {
            for (const it of byProvider.twelvedata) {
              const val = result[it.providerKey];
              if (val) {
                setCache(it.providerKey, val, ttlFor(it.entry.assetType));
                fresh.set(it.canonical, { price: val.price, change24h: val.change24h ?? null, source: 'twelvedata' });
              }
            }
          })
          .catch(err => log('twelvedata error:', err.message))
      );
    }

    await Promise.all(tasks);

    const next = [];
    for (const item of queue) {
      if (fresh.has(item.canonical)) continue;
      if (item.entry.providers[item.tier + 1]) {
        next.push({ ...item, tier: item.tier + 1 });
      }
    }
    queue = next;
  }

  // ── Build canonical PriceObject[] ────────────────────────
  const now      = Date.now();
  const snapshot = [];

  for (const { canonical, entry } of resolved) {
    const freshHit = fresh.get(canonical);
    const cacheHit = cachedHits.get(canonical);

    if (freshHit) {
      snapshot.push({
        symbol:     canonical,
        assetType:  entry.assetType,
        price:      freshHit.price,
        currency:   'USD',
        change24h:  freshHit.change24h ?? null,
        timestamp:  now,
        source:     freshHit.source,
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
        source:     cacheHit.source,
        stale:      age > ttl,
        confidence: 0.7,
      });
    }
    // else: omitted; contributes to partial=true
  }

  const partial =
    unresolved.length > 0 ||
    snapshot.length < resolved.length;

  log('snapshot:', snapshot.length, 'partial:', partial);

  OBSERVABILITY.snapshot.resolvedTotal += snapshot.length;
  if (partial) OBSERVABILITY.snapshot.partialResponses++;
  OBSERVABILITY.snapshot.latencyMs.sum += Date.now() - _t0;
  OBSERVABILITY.snapshot.latencyMs.count++;

  return res.status(200).json({
    generatedAt: now,
    partial,
    snapshot,
  });
}
