'use strict';

// ── Internationalisation ───────────────────────────────────
const LANG_KEY = 'portfolio_lang';
let lang = localStorage.getItem(LANG_KEY) || 'es';

const T = {
  es: {
    // Summary
    totalValue:      'Valor total de cartera',
    addAsset:        '+ Añadir activo',
    addLiquidity:    '+ Añadir liquidez',
    noPrices:        'precios no cargados',
    assetCount:      n => n === 1 ? '1 activo' : `${n} activos`,
    // Sections
    distribution:    'Distribución del patrimonio',
    evolution:       'Evolución del patrimonio',
    myAssets:        'Mis activos',
    chartNoData:     'Añade activos para ver la evolución',
    donutTotal:      'total',
    // Empty state
    emptyTitle:      'No tienes activos todavía.',
    emptySub:        'Pulsa "Añadir activo" para comenzar.',
    // Update status
    refreshing:      'actualizando...',
    updated:         t => `actualizado ${t}`,
    updateError:     'error al actualizar',
    rateLimit:       'límite API — reintentando pronto',
    // Market status
    live24:          '24/7',
    liveMarket:      'Mercado abierto',
    closed:          'Mercado cerrado',
    estimatedPrice:  'Precio estimado',
    updatedNow:      'Actualizado ahora',
    updatedMins:     n => `Actualizado hace ${n} min`,
    // Gold status
    goldLive:        'Live · ',
    goldEstimated:   'Precio estimado',
    goldUpdNow:      'actualizado ahora',
    goldUpdMins:     n => `actualizado hace ${n} min`,
    goldUpdHours:    n => `actualizado hace ${n}h`,
    // Card type labels
    typeCard: {
      crypto:      t => `Criptomoneda · ${t}`,
      stock:       t => `Acción · ${t}`,
      etf:         t => `Fondo/ETF · ${t}`,
      metalGold:   (t, p) => `Metal · XAU · ${p}% pureza`,
      metal:       t => `Metal · ${t}`,
      cash:        c => `Liquidez · ${c}`,
      real_estate: () => 'Inmobiliario',
      other:       () => 'Otro activo',
    },
    // Subline
    cashLabel:   'efectivo',
    units:       'ud.',
    perUnit:     '/ud.',
    perTrOz:     '/tr.oz',
    // TYPE_META labels (donut + chip)
    typeMeta: {
      crypto: 'Cripto', stock: 'Acciones', etf: 'Fondos/ETF',
      metal: 'Metales', cash: 'Liquidez', real_estate: 'Inmuebles', other: 'Otros',
    },
    // Shorter labels used only in the donut center (narrow space)
    donutMeta: { etf: 'Fondos', real_estate: 'Inmob.' },
    // Suggestion type badges
    typeLabel: { crypto: 'Cripto', stock: 'Acción', etf: 'ETF', metal: 'Metal' },
    // Contextual add button in category detail view
    addCtx: { crypto: '+ Añadir cripto', stock: '+ Añadir acción', etf: '+ Añadir fondo', metal: '+ Añadir metal', real_estate: '+ Añadir inmueble', cash: '+ Añadir liquidez' },
    // Search
    searchPH: {
      all: 'Buscar activo...', crypto: 'Buscar criptomoneda...',
      stock: 'Buscar acción...', etf: 'Buscar ETF o fondo...', metal: 'Buscar metal...',
    },
    noResults:       q => `Sin resultados para "${q}"`,
    // Price lookup
    noPrice:         'sin precio',
    priceUnavail:    'Precio no disponible — inténtalo de nuevo más tarde.',
    priceNoConn:     'Sin conexión. Precio no disponible.',
    // Card button titles
    btnAdd:          'Añadir',
    btnReduce:       'Reducir',
    btnDelete:       'Eliminar',
    btnEdit:         'Editar',
    // Modal: Add asset
    modalAddTitle:   'Añadir activo',
    modalEditRETitle: 'Editar inmueble',
    karat:           'Quilates',
    goldUnit:        'Unidad',
    gramUnit:        'g (gramos)',
    ozUnit:          'oz troy',
    qty:             'Cantidad',
    qtyGold:         u => `Cantidad (${u})`,
    estimatedVal:    'Valor estimado:',
    addToPortfolio:  'Añadir a cartera',
    // Modal: Reduce
    modalReduceTitle: 'Reducir posición',
    reduceQtyLabel:   'Cantidad a restar',
    qtyRemaining:     'Cantidad restante',
    valueRemaining:   'Valor restante',
    removeWarning:    'El activo se eliminará al llegar a 0.',
    confirmReduce:    'Confirmar reducción',
    maxLabel:         (q, u) => u ? `Máximo: ${q} ${u}` : `Máximo: ${q}`,
    cantExceed:       m => `No puedes restar más de ${m}.`,
    unidades:         'unidades',
    // Modal: Add position
    modalAddPosTitle: 'Añadir a posición',
    addQtyLabel:      u => u ? `Cantidad a añadir (${u})` : 'Cantidad a añadir',
    addQtyLabelCash:  'Importe a añadir',
    newTotalQty:      'Nueva cantidad total',
    newTotalValue:    'Nuevo valor total',
    confirm:          'Confirmar',
    // Modal: Liquidity
    modalLiqTitle:   'Añadir liquidez',
    currency:        'Moneda',
    amount:          'Importe',
    addLiqBtn:       'Añadir liquidez',
    // Filters
    filterAll: 'Todos', filterCrypto: 'Cripto', filterStock: 'Acciones',
    filterEtf: 'ETF / Fondos', filterMetal: 'Metales', filterRE: 'Inmuebles',
    reName: 'Nombre del inmueble', reValueLabel: 'Valor (en moneda base)',
    reRentLabel: 'Renta mensual', reRentHint: 'Opcional — dejar en 0 si no aplica',
    rentPerMonth: '/mes',
    // Chart range labels
    range1y:  '1A',
    rangeAll: 'TOTAL',
    backAll:  'Todos',
    viewHint: 'Ver activos →',
    // Benchmark comparison
    bmPortfolio: 'Cartera',
    bmMarket:    'Mercado',
    bmDiff:      'Diferencia',
    // Metal asset names (single language, no parenthetical mixing)
    metalNames: { XAU: 'Oro', XAG: 'Plata' },
    // ISIN / manual entry
    orLabel:          'o',
    isinLabel:        'ISIN',
    isinOptional:     ' (opcional)',
    isinPH:           'IE00B4L5Y983',
    isinOk:           '✓ ISIN válido',
    isinError:        'ISIN inválido — 12 caracteres alfanuméricos',
    isinHint:         n => `${n}/12`,
    isinLooking:      'Buscando activo...',
    isinFound:        name => `✓ ${name}`,
    isinNotFound:     'No encontrado — introduce manualmente',
    isinLookupError:  'Sin conexión — introduce manualmente',
    manualNameLabel:  'Nombre del activo',
    manualNamePH:     'Ej: iShares Core MSCI World',
    manualTypeLabel:  'Tipo de activo',
    manualTypeStock:  'Acciones',
    manualTypeEtf:    'ETF/Fondo',
    manualTypeCrypto: 'Cripto',
    manualTypeOther:  'Otros',
    manualCurrLabel:  'Moneda',
    manualPriceLabel: 'Precio por unidad',
    manualPriceOptional: ' (opcional)',
    // Beta screen
    exit: 'Salir',
  },
  en: {
    // Summary
    totalValue:      'Total portfolio value',
    addAsset:        '+ Add asset',
    addLiquidity:    '+ Add liquidity',
    noPrices:        'prices not loaded',
    assetCount:      n => n === 1 ? '1 asset' : `${n} assets`,
    // Sections
    distribution:    'Portfolio distribution',
    evolution:       'Portfolio evolution',
    myAssets:        'My assets',
    chartNoData:     'Add assets to see the evolution',
    donutTotal:      'total',
    // Empty state
    emptyTitle:      'You have no assets yet.',
    emptySub:        'Press "Add asset" to get started.',
    // Update status
    refreshing:      'refreshing...',
    updated:         t => `updated ${t}`,
    updateError:     'update error',
    rateLimit:       'API limit — retrying soon',
    // Market status
    live24:          '24/7',
    liveMarket:      'Market open',
    closed:          'Market closed',
    estimatedPrice:  'Estimated price',
    updatedNow:      'Updated just now',
    updatedMins:     n => `Updated ${n} min ago`,
    // Gold status
    goldLive:        'Live · ',
    goldEstimated:   'Estimated price',
    goldUpdNow:      'updated just now',
    goldUpdMins:     n => `updated ${n} min ago`,
    goldUpdHours:    n => `updated ${n}h ago`,
    // Card type labels
    typeCard: {
      crypto:      t => `Cryptocurrency · ${t}`,
      stock:       t => `Stock · ${t}`,
      etf:         t => `Fund/ETF · ${t}`,
      metalGold:   (t, p) => `Metal · XAU · ${p}% purity`,
      metal:       t => `Metal · ${t}`,
      cash:        c => `Cash · ${c}`,
      real_estate: () => 'Real estate',
      other:       () => 'Other asset',
    },
    // Subline
    cashLabel:   'cash',
    units:       'units',
    perUnit:     '/unit',
    perTrOz:     '/tr.oz',
    // TYPE_META labels
    typeMeta: {
      crypto: 'Crypto', stock: 'Stocks', etf: 'ETF / Funds',
      metal: 'Metals', cash: 'Cash', real_estate: 'Real Estate', other: 'Other',
    },
    // Shorter labels used only in the donut center (narrow space)
    donutMeta: { etf: 'Funds', real_estate: 'Real Est.' },
    // Suggestion type badges
    typeLabel: { crypto: 'Crypto', stock: 'Stock', etf: 'ETF', metal: 'Metal' },
    // Contextual add button in category detail view
    addCtx: { crypto: '+ Add crypto', stock: '+ Add stock', etf: '+ Add fund', metal: '+ Add metal', real_estate: '+ Add property', cash: '+ Add cash' },
    // Search
    searchPH: {
      all: 'Search asset...', crypto: 'Search cryptocurrency...',
      stock: 'Search stock...', etf: 'Search ETF or fund...', metal: 'Search metal...',
    },
    noResults:       q => `No results for "${q}"`,
    // Price lookup
    noPrice:         'no price',
    priceUnavail:    'Price not available — try again later.',
    priceNoConn:     'No connection. Price unavailable.',
    // Card button titles
    btnAdd:          'Add',
    btnReduce:       'Reduce',
    btnDelete:       'Delete',
    btnEdit:         'Edit',
    // Modal: Add asset
    modalAddTitle:   'Add asset',
    modalEditRETitle: 'Edit property',
    karat:           'Carats',
    goldUnit:        'Unit',
    gramUnit:        'g (grams)',
    ozUnit:          'troy oz',
    qty:             'Quantity',
    qtyGold:         u => `Quantity (${u})`,
    estimatedVal:    'Estimated value:',
    addToPortfolio:  'Add to portfolio',
    // Modal: Reduce
    modalReduceTitle: 'Reduce position',
    reduceQtyLabel:   'Amount to subtract',
    qtyRemaining:     'Remaining quantity',
    valueRemaining:   'Remaining value',
    removeWarning:    'The asset will be removed when it reaches 0.',
    confirmReduce:    'Confirm reduction',
    maxLabel:         (q, u) => u ? `Max: ${q} ${u}` : `Max: ${q}`,
    cantExceed:       m => `Cannot subtract more than ${m}.`,
    unidades:         'units',
    // Modal: Add position
    modalAddPosTitle: 'Add to position',
    addQtyLabel:      u => u ? `Quantity to add (${u})` : 'Quantity to add',
    addQtyLabelCash:  'Amount to add',
    newTotalQty:      'New total quantity',
    newTotalValue:    'New total value',
    confirm:          'Confirm',
    // Modal: Liquidity
    modalLiqTitle:   'Add liquidity',
    currency:        'Currency',
    amount:          'Amount',
    addLiqBtn:       'Add liquidity',
    // Filters
    // Chart range labels
    range1y:  '1Y',
    rangeAll: 'ALL',
    backAll:  'All',
    viewHint: 'View assets →',
    // Benchmark comparison
    bmPortfolio: 'Portfolio',
    bmMarket:    'Market',
    bmDiff:      'Difference',
    // Metal asset names (single language, no parenthetical mixing)
    metalNames: { XAU: 'Gold', XAG: 'Silver' },
    // ISIN / manual entry
    orLabel:          'or',
    isinLabel:        'ISIN',
    isinOptional:     ' (optional)',
    isinPH:           'IE00B4L5Y983',
    isinOk:           '✓ Valid ISIN',
    isinError:        'Invalid ISIN — 12 alphanumeric characters',
    isinHint:         n => `${n}/12`,
    isinLooking:      'Looking up asset...',
    isinFound:        name => `✓ ${name}`,
    isinNotFound:     'Not found — enter manually',
    isinLookupError:  'Offline — enter manually',
    manualNameLabel:  'Asset name',
    manualNamePH:     'E.g.: iShares Core MSCI World',
    manualTypeLabel:  'Asset type',
    manualTypeStock:  'Stocks',
    manualTypeEtf:    'ETF/Fund',
    manualTypeCrypto: 'Crypto',
    manualTypeOther:  'Other',
    manualCurrLabel:  'Currency',
    manualPriceLabel: 'Price per unit',
    manualPriceOptional: ' (optional)',
    filterAll: 'All', filterCrypto: 'Crypto', filterStock: 'Stocks',
    filterEtf: 'ETF / Funds', filterMetal: 'Metals', filterRE: 'Real Estate',
    reName: 'Property name', reValueLabel: 'Value (in base currency)',
    reRentLabel: 'Monthly rent', reRentHint: 'Optional — leave 0 if not applicable',
    rentPerMonth: '/mo',
    // Beta screen
    exit: 'Exit',
  },
};

function t(key) { return T[lang][key]; }

// Apply data-i18n attributes to static HTML
function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const v = T[lang][el.dataset.i18n];
    if (typeof v === 'string') el.textContent = v;
  });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    const v = T[lang][el.dataset.i18nPh];
    if (typeof v === 'string') el.placeholder = v;
  });
}

// Sync TYPE_META labels to current language (used by donut legend + suggestions)
function applyTypeMetaLabels() {
  const meta  = T[lang].typeMeta;
  const donut = T[lang].donutMeta || {};
  Object.keys(meta).forEach(k => {
    if (!TYPE_META[k]) return;
    TYPE_META[k].label = meta[k];
    if (donut[k]) TYPE_META[k].donutLabel = donut[k];
  });
}

function switchLang(newLang) {
  if (newLang === lang) return;
  lang = newLang;
  localStorage.setItem(LANG_KEY, lang);
  document.querySelectorAll('[data-lang]').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  applyI18n();
  applyTypeMetaLabels();
  render();
  updateDonut();
  if (_lastUpdateState) setUpdateStatus(_lastUpdateState);
  const af = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
  searchInput.placeholder = T[lang].searchPH[af] || T[lang].searchPH.all;
}

// ── State ──────────────────────────────────────────────────
const STORAGE_KEY = 'portfolio_assets';
const COINGECKO   = 'https://api.coingecko.com/api/v3';

// ── Fallback prices (used when APIs are unavailable) ──────
const FALLBACK_PRICES = {
  // Stocks
  AAPL: 213, TSLA: 248, MSFT: 388, MSTR: 320, META: 515,
  NVDA: 880, AMZN: 192, GOOGL: 163, NFLX: 625, JPM: 242,
  V: 308, WMT: 98, NVO: 82, SAP: 232, ASML: 745,
  // ETFs
  SPY: 548, QQQ: 470, VTI: 258, VOO: 498, URTH: 118,
  VEA: 49, 'IWDA.L': 92, 'VWCE.DE': 118, 'CSPX.L': 532, 'EQQQ.L': 448,
  // Metals (USD per troy oz)
  'GC=F': 2320, 'SI=F': 27,
};

function getFallbackData(marketSymbol) {
  const base = FALLBACK_PRICES[marketSymbol];
  if (!base) return null;
  // Apply tiny random variation (±0.4%) so it feels alive
  const jitter  = 1 + (Math.random() - 0.5) * 0.008;
  const price   = +(base * jitter).toFixed(base < 10 ? 3 : 2);
  // Simulate a realistic-looking daily change
  const change24h = +((Math.random() - 0.48) * 3.2).toFixed(2);
  return { price, change24h, simulated: true };
}


// ── Default suggestions per filter (shown on focus when input is empty) ─
const DEFAULTS = {
  crypto: [
    { ticker: 'BTC',  name: 'Bitcoin',   type: 'crypto', coinId: 'bitcoin' },
    { ticker: 'ETH',  name: 'Ethereum',  type: 'crypto', coinId: 'ethereum' },
    { ticker: 'SOL',  name: 'Solana',    type: 'crypto', coinId: 'solana' },
    { ticker: 'USDC', name: 'USD Coin',  type: 'crypto', coinId: 'usd-coin' },
    { ticker: 'USDT', name: 'Tether',    type: 'crypto', coinId: 'tether' },
  ],
  stock: [
    { ticker: 'AAPL', name: 'Apple',     type: 'stock', marketSymbol: 'AAPL' },
    { ticker: 'TSLA', name: 'Tesla',     type: 'stock', marketSymbol: 'TSLA' },
    { ticker: 'MSFT', name: 'Microsoft', type: 'stock', marketSymbol: 'MSFT' },
    { ticker: 'AMZN', name: 'Amazon',    type: 'stock', marketSymbol: 'AMZN' },
    { ticker: 'NVDA', name: 'NVIDIA',    type: 'stock', marketSymbol: 'NVDA' },
  ],
  etf: [
    { ticker: 'SPY',  name: 'SPDR S&P 500 ETF',          type: 'etf', marketSymbol: 'SPY' },
    { ticker: 'VOO',  name: 'Vanguard S&P 500 ETF',      type: 'etf', marketSymbol: 'VOO' },
    { ticker: 'QQQ',  name: 'Invesco QQQ Trust',          type: 'etf', marketSymbol: 'QQQ' },
    { ticker: 'VWCE', name: 'Vanguard FTSE All-World Acc', type: 'etf', marketSymbol: 'VWCE.DE' },
    { ticker: 'URTH', name: 'iShares MSCI World ETF',     type: 'etf', marketSymbol: 'URTH' },
  ],
  metal: [
    { ticker: 'XAU', name: 'Gold', type: 'metal', marketSymbol: 'GC=F' },
    { ticker: 'XAG', name: 'Silver', type: 'metal', marketSymbol: 'SI=F' },
  ],
};

const PLACEHOLDERS = {
  all:    'Buscar activo...',
  crypto: 'Buscar criptomoneda...',
  stock:  'Buscar acción...',
  etf:    'Buscar ETF o fondo...',
  metal:  'Buscar metal...',
};

// Metal ticker → Yahoo Finance futures symbol
const METAL_MAP = {
  XAU:    { yahoo: 'GC=F', name: 'Oro' },
  GOLD:   { yahoo: 'GC=F', name: 'Oro' },
  ORO:    { yahoo: 'GC=F', name: 'Oro' },
  GC:     { yahoo: 'GC=F', name: 'Oro' },
  XAG:    { yahoo: 'SI=F', name: 'Plata' },
  SILVER: { yahoo: 'SI=F', name: 'Plata' },
  PLATA:  { yahoo: 'SI=F', name: 'Plata' },
  SI:     { yahoo: 'SI=F', name: 'Plata' },
};

// ── Asset database (for smart search) ─────────────────────
const ASSET_DB = [
  // Stocks
  { ticker: 'AAPL',  name: 'Apple',             type: 'stock',  marketSymbol: 'AAPL' },
  { ticker: 'TSLA',  name: 'Tesla',             type: 'stock',  marketSymbol: 'TSLA' },
  { ticker: 'MSFT',  name: 'Microsoft',         type: 'stock',  marketSymbol: 'MSFT' },
  { ticker: 'MSTR',  name: 'MicroStrategy',     type: 'stock',  marketSymbol: 'MSTR' },
  { ticker: 'META',  name: 'Meta',              type: 'stock',  marketSymbol: 'META' },
  { ticker: 'NVDA',  name: 'NVIDIA',            type: 'stock',  marketSymbol: 'NVDA' },
  { ticker: 'AMZN',  name: 'Amazon',            type: 'stock',  marketSymbol: 'AMZN' },
  { ticker: 'GOOGL', name: 'Alphabet',          type: 'stock',  marketSymbol: 'GOOGL' },
  { ticker: 'NFLX',  name: 'Netflix',           type: 'stock',  marketSymbol: 'NFLX' },
  { ticker: 'JPM',   name: 'JPMorgan Chase',    type: 'stock',  marketSymbol: 'JPM' },
  { ticker: 'V',     name: 'Visa',              type: 'stock',  marketSymbol: 'V' },
  { ticker: 'WMT',   name: 'Walmart',           type: 'stock',  marketSymbol: 'WMT' },
  { ticker: 'NOVO',  name: 'Novo Nordisk',      type: 'stock',  marketSymbol: 'NVO' },
  { ticker: 'SAP',   name: 'SAP SE',            type: 'stock',  marketSymbol: 'SAP' },
  { ticker: 'ASML',  name: 'ASML Holding',      type: 'stock',  marketSymbol: 'ASML' },
  // ETFs
  { ticker: 'SPY',   name: 'SPDR S&P 500 ETF',                   type: 'etf', marketSymbol: 'SPY' },
  { ticker: 'QQQ',   name: 'Invesco QQQ Trust',                   type: 'etf', marketSymbol: 'QQQ' },
  { ticker: 'VTI',   name: 'Vanguard Total Stock Market ETF',      type: 'etf', marketSymbol: 'VTI' },
  { ticker: 'VOO',   name: 'Vanguard S&P 500 ETF',                type: 'etf', marketSymbol: 'VOO' },
  { ticker: 'URTH',  name: 'iShares MSCI World ETF',              type: 'etf', marketSymbol: 'URTH' },
  { ticker: 'VEA',   name: 'Vanguard FTSE Developed World ETF',   type: 'etf', marketSymbol: 'VEA' },
  { ticker: 'IWDA',  name: 'iShares Core MSCI World (London)',    type: 'etf', marketSymbol: 'IWDA.L' },
  { ticker: 'VWCE',  name: 'Vanguard FTSE All-World Acc (Xetra)', type: 'etf', marketSymbol: 'VWCE.DE' },
  { ticker: 'CSPX',  name: 'iShares Core S&P 500 UCITS (London)', type: 'etf', marketSymbol: 'CSPX.L' },
  { ticker: 'EQQQ',  name: 'Invesco EQQQ NASDAQ-100 (London)',    type: 'etf', marketSymbol: 'EQQQ.L' },
  // Metals
  { ticker: 'XAU',   name: 'Gold',   type: 'metal', marketSymbol: 'GC=F' },
  { ticker: 'XAG',   name: 'Silver', type: 'metal', marketSymbol: 'SI=F' },
];

let assets              = load();

// One-time migration: backfill costBasis for existing assets that predate this field.
// Sets costBasis = qty × price at migration time — P&L starts at 0 and grows honestly.
(function migrateCostBasis() {
  let dirty = false;
  assets.forEach(a => {
    if (Object.prototype.hasOwnProperty.call(a, 'costBasis')) return;
    const qty = a.qty || 0, price = a.price || 0;
    if (a.ticker === 'XAU' && a.karat) {
      const grams = a.goldUnit === 'oz' ? qty * 31.1035 : qty;
      a.costBasis = grams * (a.karat / 24) * (price / 31.1035);
    } else {
      a.costBasis = qty * price;
    }
    dirty = true;
  });
  if (dirty) save();
})();

let pendingCoinId       = null;
let pendingMarketSymbol = null; // Yahoo Finance symbol for stock/etf/metal
let pendingPrice        = null; // fetched price for selected asset
let pendingKarat        = 18;   // karat for pending gold asset
let pendingGoldUnit     = 'g';  // unit for pending gold asset ('g' | 'oz')
let goldPriceUpdatedAt  = null; // timestamp of last successful live gold price fetch
let goldChangePct       = null; // daily % change for XAU — shared across all gold assets
let isRealEstateMode    = false; // true when modal is in manual real-estate entry mode
let isManualMode        = false; // true when modal is in ISIN manual-entry mode
let manualAssetType     = 'etf'; // type selected in manual mode
let manualCurrency      = 'USD'; // currency selected in manual mode
let manualPendingSymbol = null;  // market symbol resolved via OpenFIGI lookup
let manualPendingCoinId = null;  // CoinGecko coin ID for crypto ISIN assets
let isinLookupAbortCtrl = null;  // abort controller for in-flight ISIN lookup
const _isinCache        = new Map(); // ISIN → lookup result (memory cache)
let rePendingCurrency   = 'EUR'; // currency selected in RE modal
let rePendingRent       = 0;     // monthly rent input in RE modal
let reEditTargetId      = null;  // when set, submit updates this asset instead of creating

// ── Search state ───────────────────────────────────────────
let selectedDbAsset     = null;     // currently selected ASSET_DB entry
let currentSuggestions  = [];       // full (unfiltered) results from API
let renderedSuggestions = [];       // filtered results currently shown in dropdown
let activeSearchFilter   = 'all';    // 'all' | 'crypto' | 'stock' | 'etf' | 'metal'
let focusedSuggIdx       = -1;
let searchDebounceTimer  = null;
let searchAbortCtrl      = null;
let suppressFocusDefaults = false;  // true when focus is programmatic (openModal/enterSearchMode)

// ── Asset type metadata ────────────────────────────────────
const TYPE_META = {
  crypto:      { label: 'Cripto',       color: '#5b9cf6' },  // soft blue
  stock:       { label: 'Acciones',     color: '#c0c8d8' },  // silver-gray
  etf:         { label: 'Fondos/ETF',   donutLabel: 'Fondos',  color: '#8f9dba' },  // blue-gray
  metal:       { label: 'Metales',      color: '#d4a843' },  // warm gold
  cash:        { label: 'Liquidez',     color: '#4ade80' },  // soft green
  real_estate: { label: 'Inmuebles',   donutLabel: 'Inmob.', color: '#a78bfa' },  // soft purple
  other:       { label: 'Otros',        color: '#6b7280' },  // muted gray
};

const HISTORY_KEY  = 'portfolio_history';
let portfolioHistory = loadHistory();
let lastSnapshotMs   = 0;
let lastRefreshAt    = null;   // timestamp of last successful price refresh
let activeRange      = '24h';
let activePerfMode   = '%';    // '%' = percentage change | 'curr' = absolute gain/loss in base currency
let _inlineEditId    = null;   // id of asset currently open in inline edit strip
let _inlineEditMode  = null;   // 'add' | 'reduce'
let portfolioChart   = null;
let _detailChart     = null;  // Chart.js instance for category detail sparkline
let _detailChartType = null;  // which category the sparkline was last rendered for

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const BASE_KEY   = 'portfolio_base_currency';
let baseCurrency = localStorage.getItem(BASE_KEY) || 'USD';
let usdToEur     = 0.92; // updated from API

// ── DOM ────────────────────────────────────────────────────
const totalValueEl  = document.getElementById('totalValue');
const summaryPerfEl = document.getElementById('summaryPerf');
const assetCountEl  = document.getElementById('assetCount');
const assetsListEl  = document.getElementById('assetsList');
const emptyStateEl  = document.getElementById('emptyState');
const modalOverlay  = document.getElementById('modalOverlay');
const btnAdd        = document.getElementById('btnAdd');
const modalClose    = document.getElementById('modalClose');
const assetForm     = document.getElementById('assetForm');
const previewTotal  = document.getElementById('previewTotal');

// Search UI
const searchWrapEl      = document.getElementById('searchWrap');
const searchInputWrapEl = document.getElementById('searchInputWrap');
const searchInput       = document.getElementById('assetSearch');
const searchClearBtn    = document.getElementById('searchClear');
const assetSuggestionsEl= document.getElementById('assetSuggestions');
const selectedChipEl    = document.getElementById('selectedChip');
const chipBadgeEl       = document.getElementById('chipBadge');
const chipNameEl        = document.getElementById('chipName');
const chipSubEl         = document.getElementById('chipSub');
const chipPriceEl       = document.getElementById('chipPrice');
const chipClearBtn      = document.getElementById('chipClear');
const searchFiltersEl   = document.getElementById('searchFilters');
const filterBtns        = document.querySelectorAll('.filter-btn');

// Form inputs
const qtyInput      = document.getElementById('assetQty');
const qtyGroup      = document.getElementById('qtyGroup');
const formPreviewEl = document.getElementById('formPreview');
const btnSubmitEl   = document.getElementById('btnSubmitAsset');

// Reduce modal
const reduceOverlay    = document.getElementById('reduceOverlay');
const reduceClose      = document.getElementById('reduceClose');
const reduceForm       = document.getElementById('reduceForm');
const reduceAssetInfo  = document.getElementById('reduceAssetInfo');
const reduceQtyInput   = document.getElementById('reduceQty');
const reduceMaxEl      = document.getElementById('reduceMax');
const previewQtyLeft   = document.getElementById('previewQtyLeft');
const previewValueLeft = document.getElementById('previewValueLeft');
const reduceWarning    = document.getElementById('reduceWarning');
const reduceError      = document.getElementById('reduceError');

let reduceTargetId = null;

// Price update UI
const lookupStatusEl = document.getElementById('lookupStatus');
const updateDotEl    = document.getElementById('updateDot');
const updateTextEl   = document.getElementById('updateText');

// ── Card drag & drop order ──────────────────────────────────
const CARD_ORDER_KEY = 'portfolio_card_order';
let _cardOrder = JSON.parse(localStorage.getItem(CARD_ORDER_KEY) || 'null') || [];
let _dd = null; // active drag state

// Show skeleton on total value while initial prices load
if (assets.length > 0) totalValueEl.classList.add('skeleton');

// Gold form groups
const karatGroupEl    = document.getElementById('karatGroup');
const goldUnitGroupEl = document.getElementById('goldUnitGroup');
const qtyLabelEl      = document.getElementById('qtyLabel');

// ── Storage ────────────────────────────────────────────────
function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!raw) return [];
    // Support legacy format (plain array) and current envelope format
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.assets)) return raw.assets;
    return [];
  } catch {
    return [];
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      assets,
      lastUpdated: Date.now(),
    }));
  } catch (e) {
    console.warn('[portfolio] save failed (localStorage full or unavailable):', e);
  }
}

// ── Input number formatting ────────────────────────────────
// Parse an es-ES formatted string ("1.234,56") back to a JS float
function parseLocalFloat(str) {
  if (typeof str !== 'string' || str === '') return NaN;
  return parseFloat(str.replace(/\./g, '').replace(',', '.'));
}

// Attach live thousand-separator formatting to a text input
function attachFormatter(input, allowDecimals) {
  input.addEventListener('input', () => {
    const start  = input.selectionStart;
    const oldLen = input.value.length;

    // Strip invalid chars; allow one comma as decimal separator
    let raw = input.value.replace(/[^\d,]/g, '');
    if (!allowDecimals) raw = raw.replace(/,/g, '');
    const ci = raw.indexOf(',');
    if (ci !== -1) {
      raw = raw.slice(0, ci + 1) + raw.slice(ci + 1).replace(/,/g, '');
    }

    const [intStr = '', decStr] = raw.split(',');
    const intVal = intStr === '' ? '' : parseInt(intStr, 10);
    const fmtInt = intStr === '' || isNaN(intVal) ? ''
      : new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(intVal);

    const formatted = decStr !== undefined ? fmtInt + ',' + decStr : fmtInt;
    input.value = formatted;

    // Restore cursor accounting for added/removed separators
    const delta  = formatted.length - oldLen;
    const newPos = Math.max(0, Math.min(start + delta, formatted.length));
    input.setSelectionRange(newPos, newPos);
  });
}

// ── Formatting ─────────────────────────────────────────────
function formatCurrency(amount, currency) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(amount);
}
function formatBase(amount) { return formatCurrency(amount, baseCurrency); }
function formatUSD(n)       { return formatCurrency(n, 'USD'); }
function formatShort(amount) {
  const sym = baseCurrency === 'EUR' ? '€' : '$';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return sym + (amount / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return sym + (amount / 1_000).toFixed(1) + 'K';
  return formatBase(amount);
}

// ── Currency conversion ─────────────────────────────────────
async function fetchExchangeRate() {
  try {
    const res  = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
    if (!res.ok) return;
    const data = await res.json();
    if (data.rates?.EUR) usdToEur = data.rates.EUR;
  } catch { /* keep default */ }
}

function toBase(amount, fromCurrency) {
  const from = (fromCurrency || 'USD').toUpperCase();
  if (from === baseCurrency) return amount;
  if (from === 'USD') return amount * usdToEur;   // USD → EUR
  return amount / usdToEur;                        // EUR → USD
}

// Gold-aware value in assetCurrency: applies karat purity for XAU assets
function assetNativeValue(asset) {
  if (asset.ticker === 'XAU' && asset.karat) {
    const grams = asset.goldUnit === 'oz' ? asset.qty * 31.1035 : asset.qty;
    return grams * (asset.karat / 24) * (asset.price / 31.1035);
  }
  return asset.qty * asset.price;
}

function totalValueUSD() {
  return assets.reduce((sum, a) => {
    const curr   = (a.assetCurrency || 'USD').toUpperCase();
    const native = assetNativeValue(a);
    return sum + (curr === 'USD' ? native : native / usdToEur);
  }, 0);
}

function totalValueBase() { return toBase(totalValueUSD(), 'USD'); }

// ── P&L calculations ────────────────────────────────────────
function assetPnLBase(asset) {
  if (asset.type === 'cash' || asset.type === 'real_estate') return null;
  const costBasis = asset.costBasis;
  if (costBasis == null || costBasis <= 0) return null;
  const curr = (asset.assetCurrency || 'USD').toUpperCase();
  const currentNative = assetNativeValue(asset);
  const pnlNative = currentNative - costBasis;
  return { abs: toBase(pnlNative, curr), pct: (pnlNative / costBasis) * 100 };
}

function totalCostBasisBase() {
  return assets.reduce((sum, a) => {
    if (a.type === 'cash' || a.type === 'real_estate') return sum;
    const curr = (a.assetCurrency || 'USD').toUpperCase();
    return sum + toBase(a.costBasis || 0, curr);
  }, 0);
}

function computeRangePnL(range) {
  const currentBase = totalValueBase();
  if (currentBase <= 0 || assets.length === 0) return null;
  if (range === 'all') {
    const invested = totalCostBasisBase();
    if (invested <= 0) return null;
    return { abs: currentBase - invested, pct: ((currentBase - invested) / invested) * 100 };
  }
  const data = getChartData(range);
  if (!data || data.values.length < 2) return null;
  const past = data.values[0];
  if (past <= 0) return null;
  return { abs: currentBase - past, pct: ((currentBase - past) / past) * 100 };
}

function formatQty(n) {
  const abs = Math.abs(n);
  if (abs >= 1000) return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n);
  if (abs >= 1)    return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 4 }).format(n);
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 8 }).format(n);
}

// Formats a gram quantity: auto-promotes to kg at ≥ 1 000 g (max 2 decimal places).
function gramsToDisplay(g) {
  if (g >= 1000) {
    const kg = +(g / 1000).toFixed(2);
    return `${new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(kg)} kg`;
  }
  return `${formatQty(g)} g`;
}

// ── History storage ────────────────────────────────────────
function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []; }
  catch { return []; }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(portfolioHistory));
}

function generateSimulatedHistory(currentVal) {
  if (currentVal <= 0) return [];
  const now  = Date.now();
  const DAY  = 86_400_000;
  const HOUR = 3_600_000;
  let val = currentVal;

  // 30 daily points (30→1 days ago) — used by 7d and 30d views
  const daily = [];
  for (let i = 30; i >= 1; i--) {
    const d = (Math.random() - 0.47) * 0.035;
    val = val * (1 - d);
    daily.push({ ts: now - i * DAY, value: +(Math.max(0, val).toFixed(2)) });
  }

  // 24 hourly points (last day) — used by 24h view
  val = currentVal;
  const hourly = [];
  for (let i = 24; i >= 1; i--) {
    const d = (Math.random() - 0.48) * 0.009;
    val = val * (1 - d);
    hourly.push({ ts: now - i * HOUR, value: +(Math.max(0, val).toFixed(2)) });
  }

  return [...daily, ...hourly, { ts: now, value: +(currentVal.toFixed(2)) }];
}

function recordSnapshot(force = false) {
  const now = Date.now();
  const val = totalValueUSD(); // always store in USD for consistent history
  if (val <= 0) return;
  if (!force && now - lastSnapshotMs < 60_000) return;
  lastSnapshotMs = now;

  const last = portfolioHistory[portfolioHistory.length - 1];
  if (last && now - last.ts < 60_000) {
    last.value = +(val.toFixed(2));
    last.ts    = now;
  } else {
    portfolioHistory.push({ ts: now, value: +(val.toFixed(2)) });
  }

  // Keep only last 365 days
  const cutoff = now - 365 * 86_400_000;
  portfolioHistory = portfolioHistory.filter(p => p.ts >= cutoff);
  saveHistory();
}

// ── Distribution donut ─────────────────────────────────────
let donutChart = null;
const distributionSectionEl = document.getElementById('distributionSection');
const distributionLegendEl  = document.getElementById('distributionLegend');
const donutCenterValEl      = document.getElementById('donutCenterVal');
const donutCenterSubEl      = document.getElementById('donutCenterSub');

let _donutHoverIdx = -1;   // ephemeral hover (index into _donutDist)
let _donutDist     = [];
let activeCategory = null; // persistent category filter ('crypto', 'metal', …, or null)

function getDistribution() {
  const totUSD = totalValueUSD();
  if (totUSD <= 0) return null;

  const groups = {};
  assets.forEach(a => {
    const curr   = (a.assetCurrency || 'USD').toUpperCase();
    const native = assetNativeValue(a);
    const valUSD = curr === 'USD' ? native : native / usdToEur;
    const key    = TYPE_META[a.type] ? a.type : 'other';
    groups[key]  = (groups[key] || 0) + valUSD;
  });

  return Object.entries(groups)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([type, valueUSD]) => ({
      type,
      valueBase: toBase(valueUSD, 'USD'),
      pct:       (valueUSD / totUSD) * 100,
    }));
}

// Lighten a hex color by a multiplier (e.g. 1.18 = 18% brighter)
function lightenHex(hex, f) {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((n >> 16 & 0xff) * f) | 0);
  const g = Math.min(255, ((n >>  8 & 0xff) * f) | 0);
  const b = Math.min(255, ((n       & 0xff) * f) | 0);
  return '#' + r.toString(16).padStart(2, '0')
             + g.toString(16).padStart(2, '0')
             + b.toString(16).padStart(2, '0');
}

function resetDonutCenter() {
  donutCenterValEl.textContent = formatShort(totalValueBase());
  if (donutCenterSubEl) donutCenterSubEl.textContent = t('donutTotal');
}

function setDonutCenter(item) {
  const m     = TYPE_META[item.type] || TYPE_META.other;
  const label = m.donutLabel || m.label;
  donutCenterValEl.textContent = formatShort(item.valueBase);
  if (donutCenterSubEl) {
    donutCenterSubEl.innerHTML = `<span style="color:${m.color}">${label}</span>`;
  }
}

// Applies current hover + active-category state to the donut visuals only.
// Card filtering is handled by render() via activeCategory.
function _applyDonutState() {
  const filterIdx = activeCategory
    ? _donutDist.findIndex(d => d.type === activeCategory)
    : -1;
  // Hover takes visual priority for center label + chart highlight
  const visIdx = _donutHoverIdx !== -1 ? _donutHoverIdx : filterIdx;

  // Center label
  if (visIdx === -1) resetDonutCenter();
  else { const item = _donutDist[visIdx]; if (item) setDonutCenter(item); }

  // Legend — hover highlight and category-pinned are separate classes
  distributionLegendEl.querySelectorAll('.legend-item').forEach((el, i) => {
    el.classList.toggle('legend-item--active', i === visIdx);
    el.classList.toggle('legend-item--pinned', activeCategory !== null && _donutDist[i]?.type === activeCategory);
  });

  // Chart.js highlight
  if (donutChart) {
    donutChart.setActiveElements(visIdx === -1 ? [] : [{ datasetIndex: 0, index: visIdx }]);
    donutChart.update('none');
  }
}

// Hover: ephemeral highlight only, never changes the persistent filter.
function donutHandleHover(idx) {
  if (_donutHoverIdx === idx) return;
  _donutHoverIdx = idx;
  _applyDonutState();
}

// Click: toggle category navigation. Clicking the same category clears it.
function donutHandleClick(idx) {
  setActiveCategory(_donutDist[idx]?.type ?? null);
}

function initDonut() {
  const canvas = document.getElementById('donutChart');
  if (!canvas || donutChart) return;

  donutChart = new Chart(canvas.getContext('2d'), {
    type: 'doughnut',
    data: {
      labels:   [],
      datasets: [{
        data:                [],
        backgroundColor:     [],
        hoverBackgroundColor:[],
        borderColor:         '#1a1a1a',
        borderWidth:         2,
        hoverBorderColor:    '#11141c',
        hoverBorderWidth:    2,
        hoverOffset:         12,
      }]
    },
    options: {
      responsive:          true,
      maintainAspectRatio: false,
      cutout:              '70%',
      rotation:            -90,
      layout: { padding: 6 },
      interaction: {
        mode:      'nearest',
        intersect: true,
      },
      plugins: {
        legend:  { display: false },
        tooltip: { enabled: false },
      },
      animation: {
        animateRotate: true,
        animateScale:  false,
        duration:      900,
        easing:        'easeOutQuart',
      },
      onHover(evt, elements) {
        donutHandleHover(elements.length ? elements[0].index : -1);
      },
      onClick(evt, elements) {
        if (!elements.length) return;
        donutHandleClick(elements[0].index);
      },
    },
  });

  // Reset when mouse leaves the chart
  canvas.addEventListener('mouseleave', () => donutHandleHover(-1), { passive: true });

  // Mobile: tap outside donut/legend resets hover highlight only
  document.addEventListener('touchstart', e => {
    if (!e.target.closest('#donutChart') && !e.target.closest('.distribution-legend')) {
      _donutHoverIdx = -1;
      _applyDonutState();
    }
  }, { passive: true });
}

let _donutHasData = false;   // track whether donut has been populated before

function updateDonut() {
  const dist   = getDistribution();
  _donutDist     = dist || [];
  _donutHoverIdx = -1;

  if (!dist || dist.length === 0) {
    distributionSectionEl.style.display = 'none';
    updateCategoryCards();
    return;
  }

  distributionSectionEl.style.display = '';
  resetDonutCenter();

  // Legend
  distributionLegendEl.innerHTML = dist.map(({ type, valueBase, pct }, i) => {
    const m = TYPE_META[type] || TYPE_META.other;
    return `<div class="legend-item" data-idx="${i}">
      <span class="legend-dot" style="background:${m.color}"></span>
      <span class="legend-name">${m.label}</span>
      <span class="legend-pct">${pct.toFixed(1)}%</span>
      <span class="legend-value">${formatBase(valueBase)}</span>
    </div>`;
  }).join('');

  // Legend interaction: hover highlights segment + center label
  distributionLegendEl.querySelectorAll('.legend-item').forEach(el => {
    const i = +el.dataset.idx;
    el.addEventListener('mouseenter', () => donutHandleHover(i));
    el.addEventListener('mouseleave', () => donutHandleHover(-1));
    el.addEventListener('click',      () => donutHandleClick(i));
  });

  // Chart
  if (donutChart) {
    donutChart.data.labels                            = dist.map(d => (TYPE_META[d.type] || TYPE_META.other).label);
    donutChart.data.datasets[0].data                 = dist.map(d => d.pct);
    donutChart.data.datasets[0].backgroundColor      = dist.map(d => (TYPE_META[d.type] || TYPE_META.other).color);
    donutChart.data.datasets[0].hoverBackgroundColor = dist.map(d => lightenHex((TYPE_META[d.type] || TYPE_META.other).color, 1.18));
    donutChart.update(_donutHasData ? 'none' : undefined);
    _donutHasData = true;
  }

  // Sync donut visual state and rebuild category cards
  _applyDonutState();
  updateCategoryCards();
}

// ── Chart ──────────────────────────────────────────────────
const chartChangeEl = document.getElementById('chartChange');
const chartNoDataEl = document.getElementById('chartNoData');

const fillGradientPlugin = {
  id: 'fillGradient',
  beforeDraw(chart) {
    if (!chart.chartArea) return;
    const { ctx, chartArea: { top, bottom } } = chart;
    const grad = ctx.createLinearGradient(0, top, 0, bottom);
    grad.addColorStop(0,   'rgba(100,137,196,0.18)');
    grad.addColorStop(0.4, 'rgba(100,137,196,0.06)');
    grad.addColorStop(1,   'rgba(100,137,196,0.00)');
    chart.data.datasets.forEach(ds => { ds.backgroundColor = grad; });
  }
};

// Line glow removed — clean chart line only
const lineGlowPlugin = {
  id: 'lineGlow',
  beforeDatasetsDraw() {},
  afterDatasetsDraw()  {}
};

// Draws a vertical dashed crosshair line at the hovered data point
const crosshairPlugin = {
  id: 'crosshair',
  afterDraw(chart) {
    if (!chart.tooltip?._active?.length) return;
    const { ctx, chartArea: { top, bottom } } = chart;
    const x = chart.tooltip._active[0].element.x;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth    = 1;
    ctx.strokeStyle  = 'rgba(79,142,247,0.40)';
    ctx.setLineDash([3, 4]);
    ctx.lineDashOffset = 0;
    ctx.stroke();
    ctx.restore();
  }
};

// External tooltip renderer — replaces Chart.js built-in tooltip with a custom DOM element
function updateChartTooltip(context) {
  const tooltipEl = document.getElementById('chartTooltip');
  if (!tooltipEl) return;

  const tooltip = context.tooltip;

  // Hide when no active point
  if (!tooltip.opacity || !tooltip.dataPoints?.length) {
    tooltipEl.classList.remove('chart-tooltip--visible');
    return;
  }

  const dp    = tooltip.dataPoints[0];
  const label = dp.label;
  const value = dp.raw;
  const data  = context.chart.data.datasets[0].data;

  // ── Time label ──
  tooltipEl.querySelector('.chart-tooltip-time').textContent = label;

  // ── Value: absolute or % change from range start ──
  const first = data.length ? data[0] : value;
  let valText, valDir;
  if (activePerfMode === 'curr') {
    valText = formatBase(value);
    valDir  = value > first ? 'up' : value < first ? 'down' : 'flat';
  } else {
    const pct  = first > 0 ? ((value - first) / first) * 100 : 0;
    const sign = pct >= 0 ? '+' : '';
    valText = `${sign}${pct.toFixed(2)}%`;
    valDir  = pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : 'flat';
  }
  const valEl = tooltipEl.querySelector('.chart-tooltip-val');
  valEl.textContent   = valText;
  valEl.dataset.dir   = valDir;

  // ── Position: left of cursor if near right edge, else right ──
  const chart = context.chart;
  const wrapW = chart.canvas.parentElement.offsetWidth;
  const x     = tooltip.caretX;
  const ttW   = tooltipEl.offsetWidth || 110;
  let left    = x + 14;
  if (left + ttW > wrapW - 8) left = x - ttW - 14;
  tooltipEl.style.left = Math.max(4, left) + 'px';
  tooltipEl.style.top  = (chart.chartArea.top + 4) + 'px';
  tooltipEl.classList.add('chart-tooltip--visible');
}

function initChart() {
  const canvas = document.getElementById('portfolioChart');
  if (!canvas || portfolioChart) return;

  portfolioChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#6489c4',
        backgroundColor: 'transparent',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#6489c4',
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
        borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled:  false,
          external: updateChartTooltip,
          mode:     'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.03)' },
          border: { display: false },
          ticks: { color: '#686868', maxTicksLimit: 6, maxRotation: 0 },
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(255,255,255,0.03)' },
          border: { display: false },
          ticks: {
            color: '#686868',
            maxTicksLimit: 5,
            callback: v => {
              const sym = baseCurrency === 'EUR' ? '€' : '$';
              if (v >= 1_000_000) return sym + (v / 1_000_000).toFixed(2) + 'M';
              if (v >= 1_000)     return sym + (v / 1_000).toFixed(1) + 'K';
              return formatBase(v);
            },
          },
        }
      },
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 1200, easing: 'easeOutQuart' },
    },
    plugins: [fillGradientPlugin, lineGlowPlugin, crosshairPlugin],
  });

  // Prevent page scroll while dragging on mobile
  canvas.style.touchAction = 'none';

  // Hide custom tooltip when pointer/touch leaves the chart
  const _hideTooltip = () => {
    const el = document.getElementById('chartTooltip');
    if (el) el.classList.remove('chart-tooltip--visible');
  };
  canvas.addEventListener('mouseleave', _hideTooltip);
  canvas.addEventListener('touchend',   _hideTooltip, { passive: true });
}

function getChartData(range) {
  const now = Date.now();
  const ms  = { '24h': 86_400_000, '7d': 7 * 86_400_000, '30d': 30 * 86_400_000, '1y': 365 * 86_400_000 };
  const pts = range === 'all' ? [...portfolioHistory] : portfolioHistory.filter(p => p.ts >= now - ms[range]);
  if (pts.length < 2) return null;

  const fmt = ts => {
    const d = new Date(ts);
    if (range === '24h') return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (range === '7d')  return d.toLocaleDateString('es-ES',  { weekday: 'short', day: 'numeric' });
    if (range === 'all') return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' });
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return { labels: pts.map(p => fmt(p.ts)), values: pts.map(p => toBase(p.value, 'USD')) };
}

function updateChart(animate = false) {
  if (!portfolioChart) return;
  const data = getChartData(activeRange);

  if (!data) {
    chartChangeEl.textContent = '';
    chartNoDataEl.style.display = '';
    portfolioChart.data.labels = [];
    portfolioChart.data.datasets[0].data = [];
    portfolioChart.update('none');
    return;
  }

  chartNoDataEl.style.display = 'none';

  const first = data.values[0];
  const last  = data.values[data.values.length - 1];
  const pct   = first > 0 ? ((last - first) / first) * 100 : 0;
  const cls   = pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : 'flat';

  if (activePerfMode === 'curr') {
    const absChange = last - first;
    const absSign   = absChange >= 0 ? '+' : '';
    chartChangeEl.textContent = `${absSign}${formatBase(absChange)}`;
  } else {
    const sign = pct >= 0 ? '+' : '';
    chartChangeEl.textContent = `${sign}${pct.toFixed(2)}%`;
  }
  chartChangeEl.className = `chart-change ${cls}`;

  portfolioChart.data.labels = data.labels;
  portfolioChart.data.datasets[0].data = data.values;
  if (animate) {
    // Range-switch: fast crossfade, not full 1200ms draw
    portfolioChart.options.animation.duration = 280;
    portfolioChart.update();
    portfolioChart.options.animation.duration = 1200; // restore for next cold draw
  } else {
    portfolioChart.update('none');
  }
}

function onPortfolioChange(force = false) {
  recordSnapshot(force);
  updateChart(force);   // animate chart when user makes a change
  updateDonut();
}

document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeRange = btn.dataset.range;
    updateChart(true);
    updatePerformance();
  });
});

document.querySelectorAll('.perf-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.perf-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activePerfMode = btn.dataset.perf;
    updateChart();
  });
});

// ── CoinGecko API ──────────────────────────────────────────
async function fetchLivePrices(coinIds) {
  const ids = [...new Set(coinIds)].join(',');
  const res = await fetch(
    `${COINGECKO}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
    { headers: { 'Accept': 'application/json' } }
  );
  if (res.status === 429) throw new Error('rate_limit');
  if (!res.ok) throw new Error(`http_${res.status}`);
  return res.json();
}

// Fall back to search API only for unknown symbols
async function searchCoinFallback(query) {
  const res = await fetch(
    `${COINGECKO}/search?query=${encodeURIComponent(query)}`,
    { headers: { 'Accept': 'application/json' } }
  );
  if (!res.ok) throw new Error('search failed');
  const { coins } = await res.json();
  const q = query.toLowerCase().trim();
  return coins.find(c => c.symbol.toLowerCase() === q)
      || coins.find(c => c.id.toLowerCase() === q)
      || coins[0]
      || null;
}

// ── Yahoo Finance API (stocks / ETFs / metals) ─────────────
async function fetchYahooData(symbol) {
  const yUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const proxies = [
    yUrl,
    `https://corsproxy.io/?url=${encodeURIComponent(yUrl)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(yUrl)}`,
  ];

  for (const url of proxies) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) }); // 1s max
      if (!res.ok) continue;
      let json = await res.json();
      if (typeof json.contents === 'string') json = JSON.parse(json.contents);
      const result = json?.chart?.result?.[0];
      if (!result) continue;
      const price = result.meta?.regularMarketPrice;
      if (!price) continue;
      const name          = result.meta?.shortName || result.meta?.longName || symbol;
      const previousClose = result.meta?.chartPreviousClose
                         || result.meta?.previousClose
                         || null;
      return { price, name, previousClose };
    } catch { /* try next proxy */ }
  }
  return null;
}

// ── Gold spot price: exchangerate.host → Yahoo GC=F → fallback ──
async function fetchGoldSpotPrice() {
  // Primary: exchangerate.host — XAU/USD spot (free, no key, CORS-friendly)
  try {
    const res = await fetch(
      'https://api.exchangerate.host/convert?from=XAU&to=USD&amount=1',
      { signal: AbortSignal.timeout(4000) }
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.result > 0) {
        goldPriceUpdatedAt = Date.now();
        return data.result;
      }
    }
  } catch { /* fall through */ }

  // Secondary: Yahoo Finance GC=F (futures ≈ spot)
  try {
    const data = await fetchYahooData('GC=F');
    if (data?.price > 0) {
      goldPriceUpdatedAt = Date.now();
      return data.price;
    }
  } catch { /* fall through */ }

  // Tertiary: hardcoded fallback — no timestamp update (not a live price)
  const fb = getFallbackData('GC=F');
  return fb?.price ?? FALLBACK_PRICES['GC=F'];
}

// ── OpenFIGI: ISIN → ticker / name / type ──────────────────

// Exchange code → Yahoo Finance symbol suffix
const FIGI_EXCH_SUFFIX = {
  LN: '.L',   GY: '.DE', GX: '.DE', GF: '.DE',
  FP: '.PA',  NA: '.AS', IM: '.MI', SM: '.MC',
  SW: '.SW',  SS: '.ST', NO: '.OL', DC: '.CO',
  HE: '.HE',  AV: '.VI', BB: '.BR', PL: '.LS',
  AU: '.AX',  JP: '.T',
  US: '',  UW: '',  UN: '',  UA: '',  UP: '',
};

function _toTitleCase(str) {
  return str.toLowerCase().replace(/(?:^|\s)\S/g, c => c.toUpperCase());
}

function _figiToAssetType(secType, secType2) {
  const t1 = (secType  || '').toLowerCase();
  const t2 = (secType2 || '').toLowerCase();
  if (t1 === 'etp' || t2.includes('etf') || t1.includes('fund') || t2.includes('fund')) return 'etf';
  if (t1 === 'common stock' || t1 === 'equity' || t1.includes('share')) return 'stock';
  return 'other';
}

async function getAssetFromISIN(isin, signal) {
  if (_isinCache.has(isin)) return _isinCache.get(isin);
  try {
    const res = await fetch('https://api.openfigi.com/v3/mapping', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify([{ idType: 'ID_ISIN', idValue: isin }]),
      signal,
    });
    if (!res.ok) { _isinCache.set(isin, null); return null; }
    const json  = await res.json();
    const items = json?.[0]?.data;
    if (!items?.length) { _isinCache.set(isin, null); return null; }

    // Prefer US-listed ticker; else take first result
    const item   = items.find(i => ['US','UW','UN','UA','UP'].includes(i.exchCode)) || items[0];
    const ticker = item.ticker || '';
    const exch   = item.exchCode || 'US';
    const suffix = FIGI_EXCH_SUFFIX[exch] ?? '';
    const result = {
      name:   item.name ? _toTitleCase(item.name) : null,
      type:   _figiToAssetType(item.securityType, item.securityType2),
      symbol: ticker + suffix,
      exch,
    };
    _isinCache.set(isin, result);
    return result;
  } catch (err) {
    if (err.name !== 'AbortError') _isinCache.set(isin, null);
    return null;
  }
}

// Thin wrapper used by ISIN modal to get a live price before saving
async function fetchStockPrice(symbol) {
  const data = await fetchYahooData(symbol);
  return data?.price ?? null;
}

// Thin wrapper: find crypto by name/symbol and return price + coinId
async function fetchCryptoPrice(query) {
  try {
    const coin = await searchCoinFallback(query);
    if (!coin?.id) return null;
    const prices = await fetchLivePrices([coin.id]);
    const usd    = prices[coin.id]?.usd ?? null;
    return usd ? { price: usd, coinId: coin.id } : null;
  } catch { return null; }
}

// ── Gold timestamp helpers ─────────────────────────────────
function formatGoldTs() {
  if (!goldPriceUpdatedAt) return null;
  const mins = Math.floor((Date.now() - goldPriceUpdatedAt) / 60_000);
  if (mins < 1)  return t('goldUpdNow');
  if (mins < 60) return t('goldUpdMins')(mins);
  return t('goldUpdHours')(Math.floor(mins / 60));
}

function formatGoldChange(pct) {
  if (pct === null || pct === undefined) return null;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}% today`;
}

function goldChangeCls(pct) {
  if (pct === null || pct === undefined) return 'neutral';
  if (pct >  0.005) return 'positive';
  if (pct < -0.005) return 'negative';
  return 'neutral';
}

function updateGoldTimestamps() {
  const tsText     = formatGoldTs();
  const changeText = formatGoldChange(goldChangePct);
  const isLive     = goldPriceUpdatedAt !== null && (Date.now() - goldPriceUpdatedAt) < 600_000;
  const cls        = goldChangeCls(goldChangePct);

  document.querySelectorAll('.gold-price-ts').forEach(container => {
    const dot      = container.querySelector('.gold-live-dot');
    const liveEl   = container.querySelector('.js-gold-live');
    const changeEl = container.querySelector('.js-gold-change');
    const updEl    = container.querySelector('.js-gold-updated');

    if (dot)      dot.className      = `gold-live-dot${isLive ? '' : ' stale'}`;
    if (liveEl)   liveEl.textContent = tsText ? t('goldLive') : t('goldEstimated');
    if (changeEl) {
      changeEl.textContent = changeText ? `${changeText} · ` : '';
      changeEl.className   = `js-gold-change gold-change ${cls}`;
    }
    if (updEl)    updEl.textContent  = tsText || '';
  });
}

// ── Lookup UI helpers ──────────────────────────────────────
function setLookupStatus(state, msg = '') {
  lookupStatusEl.className = `lookup-status ${state}`;
  lookupStatusEl.textContent = msg;
}

// ── Update status ──────────────────────────────────────────
let _lastUpdateState = null;

function setUpdateStatus(state) {
  _lastUpdateState = state;
  updateDotEl.className = `update-dot ${state === 'rate_limit' ? 'error' : state}`;
  const time = new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const msg = {
    refreshing: t('refreshing'),
    ok:         t('updated')(time),
    error:      t('updateError'),
    rate_limit: t('rateLimit'),
  };
  updateTextEl.textContent = msg[state] ?? '';
}

async function refreshMarketPrices() {
  const marketAssets = assets.filter(a =>
    (a.type === 'stock' || a.type === 'etf' || a.type === 'metal' || a.type === 'other') && a.marketSymbol
  );
  if (!marketAssets.length) return;

  await Promise.allSettled(
    marketAssets.map(async a => {
      try {
        let price         = null;
        let previousClose = null;

        if (a.marketSymbol === 'GC=F') {
          // Gold: dedicated source chain (exchangerate.host → Yahoo → fallback)
          price = await fetchGoldSpotPrice();
        } else {
          const data = await fetchYahooData(a.marketSymbol);
          price         = data?.price         ?? null;
          previousClose = data?.previousClose ?? null;
        }

        if (price) {
          if (price !== a.price) { a.prevPrice = a.price; a.price = price; }
          if (previousClose && previousClose > 0) {
            a.change24h = ((price - previousClose) / previousClose) * 100;
          } else if (a.change24h === null) {
            const fb = getFallbackData(a.marketSymbol);
            if (fb) a.change24h = fb.change24h;
          }
        } else if (a.change24h === null) {
          const fb = getFallbackData(a.marketSymbol);
          if (fb) a.change24h = fb.change24h;
        }
        // Sync gold change % to global so live indicator can read it without DOM queries
        if (a.marketSymbol === 'GC=F' && a.change24h !== null) goldChangePct = a.change24h;
        // If all sources fail: keep existing stored price — no change, no error
      } catch { /* skip */ }
    })
  );
}

async function refreshPrices() {
  // Migrate assets
  let migrated = false;
  assets.forEach(a => {
    // Migrate stock/etf/metal assets without marketSymbol
    if ((a.type === 'stock' || a.type === 'etf') && !a.marketSymbol && a.ticker) {
      a.marketSymbol = a.ticker.toUpperCase();
      migrated = true;
    }
    if (a.type === 'metal' && !a.marketSymbol && a.ticker) {
      const m = METAL_MAP[a.ticker.toUpperCase()];
      if (m) { a.marketSymbol = m.yahoo; migrated = true; }
    }
  });
  if (migrated) save();

  const cryptos = assets.filter(a => a.type === 'crypto' && a.coinId);
  const hasMarket = assets.some(a =>
    (a.type === 'stock' || a.type === 'etf' || a.type === 'metal' || a.type === 'other') && a.marketSymbol
  );

  if (!cryptos.length && !hasMarket) return;

  setUpdateStatus('refreshing');
  try {
    const results = await Promise.allSettled([
      cryptos.length ? fetchLivePrices([...new Set(cryptos.map(a => a.coinId))]) : Promise.resolve({}),
      hasMarket ? refreshMarketPrices() : Promise.resolve(),
    ]);

    // Apply crypto prices
    const priceData = results[0].status === 'fulfilled' ? results[0].value : {};
    cryptos.forEach(a => {
      const data = priceData[a.coinId];
      if (!data) return;
      if (data.usd !== a.price) {
        a.prevPrice = a.price;
        a.price     = data.usd;
      }
      a.change24h = data.usd_24h_change ?? null;
    });

    save();
    lastRefreshAt = Date.now();
    render();
    setUpdateStatus('ok');
    onPortfolioChange();
  } catch (err) {
    setUpdateStatus(err.message === 'rate_limit' ? 'rate_limit' : 'error');
  }
}

// ── Animated count-up for total value ─────────────────────
let _countUpRaf      = null;
let _countUpCurrent  = null;   // last value we displayed (in base currency)

// ── Animated count-up for the detail view hero value ──────
let _heroRaf         = null;
let _heroValueShown  = null;   // last value rendered in detail hero (null = not shown yet)

function countUpTotalValue(targetBase) {
  totalValueEl.classList.remove('skeleton');

  // First load: count up from 0 (gives the "live numbers waking up" feel)
  if (_countUpCurrent === null) {
    _countUpCurrent = 0;
    if (reducedMotion) {
      _countUpCurrent = targetBase;
      totalValueEl.textContent = formatBase(targetBase);
      return;
    }
    const end      = targetBase;
    const dur      = 1000;
    const t0       = performance.now();
    function easeOutFirst(t) { return 1 - Math.pow(1 - t, 2.5); }
    _countUpCurrent = end;
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      totalValueEl.textContent = formatBase(end * easeOutFirst(p));
      if (p < 1) { _countUpRaf = requestAnimationFrame(step); }
      else        { _countUpRaf = null; totalValueEl.textContent = formatBase(end); }
    })(t0);
    return;
  }

  // Skip if value hasn't changed
  if (_countUpCurrent === targetBase) return;

  if (_countUpRaf) cancelAnimationFrame(_countUpRaf);

  // Flash (color) + lift (transform) feedback
  const flashEl = totalValueEl;
  flashEl.classList.remove('value-flash-up', 'value-flash-down', 'value-lift');
  void flashEl.offsetWidth; // force reflow to restart animations on consecutive updates
  flashEl.classList.add(targetBase > _countUpCurrent ? 'value-flash-up' : 'value-flash-down');
  flashEl.classList.add('value-lift');

  const start     = _countUpCurrent;
  const end       = targetBase;
  const duration  = 500; // ms
  const startTime = performance.now();

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

  function step(now) {
    const elapsed  = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const value    = start + (end - start) * easeOut(progress);
    totalValueEl.textContent = formatBase(value);
    if (progress < 1) {
      _countUpRaf = requestAnimationFrame(step);
    } else {
      _countUpCurrent = end;
      _countUpRaf     = null;
    }
  }

  _countUpCurrent = end;  // store immediately so rapid calls use correct start
  _countUpRaf = requestAnimationFrame(step);
}

// Animates the detail-hero value element.
// - First entry into a category  → count up from 0 (900ms)
// - Subsequent price tick        → smooth interpolation (450ms) + color flash
// Cancelled and reset whenever the user leaves the category view.
function _animateHeroValue(el, target) {
  if (_heroRaf) { cancelAnimationFrame(_heroRaf); _heroRaf = null; }

  const isFirstEntry = (_heroValueShown === null);
  if (!isFirstEntry && Math.abs((_heroValueShown || 0) - target) < 0.005) return;

  const start = isFirstEntry ? 0 : (_heroValueShown || 0);
  const dur   = isFirstEntry
    ? (reducedMotion ? 0 : 900)
    : (reducedMotion ? 0 : 450);

  // Flash color on update (not on first entry — count-up communicates gain already)
  if (!isFirstEntry) {
    el.classList.remove('hero-flash-up', 'hero-flash-down');
    void el.offsetWidth;  // force reflow so the animation restarts
    el.classList.add(target > (_heroValueShown || 0) ? 'hero-flash-up' : 'hero-flash-down');
  }

  _heroValueShown = target;

  if (dur === 0) { el.textContent = formatBase(target); return; }

  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  const t0 = performance.now();

  (function step(now) {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = formatBase(start + (target - start) * ease(p));
    if (p < 1) {
      _heroRaf = requestAnimationFrame(step);
    } else {
      _heroRaf = null;
      el.textContent = formatBase(target);
    }
  })(t0);
}

// Animates individual asset value elements that carried data-from/data-to
// attributes set during render() when prices changed.
function animateCardValues() {
  const dur = 500;
  function easeOut(t) { return 1 - (1 - t) ** 3; }
  assetsListEl.querySelectorAll('.asset-value-amount[data-from], .dar-value[data-from]').forEach(el => {
    const from = +el.dataset.from;
    const to   = +el.dataset.to;
    if (!isFinite(from) || !isFinite(to) || Math.abs(from - to) < 0.001) return;
    const t0 = performance.now();
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      el.textContent = formatBase(from + (to - from) * easeOut(p));
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  });
}

// ── Market status ──────────────────────────────────────────
function getMarketStatus(type) {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  // NYSE hours in Spain time: 15:30 – 22:00
  const open  = 15 * 60 + 30;
  const close = 22 * 60;

  if (type === 'crypto') return '24/7';
  if (type === 'stock' || type === 'etf') {
    return (currentTime >= open && currentTime < close) ? 'open' : 'closed';
  }
  return null;
}

function getMarketLabel(status) {
  if (lang === 'es') {
    if (status === 'open')   return 'Mercado abierto';
    if (status === 'closed') return 'Mercado cerrado';
    if (status === '24/7')   return '24/7';
  }
  if (status === 'open')   return 'Market open';
  if (status === 'closed') return 'Market closed';
  return '24/7';
}

// Builds the status HTML for a card — only crypto and stock/ETF get a badge.
function getStatusHtml(asset) {
  if (asset.type === 'cash' || asset.type === 'metal' || asset.type === 'real_estate') return '';

  const status = getMarketStatus(asset.type);
  if (!status) return '';

  const cls   = status === '24/7' ? 'crypto' : status;  // '24/7' → 'crypto'
  const label = {
    '24/7':   `🟣 24/7`,
    'open':   `🟢 ${lang === 'es' ? 'Abierto' : 'Open'}`,
    'closed': `🔴 ${lang === 'es' ? 'Cerrado' : 'Closed'}`,
  }[status];

  return `<div class="market-status ${cls}">${label}</div>`;
}

// ── Card drag & drop functions ──────────────────────────────
function _ddSaveOrder() {
  const ids = [...assetsListEl.querySelectorAll('.asset-card[data-asset-id]')]
    .map(c => c.dataset.assetId);
  _cardOrder = ids;
  localStorage.setItem(CARD_ORDER_KEY, JSON.stringify(ids));
}

function applyCustomOrder(assetList) {
  if (!_cardOrder.length) return assetList;
  const map = new Map(assetList.map(a => [a.id, a]));
  const out = [];
  _cardOrder.forEach(id => { if (map.has(id)) { out.push(map.get(id)); map.delete(id); } });
  map.forEach(a => out.push(a)); // newly added assets go to the end
  return out;
}

function _ddBeginDrag(card, touch) {
  if (_dd) return;
  const rect = card.getBoundingClientRect();
  if (navigator.vibrate) navigator.vibrate(28);

  // Placeholder keeps the gap while card is lifted
  const ph = document.createElement('div');
  ph.className  = 'card--drag-ph';
  ph.style.height = rect.height + 'px';
  card.after(ph);

  card.classList.add('card--dragging');
  card.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;margin:0;z-index:500;`;

  _dd = { card, ph, startY: touch.clientY, origTop: rect.top };
}

function _ddMove(e) {
  if (!_dd || !e.touches[0]) return;
  e.preventDefault();
  const dy  = e.touches[0].clientY - _dd.startY;
  const top = _dd.origTop + dy;
  _dd.card.style.top = top + 'px';

  // Move placeholder to the slot where the card would land
  const center  = top + _dd.card.offsetHeight / 2;
  const sibs    = [...assetsListEl.querySelectorAll('.asset-card[data-asset-id]:not(.card--dragging)')];
  let insertBefore = null;
  for (const s of sibs) {
    const sr = s.getBoundingClientRect();
    if (center < sr.top + sr.height / 2) { insertBefore = s; break; }
  }
  if (insertBefore) {
    if (_dd.ph.nextElementSibling !== insertBefore) assetsListEl.insertBefore(_dd.ph, insertBefore);
  } else if (_dd.ph !== assetsListEl.lastElementChild) {
    assetsListEl.appendChild(_dd.ph);
  }
}

function _ddEnd() {
  if (!_dd) return;
  const { card, ph } = _dd;
  _dd = null;

  // FLIP: record where card is right now (fixed position)
  const fromTop = parseFloat(card.style.top) || 0;

  // Reset card to normal flow at placeholder's position
  card.removeAttribute('style');
  card.classList.remove('card--dragging');
  ph.replaceWith(card);

  // FLIP invert: measure the jump and counteract it with transform
  const toRect = card.getBoundingClientRect();
  const dy     = fromTop - toRect.top;
  card.style.transform  = `translateY(${dy}px)`;
  card.style.transition = 'none';
  card.getBoundingClientRect(); // force layout

  // FLIP play: animate to zero
  card.style.transition = 'transform 200ms cubic-bezier(.22,1,.36,1)';
  card.style.transform  = '';
  setTimeout(() => { card.style.transition = ''; }, 220);

  _ddSaveOrder();
}

// ── Category navigation ─────────────────────────────────────
// type = null always clears; same type as active toggles off; different type activates.
// Orchestrates a cross-fade transition between the category grid and asset list views.

let _catTransitioning = false;

function _animateSectionIn(el) {
  if (!el || reducedMotion) return;
  const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  el.style.opacity   = '0';
  el.style.transform = 'translateY(10px)';
  el.style.transition = 'none';
  void el.getBoundingClientRect(); // force layout before re-enabling transition
  el.style.transition = `opacity 300ms ${EASE}, transform 300ms ${EASE}`;
  el.style.opacity   = '1';
  el.style.transform = 'translateY(0)';
  setTimeout(() => {
    el.style.transition = el.style.opacity = el.style.transform = '';
  }, 360);
}

// Brief border+background flash on the card that was just added or edited
function _flashAssetCard(id) {
  if (!id || reducedMotion) return;
  requestAnimationFrame(() => {
    const card = assetsListEl.querySelector(`[data-asset-id="${id}"]`);
    if (!card) return;
    card.classList.remove('card--just-updated');
    void card.offsetWidth; // restart if called twice rapidly
    card.classList.add('card--just-updated');
    setTimeout(() => card.classList.remove('card--just-updated'), 650);
  });
}

// Brief flash on the matching category card (only when on the dashboard)
function _flashCategoryCard(type) {
  if (!type || reducedMotion || activeCategory) return;
  requestAnimationFrame(() => {
    const catCard = document.querySelector(`.cat-card[data-type="${type}"]`);
    if (!catCard) return;
    catCard.classList.remove('cat-card--just-updated');
    void catCard.offsetWidth;
    catCard.classList.add('cat-card--just-updated');
    setTimeout(() => catCard.classList.remove('cat-card--just-updated'), 650);
  });
}

function setActiveCategory(type) {
  const next = (type === null || activeCategory === type) ? null : type;
  if (next === activeCategory) return;
  if (_catTransitioning && !reducedMotion) return; // ignore clicks mid-transition

  const EASE       = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const isDrilling = next !== null;

  function _commit() {
    activeCategory = next;
    updateCategoryCards();
    render(true);
    _applyDonutState();
  }

  // Reduced-motion: instant swap, no animations
  if (reducedMotion) {
    document.body.classList.toggle('is-detail-view', isDrilling);
    _commit();
    window.scrollTo(0, 0);
    return;
  }

  // Background dim: apply immediately so it transitions in parallel with everything else
  document.body.classList.toggle('is-detail-view', isDrilling);

  _catTransitioning = true;

  if (isDrilling) {
    // Briefly lift the clicked card before the dashboard fades
    const clickedCard = document.querySelector(`.cat-card[data-type="${next}"]`);
    if (clickedCard) {
      clickedCard.style.transition = `transform 130ms ${EASE}, box-shadow 130ms ${EASE}, filter 130ms ${EASE}`;
      clickedCard.style.transform  = 'scale(1.04) translateY(-4px)';
      clickedCard.style.boxShadow  = '0 24px 52px rgba(0,0,0,.6), 0 0 0 2px rgba(79,142,247,.22)';
      clickedCard.style.filter     = 'brightness(1.08)';
    }

    // Fade out entire dashboard (hero card + distribution + category cards)
    const dashTop     = document.querySelector('.dashboard-top');
    const distSection = document.getElementById('distributionSection');
    const catSection  = document.getElementById('categoriesSection');

    const toHide = [dashTop, distSection, catSection].filter(
      el => el && el.style.display !== 'none'
    );

    const _runFade = () => {
      if (toHide.length) {
        toHide.forEach(el => {
          el.style.transition = `opacity 200ms ${EASE}, transform 200ms ${EASE}`;
          el.style.opacity    = '0';
          el.style.transform  = 'translateY(-6px) scale(0.98)';
        });
        setTimeout(() => {
          if (clickedCard) {
            clickedCard.style.transition = clickedCard.style.transform =
              clickedCard.style.boxShadow = clickedCard.style.filter = '';
          }
          toHide.forEach(el => {
            el.style.transition = el.style.opacity = el.style.transform = '';
          });
          _commit(); // render() sets dashTop display:none, shows assetsSection
          _animateSectionIn(document.getElementById('assetsSection'));
          window.scrollTo(0, 0);
          setTimeout(() => { _catTransitioning = false; }, 320);
        }, 210);
      } else {
        if (clickedCard) {
          clickedCard.style.transition = clickedCard.style.transform =
            clickedCard.style.boxShadow = clickedCard.style.filter = '';
        }
        _commit();
        _animateSectionIn(document.getElementById('assetsSection'));
        setTimeout(() => { _catTransitioning = false; }, 320);
      }
    };

    // Give the card lift a 55ms head-start before the dashboard fades
    if (clickedCard) {
      setTimeout(_runFade, 55);
    } else {
      _runFade();
    }

  } else {
    // Fade out asset list, then slide the full dashboard back in
    const assetsSection = document.getElementById('assetsSection');

    if (assetsSection && assetsSection.style.display !== 'none') {
      assetsSection.style.transition = `opacity 180ms ${EASE}, transform 180ms ${EASE}`;
      assetsSection.style.opacity    = '0';
      assetsSection.style.transform  = 'translateY(8px)';
      setTimeout(() => {
        assetsSection.style.transition = assetsSection.style.opacity = assetsSection.style.transform = '';
        _commit(); // render() shows dashTop/distributionSection, hides assetsSection; updateCategoryCards shows catSection
        const dashTop    = document.querySelector('.dashboard-top');
        const distSection = document.getElementById('distributionSection');
        const catSec     = document.getElementById('categoriesSection');
        [dashTop, distSection, catSec].filter(Boolean).forEach(el => _animateSectionIn(el));
        window.scrollTo(0, 0);
        setTimeout(() => { _catTransitioning = false; }, 320);
      }, 190);
    } else {
      _commit();
      const dashTop    = document.querySelector('.dashboard-top');
      const distSection = document.getElementById('distributionSection');
      const catSec     = document.getElementById('categoriesSection');
      [dashTop, distSection, catSec].filter(Boolean).forEach(el => _animateSectionIn(el));
      setTimeout(() => { _catTransitioning = false; }, 320);
    }
  }
}

// ── Category card visual builder ───────────────────────────
// Returns decorative HTML for each asset type. Animations use
// only transform / opacity / background-position — GPU-only.
function buildCardVisual(type, typeAssets, pct) {
  const top = [...typeAssets]
    .sort((a, b) => assetNativeValue(b) - assetNativeValue(a))
    .slice(0, 3);

  if (type === 'crypto') {
    const GLYPHS = {
      BTC: '₿', ETH: 'Ξ', SOL: '◎', XRP: '✦', USDT: '₮',
      BNB: '⬡', DOGE: 'Ð', ADA: '₳', DOT: '●', LTC: 'Ł', AVAX: '▲',
    };
    const HEIGHTS = [38, 52, 44, 68, 55, 82, 62, 100];
    const bars    = HEIGHTS.map((h, i) =>
      `<div class="cc-wave-bar" style="--wh:${h}%;animation-delay:${(i * 0.18).toFixed(2)}s"></div>`
    ).join('');
    // Stacked glyphs: up to 3 largest holdings, layered as subtle watermarks
    const GLYPH_TIERS = ['primary', 'secondary', 'tertiary'];
    const glyphHtml = top.length
      ? top.slice(0, 3).map((a, i) => {
          const g = GLYPHS[a.ticker] || '◈';
          return `<span class="cc-glyph cc-glyph--${GLYPH_TIERS[i]}">${g}</span>`;
        }).join('')
      : `<span class="cc-glyph cc-glyph--primary">◈</span>`;
    return `<div class="cat-card-visual cc-vis--crypto">
      <div class="cc-signal-ring"></div>
      <div class="cc-signal-ring"></div>
      ${glyphHtml}
      <div class="cc-wave-wrap">${bars}</div>
    </div>`;
  }

  if (type === 'metal') {
    const hasSilverOnly = top.length > 0 && top.every(a => a.ticker === 'XAG');
    const shineCls = hasSilverOnly ? 'cc-metal-shine--silver' : 'cc-metal-shine--gold';
    const labelCls = hasSilverOnly ? 'cc-metal-label--silver' : 'cc-metal-label--gold';
    const symbol   = hasSilverOnly
      ? (lang === 'es' ? 'Plata' : 'Silver')
      : (lang === 'es' ? 'Oro'   : 'Gold');
    return `<div class="cat-card-visual cc-vis--metal">
      <div class="cc-metal-shine ${shineCls}"></div>
      <span class="cc-metal-label ${labelCls}">${symbol}</span>
    </div>`;
  }

  if (type === 'stock' || type === 'etf') {
    const fallback = type === 'etf'
      ? [{ ticker: 'SPY' }, { ticker: 'QQQ' }]
      : [{ ticker: 'TSLA' }, { ticker: 'AAPL' }];
    const src  = top.length ? top : fallback;
    const chip = src.slice(0, 2).map((a, i) =>
      i === 0
        ? `<span class="cc-ticker-big">${escHtml(a.ticker.slice(0, 5))}</span>`
        : `<span class="cc-ticker-secondary">${escHtml(a.ticker.slice(0, 5))}</span>`
    ).join('');
    // Micro sparkline — deterministic heights give a realistic chart silhouette
    const SPARK_H = type === 'etf'
      ? [42, 38, 55, 48, 62, 58, 72, 66, 80, 74]
      : [38, 50, 44, 60, 52, 78, 64, 55, 88, 70];
    const sparkBars = SPARK_H.map((h, i) =>
      `<div class="cc-micro-bar" style="height:${h}%;animation-delay:${(i * 0.20).toFixed(2)}s"></div>`
    ).join('');
    return `<div class="cat-card-visual cc-vis--${type}">
      ${chip}
      <div class="cc-micro-chart">${sparkBars}</div>
    </div>`;
  }

  if (type === 'cash') {
    const bars = [100, 80, 62].map((fw, i) =>
      `<div class="cc-flow cc-flow--green" style="--fw:${fw}%;animation-delay:${(i * 0.9).toFixed(2)}s"></div>`
    ).join('');
    return `<div class="cat-card-visual cc-vis--cash">${bars}</div>`;
  }

  if (type === 'real_estate') {
    const bldgCount = Math.min(5, Math.max(3, Math.floor(pct / 12) + 2));
    const HEIGHTS   = [55, 32, 72, 22, 46];
    const blocks    = Array.from({ length: bldgCount }, (_, i) =>
      `<div class="cc-bldg" style="--bh:${HEIGHTS[i % HEIGHTS.length]}px;animation-delay:${(i * 0.7).toFixed(1)}s"></div>`
    ).join('');
    return `<div class="cat-card-visual cc-vis--realestate">${blocks}</div>`;
  }

  return '';
}

function updateCategoryCards() {
  const section = document.getElementById('categoriesSection');
  const grid    = document.getElementById('categoriesGrid');
  if (!section || !grid) return;

  // In category drill-down, this section is replaced by the filtered asset list
  if (activeCategory !== null) {
    section.style.display = 'none';
    return;
  }

  // Fixed ordered list — all 6 categories always rendered, even when empty
  // Row 1: Acciones, Fondos/ETF, Cripto  |  Row 2: Metales, Inmuebles, Liquidez
  const ALL_CATEGORIES = ['stock', 'etf', 'crypto', 'metal', 'real_estate', 'cash'];

  // Build a lookup from _donutDist so we can fill in live values where available
  const distMap = Object.fromEntries((_donutDist || []).map(d => [d.type, d]));

  console.log('[categories] rendering:', ALL_CATEGORIES, '| live dist:', Object.keys(distMap));

  section.style.display = '';
  const hint = `<span class="cat-card-hint">${t('viewHint')}</span>`;
  grid.innerHTML = ALL_CATEGORIES.map(type => {
    const dist       = distMap[type] || { type, valueBase: 0, pct: 0 };
    const m          = TYPE_META[type] || TYPE_META.other;
    const typeAssets = assets.filter(a => (TYPE_META[a.type] ? a.type : 'other') === type);
    const visual     = buildCardVisual(type, typeAssets, dist.pct);
    const isEmpty    = dist.valueBase === 0;

    // Real estate: compute total monthly rent across all RE assets
    let rentLineHtml = '';
    if (type === 'real_estate') {
      const totalRentEur = typeAssets
        .filter(a => a.rent > 0 && (a.assetCurrency || 'EUR') === 'EUR')
        .reduce((s, a) => s + a.rent, 0);
      const totalRentUsd = typeAssets
        .filter(a => a.rent > 0 && (a.assetCurrency || 'EUR') === 'USD')
        .reduce((s, a) => s + a.rent, 0);
      const totalRentBase = toBase(totalRentEur, 'EUR') + toBase(totalRentUsd, 'USD');
      if (totalRentBase > 0) {
        const rentLabel     = lang === 'es' ? '/mes' : '/mo';
        const rentLblText   = lang === 'es' ? 'Ingresos mensuales' : 'Monthly income';
        const multipleProps = typeAssets.filter(a => a.rent > 0).length > 1;
        const rentLblFull   = multipleProps
          ? (lang === 'es' ? 'Ingresos mensuales totales' : 'Total monthly income')
          : rentLblText;
        rentLineHtml = `<div class="cat-card-rent-group">
          <span class="cat-card-rent-lbl">${rentLblFull}</span>
          <span class="cat-card-rent">+${formatBase(totalRentBase)}${rentLabel}</span>
        </div>`;
      }
    }

    const catStatus = getMarketStatus(type);
    const catStatusHtml = catStatus
      ? `<span class="market-status ${catStatus === '24/7' ? 'crypto' : catStatus}"><span class="dot"></span>${getMarketLabel(catStatus)}</span>`
      : '';

    return `<button class="cat-card${isEmpty ? ' cat-card--empty' : ''}" data-type="${type}">
      ${visual}
      <div class="cat-card-content">
        <div class="cat-card-header">
          <span class="cat-card-dot" style="background:${m.color}"></span>
          <span class="cat-card-name">${m.label}</span>
          ${catStatusHtml}
        </div>
        <span class="cat-card-value" data-target="${isEmpty ? '' : dist.valueBase}">${isEmpty ? '—' : formatBase(dist.valueBase)}</span>
        <span class="cat-card-pct">${isEmpty ? '0.0%' : dist.pct.toFixed(1) + '%'}</span>
        ${rentLineHtml}
        ${hint}
      </div>
    </button>`;
  }).join('');

  // Phase-offset each card's ambient glow so they don't pulse in sync
  grid.querySelectorAll('.cat-card').forEach((btn, i) => {
    btn.style.setProperty('--vi', i);
  });

  grid.querySelectorAll('.cat-card').forEach(btn => {
    let _tapOk = false;

    // touchstart: visual press feedback immediately
    btn.addEventListener('touchstart', () => {
      _tapOk = true;
      btn.classList.add('is-pressing');
    }, { passive: true });

    // touchmove: user is scrolling, cancel tap
    btn.addEventListener('touchmove', () => {
      _tapOk = false;
      btn.classList.remove('is-pressing');
    }, { passive: true });

    // touchend: fire action if finger didn't scroll away
    btn.addEventListener('touchend', (e) => {
      btn.classList.remove('is-pressing');
      if (_tapOk) {
        _tapOk = false;
        e.preventDefault(); // prevent ghost click
        setActiveCategory(btn.dataset.type);
      }
    });

    btn.addEventListener('touchcancel', () => {
      _tapOk = false;
      btn.classList.remove('is-pressing');
    });

    // click: fallback for desktop / non-touch
    btn.addEventListener('click', () => setActiveCategory(btn.dataset.type));
  });
}

// ── Performance display ─────────────────────────────────────
function updatePerformance() {
  if (!summaryPerfEl) return;
  if (assets.length === 0) { summaryPerfEl.style.display = 'none'; return; }

  let result = computeRangePnL(activeRange);
  if (!result && activeRange !== 'all') result = computeRangePnL('all'); // fallback to cost basis
  if (!result) { summaryPerfEl.style.display = 'none'; return; }

  const { abs, pct } = result;
  const isPos  = abs >= 0;
  const sign   = isPos ? '+' : '−';
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  const pctStr = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1, maximumFractionDigits: 1,
  }).format(Math.abs(pct));

  summaryPerfEl.textContent = `${sign}${formatBase(Math.abs(abs))} (${sign}${pctStr}%)`;
  summaryPerfEl.className   = `summary-perf ${isPos ? 'positive' : 'negative'}`;
  summaryPerfEl.style.display = '';
}

// ── Detail View ────────────────────────────────────────────
function _hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16 & 0xff), (n >> 8 & 0xff), (n & 0xff)];
}

// Weighted-average 24h change across all assets in a category.
// Excludes cash and real estate (no daily market price change).
function computeCategoryChange(typeAssets) {
  const liquid = typeAssets.filter(
    a => typeof a.change24h === 'number' && a.type !== 'cash' && a.type !== 'real_estate'
  );
  if (!liquid.length) return null;
  const totalVal = liquid.reduce(
    (s, a) => s + toBase(assetNativeValue(a), (a.assetCurrency || 'USD').toUpperCase()), 0
  );
  if (totalVal <= 0) return null;
  return liquid.reduce((s, a) => {
    const w = toBase(assetNativeValue(a), (a.assetCurrency || 'USD').toUpperCase()) / totalVal;
    return s + a.change24h * w;
  }, 0);
}

// Build (or rebuild) the mini sparkline chart inside .detail-chart-wrap.
// Uses deterministic synthetic data: smoothstep from 24h-ago value to now,
// plus a fixed wave pattern — no Math.random so it stays stable on re-renders.
function buildDetailSparkline(totalValue, change24h, color) {
  const canvas = document.getElementById('detailChartCanvas');
  if (!canvas) return;
  if (_detailChart) { _detailChart.destroy(); _detailChart = null; }

  const pts     = 32;
  const startVal = totalValue / (1 + (change24h || 0) / 100);
  const now      = Date.now();
  const STEP     = (24 * 3_600_000) / (pts - 1);

  const values = Array.from({ length: pts }, (_, i) => {
    const t      = i / (pts - 1);
    const smooth = t * t * (3 - 2 * t);            // smoothstep ease
    const wave   = Math.sin(i * 1.9) * 0.004 + Math.cos(i * 3.1) * 0.002;
    return startVal + (totalValue - startVal) * smooth + totalValue * wave;
  });

  const labels = Array.from({ length: pts }, (_, i) => {
    const d = new Date(now - (pts - 1 - i) * STEP);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  });

  const isUp        = (change24h || 0) >= 0;
  const lineColor   = isUp ? color : '#c87070';
  const [lr, lg, lb] = _hexToRgb(lineColor);

  const fillPlugin = {
    id: 'detailFill',
    beforeDraw(chart) {
      if (!chart.chartArea) return;
      const { ctx, chartArea: { top, bottom } } = chart;
      const grad = ctx.createLinearGradient(0, top, 0, bottom);
      grad.addColorStop(0,   `rgba(${lr},${lg},${lb},0.20)`);
      grad.addColorStop(0.55, `rgba(${lr},${lg},${lb},0.06)`);
      grad.addColorStop(1,   `rgba(${lr},${lg},${lb},0.00)`);
      chart.data.datasets.forEach(ds => { ds.backgroundColor = grad; });
    }
  };

  // Glow removed — clean sparkline
  const glowPlugin = { id: 'detailGlow', beforeDatasetsDraw() {}, afterDatasetsDraw() {} };

  _detailChart = new Chart(canvas.getContext('2d'), {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: values, borderColor: lineColor, backgroundColor: 'transparent',
        fill: true, tension: 0.45, pointRadius: 0, borderWidth: 2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } },
      animation: { duration: 700, easing: 'easeInOutQuart' },
    },
    plugins: [fillPlugin, glowPlugin],
  });
}

// Render or update the premium detail hero (category name, total value,
// 24h change badge, mini sparkline chart). Called from render() when in
// category drill-down. Re-creates sparkline only when category changes.
function renderDetailHero(type, typeAssets) {
  const m          = TYPE_META[type] || TYPE_META.other;
  const dist       = _donutDist.find(d => d.type === type);
  const totalValue = dist
    ? dist.valueBase
    : typeAssets.reduce(
        (s, a) => s + toBase(assetNativeValue(a), (a.assetCurrency || 'USD').toUpperCase()), 0
      );
  const change24h = computeCategoryChange(typeAssets);

  // Create hero element once
  let heroEl = document.getElementById('detailHero');
  if (!heroEl) {
    heroEl = document.createElement('div');
    heroEl.id        = 'detailHero';
    heroEl.className = 'detail-hero';
    heroEl.innerHTML = `
      <div class="detail-hero-info">
        <div class="detail-hero-meta">
          <span class="detail-hero-dot"></span>
          <span class="detail-hero-type"></span>
        </div>
        <div class="detail-hero-value"></div>
        <span class="detail-hero-change"></span>
      </div>
      <div class="detail-chart-wrap"><canvas id="detailChartCanvas"></canvas></div>`;
    const hdr = document.querySelector('#assetsSection .section-header');
    if (hdr) hdr.after(heroEl);
  }

  // Update static fields
  heroEl.style.setProperty('--detail-hero-color', m.color);
  heroEl.querySelector('.detail-hero-dot').style.background = m.color;
  heroEl.querySelector('.detail-hero-type').textContent     = m.label.toUpperCase();

  // On category switch: reset hero animation so it counts up from 0 for new category
  if (_detailChartType !== type) {
    if (_heroRaf) { cancelAnimationFrame(_heroRaf); _heroRaf = null; }
    _heroValueShown = null;
  }

  // Animated value: count-up from 0 on first entry, smooth interpolation on update
  _animateHeroValue(heroEl.querySelector('.detail-hero-value'), totalValue);

  const changeEl = heroEl.querySelector('.detail-hero-change');
  if (change24h !== null) {
    const sign = change24h >= 0 ? '+' : '';
    const cls  = change24h > 0.005 ? 'up' : change24h < -0.005 ? 'down' : 'flat';
    changeEl.textContent = `${sign}${change24h.toFixed(2)}%`;
    changeEl.className   = `detail-hero-change ${cls}`;
    changeEl.style.display = '';
  } else {
    changeEl.style.display = 'none';
  }

  // Re-build sparkline only when the category changes (not on every price tick)
  if (_detailChartType !== type) {
    _detailChartType = type;
    requestAnimationFrame(() => buildDetailSparkline(totalValue, change24h, m.color));
  }
}

// ── Render ─────────────────────────────────────────────────
function render(animate = false) {
  countUpTotalValue(totalValueBase());
  updatePerformance();
  assetCountEl.textContent = t('assetCount')(assets.length);

  // Update section header: show category name + back button, or the normal title
  const assetsTitleEl    = document.getElementById('assetsSectionTitle');
  const filterIndicator  = document.getElementById('sectionFilterIndicator');
  const filterNameEl     = document.getElementById('sectionFilterName');
  if (activeCategory) {
    const m = TYPE_META[activeCategory] || TYPE_META.other;
    if (assetsTitleEl)   assetsTitleEl.style.display   = 'none';
    if (filterNameEl)    { filterNameEl.textContent = m.label; filterNameEl.style.color = m.color; }
    if (filterIndicator) filterIndicator.style.display = '';
  } else {
    if (assetsTitleEl)   assetsTitleEl.style.display   = '';
    if (filterIndicator) filterIndicator.style.display = 'none';
  }

  // Section visibility: full-page navigation between dashboard and category drill-down
  const assetsSectionEl = document.getElementById('assetsSection');
  const dashTopEl        = document.querySelector('.dashboard-top'); // the hero card
  if (activeCategory) {
    // Category drill-down: hide dashboard, show asset list only
    if (assetsSectionEl)        { assetsSectionEl.style.display = ''; assetsSectionEl.classList.add('is-detail'); }
    if (dashTopEl)               dashTopEl.style.display               = 'none';
    if (distributionSectionEl)   distributionSectionEl.style.display   = 'none';
    // categoriesSection already hidden by updateCategoryCards() short-circuit
    // Render premium detail hero (category stats + mini sparkline)
    const typeAssets = assets.filter(a => (TYPE_META[a.type] ? a.type : 'other') === activeCategory);
    renderDetailHero(activeCategory, typeAssets);
  } else {
    // Dashboard: show all dashboard sections, hide asset list
    if (assetsSectionEl) { assetsSectionEl.style.display = 'none'; assetsSectionEl.classList.remove('is-detail'); }
    if (dashTopEl)        dashTopEl.style.display        = '';
    if (distributionSectionEl && _donutDist.length > 0) distributionSectionEl.style.display = '';
    // Clean up detail hero, sparkline and hero animation when returning to dashboard
    const heroEl = document.getElementById('detailHero');
    if (heroEl) heroEl.remove();
    if (_detailChart) { _detailChart.destroy(); _detailChart = null; }
    _detailChartType = null;
    if (_heroRaf) { cancelAnimationFrame(_heroRaf); _heroRaf = null; }
    _heroValueShown = null;
  }

  // Toggle premium detail-view styling on the list container
  assetsListEl.classList.toggle('assets-list--detail', !!activeCategory);

  // Contextual add button: show inside category view with translated label
  const btnAddCtxEl = document.getElementById('btnAddContext');
  if (btnAddCtxEl) {
    if (activeCategory) {
      btnAddCtxEl.textContent = (T[lang].addCtx || {})[activeCategory] || '+ Añadir';
      btnAddCtxEl.style.display = '';
    } else {
      btnAddCtxEl.style.display = 'none';
    }
  }

  // Reset inline edit state before clearing DOM (elements are about to be destroyed)
  _inlineEditId  = null;
  _inlineEditMode = null;

  // Clear list (keep empty state node)
  while (assetsListEl.firstChild) {
    assetsListEl.removeChild(assetsListEl.firstChild);
  }

  if (assets.length === 0) {
    assetsListEl.appendChild(emptyStateEl);
    return;
  }

  // Sort by value descending; apply custom drag-drop order in main list view
  const sorted   = [...assets].sort((a, b) => assetNativeValue(b) - assetNativeValue(a));
  const display  = activeCategory ? sorted : applyCustomOrder(sorted);
  const filtered = activeCategory
    ? display.filter(a => (TYPE_META[a.type] ? a.type : 'other') === activeCategory)
    : display;

  if (filtered.length === 0) {
    assetsListEl.appendChild(emptyStateEl);
    return;
  }

  // Real estate view: show total monthly rental income banner
  if (activeCategory === 'real_estate') {
    const totalRentBase = filtered
      .filter(a => a.rent > 0)
      .reduce((sum, a) => sum + toBase(a.rent, (a.assetCurrency || 'EUR').toUpperCase()), 0);
    const rentLabel = lang === 'es' ? '/mes' : '/mo';
    const bannerEl = document.createElement('div');
    bannerEl.className = 'rent-banner' + (totalRentBase > 0 ? '' : ' rent-banner--zero');
    bannerEl.innerHTML = totalRentBase > 0
      ? `<span class="rent-banner-label">${lang === 'es' ? 'Ingresos mensuales' : 'Monthly income'}</span>
         <span class="rent-banner-value">+${formatBase(totalRentBase)}${rentLabel}</span>`
      : `<span class="rent-banner-label">${lang === 'es' ? 'Ingresos mensuales' : 'Monthly income'}</span>
         <span class="rent-banner-zero">${lang === 'es' ? 'Sin ingresos' : 'No income'}</span>`;
    assetsListEl.appendChild(bannerEl);
  }

  filtered.forEach((asset, cardIndex) => {
    const assetCurr  = (asset.assetCurrency || 'USD').toUpperCase();
    const isCash     = asset.type === 'cash';
    const isGold     = asset.ticker === 'XAU' && asset.karat;
    const valueOrig  = assetNativeValue(asset);              // in assetCurr
    const valueBase  = toBase(valueOrig, assetCurr);         // in baseCurrency
    const showOrig   = assetCurr !== baseCurrency;

    const change24   = asset.change24h;
    const changeHtml = (!isCash && typeof change24 === 'number')
      ? `<span class="change ${change24 >= 0 ? 'up' : 'down'}">${change24 >= 0 ? '▲' : '▼'} ${Math.abs(change24).toFixed(2)}%</span>`
      : '';
    const flashClass = (asset.prevPrice != null && asset.prevPrice !== asset.price)
      ? (asset.price > asset.prevPrice ? 'flash-up' : 'flash-down')
      : '';
    // Derive previous base value via price ratio (works for all asset types including gold)
    const prevValueBase = (flashClass && asset.price > 0 && asset.prevPrice > 0)
      ? valueBase * (asset.prevPrice / asset.price)
      : null;

    const badgeText = isGold
      ? `${asset.karat}K`
      : escHtml(asset.ticker.toUpperCase().slice(0, 4));

    // Type label (translated)
    const tc = T[lang].typeCard;
    const ticker = escHtml(asset.ticker.toUpperCase());
    const typeLabelMap = {
      crypto:      tc.crypto(ticker),
      stock:       tc.stock(ticker),
      etf:         tc.etf(ticker),
      metal:       isGold
        ? tc.metalGold(ticker, Math.round(asset.karat / 24 * 100))
        : tc.metal(ticker),
      cash:        tc.cash(assetCurr),
      real_estate: tc.real_estate(),
      other:       tc.other(),
    };
    const typeLabel = typeLabelMap[asset.type] ?? `${escHtml(asset.type)} · ${ticker}`;

    // Sub-line under total value: qty + price/unit + change
    const origHtml = (showOrig && !isCash)
      ? `<span class="orig-price">${formatCurrency(valueOrig, assetCurr)}</span>`
      : '';

    // Context-aware quantity + unit string
    const qtyUnitStr = (() => {
      if (isGold) {
        // Gold in grams → auto-promote to kg; oz stays as-is
        const unit = asset.goldUnit || 'g';
        return unit === 'g' ? gramsToDisplay(asset.qty) : `${formatQty(asset.qty)} ${unit}`;
      }
      if (asset.type === 'crypto') return `${formatQty(asset.qty)} ${asset.ticker.toUpperCase()}`;
      if (asset.type === 'metal')  return gramsToDisplay(asset.qty);
      return `${formatQty(asset.qty)} ${t('units')}`;  // stocks, ETF, other
    })();

    const isRE = asset.type === 'real_estate';

    const rentHtml = (isRE && asset.rent > 0)
      ? `<span class="asset-rent">+${formatCurrency(asset.rent, assetCurr)}${lang === 'es' ? '/mes' : '/mo'}</span>`
      : '';

    const subLineHtml = isCash
      ? `<span class="units">${formatCurrency(asset.qty, assetCurr)} ${t('cashLabel')}</span>`
      : isRE
        ? `<span class="units">${assetCurr === 'EUR' ? '€' : '$'} ${assetCurr}</span>
           ${rentHtml}`
        : isGold
          ? `<span class="units">${qtyUnitStr}</span>
             <span class="price">${formatCurrency(asset.price, assetCurr)}${t('perTrOz')}${origHtml ? ` · ${origHtml}` : ''}</span>
             ${changeHtml}`
          : `<span class="units">${qtyUnitStr}</span>
             <span class="price">${formatCurrency(asset.price, assetCurr)}${t('perUnit')}${origHtml ? ` · ${origHtml}` : ''}</span>
             ${changeHtml}`;

    const _mStatus = getMarketStatus(asset.type);
    let statusHtml = '';
    if (_mStatus === 'open')   statusHtml = '<div class="market-status open">🟢 Open</div>';
    else if (_mStatus === 'closed') statusHtml = '<div class="market-status closed">🔴 Closed</div>';
    else if (_mStatus === '24/7')   statusHtml = '<div class="market-status crypto">🟣 24/7</div>';

    // Per-asset P&L
    const pnlData = assetPnLBase(asset);
    let pnlHtml = '';
    if (pnlData) {
      const pSign = pnlData.abs >= 0 ? '+' : '−';
      const pCls  = pnlData.abs >= 0 ? 'up' : 'down';
      pnlHtml = `<span class="asset-pnl ${pCls}">${pSign}${formatBase(Math.abs(pnlData.abs))} (${pSign}${Math.abs(pnlData.pct).toFixed(1)}%)</span>`;
    }

    const actionsHtml = isRE
      ? `<button class="btn-edit-re" title="${t('btnEdit')}" data-id="${asset.id}">✎</button>
         <button class="btn-delete"  title="${t('btnDelete')}" data-id="${asset.id}">✕</button>`
      : `<button class="btn-add-pos" title="${t('btnAdd')}" data-id="${asset.id}">+</button>
         <button class="btn-reduce"  title="${t('btnReduce')}" data-id="${asset.id}">−</button>
         <button class="btn-delete"  title="${t('btnDelete')}" data-id="${asset.id}">✕</button>`;

    // ── Premium detail row (category drill-down view) ────────
    if (activeCategory) {
      const darChangeCls  = typeof change24 === 'number'
        ? (change24 > 0.005 ? 'up' : change24 < -0.005 ? 'down' : 'flat') : '';
      const darChangeHtml = (!isCash && darChangeCls)
        ? `<span class="dar-change ${darChangeCls}">${change24 >= 0 ? '+' : ''}${change24.toFixed(2)}%</span>`
        : '';

      const qtyStr = (() => {
        if (isGold)               return (asset.goldUnit || 'g') === 'g' ? gramsToDisplay(asset.qty) : `${formatQty(asset.qty)} oz`;
        if (asset.type === 'crypto') return `${formatQty(asset.qty)} ${asset.ticker.toUpperCase()}`;
        if (asset.type === 'metal')  return gramsToDisplay(asset.qty);
        if (isCash)               return formatCurrency(asset.qty, assetCurr);
        return `${formatQty(asset.qty)} ${t('units')}`;
      })();
      const priceStr = (!isCash && !isRE && asset.price > 0)
        ? `${formatCurrency(asset.price, assetCurr)}${isGold ? t('perTrOz') : t('perUnit')}`
        : '';
      const darRentHtml = (isRE && asset.rent > 0)
        ? `<span class="dar-rent">+${formatCurrency(asset.rent, assetCurr)}${lang === 'es' ? '/mes' : '/mo'}</span>`
        : '';

      const subParts   = [qtyStr, priceStr].filter(Boolean);
      const darSubHtml = `<span class="dar-qty">${escHtml(subParts.join(' · '))}</span>${darRentHtml}`;

      const row = document.createElement('div');
      row.className    = 'detail-asset-row';
      row.dataset.type    = asset.type;
      row.dataset.assetId = asset.id;
      row.innerHTML = `
        <div class="dar-badge ${asset.type}">${badgeText}</div>
        <div class="dar-info">
          <div class="dar-name">${escHtml(getDisplayName(asset))}</div>
          <div class="dar-sub">${darSubHtml}</div>
        </div>
        <div class="dar-right">
          <div class="dar-value ${flashClass}"${prevValueBase != null ? ` data-from="${prevValueBase.toFixed(6)}" data-to="${valueBase.toFixed(6)}"` : ''}>${formatBase(valueBase)}</div>
          ${darChangeHtml}
          ${pnlData ? `<span class="dar-pnl ${pnlData.abs >= 0 ? 'up' : 'down'}">${pnlData.abs >= 0 ? '+' : '−'}${formatBase(Math.abs(pnlData.abs))} (${pnlData.abs >= 0 ? '+' : '−'}${Math.abs(pnlData.pct).toFixed(1)}%)</span>` : ''}
          <div class="dar-actions">${actionsHtml}</div>
        </div>
        <div class="asset-edit-strip dar-strip" id="aes-${asset.id}">
          <div class="aes-body">
            <div class="aes-row">
              <span class="aes-label"></span>
              <input class="aes-qty-input" type="text" inputmode="decimal" placeholder="0" data-id="${asset.id}" />
              <span class="aes-preview"></span>
              <button class="aes-confirm-btn" data-id="${asset.id}">✓</button>
              <button class="aes-cancel-btn">✕</button>
            </div>
            <div class="aes-error"></div>
          </div>
        </div>`;
      if (animate) {
        row.style.setProperty('--card-i', cardIndex);
        row.classList.add('dar-entering');
      }
      assetsListEl.appendChild(row);
      return;
    }

    // ── Standard asset card (dashboard / all-assets view) ────
    const card = document.createElement('div');
    card.className    = 'asset-card';
    card.dataset.type    = asset.type;
    card.dataset.assetId = asset.id;
    card.innerHTML = `
      <div class="asset-badge ${asset.type}">${badgeText}</div>
      <div class="asset-info">
        <div class="asset-name">${escHtml(getDisplayName(asset))}</div>
        <div class="asset-meta">${typeLabel}</div>
        ${statusHtml}
      </div>
      <div class="asset-value">
        <div class="asset-value-amount ${flashClass}"${prevValueBase != null ? ` data-from="${prevValueBase.toFixed(6)}" data-to="${valueBase.toFixed(6)}"` : ''}>${formatBase(valueBase)}</div>
        <div class="asset-value-sub">${subLineHtml}</div>
        ${pnlHtml}
      </div>
      <div class="asset-actions">
        ${actionsHtml}
      </div>
      <div class="asset-edit-strip" id="aes-${asset.id}">
        <div class="aes-body">
          <div class="aes-row">
            <span class="aes-label"></span>
            <input class="aes-qty-input" type="text" inputmode="decimal" placeholder="0" data-id="${asset.id}" />
            <span class="aes-preview"></span>
            <button class="aes-confirm-btn" data-id="${asset.id}">✓</button>
            <button class="aes-cancel-btn">✕</button>
          </div>
          <div class="aes-error"></div>
        </div>
      </div>
    `;
    if (animate) card.style.setProperty('--card-i', cardIndex);
    assetsListEl.appendChild(card);
  });

  // Animate card values that changed during this render (prices updated)
  animateCardValues();
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

// Always resolve the display name through the translation system for known assets.
// Handles legacy saved assets that may have stored mixed-language names (e.g. "Oro (Gold)").
function getDisplayName(a) {
  if (a.type === 'metal') {
    const translated = T[lang]?.metalNames?.[a.ticker?.toUpperCase()];
    if (translated) return translated;
  }
  // Fallback: use stored name as-is (already English for all non-metal assets)
  return a.name;
}

// ── Local search (instant phase-1, from ASSET_DB, filter-aware) ──
function getLocalResults(query, filter) {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const pool = (filter === 'all' || filter === 'crypto')
    ? ASSET_DB  // stocks + ETFs + metals (crypto comes from API only)
    : ASSET_DB.filter(a => a.type === filter);
  return pool
    .filter(a => a.ticker.toLowerCase().startsWith(q) || a.name.toLowerCase().includes(q))
    .sort((a, b) => {
      const at = a.ticker.toLowerCase().startsWith(q) ? 0 : 1;
      const bt = b.ticker.toLowerCase().startsWith(q) ? 0 : 1;
      return at - bt;
    })
    .slice(0, 8);
}

// ── Real-time API search ───────────────────────────────────
async function searchYahooFinance(query, signal) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=8&newsCount=0&listsCount=0`;
  const proxies = [
    url,
    `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  ];
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, { signal, headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      let json = await res.json();
      if (typeof json.contents === 'string') json = JSON.parse(json.contents);
      const quotes = json?.quotes ?? [];
      return quotes
        .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
        .slice(0, 7)
        .map(q => ({
          ticker:       q.symbol,
          name:         q.longname || q.shortname || q.symbol,
          type:         q.quoteType === 'ETF' ? 'etf' : 'stock',
          marketSymbol: q.symbol,
        }));
    } catch (err) {
      if (err.name === 'AbortError') throw err;
    }
  }
  return null; // all proxies failed
}

async function searchCoinGeckoAPI(query, signal) {
  const res = await fetch(
    `${COINGECKO}/search?query=${encodeURIComponent(query)}`,
    { signal, headers: { Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error('CG search failed');
  const data = await res.json();
  return (data.coins || []).slice(0, 8).map(c => ({
    ticker: c.symbol.toUpperCase(),
    name:   c.name,
    type:   'crypto',
    coinId: c.id,
  }));
}

function searchMetalsLocal(query) {
  const q = query.toLowerCase();
  return [
    { ticker: 'XAU', name: 'Oro (Gold)',     type: 'metal', marketSymbol: 'GC=F', kw: ['oro','gold','xau','gc','xauusd'] },
    { ticker: 'XAG', name: 'Plata (Silver)', type: 'metal', marketSymbol: 'SI=F', kw: ['plata','silver','xag','si','xagusd'] },
  ].filter(m => m.kw.some(k => k.startsWith(q)));
}

async function searchAllAssets(query, signal) {
  const metals = searchMetalsLocal(query);

  const [yahooRes, cryptoRes] = await Promise.allSettled([
    searchYahooFinance(query, signal),
    searchCoinGeckoAPI(query, signal),
  ]);

  if (signal?.aborted) return null;

  const q = query.toLowerCase();
  const yahooItems = (yahooRes.status === 'fulfilled' && yahooRes.value)
    ? yahooRes.value
    : ASSET_DB.filter(a =>
        (a.type === 'stock' || a.type === 'etf') &&
        (a.ticker.toLowerCase().startsWith(q) || a.name.toLowerCase().includes(q))
      ).slice(0, 5);

  const cryptoItems = (cryptoRes.status === 'fulfilled' && cryptoRes.value)
    ? cryptoRes.value
    : [];

  const seen = new Set();
  const merged = [];
  for (const item of [...metals, ...yahooItems, ...cryptoItems]) {
    const key = item.ticker.toUpperCase();
    if (!seen.has(key)) { seen.add(key); merged.push(item); }
  }
  return merged.slice(0, 10);
}

// Filter-aware search: only queries the relevant API source
async function searchByFilter(query, filter, signal) {
  if (filter === 'metal') {
    return searchMetalsLocal(query);
  }
  if (filter === 'crypto') {
    const results = await searchCoinGeckoAPI(query, signal);
    return results || [];
  }
  if (filter === 'stock' || filter === 'etf') {
    const yahooResults = await searchYahooFinance(query, signal);
    if (yahooResults) return yahooResults.filter(a => a.type === filter);
    const q = query.toLowerCase();
    return ASSET_DB
      .filter(a => a.type === filter && (
        a.ticker.toLowerCase().startsWith(q) || a.name.toLowerCase().includes(q)
      ))
      .slice(0, 8);
  }
  return searchAllAssets(query, signal);
}

// ── Render suggestions ────────────────────────────────────
// TYPE_LABEL is derived from translations at render time — no static const needed

function showDefaultSuggestions() {
  const defaults = DEFAULTS[activeSearchFilter] || [];
  if (!defaults.length) { closeSuggestions(); return; }
  renderedSuggestions = defaults;

  assetSuggestionsEl.innerHTML = `
    <div class="sugg-section-label">Populares</div>
    ${defaults.map((a, i) => `
      <div class="suggestion-item" data-idx="${i}">
        <div class="sugg-badge ${a.type}">${escHtml(a.ticker.slice(0, 5))}</div>
        <div class="sugg-info">
          <div class="sugg-name">${escHtml(getDisplayName(a))}</div>
          <div class="sugg-ticker">${escHtml(a.ticker)}</div>
        </div>
        <span class="sugg-type ${a.type}">${T[lang].typeLabel[a.type] || a.type}</span>
      </div>`).join('')}`;

  assetSuggestionsEl.classList.add('open');
  assetSuggestionsEl.querySelectorAll('.suggestion-item[data-idx]').forEach((item, i) => {
    item.addEventListener('click',      () => { closeSuggestions(); selectAsset(defaults[i]); });
    item.addEventListener('mouseenter', () => setFocusedSugg(i));
  });
}

function renderSuggestions(results, query, loading = false) {
  renderedSuggestions = results;

  const loadingHtml = loading
    ? `<div class="suggestion-loading"><span class="sugg-dot-anim">···</span> Buscando…</div>`
    : '';

  if (!results.length) {
    assetSuggestionsEl.innerHTML = loadingHtml ||
      `<div class="suggestion-empty">${t('noResults')(escHtml(query))}</div>`;
    assetSuggestionsEl.classList.add('open');
    return;
  }

  assetSuggestionsEl.innerHTML = results.map((a, i) => `
    <div class="suggestion-item" data-idx="${i}">
      <div class="sugg-badge ${a.type}">${escHtml(a.ticker.slice(0, 5))}</div>
      <div class="sugg-info">
        <div class="sugg-name">${escHtml(getDisplayName(a))}</div>
        <div class="sugg-ticker">${escHtml(a.ticker)}</div>
      </div>
      <span class="sugg-type ${a.type}">${T[lang].typeLabel[a.type] || a.type}</span>
    </div>`).join('') + loadingHtml;

  assetSuggestionsEl.classList.add('open');
  assetSuggestionsEl.querySelectorAll('.suggestion-item[data-idx]').forEach((item, i) => {
    item.addEventListener('click',      () => { closeSuggestions(); selectAsset(results[i]); });
    item.addEventListener('mouseenter', () => setFocusedSugg(i));
  });
}

function closeSuggestions() {
  assetSuggestionsEl.classList.remove('open');
  focusedSuggIdx = -1;
}

function setFocusedSugg(idx) {
  focusedSuggIdx = idx;
  assetSuggestionsEl.querySelectorAll('.suggestion-item[data-idx]').forEach((el, i) => {
    el.classList.toggle('focused', i === idx);
  });
}

async function selectAsset(entry) {
  selectedDbAsset     = entry;
  pendingCoinId       = null;
  pendingMarketSymbol = null;
  pendingPrice        = null;

  // Show chip, hide search
  chipBadgeEl.textContent         = entry.ticker.slice(0, 4);
  chipBadgeEl.className           = `chip-badge ${entry.type}`;
  chipNameEl.textContent          = getDisplayName(entry);
  chipSubEl.textContent           = `${entry.ticker} · ${T[lang].typeLabel[entry.type] || entry.type}`;
  chipPriceEl.textContent         = '⋯';
  selectedChipEl.style.display    = '';
  searchInputWrapEl.style.display = 'none';
  if (searchFiltersEl) searchFiltersEl.style.display = 'none';

  // Reveal qty + submit
  qtyGroup.style.display    = '';
  formPreviewEl.style.display = '';
  btnSubmitEl.style.display  = '';

  // Gold: show karat/unit selectors
  const isGoldEntry = entry.ticker === 'XAU';
  if (karatGroupEl)    karatGroupEl.style.display    = isGoldEntry ? '' : 'none';
  if (goldUnitGroupEl) goldUnitGroupEl.style.display = isGoldEntry ? '' : 'none';
  if (qtyLabelEl)      qtyLabelEl.textContent        = isGoldEntry ? t('qtyGold')(pendingGoldUnit) : t('qty');

  setLookupStatus('loading', 'Obteniendo precio...');

  try {
    let price = null;

    if (entry.type === 'crypto' && entry.coinId) {
      pendingCoinId = entry.coinId;
      const data    = await fetchLivePrices([entry.coinId]);
      price         = data[entry.coinId]?.usd ?? null;
      // Some coins return 0 as price (stablecoin edge cases) — treat as valid
      if (price === null || price === undefined) price = null;
    } else if (entry.marketSymbol) {
      pendingMarketSymbol = entry.marketSymbol;
      if (entry.ticker === 'XAU') {
        // Gold: dedicated source chain (exchangerate.host → Yahoo → fallback)
        price = await fetchGoldSpotPrice();
      } else {
        const data = await fetchYahooData(entry.marketSymbol);
        price      = data?.price ?? null;
        if (!price) {
          const fb = getFallbackData(entry.marketSymbol);
          price    = fb?.price ?? null;
        }
      }
    }

    if (price) {
      pendingPrice            = price;
      chipPriceEl.textContent = formatUSD(price);
      setLookupStatus('ok', '');
    } else {
      chipPriceEl.textContent = t('noPrice');
      setLookupStatus('error', t('priceUnavail'));
    }
  } catch (err) {
    // Network error: try local fallback for non-crypto
    const fb = entry.marketSymbol ? getFallbackData(entry.marketSymbol) : null;
    if (fb) {
      pendingPrice            = fb.price;
      chipPriceEl.textContent = formatUSD(fb.price);
      setLookupStatus('ok', '');
    } else {
      chipPriceEl.textContent = t('noPrice');
      setLookupStatus('error', t('priceNoConn'));
    }
  }

  updatePreview();
  qtyInput.focus();
}

function clearSelectedAsset() {
  selectedDbAsset      = null;
  pendingCoinId        = null;
  pendingMarketSymbol  = null;
  pendingPrice         = null;
  pendingKarat         = 18;
  pendingGoldUnit      = 'g';
  selectedChipEl.style.display = 'none';
  if (karatGroupEl)    karatGroupEl.style.display    = 'none';
  if (goldUnitGroupEl) goldUnitGroupEl.style.display = 'none';
  if (qtyLabelEl)      qtyLabelEl.textContent        = t('qty');
  setLookupStatus('');
  updatePreview();
}

function enterSearchMode() {
  isRealEstateMode = false;
  if (isManualMode) exitManualMode();
  const isinOrWrap = document.getElementById('isinOrWrap');
  if (isinOrWrap) isinOrWrap.style.display = '';
  const reNameGroupEl = document.getElementById('reNameGroup');
  const reCurrGroupEl = document.getElementById('reCurrGroup');
  const reRentGroupEl = document.getElementById('reRentGroup');
  if (reNameGroupEl) reNameGroupEl.style.display = 'none';
  if (reCurrGroupEl) reCurrGroupEl.style.display = 'none';
  if (reRentGroupEl) reRentGroupEl.style.display = 'none';

  clearSelectedAsset();
  searchInputWrapEl.style.display = '';
  if (searchFiltersEl) searchFiltersEl.style.display = '';
  searchInput.value            = '';
  searchClearBtn.style.display = 'none';
  qtyGroup.style.display       = 'none';
  formPreviewEl.style.display  = 'none';
  btnSubmitEl.style.display    = 'none';
  closeSuggestions();
  searchInput.placeholder = T[lang].searchPH[activeSearchFilter] || T[lang].searchPH.all;
  suppressFocusDefaults = true;
  setTimeout(() => searchInput.focus(), 0);
}

function enterRealEstateMode() {
  isRealEstateMode   = true;
  rePendingCurrency  = 'EUR';
  rePendingRent      = 0;
  clearSelectedAsset();
  closeSuggestions();

  // Also exit manual mode if active and hide ISIN section
  if (isManualMode) exitManualMode();
  const isinOrWrap = document.getElementById('isinOrWrap');
  if (isinOrWrap) isinOrWrap.style.display = 'none';

  searchInputWrapEl.style.display = 'none';

  const reNameGroupEl = document.getElementById('reNameGroup');
  const reCurrGroupEl = document.getElementById('reCurrGroup');
  const reRentGroupEl = document.getElementById('reRentGroup');
  if (reNameGroupEl) reNameGroupEl.style.display = '';
  if (reCurrGroupEl) reCurrGroupEl.style.display = '';
  if (reRentGroupEl) reRentGroupEl.style.display = '';

  // Reset currency toggle to EUR
  document.querySelectorAll('.re-curr-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.curr === 'EUR'));

  // Clear rent input
  const reRentInput = document.getElementById('reRent');
  if (reRentInput) reRentInput.value = '';

  if (qtyLabelEl) qtyLabelEl.textContent = t('reValueLabel');
  qtyGroup.style.display      = '';
  formPreviewEl.style.display = '';
  btnSubmitEl.style.display   = '';
  setLookupStatus('');

  const reNameInput = document.getElementById('reName');
  if (reNameInput) { reNameInput.value = ''; reNameInput.focus(); }
}

// ── Search event listeners (two-phase: instant local + debounced API) ──
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim();
  searchClearBtn.style.display = q ? '' : 'none';

  clearTimeout(searchDebounceTimer);
  if (searchAbortCtrl) { searchAbortCtrl.abort(); searchAbortCtrl = null; }

  if (!q) {
    closeSuggestions();
    return;
  }

  // Phase 1 — instant local results (skip for 'all' to avoid partial-results flash)
  const localResults = getLocalResults(q, activeSearchFilter);
  currentSuggestions = localResults;
  if (activeSearchFilter === 'all') {
    // Show loading only — wait for complete combined results in Phase 2
    renderSuggestions([], q, true);
  } else {
    renderSuggestions(localResults, q, activeSearchFilter !== 'metal');
  }

  // Phase 2 — API results after 300ms (skip for metals, they're local only)
  if (activeSearchFilter === 'metal') return;

  searchDebounceTimer = setTimeout(async () => {
    searchAbortCtrl = new AbortController();
    const { signal } = searchAbortCtrl;
    try {
      const results = await searchByFilter(q, activeSearchFilter, signal);
      if (signal.aborted || searchInput.value.trim() !== q) return;
      if (results && results.length) currentSuggestions = results;
      renderSuggestions(currentSuggestions, q, false);
    } catch (err) {
      if (err.name === 'AbortError') return;
      renderSuggestions(currentSuggestions, q, false);
    }
  }, 300);
});

searchInput.addEventListener('keydown', e => {
  if (!assetSuggestionsEl.classList.contains('open')) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setFocusedSugg(Math.min(focusedSuggIdx + 1, renderedSuggestions.length - 1));
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setFocusedSugg(Math.max(focusedSuggIdx - 1, 0));
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (focusedSuggIdx >= 0 && renderedSuggestions[focusedSuggIdx]) {
      closeSuggestions();
      selectAsset(renderedSuggestions[focusedSuggIdx]);
    }
  } else if (e.key === 'Escape') {
    closeSuggestions();
  }
});

searchClearBtn.addEventListener('click', () => {
  searchInput.value = '';
  searchClearBtn.style.display = 'none';
  clearTimeout(searchDebounceTimer);
  if (searchAbortCtrl) { searchAbortCtrl.abort(); searchAbortCtrl = null; }
  closeSuggestions();
  suppressFocusDefaults = true;
  searchInput.focus();
});

// Show popular defaults on manual focus when a specific filter is active and input is empty
searchInput.addEventListener('focus', () => {
  if (suppressFocusDefaults) { suppressFocusDefaults = false; return; }
  if (!searchInput.value.trim() && activeSearchFilter !== 'all') {
    showDefaultSuggestions();
  }
});


chipClearBtn.addEventListener('click', () => enterSearchMode());

// Close dropdown on outside click
document.addEventListener('click', e => {
  if (!e.target.closest('#searchWrap')) closeSuggestions();
}, true);

// ── Modal ──────────────────────────────────────────────────

// Opens the add-asset modal pre-filtered to the given category type.
// Reuses openModal() then programmatically clicks the matching filter button.
function openContextualModal(type) {
  openModal();
  const filterKey = { crypto: 'crypto', stock: 'stock', etf: 'etf', metal: 'metal', real_estate: 'real_estate' }[type];
  if (filterKey) {
    const btn = document.querySelector(`.filter-btn[data-filter="${filterKey}"]`);
    if (btn) btn.click();
  }
}

// ── ISIN / Manual mode helpers ──────────────────────────────
function detectTypeFromISIN(isin) {
  const cc = isin.slice(0, 2).toUpperCase();
  if (cc === 'IE' || cc === 'LU') return 'etf';           // fund domiciles
  if (['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT',
       'NL', 'CH', 'JP', 'AU', 'SE', 'DK', 'NO'].includes(cc)) return 'stock';
  return 'other';
}

function enterManualMode(isin, prefill = {}) {
  isManualMode         = true;
  manualAssetType      = prefill.type     || detectTypeFromISIN(isin);
  manualCurrency       = prefill.currency || 'USD';
  manualPendingSymbol  = prefill.symbol   || null;
  manualPendingCoinId  = prefill.coinId   || null;

  // Hide search UI
  searchInputWrapEl.style.display = 'none';
  if (searchFiltersEl) searchFiltersEl.style.display = 'none';
  clearSelectedAsset();
  closeSuggestions();
  setLookupStatus('');

  // Show manual fields
  const mf = document.getElementById('manualFields');
  if (mf) mf.style.display = '';

  // Auto-fill name if resolved
  const nameEl = document.getElementById('manualName');
  if (nameEl && prefill.name) nameEl.value = prefill.name;

  // Activate detected/resolved type
  document.querySelectorAll('#manualTypeToggle [data-mtype]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.mtype === manualAssetType));

  // Activate currency
  document.querySelectorAll('#manualCurrToggle [data-mcurr]').forEach(btn =>
    btn.classList.toggle('active', btn.dataset.mcurr === manualCurrency));

  // Show qty + preview + submit
  if (qtyLabelEl) qtyLabelEl.textContent = t('qty');
  qtyGroup.style.display      = '';
  formPreviewEl.style.display = '';
  btnSubmitEl.style.display   = '';

  // Auto-fill price if resolved (optional — user can override)
  if (prefill.price != null && prefill.price > 0) {
    const priceEl = document.getElementById('manualPrice');
    if (priceEl) {
      priceEl.value = prefill.price < 100
        ? prefill.price.toFixed(4)
        : prefill.price.toFixed(2);
      updatePreview();
    }
  }

  // Focus: if name was auto-filled, go straight to quantity
  setTimeout(() => {
    if (prefill.name) qtyInput.focus();
    else nameEl?.focus();
  }, 50);
}

function exitManualMode() {
  isManualMode        = false;
  manualPendingSymbol = null;
  manualPendingCoinId = null;
  const mf = document.getElementById('manualFields');
  if (mf) mf.style.display = 'none';
  searchInputWrapEl.style.display = '';
  if (searchFiltersEl) searchFiltersEl.style.display = '';
  qtyGroup.style.display      = 'none';
  formPreviewEl.style.display = 'none';
  btnSubmitEl.style.display   = 'none';
  const isinStatus = document.getElementById('isinStatus');
  if (isinStatus) isinStatus.textContent = '';
}

function resetISINInput() {
  // Cancel any in-flight lookup
  if (isinLookupAbortCtrl) { isinLookupAbortCtrl.abort(); isinLookupAbortCtrl = null; }
  const isinInput  = document.getElementById('isinInput');
  const isinStatus = document.getElementById('isinStatus');
  if (isinInput)  { isinInput.value = ''; }
  if (isinStatus) { isinStatus.textContent = ''; isinStatus.className = 'isin-status'; }
  if (isManualMode) exitManualMode();
}

function openModal() {
  assetForm.reset();
  previewTotal.textContent = formatBase(0);

  // Reset state
  selectedDbAsset      = null;
  pendingCoinId        = null;
  pendingMarketSymbol  = null;
  pendingPrice         = null;
  pendingKarat         = 18;
  pendingGoldUnit      = 'g';
  currentSuggestions   = [];
  renderedSuggestions  = [];
  activeSearchFilter   = 'all';
  focusedSuggIdx       = -1;
  if (karatGroupEl)    karatGroupEl.style.display    = 'none';
  if (goldUnitGroupEl) goldUnitGroupEl.style.display = 'none';
  if (qtyLabelEl)      qtyLabelEl.textContent        = t('qty');
  isRealEstateMode  = false;
  isManualMode      = false;
  rePendingCurrency = 'EUR';
  rePendingRent     = 0;
  reEditTargetId    = null;
  // Reset ISIN + manual fields
  resetISINInput();
  const isinOrWrap = document.getElementById('isinOrWrap');
  if (isinOrWrap) isinOrWrap.style.display = '';
  const manualFields = document.getElementById('manualFields');
  if (manualFields) manualFields.style.display = 'none';
  const reNameGroupEl = document.getElementById('reNameGroup');
  const reCurrGroupEl = document.getElementById('reCurrGroup');
  const reRentGroupEl = document.getElementById('reRentGroup');
  if (reNameGroupEl) reNameGroupEl.style.display = 'none';
  if (reCurrGroupEl) reCurrGroupEl.style.display = 'none';
  if (reRentGroupEl) reRentGroupEl.style.display = 'none';

  searchInput.value               = '';
  searchClearBtn.style.display    = 'none';
  selectedChipEl.style.display    = 'none';
  searchInputWrapEl.style.display = '';
  chipPriceEl.textContent         = '';
  qtyGroup.style.display          = 'none';
  formPreviewEl.style.display     = 'none';
  btnSubmitEl.style.display       = 'none';

  closeSuggestions();
  setLookupStatus('');

  if (searchFiltersEl) searchFiltersEl.style.display = '';
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'all'));

  searchInput.placeholder = T[lang].searchPH.all;
  // Reset modal title in case it was changed for edit mode
  const modalTitle = document.querySelector('#modalOverlay .modal-header h3');
  if (modalTitle) modalTitle.textContent = t('modalAddTitle');
  modalOverlay.classList.add('open');
  document.body.classList.add('modal-open');
  suppressFocusDefaults = true;
  setTimeout(() => searchInput.focus(), 50);
}

function closeModal() {
  modalOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  clearTimeout(searchDebounceTimer);
  if (searchAbortCtrl) { searchAbortCtrl.abort(); searchAbortCtrl = null; }
  closeSuggestions();
}

// ── Filter bar ─────────────────────────────────────────────
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const newFilter = btn.dataset.filter;
    filterBtns.forEach(b => b.classList.toggle('active', b === btn));
    focusedSuggIdx = -1;

    // Real estate: switch to manual form — no live search needed
    if (newFilter === 'real_estate') {
      activeSearchFilter = 'real_estate';
      enterRealEstateMode();
      return;
    }

    // Switching away from RE mode: restore search UI
    if (isRealEstateMode) enterSearchMode();

    activeSearchFilter = newFilter;

    // Update placeholder
    searchInput.placeholder = T[lang].searchPH[activeSearchFilter] || T[lang].searchPH.all;

    // Cancel any pending search
    clearTimeout(searchDebounceTimer);
    if (searchAbortCtrl) { searchAbortCtrl.abort(); searchAbortCtrl = null; }

    const q = searchInput.value.trim();
    if (!q) {
      closeSuggestions();
      return;
    }

    // Re-run search with new filter
    const localResults = getLocalResults(q, activeSearchFilter);
    currentSuggestions = localResults;
    renderSuggestions(localResults, q, activeSearchFilter !== 'metal');

    if (activeSearchFilter === 'metal') return;

    searchDebounceTimer = setTimeout(async () => {
      searchAbortCtrl = new AbortController();
      const { signal } = searchAbortCtrl;
      try {
        const results = await searchByFilter(q, activeSearchFilter, signal);
        if (signal.aborted || searchInput.value.trim() !== q) return;
        if (results && results.length) currentSuggestions = results;
        renderSuggestions(currentSuggestions, q, false);
      } catch (err) {
        if (err.name === 'AbortError') return;
        renderSuggestions(currentSuggestions, q, false);
      }
    }, 300);
  });
});

// ── ISIN input: real-time validation + async API lookup ─────
const isinInputEl = document.getElementById('isinInput');
if (isinInputEl) {
  isinInputEl.addEventListener('input', () => {
    // Force uppercase + strip non-alphanumeric
    const raw = isinInputEl.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (isinInputEl.value !== raw) isinInputEl.value = raw;

    // Cancel any in-flight lookup whenever the user types
    if (isinLookupAbortCtrl) { isinLookupAbortCtrl.abort(); isinLookupAbortCtrl = null; }

    const statusEl = document.getElementById('isinStatus');
    const n = raw.length;

    if (n === 0) {
      if (isManualMode) exitManualMode();
      if (statusEl) { statusEl.textContent = ''; statusEl.className = 'isin-status'; }
      return;
    }

    if (n < 12) {
      if (isManualMode) exitManualMode();
      if (statusEl) {
        statusEl.textContent = t('isinHint')(n);
        statusEl.className   = 'isin-status isin-status--hint';
      }
      return;
    }

    // 12 chars — validate format: 2 letters + 9 alphanumeric + 1 digit
    const valid = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(raw);
    if (!valid) {
      if (isManualMode) exitManualMode();
      if (statusEl) {
        statusEl.textContent = t('isinError');
        statusEl.className   = 'isin-status isin-status--error';
      }
      isinInputEl.classList.add('aes-shake');
      setTimeout(() => isinInputEl.classList.remove('aes-shake'), 450);
      return;
    }

    // Valid ISIN → show loading, then look up asynchronously
    if (statusEl) {
      statusEl.textContent = t('isinLooking');
      statusEl.className   = 'isin-status isin-status--loading';
    }
    if (isManualMode) exitManualMode(); // reset if user edited to a new ISIN

    isinLookupAbortCtrl = new AbortController();
    const { signal }    = isinLookupAbortCtrl;
    const isinSnap      = raw;

    (async () => {
      try {
        // Step 1: ISIN → ticker/name/type via OpenFIGI
        const figiResult = await getAssetFromISIN(isinSnap, signal);
        if (signal.aborted) return;

        const prefill = {};
        if (figiResult) {
          prefill.type   = figiResult.type;
          prefill.name   = figiResult.name;
          prefill.symbol = figiResult.symbol;

          // Step 2: fetch current price using the resolved symbol
          if (figiResult.type === 'crypto') {
            const cp = await fetchCryptoPrice(figiResult.symbol);
            if (!signal.aborted && cp) { prefill.price = cp.price; prefill.coinId = cp.coinId; }
          } else if (figiResult.symbol) {
            const price = await fetchStockPrice(figiResult.symbol);
            if (!signal.aborted && price) prefill.price = price;
          }
        }
        if (signal.aborted) return;

        // Step 3: update status + enter manual mode with prefilled data
        if (statusEl) {
          if (figiResult?.name) {
            statusEl.textContent = t('isinFound')(figiResult.name);
            statusEl.className   = 'isin-status isin-status--ok';
          } else {
            statusEl.textContent = t('isinNotFound');
            statusEl.className   = 'isin-status isin-status--warn';
          }
        }
        enterManualMode(isinSnap, prefill);

      } catch (err) {
        if (err.name === 'AbortError' || signal.aborted) return;
        if (statusEl) {
          statusEl.textContent = t('isinLookupError');
          statusEl.className   = 'isin-status isin-status--warn';
        }
        // Fallback: enter manual mode with heuristic type detection only
        enterManualMode(isinSnap);
      }
    })();
  });
}

// ── Manual type toggle ─────────────────────────────────────
document.getElementById('manualTypeToggle')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-mtype]');
  if (!btn) return;
  manualAssetType = btn.dataset.mtype;
  document.querySelectorAll('#manualTypeToggle [data-mtype]').forEach(b =>
    b.classList.toggle('active', b === btn));
});

// ── Manual currency toggle ─────────────────────────────────
document.getElementById('manualCurrToggle')?.addEventListener('click', e => {
  const btn = e.target.closest('[data-mcurr]');
  if (!btn) return;
  manualCurrency = btn.dataset.mcurr;
  document.querySelectorAll('#manualCurrToggle [data-mcurr]').forEach(b =>
    b.classList.toggle('active', b === btn));
  updatePreview();
});

// ── Live Preview ───────────────────────────────────────────
function updatePreview() {
  const qty = parseLocalFloat(qtyInput.value) || 0;
  // Real estate: qty IS the value, already in rePendingCurrency
  if (isRealEstateMode) {
    previewTotal.textContent = formatBase(toBase(qty, rePendingCurrency));
    return;
  }
  // Manual ISIN mode: qty × manual price (if any), in selected manualCurrency
  if (isManualMode) {
    const price = parseLocalFloat(document.getElementById('manualPrice')?.value) || 0;
    previewTotal.textContent = formatBase(toBase(qty * price, manualCurrency));
    return;
  }
  const price = pendingPrice || 0;
  let value;
  if (selectedDbAsset?.ticker === 'XAU' && pendingKarat) {
    const grams = pendingGoldUnit === 'oz' ? qty * 31.1035 : qty;
    value = grams * (pendingKarat / 24) * (price / 31.1035);
  } else {
    value = qty * price;
  }
  previewTotal.textContent = formatBase(toBase(value, 'USD'));
}
qtyInput.addEventListener('input', updatePreview);
document.getElementById('manualPrice')?.addEventListener('input', updatePreview);

// ── Add Asset ──────────────────────────────────────────────
assetForm.addEventListener('submit', e => {
  e.preventDefault();

  // ── Real estate branch: manual value entry, no live price ──
  if (isRealEstateMode) {
    const reNameInput = document.getElementById('reName');
    const name = (reNameInput?.value || '').trim();
    if (!name) { reNameInput?.focus(); return; }

    const value = parseLocalFloat(qtyInput.value);
    if (isNaN(value) || value <= 0) { qtyInput.focus(); return; }

    const rent = parseLocalFloat(document.getElementById('reRent')?.value) || 0;
    const ticker = name.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'INMU';

    let reFlashId = reEditTargetId;
    if (reEditTargetId) {
      // Edit existing real estate asset
      const existing = assets.find(a => a.id === reEditTargetId);
      if (existing) {
        existing.name          = name;
        existing.ticker        = ticker;
        existing.qty           = value;
        existing.rent          = rent;
        existing.assetCurrency = rePendingCurrency;
        existing.costBasis     = value;
      }
    } else {
      reFlashId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      assets.push({
        id:            reFlashId,
        name,
        ticker,
        type:          'real_estate',
        qty:           value,
        price:         1,                  // qty × price = value; price never changes
        coinId:        null,
        marketSymbol:  null,
        assetCurrency: rePendingCurrency,
        change24h:     null,
        prevPrice:     null,
        rent,
        costBasis:     value,
      });
    }
    save();
    render(true);
    closeModal();
    _flashAssetCard(reFlashId);
    _flashCategoryCard('real_estate');
    onPortfolioChange(true);
    return;
  }

  // ── Manual ISIN branch ────────────────────────────────────
  if (isManualMode) {
    const isinVal = (document.getElementById('isinInput')?.value || '').toUpperCase().trim();
    const nameVal = (document.getElementById('manualName')?.value || '').trim();
    if (!nameVal) { document.getElementById('manualName')?.focus(); return; }

    const qty = parseLocalFloat(qtyInput.value);
    if (isNaN(qty) || qty <= 0) { qtyInput.focus(); return; }

    const price  = parseLocalFloat(document.getElementById('manualPrice')?.value) || 0;
    const ticker = nameVal.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'MANU';

    // Merge into existing position if same ISIN (or same ticker+type fallback)
    const existing = isinVal
      ? assets.find(a => a.isin === isinVal)
      : assets.find(a => a.ticker.toUpperCase() === ticker && a.type === manualAssetType);

    let manualFlashId = existing?.id;
    if (existing) {
      const manualAddedCost = qty * (price > 0 ? price : existing.price || 0);
      existing.costBasis = (existing.costBasis || existing.qty * (existing.price || 0)) + manualAddedCost;
      existing.qty = +(existing.qty + qty).toFixed(8);
      if (price > 0) existing.price = price;
      // Backfill symbols if a lookup ran after the original save
      if (manualPendingSymbol  && !existing.marketSymbol) existing.marketSymbol = manualPendingSymbol;
      if (manualPendingCoinId  && !existing.coinId)       existing.coinId       = manualPendingCoinId;
    } else {
      manualFlashId = Date.now().toString(36) + Math.random().toString(36).slice(2);
      assets.push({
        id:            manualFlashId,
        name:          nameVal,
        ticker,
        type:          manualAssetType,
        qty,
        price:         price > 0 ? price : 1,
        isin:          isinVal || null,
        coinId:        manualPendingCoinId || null,
        marketSymbol:  manualPendingSymbol || null,
        assetCurrency: manualCurrency,
        change24h:     null,
        prevPrice:     null,
        costBasis:     qty * (price > 0 ? price : 1),
      });
    }
    save();
    render(true);
    closeModal();
    _flashAssetCard(manualFlashId);
    _flashCategoryCard(manualAssetType);
    onPortfolioChange(true);
    return;
  }

  if (!selectedDbAsset) return;
  if (!pendingPrice) {
    setLookupStatus('error', 'Precio no disponible. Selecciona el activo de nuevo para reintentar.');
    return;
  }

  const qty = parseLocalFloat(qtyInput.value);
  if (isNaN(qty) || qty <= 0) { qtyInput.focus(); return; }

  const { ticker, type, coinId = null, marketSymbol = null } = selectedDbAsset;
  const isGoldAsset = ticker === 'XAU';
  const karat       = isGoldAsset ? pendingKarat    : undefined;
  const goldUnit    = isGoldAsset ? pendingGoldUnit : undefined;
  const name        = isGoldAsset ? `Gold ${karat}K` : selectedDbAsset.name;

  // Merge into existing position
  // Gold: always isolated by karat + unit — never merged across combinations
  const existing = assets.find(a => {
    if (coinId && a.coinId) return a.coinId === coinId;
    if (isGoldAsset)        return a.ticker === 'XAU' && a.karat === karat && a.goldUnit === goldUnit;
    if (marketSymbol && a.marketSymbol) return a.marketSymbol === marketSymbol;
    return a.ticker.toUpperCase() === ticker.toUpperCase() && a.type === type;
  });

  // Cost basis for this purchase (in asset's native USD)
  const newPurchaseCost = isGoldAsset
    ? (() => { const g = pendingGoldUnit === 'oz' ? qty * 31.1035 : qty; return g * (pendingKarat / 24) * (pendingPrice / 31.1035); })()
    : qty * pendingPrice;

  let normalFlashId = existing?.id;
  if (existing) {
    existing.costBasis = (existing.costBasis || assetNativeValue(existing)) + newPurchaseCost;
    existing.qty    = +(existing.qty + qty).toFixed(8);
    existing.price  = pendingPrice;
  } else {
    let initialChange24h = null;
    if (marketSymbol && type !== 'crypto') {
      const fb = getFallbackData(marketSymbol);
      if (fb) initialChange24h = fb.change24h;
    }
    normalFlashId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    assets.push({
      id:            normalFlashId,
      name, ticker, type, qty,
      price:         pendingPrice,
      coinId, marketSymbol,
      assetCurrency: 'USD',
      change24h:     initialChange24h,
      prevPrice:     null,
      costBasis:     newPurchaseCost,
      ...(isGoldAsset ? { karat, goldUnit } : {}),
    });
  }

  save();
  render(true);
  closeModal();
  _flashAssetCard(normalFlashId);
  _flashCategoryCard(type);
  onPortfolioChange(true);
});

// ── Reduce Modal ───────────────────────────────────────────
function openReduceModal(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;
  reduceTargetId = id;

  const assetCurr  = (asset.assetCurrency || 'USD').toUpperCase();
  const isCash     = asset.type === 'cash';
  const isGold     = asset.ticker === 'XAU' && asset.karat;
  const totalBase  = toBase(assetNativeValue(asset), assetCurr);
  const badgeText  = isGold ? `${asset.karat}K` : escHtml(asset.ticker.toUpperCase().slice(0, 4));
  const qtyLabel   = isCash
    ? formatCurrency(asset.qty, assetCurr)
    : isGold
      ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}`
      : `${formatQty(asset.qty)} ${t('unidades')}`;

  reduceAssetInfo.innerHTML = `
    <div class="asset-badge ${asset.type}">${badgeText}</div>
    <div>
      <div class="reduce-info-name">${escHtml(getDisplayName(asset))}</div>
      <div class="reduce-info-qty">${qtyLabel} · ${formatBase(totalBase)}</div>
    </div>
  `;

  reduceMaxEl.textContent = isGold
    ? t('maxLabel')(formatQty(asset.qty), asset.goldUnit || 'g')
    : t('maxLabel')(formatQty(asset.qty), null);
  reduceQtyInput.value = '';
  previewQtyLeft.textContent   = isGold
    ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}`
    : formatQty(asset.qty);
  previewValueLeft.textContent = formatBase(totalBase);
  reduceWarning.classList.remove('visible');
  reduceError.textContent = '';

  reduceOverlay.classList.add('open');
  document.body.classList.add('modal-open');
  reduceQtyInput.focus();
}

function closeReduceModal() {
  reduceOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  reduceTargetId = null;
}

function updateReducePreview() {
  const asset  = assets.find(a => a.id === reduceTargetId);
  if (!asset) return;

  const amount  = parseLocalFloat(reduceQtyInput.value) || 0;
  const cur     = (asset.assetCurrency || 'USD').toUpperCase();
  const isGold  = asset.ticker === 'XAU' && asset.karat;
  reduceError.textContent = '';

  if (amount > asset.qty) {
    const maxLabel = isGold ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}` : formatQty(asset.qty);
    reduceError.textContent = t('cantExceed')(maxLabel);
    previewQtyLeft.textContent   = '—';
    previewValueLeft.textContent = '—';
    reduceWarning.classList.remove('visible');
    return;
  }

  const remaining      = asset.qty - amount;
  const remainingAsset = { ...asset, qty: remaining };
  previewQtyLeft.textContent   = asset.type === 'cash'
    ? formatCurrency(remaining, cur)
    : isGold
      ? `${formatQty(remaining)} ${asset.goldUnit || 'g'}`
      : formatQty(remaining);
  previewValueLeft.textContent = formatBase(toBase(assetNativeValue(remainingAsset), cur));
  reduceWarning.classList.toggle('visible', remaining === 0 && amount > 0);
}

reduceQtyInput.addEventListener('input', updateReducePreview);

reduceForm.addEventListener('submit', e => {
  e.preventDefault();
  const asset  = assets.find(a => a.id === reduceTargetId);
  if (!asset) return;

  const amount = parseLocalFloat(reduceQtyInput.value);
  if (isNaN(amount) || amount <= 0) {
    reduceError.textContent = 'Introduce una cantidad válida mayor que 0.';
    return;
  }
  if (amount > asset.qty) {
    reduceError.textContent = t('cantExceed')(formatQty(asset.qty));
    return;
  }

  const remaining  = asset.qty - amount;
  const wasRemoved = remaining === 0;
  const reduceType = asset.type;
  if (wasRemoved) {
    assets = assets.filter(a => a.id !== reduceTargetId);
  } else {
    if (asset.costBasis && asset.qty > 0) asset.costBasis *= remaining / asset.qty;
    asset.qty = remaining;
  }

  save();
  render(true);
  closeReduceModal();
  if (!wasRemoved) _flashAssetCard(reduceTargetId);
  _flashCategoryCard(reduceType);
  onPortfolioChange(true);
});

reduceClose.addEventListener('click', closeReduceModal);
reduceOverlay.addEventListener('click', e => {
  if (e.target === reduceOverlay) closeReduceModal();
});

// ── Add position modal ─────────────────────────────────────
const addOverlay          = document.getElementById('addOverlay');
const addClose            = document.getElementById('addClose');
const addForm             = document.getElementById('addForm');
const addAssetInfo        = document.getElementById('addAssetInfo');
const addQtyInput         = document.getElementById('addQty');
const addQtyLabelEl       = document.getElementById('addQtyLabel');
const previewAddQtyTotal  = document.getElementById('previewAddQtyTotal');
const previewAddValueTotal= document.getElementById('previewAddValueTotal');
const addError            = document.getElementById('addError');

let addTargetId = null;

function openAddModal(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;
  addTargetId = id;

  const assetCurr  = (asset.assetCurrency || 'USD').toUpperCase();
  const isCash     = asset.type === 'cash';
  const isGold     = asset.ticker === 'XAU' && asset.karat;
  const totalBase  = toBase(assetNativeValue(asset), assetCurr);
  const badgeText  = isGold ? `${asset.karat}K` : escHtml(asset.ticker.toUpperCase().slice(0, 4));
  const qtyLabel   = isCash
    ? formatCurrency(asset.qty, assetCurr)
    : isGold
      ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}`
      : `${formatQty(asset.qty)} ${t('unidades')}`;

  addAssetInfo.innerHTML = `
    <div class="asset-badge ${asset.type}">${badgeText}</div>
    <div>
      <div class="reduce-info-name">${escHtml(getDisplayName(asset))}</div>
      <div class="reduce-info-qty">${qtyLabel} · ${formatBase(totalBase)}</div>
    </div>
  `;

  addQtyLabelEl.textContent = isCash ? t('addQtyLabelCash') : t('addQtyLabel')(isGold ? asset.goldUnit || 'g' : null);
  addQtyInput.value         = '';
  addError.textContent      = '';
  previewAddQtyTotal.textContent   = isCash
    ? formatCurrency(asset.qty, assetCurr)
    : isGold ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}` : formatQty(asset.qty);
  previewAddValueTotal.textContent = formatBase(totalBase);

  addOverlay.classList.add('open');
  document.body.classList.add('modal-open');
  addQtyInput.focus();
}

function closeAddModal() {
  addOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  addTargetId = null;
}

function updateAddPreview() {
  const asset = assets.find(a => a.id === addTargetId);
  if (!asset) return;

  const amount    = parseLocalFloat(addQtyInput.value) || 0;
  const assetCurr = (asset.assetCurrency || 'USD').toUpperCase();
  const isCash    = asset.type === 'cash';
  const isGold    = asset.ticker === 'XAU' && asset.karat;
  addError.textContent = '';

  if (amount < 0) {
    addError.textContent = 'La cantidad debe ser positiva.';
    previewAddQtyTotal.textContent    = '—';
    previewAddValueTotal.textContent  = '—';
    return;
  }

  const newQty   = asset.qty + amount;
  const newAsset = { ...asset, qty: newQty };
  previewAddQtyTotal.textContent   = isCash
    ? formatCurrency(newQty, assetCurr)
    : isGold ? `${formatQty(newQty)} ${asset.goldUnit || 'g'}` : formatQty(newQty);
  previewAddValueTotal.textContent = formatBase(toBase(assetNativeValue(newAsset), assetCurr));
}

addQtyInput.addEventListener('input', updateAddPreview);

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const asset = assets.find(a => a.id === addTargetId);
  if (!asset) return;

  const amount = parseLocalFloat(addQtyInput.value);
  if (isNaN(amount) || amount <= 0) {
    addError.textContent = 'Introduce una cantidad válida mayor que 0.';
    return;
  }

  const addedCostNative = assetNativeValue({ ...asset, qty: amount });
  asset.costBasis = (asset.costBasis || assetNativeValue(asset)) + addedCostNative;
  asset.qty = +(asset.qty + amount).toFixed(8);
  const addFlashId   = asset.id;
  const addFlashType = asset.type;
  save();
  render(true);
  closeAddModal();
  _flashAssetCard(addFlashId);
  _flashCategoryCard(addFlashType);
  onPortfolioChange(true);
});

addClose.addEventListener('click', closeAddModal);
addOverlay.addEventListener('click', e => {
  if (e.target === addOverlay) closeAddModal();
});

// ── Edit Real Estate Modal ──────────────────────────────────
function openEditRealEstateModal(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset || asset.type !== 'real_estate') return;

  // Open modal (resets state), then enter RE mode, then prefill
  openModal();
  // Activate the RE filter button visually
  filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === 'real_estate'));
  enterRealEstateMode();

  // Set edit target
  reEditTargetId    = id;
  rePendingCurrency = (asset.assetCurrency || 'EUR').toUpperCase();

  // Prefill name
  const reNameInput = document.getElementById('reName');
  if (reNameInput) reNameInput.value = asset.name || '';

  // Prefill value
  const locale = lang === 'es' ? 'es-ES' : 'en-US';
  qtyInput.value = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(asset.qty);

  // Prefill rent
  const reRentInput = document.getElementById('reRent');
  if (reRentInput) reRentInput.value = asset.rent > 0
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(asset.rent)
    : '';

  // Set currency toggle
  document.querySelectorAll('.re-curr-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.curr === rePendingCurrency));

  // Update modal title
  const modalTitle = document.querySelector('#modalOverlay .modal-header h3');
  if (modalTitle) modalTitle.textContent = t('modalEditRETitle');

  // Trigger qty preview update
  qtyInput.dispatchEvent(new Event('input'));
}

// ── Inline edit strip ──────────────────────────────────────
function openInlineEdit(id, mode) {
  if (_inlineEditId && _inlineEditId !== id) closeInlineEdit();

  const asset = assets.find(a => a.id === id);
  if (!asset) return;

  _inlineEditId   = id;
  _inlineEditMode = mode;

  const strip = document.getElementById(`aes-${id}`);
  if (!strip) return;

  const isCash = asset.type === 'cash';
  const isGold = asset.ticker === 'XAU' && asset.karat;
  const assetCurr = (asset.assetCurrency || 'USD').toUpperCase();

  const currentQtyStr = isCash
    ? formatCurrency(asset.qty, assetCurr)
    : isGold
      ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}`
      : `${formatQty(asset.qty)} ${t('units')}`;

  const labelEl   = strip.querySelector('.aes-label');
  const inputEl   = strip.querySelector('.aes-qty-input');
  const previewEl = strip.querySelector('.aes-preview');
  const errorEl   = strip.querySelector('.aes-error');

  if (labelEl)   labelEl.textContent   = `${mode === 'add' ? t('btnAdd') : t('btnReduce')}: ${currentQtyStr}`;
  if (inputEl)   { inputEl.value = ''; }
  if (previewEl) previewEl.textContent = '';
  if (errorEl)   errorEl.textContent   = '';

  strip.closest('.asset-card, .detail-asset-row')?.classList.add('card--editing');
  strip.classList.add('aes-open');

  setTimeout(() => inputEl?.focus(), 180);
}

function closeInlineEdit() {
  if (!_inlineEditId) return;
  const strip = document.getElementById(`aes-${_inlineEditId}`);
  if (strip) {
    strip.classList.remove('aes-open');
    strip.closest('.asset-card, .detail-asset-row')?.classList.remove('card--editing');
  }
  _inlineEditId   = null;
  _inlineEditMode = null;
}

function updateInlinePreview(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;
  const strip = document.getElementById(`aes-${id}`);
  if (!strip) return;

  const inputEl   = strip.querySelector('.aes-qty-input');
  const previewEl = strip.querySelector('.aes-preview');
  const errorEl   = strip.querySelector('.aes-error');
  if (!inputEl || !previewEl) return;

  const isCash    = asset.type === 'cash';
  const isGold    = asset.ticker === 'XAU' && asset.karat;
  const assetCurr = (asset.assetCurrency || 'USD').toUpperCase();
  const amount    = parseLocalFloat(inputEl.value) || 0;
  errorEl.textContent = '';

  if (amount <= 0) { previewEl.textContent = ''; return; }

  let newQty;
  if (_inlineEditMode === 'add') {
    newQty = asset.qty + amount;
  } else {
    const maxStr = isGold ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}` : formatQty(asset.qty);
    if (amount > asset.qty) {
      errorEl.textContent = t('cantExceed')(maxStr);
      previewEl.textContent = '';
      return;
    }
    newQty = asset.qty - amount;
  }

  const newValueBase = toBase(assetNativeValue({ ...asset, qty: newQty }), assetCurr);
  const newQtyStr    = isCash
    ? formatCurrency(newQty, assetCurr)
    : isGold
      ? `${formatQty(newQty)} ${asset.goldUnit || 'g'}`
      : `${formatQty(newQty)} ${t('units')}`;

  previewEl.textContent = `→ ${newQtyStr} · ${formatBase(newValueBase)}`;
  previewEl.classList.toggle('aes-preview--remove', _inlineEditMode === 'reduce' && newQty === 0);
}

function applyInlineEdit(id) {
  const asset = assets.find(a => a.id === id);
  if (!asset) return;
  const strip = document.getElementById(`aes-${id}`);
  if (!strip) return;

  const inputEl = strip.querySelector('.aes-qty-input');
  const errorEl = strip.querySelector('.aes-error');
  const amount  = parseLocalFloat(inputEl.value);

  if (isNaN(amount) || amount <= 0) {
    errorEl.textContent = lang === 'es'
      ? 'Introduce una cantidad mayor que 0.'
      : 'Enter a quantity greater than 0.';
    inputEl.classList.add('aes-shake');
    setTimeout(() => inputEl.classList.remove('aes-shake'), 500);
    return;
  }

  let inlineWasRemoved = false;
  if (_inlineEditMode === 'reduce') {
    const isGold = asset.ticker === 'XAU' && asset.karat;
    if (amount > asset.qty) {
      errorEl.textContent = t('cantExceed')(isGold ? `${formatQty(asset.qty)} ${asset.goldUnit || 'g'}` : formatQty(asset.qty));
      inputEl.classList.add('aes-shake');
      setTimeout(() => inputEl.classList.remove('aes-shake'), 500);
      return;
    }
    const remaining = asset.qty - amount;
    if (remaining === 0) {
      inlineWasRemoved = true;
      assets = assets.filter(a => a.id !== id);
    } else {
      if (asset.costBasis && asset.qty > 0) asset.costBasis *= remaining / asset.qty;
      asset.qty = remaining;
    }
  } else {
    const inlineAddedCost = assetNativeValue({ ...asset, qty: amount });
    asset.costBasis = (asset.costBasis || assetNativeValue(asset)) + inlineAddedCost;
    asset.qty += amount;
  }

  const inlineType = asset.type;
  closeInlineEdit();
  save();
  render(true);
  if (!inlineWasRemoved) _flashAssetCard(id);
  _flashCategoryCard(inlineType);
  onPortfolioChange(true);
}

// ── Delete / Reduce / Add click dispatcher ─────────────────
assetsListEl.addEventListener('click', e => {
  const editREBtn = e.target.closest('.btn-edit-re');
  if (editREBtn) { openEditRealEstateModal(editREBtn.dataset.id); return; }

  const addBtn = e.target.closest('.btn-add-pos');
  if (addBtn) {
    const id = addBtn.dataset.id;
    if (_inlineEditId === id && _inlineEditMode === 'add') { closeInlineEdit(); return; }
    openInlineEdit(id, 'add');
    return;
  }

  const reduceBtn = e.target.closest('.btn-reduce');
  if (reduceBtn) {
    const id = reduceBtn.dataset.id;
    if (_inlineEditId === id && _inlineEditMode === 'reduce') { closeInlineEdit(); return; }
    openInlineEdit(id, 'reduce');
    return;
  }

  const confirmBtn = e.target.closest('.aes-confirm-btn');
  if (confirmBtn) { applyInlineEdit(confirmBtn.dataset.id); return; }

  const cancelBtn = e.target.closest('.aes-cancel-btn');
  if (cancelBtn) { closeInlineEdit(); return; }

  const deleteBtn = e.target.closest('.btn-delete');
  if (deleteBtn) {
    const delId   = deleteBtn.dataset.id;
    const delType = assets.find(a => a.id === delId)?.type;
    if (_inlineEditId === delId) closeInlineEdit();

    const delCard = assetsListEl.querySelector(`[data-asset-id="${delId}"]`);
    if (delCard && !reducedMotion) {
      delCard.classList.add('card--exiting');
      setTimeout(() => {
        assets = assets.filter(a => a.id !== delId);
        save();
        render(true);
        _flashCategoryCard(delType);
        onPortfolioChange(true);
      }, 200);
    } else {
      assets = assets.filter(a => a.id !== delId);
      save();
      render(true);
      _flashCategoryCard(delType);
      onPortfolioChange(true);
    }
  }
});

// Live preview as the user types in the inline input
assetsListEl.addEventListener('input', e => {
  const inputEl = e.target.closest('.aes-qty-input');
  if (inputEl) updateInlinePreview(inputEl.dataset.id);
});

// Confirm on Enter, dismiss on Escape in inline input
assetsListEl.addEventListener('keydown', e => {
  if (!e.target.closest('.asset-edit-strip')) return;
  if (e.key === 'Enter') {
    const inputEl = e.target.closest('.aes-qty-input');
    if (inputEl) { e.preventDefault(); applyInlineEdit(inputEl.dataset.id); }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    closeInlineEdit();
  }
});

// ── Base currency toggle (menu) ─────────────────────────────
function _applyCurrencyChange(currency) {
  baseCurrency = currency;
  localStorage.setItem(BASE_KEY, baseCurrency);
  document.querySelectorAll('.menu-curr-btn')
    .forEach(b => b.classList.toggle('active', b.dataset.currency === baseCurrency));
  const perfCurrBtn = document.getElementById('perfCurrBtn');
  if (perfCurrBtn) perfCurrBtn.textContent = baseCurrency === 'EUR' ? '€' : '$';
  render(true);
  updateChart(true);
  updateDonut();
}

document.querySelectorAll('.menu-curr-btn').forEach(btn => {
  btn.addEventListener('click', () => _applyCurrencyChange(btn.dataset.currency));
});


// ── Liquidity Modal ────────────────────────────────────────
const liquidityOverlay  = document.getElementById('liquidityOverlay');
const liquidityClose    = document.getElementById('liquidityClose');
const liquidityForm     = document.getElementById('liquidityForm');
const liquidityQtyInput = document.getElementById('liquidityQty');
const liquidityCurrIn   = document.getElementById('liquidityCurrency');
const liqBtns           = document.querySelectorAll('.liq-btn');

// Attach live formatters
attachFormatter(qtyInput,       true);   // asset qty — allow decimals (e.g. 0.0015 BTC)
attachFormatter(reduceQtyInput, true);   // reduce qty
attachFormatter(addQtyInput,    true);   // add to position qty

// Liquidity: direct integer formatter (no decimals, no cursor complexity)
liquidityQtyInput.addEventListener('input', e => {
  const digits = e.target.value.replace(/\D/g, '');
  if (!digits) { e.target.value = ''; return; }
  e.target.value = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(parseInt(digits, 10));
});

function openLiquidityModal() {
  liquidityForm.reset();
  liquidityCurrIn.value = 'EUR';
  liqBtns.forEach(b => b.classList.toggle('active', b.dataset.curr === 'EUR'));
  liquidityOverlay.classList.add('open');
  document.body.classList.add('modal-open');
  setTimeout(() => liquidityQtyInput.focus(), 50);
}

function closeLiquidityModal() {
  liquidityOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
}

liqBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    liquidityCurrIn.value = btn.dataset.curr;
    liqBtns.forEach(b => b.classList.toggle('active', b === btn));
  });
});

// ── Real estate currency toggle ─────────────────────────────
document.querySelectorAll('.re-curr-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    rePendingCurrency = btn.dataset.curr;
    document.querySelectorAll('.re-curr-btn')
      .forEach(b => b.classList.toggle('active', b === btn));
    updatePreview();
  });
});

liquidityForm.addEventListener('submit', e => {
  e.preventDefault();
  const curr = liquidityCurrIn.value || 'EUR';
  const qty  = parseLocalFloat(liquidityQtyInput.value);
  if (isNaN(qty) || qty <= 0) { liquidityQtyInput.focus(); return; }

  const priceInUSD = curr === 'EUR' ? 1 / usdToEur : 1;

  const existingCash = assets.find(a => a.type === 'cash' && a.assetCurrency === curr);
  if (existingCash) {
    existingCash.qty   = +(existingCash.qty + qty).toFixed(2);
    existingCash.price = priceInUSD;
  } else {
    assets.push({
      id:            Date.now().toString(36) + Math.random().toString(36).slice(2),
      name:          curr === 'EUR' ? 'Euros' : 'Dólares',
      ticker:        curr === 'EUR' ? '€' : '$',
      type:          'cash',
      qty,
      price:         priceInUSD,
      coinId:        null,
      marketSymbol:  null,
      assetCurrency: curr,
      change24h:     null,
      prevPrice:     null,
    });
  }

  save();
  render(true);
  closeLiquidityModal();
  onPortfolioChange(true);
});

liquidityClose.addEventListener('click', closeLiquidityModal);
liquidityOverlay.addEventListener('click', e => {
  if (e.target === liquidityOverlay) closeLiquidityModal();
});
document.getElementById('btnAddLiquidity').addEventListener('click', openLiquidityModal);

// ── Gold: karat & unit selectors ───────────────────────────
if (karatGroupEl) {
  karatGroupEl.querySelectorAll('[data-karat]').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingKarat = parseInt(btn.dataset.karat, 10);
      karatGroupEl.querySelectorAll('[data-karat]').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
      updatePreview();
    });
  });
}

if (goldUnitGroupEl) {
  goldUnitGroupEl.querySelectorAll('[data-unit]').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingGoldUnit = btn.dataset.unit;
      goldUnitGroupEl.querySelectorAll('[data-unit]').forEach(b =>
        b.classList.toggle('active', b === btn)
      );
      if (qtyLabelEl) qtyLabelEl.textContent = t('qtyGold')(pendingGoldUnit);
      updatePreview();
    });
  });
}

// ── Event Listeners ────────────────────────────────────────
document.getElementById('logoHome')
  ?.addEventListener('click', () => setActiveCategory(null));
document.getElementById('assetsBackBtn')
  ?.addEventListener('click', () => setActiveCategory(null));
btnAdd.addEventListener('click', openModal);
document.getElementById('btnAddContext')?.addEventListener('click', () => {
  if (!activeCategory) return;
  if (activeCategory === 'cash') {
    openLiquidityModal();
  } else {
    openContextualModal(activeCategory);
  }
});
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', e => {
  if (e.target === modalOverlay) closeModal();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeReduceModal();
    closeAddModal();
    closeLiquidityModal();
  }
});

// ── Init ───────────────────────────────────────────────────
// Apply saved base currency to menu toggle
document.querySelectorAll('.menu-curr-btn')
  .forEach(b => b.classList.toggle('active', b.dataset.currency === baseCurrency));

// Set initial perf-toggle currency button label to match base currency
const _perfCurrBtn = document.getElementById('perfCurrBtn');
if (_perfCurrBtn) _perfCurrBtn.textContent = baseCurrency === 'EUR' ? '€' : '$';

render(true);

// Bootstrap simulated history if this is the first session
(function bootstrapHistory() {
  const val = totalValueUSD();
  if (portfolioHistory.length === 0 && val > 0) {
    portfolioHistory = generateSimulatedHistory(val);
    saveHistory();
  }
  recordSnapshot(true);
})();

initChart();
updateChart();
initDonut();
updateDonut();

fetchExchangeRate().then(() => {
  render();
  updateChart();
  updateDonut();
});

refreshPrices();
setInterval(refreshPrices, 60_000);         // 60 s — real-time price updates
setInterval(fetchExchangeRate, 3_600_000);  // 1 h — EUR/USD rate
setInterval(updateGoldTimestamps, 30_000);  // 30 s — lightweight text-only update

// ── Sticky header scroll elevation ────────────────────────
(function initScrollHeader() {
  const headerEl = document.querySelector('.header');
  if (!headerEl) return;
  window.addEventListener('scroll', () => {
    headerEl.classList.toggle('header--scrolled', window.scrollY > 8);
  }, { passive: true });
})();

// ── Language switcher ──────────────────────────────────────
(function initLangSwitcher() {
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
    btn.addEventListener('click', () => switchLang(btn.dataset.lang));
  });
  // Apply TYPE_META labels for current lang (HTML is already in ES, only override for EN)
  applyTypeMetaLabels();
  if (lang !== 'es') applyI18n();
})();

// ── Hamburger menu ─────────────────────────────────────────
(function initMenu() {
  const toggle = document.getElementById('menuToggle');
  const panel  = document.getElementById('menuPanel');
  const exit   = document.getElementById('menuExit');
  const proxy  = document.getElementById('btnExit'); // hidden button with revokeAccess listener
  if (!toggle || !panel) return;

  function openMenu()  {
    panel.classList.add('open');
    toggle.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    panel.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  }
  function isOpen() { return panel.classList.contains('open'); }

  toggle.addEventListener('click', e => {
    e.stopPropagation();
    isOpen() ? closeMenu() : openMenu();
  });

  // Close on outside click
  document.addEventListener('click', e => {
    if (isOpen() && !panel.contains(e.target) && !toggle.contains(e.target)) closeMenu();
  });

  // Close on Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isOpen()) { closeMenu(); toggle.focus(); }
  });

  // Language items — switchLang already wired via initLangSwitcher; just close menu
  panel.querySelectorAll('.menu-item--lang').forEach(btn => {
    btn.addEventListener('click', () => closeMenu());
  });

  // Exit — proxy to hidden #btnExit which has the revokeAccess listener
  if (exit && proxy) {
    exit.addEventListener('click', () => { closeMenu(); proxy.click(); });
  }
})();

// ── Private Beta Auth ──────────────────────────────────────
(function initBetaAuth() {
  const APP_PIN       = '8181';
  const EMERGENCY_PIN = '0000';
  const AUTH_KEY      = 'isa_auth';
  const MAX_DIGITS    = 4;

  const screen    = document.getElementById('betaAccessScreen');
  const form      = document.getElementById('betaForm');
  const pinInput  = document.getElementById('betaPin');
  const inputWrap = document.getElementById('betaInputWrap');
  const dotsEl    = document.getElementById('betaDots');
  const errorEl   = document.getElementById('betaError');
  const btnSubmit = document.getElementById('betaSubmit');
  const btnExit   = document.getElementById('btnExit');

  // ── Entrance animation ──────────────────────────────────
  const isMobile      = window.innerWidth <= 640;
  const STEP          = reducedMotion ? 0  : (isMobile ? 50  : 100);
  const REVEAL_DUR    = reducedMotion ? 0  : (isMobile ? 280 : 400);
  const appEl         = document.querySelector('.app');

  function getDashTargets() {
    return [
      document.querySelector('.header'),
      document.querySelector('.dashboard-top'), // hero card (summary + chart)
    ].filter(Boolean);
  }

  // Instantly hide dashboard elements while screen is still covering them
  function maskDashboard() {
    if (reducedMotion) return;
    getDashTargets().forEach(el => {
      el.style.opacity    = '0';
      el.style.transform  = 'translateY(12px) scale(0.98)';
      el.style.transition = 'none';
    });
    // Hide categories section separately — cards stagger in individually
    const catSection = document.getElementById('categoriesSection');
    if (catSection) {
      catSection.style.opacity    = '0';
      catSection.style.transition = 'none';
    }
  }

  // Animate #appRoot in: opacity/scale/blur, slight overlap with screen exit
  function enterAppRoot() {
    if (!appEl || reducedMotion) return;
    const ease = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
    appEl.style.opacity    = '0';
    appEl.style.transform  = 'scale(0.985)';
    appEl.style.filter     = 'blur(8px)';
    appEl.style.transition = 'none';
    void appEl.getBoundingClientRect();
    appEl.style.transition = `opacity 600ms ${ease}, transform 600ms ${ease}, filter 600ms ${ease}`;
    appEl.style.opacity    = '1';
    appEl.style.transform  = 'scale(1)';
    appEl.style.filter     = 'blur(0px)';
    setTimeout(() => {
      appEl.style.opacity = appEl.style.transform = appEl.style.filter = appEl.style.transition = '';
    }, 660);
  }

  // Reveal one element after `delay` ms using a CSS transition
  function revealEl(el, delay) {
    setTimeout(() => {
      // rAF ensures at least one painted frame with transition:none before re-enabling
      requestAnimationFrame(() => {
        el.style.transition = `opacity ${REVEAL_DUR}ms var(--ease-out), transform ${REVEAL_DUR}ms var(--ease-out)`;
        el.style.opacity    = '1';
        el.style.transform  = 'translateY(0) scale(1)';
        // Clean up inline styles once animation settles so hover/CSS can take over
        setTimeout(() => {
          el.style.transition = '';
          el.style.opacity    = '';
          el.style.transform  = '';
        }, REVEAL_DUR + 60);
      });
    }, delay);
  }

  // Count total balance up from 0 (hero moment for the summary panel)
  function runEntranceCountUp() {
    const target = totalValueBase();
    if (target <= 0) return;

    const dur = reducedMotion ? 0 : (isMobile ? 420 : 820);
    totalValueEl.classList.remove('skeleton');
    _countUpCurrent = target; // prevent countUpTotalValue from clobbering mid-animation

    if (dur === 0) {
      totalValueEl.textContent = formatBase(target);
      return;
    }

    const t0 = performance.now();
    function ease(t) { return 1 - Math.pow(1 - t, 3); }

    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      totalValueEl.textContent = formatBase(target * ease(p));
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        totalValueEl.textContent = formatBase(target);
        totalValueEl.classList.add('balance-glow-pulse');
        setTimeout(() => totalValueEl.classList.remove('balance-glow-pulse'), 1000);
      }
    })(t0);
  }

  // Orchestrate the full staggered dashboard entrance
  function playDashboardEntrance() {
    const targets = getDashTargets();

    // Suppress hover transforms until all animations settle
    if (appEl) appEl.classList.add('app--animating');
    setTimeout(() => {
      if (appEl) appEl.classList.remove('app--animating');
    }, 1800);

    // 1–2: staggered reveals (header, hero card)
    targets.forEach((el, i) => revealEl(el, i * STEP));

    // Hero: count up the balance as the hero card fades in
    setTimeout(runEntranceCountUp, 1 * STEP + 120);

    // Chart: wipe cover slides away left → right, revealing the drawn line
    if (!reducedMotion) {
      setTimeout(() => {
        const cw = document.querySelector('.chart-wrap');
        if (!cw) return;
        cw.classList.add('chart-wrap--drawing');
        setTimeout(() => cw.classList.remove('chart-wrap--drawing'), 1050);
      }, 2 * STEP + 200);
    }

    // Categories: section visible instantly, cards stagger in 120ms after chart starts
    const CARD_EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
    setTimeout(() => {
      const catSection = document.getElementById('categoriesSection');
      const grid       = document.getElementById('categoriesGrid');
      if (!catSection || !grid) return;

      // Snap section container to visible (no fade — cards handle the entrance)
      catSection.style.transition = 'none';
      catSection.style.opacity    = '1';
      setTimeout(() => { catSection.style.transition = catSection.style.opacity = ''; }, 60);

      const cards = Array.from(grid.querySelectorAll('.cat-card'));
      if (!cards.length) return;

      if (reducedMotion) return; // instant — already visible via section reveal

      // Set initial hidden state on all cards before first paint
      cards.forEach(card => {
        card.style.opacity    = '0';
        card.style.transform  = 'translateY(12px) scale(0.98)';
        card.style.transition = 'none';
      });
      void grid.getBoundingClientRect();

      // Stagger each card in (40ms apart), then animate its internal visual
      cards.forEach((card, i) => {
        setTimeout(() => {
          card.style.transition = `opacity 320ms ${CARD_EASE}, transform 320ms ${CARD_EASE}`;
          card.style.opacity    = '1';
          card.style.transform  = 'translateY(0) scale(1)';

          // Internal visual fades up 150ms after the card starts appearing
          setTimeout(() => {
            const visual = card.querySelector('.cat-card-visual');
            if (visual) {
              visual.style.opacity    = '0';
              visual.style.transform  = 'translateY(8px)';
              visual.style.transition = 'none';
              void visual.getBoundingClientRect();
              visual.style.transition = `opacity 300ms ${CARD_EASE}, transform 300ms ${CARD_EASE}`;
              visual.style.opacity    = '0.28';
              visual.style.transform  = 'translateY(0)';
              setTimeout(() => {
                visual.style.opacity = visual.style.transform = visual.style.transition = '';
              }, 360);
            }

            // Count-up the card value from 0 (staggered with card reveal)
            const valueEl = card.querySelector('.cat-card-value[data-target]');
            if (valueEl && !reducedMotion) {
              const target = parseFloat(valueEl.dataset.target);
              if (isFinite(target) && target > 0) {
                const dur = 650;
                const t0  = performance.now();
                const ease = t => 1 - Math.pow(1 - t, 3);
                valueEl.textContent = formatBase(0);
                (function step(now) {
                  const p = Math.min((now - t0) / dur, 1);
                  valueEl.textContent = formatBase(target * ease(p));
                  if (p < 1) requestAnimationFrame(step);
                  else valueEl.textContent = formatBase(target);
                })(t0);
              }
            }

            // Clean up card inline styles so CSS hover can take over
            setTimeout(() => {
              card.style.opacity = card.style.transform = card.style.transition = '';
            }, 360);
          }, 150);
        }, i * 40);
      });
    }, 2 * STEP + 120);
  }

  // ── Dot management — dynamic add/remove for true centering ─
  // Only live dots exist in the flex container so justify-content:center
  // always centers exactly the typed count, not a fixed 4-slot row.
  const dotEls = [];

  function addDot() {
    const dot = document.createElement('span');
    dot.className = 'beta-dot';
    dotsEl.appendChild(dot);
    dotEls.push(dot);
    // Force layout commit before adding .visible so the transition fires
    void dot.getBoundingClientRect();
    dot.classList.add('visible');
  }

  function removeDot() {
    if (!dotEls.length) return;
    const dot = dotEls.pop();
    dot.classList.remove('visible');
    // Remove from DOM after both opacity (.12s) and transform (.14s) finish
    setTimeout(() => { if (dot.parentNode) dot.remove(); }, 180);
  }

  function renderDots(count) {
    const delta = count - dotEls.length;
    if (delta > 0) for (let i = 0; i < delta; i++) addDot();
    else if (delta < 0) for (let i = 0; i < -delta; i++) removeDot();

    const hasValue = count > 0;
    pinInput.classList.toggle('has-value', hasValue);
    inputWrap.classList.toggle('has-input', hasValue);
    inputWrap.classList.toggle('ready', count === MAX_DIGITS);
    btnSubmit.classList.toggle('ready', count === MAX_DIGITS);
  }

  // ── Auth utils ─────────────────────────────────────────
  function isAuthed() {
    try { return localStorage.getItem(AUTH_KEY) === 'true'; }
    catch (e) { return true; } // localStorage unavailable → grant access
  }
  function saveAuth()  { try { localStorage.setItem(AUTH_KEY, 'true'); } catch (e) {} }
  function clearAuth() { try { localStorage.removeItem(AUTH_KEY); }      catch (e) {} }

  // Card shrinks + blurs → screen fades → dashboard reveals in sequence
  function grantAccess() {
    saveAuth();
    btnExit.style.display = '';
    maskDashboard();                                  // hide dashboard while screen still covers it
    screen.classList.add('exiting');
    setTimeout(enterAppRoot, 150);                   // begin #appRoot entrance, overlaps with screen fade
    setTimeout(() => screen.classList.add('authed'), 220);
    setTimeout(playDashboardEntrance, 700);           // crossfades with tail of screen fade
  }

  // Instant card reset → screen fades back in → ready for re-entry
  function revokeAccess() {
    clearAuth();
    screen.classList.remove('exiting');   // snap card back (no transition without .exiting)
    void screen.offsetWidth;              // force reflow
    screen.classList.remove('authed');
    btnExit.style.display = 'none';
    pinInput.value = '';
    // Instant clear — no exit animations when returning to the auth screen
    dotsEl.innerHTML = '';
    dotEls.length = 0;
    inputWrap.classList.remove('has-input', 'ready');
    pinInput.classList.remove('has-value');
    btnSubmit.classList.remove('ready');
    btnSubmit.disabled = true;
    errorEl.classList.remove('show');
    setTimeout(() => pinInput.focus(), 80);
  }

  function showError() {
    errorEl.classList.add('show');
    inputWrap.classList.remove('shake');
    void inputWrap.offsetWidth;
    inputWrap.classList.add('shake');
  }

  // ── Input events ───────────────────────────────────────
  pinInput.addEventListener('input', () => {
    if (pinInput.value.length > MAX_DIGITS) pinInput.value = pinInput.value.slice(0, MAX_DIGITS);
    renderDots(pinInput.value.length);
    btnSubmit.disabled = pinInput.value.length === 0;
    if (pinInput.value.length > 0) errorEl.classList.remove('show');
  });
  pinInput.addEventListener('focus', () => inputWrap.classList.add('focused'));
  pinInput.addEventListener('blur',  () => inputWrap.classList.remove('focused'));

  // ── On load ────────────────────────────────────────────
  if (isAuthed()) {
    // Already authenticated — hide screen instantly, no entrance sequence needed
    screen.style.transition = 'none';
    screen.classList.add('authed');
    btnExit.style.display = '';
    requestAnimationFrame(() => { screen.style.transition = ''; });
  } else {
    pinInput.focus();
  }

  // ── Submit ─────────────────────────────────────────────
  form.addEventListener('submit', e => {
    e.preventDefault();
    const pin = pinInput.value.trim();
    if (pin === APP_PIN || pin === EMERGENCY_PIN) {
      errorEl.classList.remove('show');
      grantAccess();
    } else {
      showError();
    }
  });

  // ── Logout ─────────────────────────────────────────────
  btnExit.addEventListener('click', revokeAccess);
})();

// ── Card drag & drop — single delegated listener ────────────
(function initCardDragDrop() {
  assetsListEl.addEventListener('touchstart', e => {
    if (activeCategory) return;                      // disabled in category detail view
    const card = e.target.closest('.asset-card[data-asset-id]');
    if (!card || e.touches.length !== 1) return;

    const t0     = e.touches[0];
    const startY = t0.clientY;
    let fired    = false;

    const timer = setTimeout(() => {
      fired = true;
      _ddBeginDrag(card, t0);
    }, 300);

    const onMove = ev => {
      if (fired) {
        _ddMove(ev);
      } else if (Math.abs(ev.touches[0].clientY - startY) > 8) {
        cancel(); // moved too early — treat as scroll, not long press
      }
    };

    const onEnd = () => { cancel(); if (fired) _ddEnd(); };

    function cancel() {
      clearTimeout(timer);
      document.removeEventListener('touchmove',   onMove);
      document.removeEventListener('touchend',    onEnd);
      document.removeEventListener('touchcancel', onEnd);
    }

    document.addEventListener('touchmove',   onMove, { passive: false });
    document.addEventListener('touchend',    onEnd,  { passive: true });
    document.addEventListener('touchcancel', onEnd,  { passive: true });
  }, { passive: true });
})();
