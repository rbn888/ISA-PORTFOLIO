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
    // Bottom nav
    tabHome:     'Inicio',
    tabInsights: 'Insights',
    tabMarket:   'Mercado',
    tabProfile:  'Perfil',
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
    // Bottom nav
    tabHome:     'Home',
    tabInsights: 'Insights',
    tabMarket:   'Market',
    tabProfile:  'Profile',
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
const STORAGE_KEY    = 'portfolio_assets';
const COINGECKO      = 'https://api.coingecko.com/api/v3';
const TWELVE_API_KEY = '55e1f0fb31714f0d91081bd8e4e664c9';

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
const LOGO_CACHE        = {};   // sym → resolved url | null  (in-memory)
let   _cgMap            = null; // sym → coingecko id  (in-memory, backed by localStorage)

// Logos whose spothq/atomiclabs "color" variant bakes in a coloured circle background.
// Values point to the CoinGecko CDN which serves the original brand mark on a transparent
// background — the same source _fetchLogoFromCG() would eventually resolve to.
// If a URL fails, the existing onerror → _logoFallback chain takes over transparently.
// To use local files instead: place PNGs in /public/logos/ and update the paths below.
const CLEAN_LOGO_OVERRIDE = {
  BTC:   'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
  ETH:   'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
  USDC:  'https://assets.coingecko.com/coins/images/6319/small/usdc.png',
  USDT:  'https://assets.coingecko.com/coins/images/325/small/Tether.png',
  BNB:   'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
  SOL:   'https://assets.coingecko.com/coins/images/4128/small/solana.png',
  ADA:   'https://assets.coingecko.com/coins/images/975/small/cardano.png',
  XRP:   'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
  DOGE:  'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
  DOT:   'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
  MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png',
  LINK:  'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png',
  AVAX:  'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
  LTC:   'https://assets.coingecko.com/coins/images/2/small/litecoin.png',
};

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
  crypto:      { label: 'Cripto',       color: '#2563EB' },  // blue-600
  stock:       { label: 'Acciones',     color: '#EA580C' },  // orange-600
  etf:         { label: 'Fondos/ETF',   donutLabel: 'Fondos',  color: '#0891B2' },  // cyan-600
  metal:       { label: 'Metales',      color: '#CA8A04' },  // yellow-600
  cash:        { label: 'Liquidez',     color: '#16A34A' },  // green-700
  real_estate: { label: 'Inmuebles',   donutLabel: 'Inmob.', color: '#7C3AED' },  // violet-700
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
let _chartRevealProgress = 1; // 0–1 clip for left-to-right line reveal
let _chartColdDraw   = true;  // true until first successful data draw

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
const CARD_ORDER_KEY     = 'portfolio_card_order';
const CAT_ORDER_KEY      = 'portfolio_cat_order';
const CAT_DEFAULT_ORDER  = ['stock', 'etf', 'crypto', 'metal', 'real_estate', 'cash'];
let _cardOrder = JSON.parse(localStorage.getItem(CARD_ORDER_KEY) || 'null') || [];
let _catOrder  = JSON.parse(localStorage.getItem(CAT_ORDER_KEY)  || 'null') || [];
let _dd = null;          // active drag state (asset cards)
let justDragged = false; // blocks post-drag click from opening a card

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

// Handles both European ("2.446,77") and standard ("2446.77") price strings.
// parseLocalFloat breaks standard format by treating the decimal dot as thousands separator.
function normalizePriceInput(value) {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  let v = String(value).trim();
  if (v.includes(',') && v.includes('.')) {
    v = v.replace(/\./g, '').replace(',', '.');
  } else if (v.includes(',')) {
    v = v.replace(',', '.');
  }
  return Number(v) || 0;
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
  const value = asset.qty * asset.price;
  const cost  = asset.costBasis || 0;
  if (!cost || cost <= 0) return { abs: 0, pct: 0 };
  const abs = value - cost;
  const pct = (abs / cost) * 100;
  return { abs, pct };
}

function avgBuyPrice(asset) {
  const buys = (asset.transactions || []).filter(tx => tx.type === 'buy');
  if (!buys.length) return null;
  const totalQty  = buys.reduce((s, tx) => s + tx.qty,         0);
  const totalCost = buys.reduce((s, tx) => s + tx.qty * tx.price, 0);
  return totalQty > 0 ? totalCost / totalQty : null;
}

// Derives costBasis from buy transactions (sum of qty × price).
function sanitizeTransactionPrices(asset) {
  if (!asset.transactions || !asset.transactions.length) return;
  asset.transactions.forEach(tx => {
    if (!tx.price) return;
    if (tx.price > 100000) tx.price = tx.price / 100;
  });
}

// Returns null when no transactions exist so legacy costBasis is preserved.
function computeCostBasisFromTransactions(asset) {
  const buys = (asset.transactions || []).filter(tx => tx.type === 'buy');
  if (!buys.length) return null;
  return buys.reduce((sum, tx) => sum + tx.qty * tx.price, 0);
}

function syncCostBasisFromTransactions(asset) {
  if (!asset.transactions || !asset.transactions.length) return;
  let totalCost = 0;
  for (const tx of asset.transactions) {
    const qty   = Number(tx.qty)   || 0;
    const price = Number(tx.price) || 0;
    if (tx.type === 'buy')  totalCost += qty * price;
    if (tx.type === 'sell') totalCost -= qty * price;
  }
  asset.costBasis = Math.max(0, totalCost);
}

function migrateLegacyAssetToTransactions(asset) {
  if (asset.transactions && asset.transactions.length) return;
  if (!asset.qty || asset.qty <= 0) return;
  if (!asset.costBasis || asset.costBasis <= 0) return;
  const avgPrice = asset.costBasis / asset.qty;
  asset.transactions = [{ type: 'buy', qty: asset.qty, price: avgPrice, ts: Date.now() }];
}

function syncQtyFromTransactions(asset) {
  if (!asset.transactions || !asset.transactions.length) return;
  let qty = 0;
  for (const tx of asset.transactions) {
    if (tx.type === 'buy')  qty += tx.qty;
    if (tx.type === 'sell') qty -= tx.qty;
  }
  asset.qty = Math.max(0, qty);
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
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY));
    if (!Array.isArray(raw)) return [];

    // Sanitize on load: discard malformed entries, dedupe by timestamp
    // (keep last occurrence), then sort ascending.  This ensures the
    // in-memory array is always clean regardless of what was stored.
    const valid = raw.filter(p =>
      p &&
      typeof p.ts    === 'number' &&
      typeof p.value === 'number' &&
      isFinite(p.value) &&
      p.value > 0
    );

    const deduped = Object.values(
      valid.reduce((acc, p) => { acc[p.ts] = p; return acc; }, {})
    );

    return deduped.sort((a, b) => a.ts - b.ts);
  } catch {
    return [];
  }
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

function recordSnapshot() {
  const now = Date.now();
  const val = totalValueUSD(); // always store in USD for consistent history
  if (val <= 0) return;

  const last     = portfolioHistory[portfolioHistory.length - 1];
  const newPoint = { ts: now, value: +(val.toFixed(2)) };

  // Dedup: upsert only if called within 5 s of the last point (same moment).
  // Otherwise strictly append so historyLength grows on every price refresh.
  const base = (last && now - last.ts < 5_000)
    ? portfolioHistory.slice(0, -1)
    : portfolioHistory;

  const cutoff = now - 365 * 86_400_000;
  portfolioHistory = [...base, newPoint].filter(p => p.ts >= cutoff);
  lastSnapshotMs = now;
  saveHistory();

  console.log('[snapshot]', { ts: now, total: totalValueBase(), historyLength: portfolioHistory.length });
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
let currentTab       = 'home';
let showAllTx        = false;
let insightIndex = 0;
let insightCache = [];
let _insightInterval  = null;

const MEMORY_KEY = 'aurix_insights_memory';

function getMemory() {
  try { return JSON.parse(localStorage.getItem(MEMORY_KEY)) || []; } catch { return []; }
}

function saveMemory(arr) {
  try { localStorage.setItem(MEMORY_KEY, JSON.stringify(arr)); } catch {}
}

function wasRecentlyShown(text, days = 2) {
  const memory = getMemory();
  const limit  = days * 24 * 60 * 60 * 1000;
  const now    = Date.now();
  return memory.some(m => m.text === text && (now - m.ts < limit));
}

function storeInsight(text) {
  const memory = getMemory();
  memory.push({ text, ts: Date.now() });
  saveMemory(memory.slice(-50));
}

function hasEnoughHistory() {
  return getAllTransactions().length >= 5;
}

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

  if (distributionSectionEl.style.display === 'none' || !distributionSectionEl.dataset.entered) {
    distributionSectionEl.dataset.entered = '1';
    distributionSectionEl.classList.add('is-entering');
    distributionSectionEl.addEventListener('animationend', () => distributionSectionEl.classList.remove('is-entering'), { once: true });
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
    grad.addColorStop(0,   'rgba(255,255,255,0.07)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.02)');
    grad.addColorStop(1,   'rgba(255,255,255,0.00)');
    chart.data.datasets.forEach(ds => { ds.backgroundColor = grad; });
  }
};

// Subtle glow behind the chart line
const lineGlowPlugin = {
  id: 'lineGlow',
  beforeDatasetsDraw(chart) {
    chart.ctx.save();
    chart.ctx.shadowColor = 'rgba(255,255,255,0.10)';
    chart.ctx.shadowBlur  = 8;
  },
  afterDatasetsDraw(chart) {
    chart.ctx.restore();
  }
};

// Clips the canvas to a rect that expands left→right during animation
const lineRevealPlugin = {
  id: 'lineReveal',
  beforeDatasetsDraw(chart) {
    if (_chartRevealProgress >= 1) return;
    const { ctx, chartArea } = chart;
    if (!chartArea) return;
    ctx.save();
    ctx.beginPath();
    ctx.rect(chartArea.left, chartArea.top - 5, chartArea.width * _chartRevealProgress, chartArea.height + 10);
    ctx.clip();
  },
  afterDatasetsDraw(chart) {
    if (_chartRevealProgress < 1) chart.ctx.restore();
  }
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
        borderColor: 'rgba(255,255,255,0.85)',
        backgroundColor: 'transparent',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255,255,255,0.3)',
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
          grid: { color: 'rgba(255,255,255,0.06)' },
          border: { display: false },
          ticks: { color: '#686868', maxTicksLimit: 6, maxRotation: 0 },
        },
        y: {
          position: 'right',
          grid: { color: 'rgba(255,255,255,0.06)' },
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
      animation: {
        duration: 1200,
        easing: 'easeOutQuart',
        onProgress(anim) {
          _chartRevealProgress = anim.numSteps > 0 ? anim.currentStep / anim.numSteps : 1;
        },
        onComplete() { _chartRevealProgress = 1; }
      },
    },
    plugins: [fillGradientPlugin, lineGlowPlugin, lineRevealPlugin, crosshairPlugin],
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

// ── Per-range display-point limits ───────────────────────────────────────
const MAX_POINTS = { '24h': 80, '7d': 120, '30d': 150, '1y': 200, 'all': 250 };

// ── Downsample via bucket-averaging ──────────────────────────────────────
// Groups data into equal-sized buckets and averages ts + value within each.
// Returns the input unchanged when it is already at or below maxPoints.
function downsample(data, maxPoints = 120) {
  if (!data || data.length <= maxPoints) return data;
  const bucketSize = Math.floor(data.length / maxPoints);
  const result     = [];
  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    const sum    = bucket.reduce(
      (acc, p) => { acc.ts += p.ts; acc.value += p.value; return acc; },
      { ts: 0, value: 0 }
    );
    result.push({ ts: sum.ts / bucket.length, value: sum.value / bucket.length });
  }
  return result;
}

// ── Single unified data pipeline ─────────────────────────────────────────
// Pure, stateless, deterministic.  Same input always produces same output.
// Steps: validate → dedupe → sort.
// Downsampling and time-filtering are done by the caller (getChartData).
// NEVER returns null — falls back to the input dataset if processing fails.
function processSeries(data) {
  if (!Array.isArray(data) || data.length < 2) return data || [];

  try {
    // 1. Validate — keep only well-formed, positive points
    const valid = data.filter(p =>
      p &&
      typeof p.ts    === 'number' &&
      typeof p.value === 'number' &&
      isFinite(p.value) &&
      p.value > 0
    );

    if (valid.length < 2) return data;

    // 2. Dedupe by timestamp (keep last write); input is not mutated
    const deduped = Object.values(
      valid.reduce((acc, p) => { acc[p.ts] = p; return acc; }, {})
    );

    // 3. Sort ascending — explicit copy so no intermediate array is mutated
    const sorted = [...deduped].sort((a, b) => a.ts - b.ts);

    return sorted;

  } catch {
    // Pipeline error — return original data so the chart always renders.
    return data;
  }
}


function getChartData(range) {
  const now = Date.now();

  const ms = {
    '24h': 24 * 60 * 60 * 1000,
    '7d':  7  * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '1y':  365 * 24 * 60 * 60 * 1000,
  };

  const fmt = ts => {
    const d = new Date(ts);
    if (range === '24h') return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    if (range === '7d')  return d.toLocaleDateString('es-ES',  { weekday: 'short', day: 'numeric' });
    if (range === 'all') return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: '2-digit' });
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  // 1. Normalise source — defensive copy, discard invalid entries, sort ascending.
  //    portfolioHistory is treated as read-only; we never mutate it here.
  //    This guarantees processSeries always receives the same ordered input
  //    regardless of when or where the chart is rendered.
  const _empty = { labels: [], values: [] };
  if (!Array.isArray(portfolioHistory) || portfolioHistory.length < 2) return _empty;

  const source = portfolioHistory
    .filter(p => p && typeof p.ts === 'number' && typeof p.value === 'number' && isFinite(p.value) && p.value > 0)
    .sort((a, b) => a.ts - b.ts);

  if (source.length < 2) return _empty;

  // Diagnostic logging — confirms the input is stable across reloads.
  // Remove once charts are confirmed stable.
  console.debug('[chart] history snapshot —',
    'len:', source.length,
    '| first:', new Date(source[0].ts).toISOString(),
    '| last:', new Date(source[source.length - 1].ts).toISOString()
  );

  // 2. Process the full normalised dataset
  const processed = processSeries(source);
  if (!processed || processed.length < 2) return _empty;

  // 3. Build output — time-grid for windowed ranges, downsample for 'all'
  let final;
  if (range === 'all') {
    const filtered = processed.filter(p => p.ts >= 0); // all points
    if (filtered.length < 2) return _empty;
    final = downsample(filtered, MAX_POINTS['all'] || 250);
  } else {
    // Time-grid normalization: create a fixed, evenly-spaced timeline and
    // fill each slot with the last known value (carry-forward).  This makes
    // the chart deterministic (same grid every render) and eliminates steps
    // caused by sparse snapshot windows.
    const duration  = ms[range];
    const points    = MAX_POINTS[range] || 120;
    const gridStart = now - duration;
    const step      = duration / points;

    let di        = 0;
    let lastValue = null;
    const grid    = [];

    for (let i = 0; i <= points; i++) {
      const t = gridStart + i * step;
      // Advance to consume all processed points up to this grid tick
      while (di < processed.length && processed[di].ts <= t) {
        lastValue = processed[di].value;
        di++;
      }
      if (lastValue !== null) grid.push({ ts: t, value: lastValue });
    }

    if (grid.length < 2) {
      // Grid produced too few points (very sparse data) — fall back to simple filter
      const filtered = processed.filter(p => p.ts >= gridStart);
      if (filtered.length < 2) return _empty;
      final = downsample(filtered, points);
    } else {
      final = grid;
    }
  }

  return {
    labels: final.map(p => fmt(p.ts)),
    values: final.map(p => toBase(p.value, 'USD')),
  };
}

function updateChart(animate = false) {
  if (!portfolioChart) return;
  const data = getChartData(activeRange);

  if (!data.values.length) {
    chartChangeEl.textContent = '';
    chartNoDataEl.style.display = '';
    portfolioChart.data.labels = [];
    portfolioChart.data.datasets[0].data = [];
    portfolioChart.update('none');
    return;
  }

  chartNoDataEl.style.display = 'none';

  // Use the live portfolio value as "now" so chart PnL never diverges from
  // the actual portfolio total, even when the last chart point is a snapshot
  // that's slightly behind the current price feed.
  const startValue   = data.values[0];
  const currentValue = totalValueBase();
  const pct = startValue > 0 ? ((currentValue - startValue) / startValue) * 100 : 0;
  const cls = pct > 0.005 ? 'up' : pct < -0.005 ? 'down' : 'flat';

  if (activePerfMode === 'curr') {
    const absChange = currentValue - startValue;
    const absSign   = absChange >= 0 ? '+' : '';
    chartChangeEl.textContent = `${absSign}${formatBase(absChange)}`;
  } else {
    const sign = pct >= 0 ? '+' : '';
    chartChangeEl.textContent = `${sign}${pct.toFixed(2)}%`;
  }
  chartChangeEl.className = `chart-change ${cls}`;

  portfolioChart.data.labels = data.labels;
  portfolioChart.data.datasets[0].data = data.values;
  if (_chartColdDraw) {
    // First successful draw — full left-to-right reveal at 1200ms
    _chartColdDraw = false;
    _chartRevealProgress = 0;
    portfolioChart.update();
  } else if (animate) {
    // Range-switch or data update — fast 280ms reveal
    _chartRevealProgress = 0;
    portfolioChart.options.animation.duration = 280;
    portfolioChart.update();
    portfolioChart.options.animation.duration = 1200;
  } else {
    portfolioChart.update('none');
  }
}

function onPortfolioChange(animate = false) {
  recordSnapshot();
  updateChart(animate);
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

// ── Twelve Data API (stocks / ETFs / metals) ───────────────
async function fetchTwelveData(symbol) {
  const url = `https://api.twelvedata.com/price?symbol=${encodeURIComponent(symbol)}&apikey=${TWELVE_API_KEY}`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    console.log('[twelve]', symbol, 'status:', res.status);
    if (!res.ok) return null;
    const json = await res.json();
    const price = parseFloat(json.price);
    if (!price || isNaN(price)) return null;
    return { price, previousClose: null };
  } catch (err) {
    console.log('[twelve]', symbol, 'error:', err.message);
    return null;
  }
}

const fetchYahooData = fetchTwelveData;

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


// ── Collect market prices WITHOUT mutating assets ────────────────────────
// Returns { [marketSymbol]: { price, change24h } } for all assets that
// returned a valid price.  Per-asset failures are silently skipped so one
// delisted ticker can't block the whole update.
async function collectMarketPriceData(marketAssets) {
  const results = await Promise.allSettled(
    marketAssets.map(async a => {
      let price = null, change24h = null;
      try {
        if (a.marketSymbol === 'GC=F') {
          price = await fetchGoldSpotPrice();
        } else {
          const data  = await fetchYahooData(a.marketSymbol);
          price       = data?.price         ?? null;
          const prev  = data?.previousClose ?? null;
          if (price && prev > 0) change24h = ((price - prev) / prev) * 100;
        }
        if (change24h === null) {
          const fb = getFallbackData(a.marketSymbol);
          if (fb) change24h = fb.change24h;
        }
      } catch { /* skip this asset */ }
      return { symbol: a.marketSymbol, price, change24h };
    })
  );

  const map = {};
  results.forEach(r => {
    if (r.status === 'fulfilled' && r.value.price != null) {
      map[r.value.symbol] = { price: r.value.price, change24h: r.value.change24h };
    }
  });
  return map;
}

// ── Single atomic portfolio update ───────────────────────────────────────
// ONE function owns the entire update cycle:
//   collect all prices → apply atomically → record snapshot → render
// If any batch-level fetch fails (network, rate-limit) the rollback snapshot
// is restored and NO history point is written.
async function refreshPrices() {
  // ── Legacy migration (one-time data fix) ──────────────────────────────
  let migrated = false;
  assets.forEach(a => {
    if ((a.type === 'stock' || a.type === 'etf') && !a.marketSymbol && a.ticker) {
      a.marketSymbol = a.ticker.toUpperCase(); migrated = true;
    }
    if (a.type === 'metal' && !a.marketSymbol && a.ticker) {
      const m = METAL_MAP[a.ticker.toUpperCase()];
      if (m) { a.marketSymbol = m.yahoo; migrated = true; }
    }
  });
  if (migrated) save();

  const cryptos      = assets.filter(a => a.type === 'crypto' && a.coinId);
  const marketAssets = assets.filter(a =>
    (a.type === 'stock' || a.type === 'etf' || a.type === 'metal' || a.type === 'other') && a.marketSymbol
  );
  if (!cryptos.length && !marketAssets.length) return;

  setUpdateStatus('refreshing');

  // ── 1. Save rollback snapshot ─────────────────────────────────────────
  const rollback = assets.map(a => ({ price: a.price, prevPrice: a.prevPrice, change24h: a.change24h }));

  // ── 2. Fetch prices independently — one source failing won't abort the other
  const [cryptoResult, marketResult] = await Promise.allSettled([
    cryptos.length
      ? fetchLivePrices([...new Set(cryptos.map(a => a.coinId))])
      : Promise.resolve({}),
    marketAssets.length
      ? collectMarketPriceData(marketAssets)
      : Promise.resolve({}),
  ]);

  const cryptoSuccess = cryptoResult.status === 'fulfilled' && cryptoResult.value;
  const marketSuccess = marketResult.status === 'fulfilled' && marketResult.value;

  // ── 3. Rollback only if both sources failed ───────────────────────────
  if (!cryptoSuccess && !marketSuccess) {
    console.error('[refreshPrices] both sources failed:', cryptoResult.reason, marketResult.reason);
    assets.forEach((a, i) => {
      a.price     = rollback[i].price;
      a.prevPrice = rollback[i].prevPrice;
      a.change24h = rollback[i].change24h;
    });
    setUpdateStatus('error');
    return;
  }

  // ── 4. Apply whichever sources succeeded ─────────────────────────────
  const cryptoPrices = cryptoSuccess ? cryptoResult.value : {};
  const marketPrices = marketSuccess ? marketResult.value : {};

  assets.forEach(a => {
    if (a.type === 'crypto' && a.coinId) {
      const d = cryptoPrices[a.coinId];
      if (!d) return;
      if (d.usd !== a.price) { a.prevPrice = a.price; a.price = d.usd; }
      a.change24h = d.usd_24h_change ?? a.change24h;
    } else if (a.marketSymbol && marketPrices[a.marketSymbol]) {
      const m = marketPrices[a.marketSymbol];
      if (m.price !== a.price) { a.prevPrice = a.price; a.price = m.price; }
      if (m.change24h != null) {
        a.change24h = m.change24h;
        if (a.marketSymbol === 'GC=F') goldChangePct = m.change24h;
      }
    }
  });

  // ── 5. Persist, render ────────────────────────────────────────────────
  save();
  lastRefreshAt = Date.now();
  render();
  setUpdateStatus('ok');

  // Runs only on success — chart errors must never affect price status or rollback
  try { onPortfolioChange(); } catch { /* chart errors stay contained */ }
}

// ── Animated count-up for total value ─────────────────────
let _countUpRaf      = null;
let _countUpCurrent  = null;   // last value we displayed (in base currency)

// ── Animated count-up for the detail view hero value ──────
let _heroRaf         = null;
let _heroValueShown  = null;   // last value rendered in detail hero (null = not shown yet)

// Apply compact class when formatted value is long (> 12 chars)
function _applyValueSizeClass() {
  totalValueEl.classList.toggle('summary-total--compact', totalValueEl.textContent.length > 12);
}

function countUpTotalValue(targetBase) {
  totalValueEl.classList.remove('skeleton');

  // First load: count up from 0 (gives the "live numbers waking up" feel)
  if (_countUpCurrent === null) {
    _countUpCurrent = 0;
    if (reducedMotion) {
      _countUpCurrent = targetBase;
      totalValueEl.textContent = formatBase(targetBase);
      _applyValueSizeClass();
      return;
    }
    const end      = targetBase;
    const dur      = 1200;
    const t0       = performance.now();
    function easeOutFirst(t) { return 1 - Math.pow(1 - t, 2.5); }
    _countUpCurrent = end;
    (function step(now) {
      const p = Math.min((now - t0) / dur, 1);
      totalValueEl.textContent = formatBase(end * easeOutFirst(p));
      if (p < 1) { _countUpRaf = requestAnimationFrame(step); }
      else        { _countUpRaf = null; totalValueEl.textContent = formatBase(end); _applyValueSizeClass(); }
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
      _applyValueSizeClass();
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
  justDragged = true;
  setTimeout(() => { justDragged = false; }, 150);

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
// Renders logos in the bottom-right visual zone.
// Renders logos in the bottom-right visual zone.
// Crypto tries spothq CDN first, falls back via _logoFallback.
function buildCardVisual(type, typeAssets) {
  const validAssets = typeAssets
    .map(a => ({ symbol: a.ticker, url: getAssetLogo(a.ticker, a.type), type: a.type }))
    .filter(a => a.url);

  if (!validAssets.length) return '';

  const imgs = validAssets.map(a => {
    const sym   = escHtml(a.symbol);
    const onErr = a.type === 'crypto' ? '_logoFallback(this)' : 'this.style.display=\'none\'';
    const extra = a.type === 'crypto' ? ' data-fallback-step="0"' : '';
    return `<img src="${a.url}" width="24" height="24" alt="${sym} logo" ` +
      `data-key="${sym}"${extra} onload="this.classList.add('loaded')" onerror="${onErr}">`;
  }).join('');

  return `<div class="cat-card-visual">${imgs}</div>`;
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

  // Ordered list — respects user's saved drag order
  const ALL_CATEGORIES = _catOrder.length === CAT_DEFAULT_ORDER.length
    ? _catOrder
    : CAT_DEFAULT_ORDER;

  // Build a lookup from _donutDist so we can fill in live values where available
  const distMap = Object.fromEntries((_donutDist || []).map(d => [d.type, d]));

  console.log('[categories] rendering:', ALL_CATEGORIES, '| live dist:', Object.keys(distMap));

  if (!section.dataset.entered) {
    section.dataset.entered = '1';
    section.classList.add('is-entering');
    section.addEventListener('animationend', () => section.classList.remove('is-entering'), { once: true });
  }
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
      ${catStatusHtml}
      <div class="cat-card-content">
        <div class="cat-card-header">
          <span class="cat-card-dot" style="background:${m.color}"></span>
          <span class="cat-card-name">${m.label}</span>
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

  // Staggered fade-up entrance — each card reveals 80 ms after the previous
  requestAnimationFrame(() => {
    grid.querySelectorAll('.cat-card').forEach((card, i) => {
      setTimeout(() => card.classList.add('cat-card--visible'), i * 80);
    });
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
      if (_tapOk && !justDragged) {
        _tapOk = false;
        e.preventDefault(); // prevent ghost click
        setActiveCategory(btn.dataset.type);
      } else {
        _tapOk = false;
      }
    });

    btn.addEventListener('touchcancel', () => {
      _tapOk = false;
      btn.classList.remove('is-pressing');
    });

    // click: fallback for desktop / non-touch
    btn.addEventListener('click', () => { if (!justDragged) setActiveCategory(btn.dataset.type); });
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
        <span class="detail-hero-pct"></span>
        <span class="detail-hero-pnl"></span>
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

  const portfolioTotal = totalValueBase();
  const pctEl = heroEl.querySelector('.detail-hero-pct');
  if (portfolioTotal > 0) {
    pctEl.textContent = `${((totalValue / portfolioTotal) * 100).toFixed(1)}% of portfolio`;
  } else {
    pctEl.textContent = '';
  }

  const categoryPnLAbs = typeAssets.reduce((s, a) => {
    const p = assetPnLBase(a);
    return p ? s + p.abs : s;
  }, 0);
  const categoryCostBasis = typeAssets.reduce((s, a) => {
    if (a.costBasis == null || a.costBasis <= 0 || a.type === 'cash' || a.type === 'real_estate') return s;
    return s + toBase(a.costBasis, (a.assetCurrency || 'USD').toUpperCase());
  }, 0);
  const pnlEl = heroEl.querySelector('.detail-hero-pnl');
  if (categoryCostBasis > 0) {
    const pnlPct = (categoryPnLAbs / categoryCostBasis) * 100;
    const sign = categoryPnLAbs >= 0 ? '+' : '−';
    const cls  = categoryPnLAbs > 0 ? 'up' : categoryPnLAbs < 0 ? 'down' : 'flat';
    pnlEl.textContent = `${sign}${formatBase(Math.abs(categoryPnLAbs))} (${sign}${Math.abs(pnlPct).toFixed(1)}%)`;
    pnlEl.className   = `detail-hero-pnl ${cls}`;
    pnlEl.style.display = '';
  } else {
    pnlEl.style.display = 'none';
  }

  // Re-build sparkline only when the category changes (not on every price tick)
  if (_detailChartType !== type) {
    _detailChartType = type;
    requestAnimationFrame(() => buildDetailSparkline(totalValue, change24h, m.color));
  }
}

// ── Insights tab ───────────────────────────────────────────
function getAllTransactions() {
  const all = [];
  assets.forEach(asset => {
    (asset.transactions || []).forEach(tx => {
      all.push({
        ...tx,
        assetName:     asset.name,
        assetSymbol:   asset.ticker || '',
        assetCurrency: (asset.assetCurrency || 'USD').toUpperCase(),
        assetId:       asset.id,
      });
    });
  });
  return all.sort((a, b) => b.ts - a.ts);
}

function renderTxRow(tx) {
  const total     = tx.qty * tx.price;
  const date      = new Date(tx.ts).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-GB');
  const typeLabel = tx.type === 'buy' ? 'BUY' : 'SELL';
  return `
    <div class="tx-row">
      <div class="tx-left">
        <div class="tx-type ${tx.type}">${typeLabel}</div>
        <div class="tx-asset">${escHtml(tx.assetName)}</div>
        <div class="tx-date">${date}</div>
      </div>
      <div class="tx-right">
        <div class="tx-main">${formatQty(tx.qty)} ${escHtml(tx.assetSymbol)}</div>
        <div class="tx-sub">@ ${formatCurrency(tx.price, tx.assetCurrency)}</div>
        <div class="tx-total">${formatCurrency(total, tx.assetCurrency)}</div>
      </div>
    </div>`;
}

function renderInsightsHero() {
  return `
    <div class="insights-hero">
      <div class="insights-orb"></div>
      <div class="insights-text">
        <h2>Insights</h2>
        <p>Analyzing your portfolio...</p>
      </div>
    </div>`;
}

function renderInsightsHistory(txs) {
  if (!txs.length) {
    return `<div class="insights-history-empty">No transactions yet</div>`;
  }
  return `
    <div class="insights-history">
      <div class="insights-history-header">History</div>
      <div class="ins-tx-list">${txs.map(renderTxRow).join('')}</div>
    </div>`;
}

function getTotalPortfolioValue() {
  return assets.reduce((sum, a) => sum + a.qty * a.price, 0);
}

function generateBaseInsights() {
  const es         = lang === 'es';
  const insights   = [];
  const txs        = getAllTransactions();
  const totalValue = getTotalPortfolioValue();

  if (!assets.length) {
    return [{ text: es ? 'Añade activos para comenzar a recibir insights.' : 'Start adding assets to receive insights.', priority: 4 }];
  }

  // 1. Single-asset concentration (priority 1)
  let maxValue = 0;
  assets.forEach(a => { const v = a.qty * a.price; if (v > maxValue) maxValue = v; });
  if (totalValue > 0 && (maxValue / totalValue) * 100 > 50) insights.push({
    text: es ? 'Una gran parte de tu cartera depende de un único activo.' : 'A large part of your portfolio depends on a single asset.',
    priority: 1,
  });

  // 2. Category exposure (priority 1)
  const byType = {};
  assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.qty * a.price; });
  for (const type in byType) {
    if (totalValue > 0 && (byType[type] / totalValue) * 100 > 60) {
      const label = (T[lang].typeMeta && T[lang].typeMeta[type]) || type;
      insights.push({
        text: es ? `Una parte importante de tu cartera está concentrada en ${label}.` : `A large part of your portfolio is concentrated in ${label}.`,
        priority: 1,
      });
      break;
    }
  }

  // 3. Strong performer — priority 2
  let strongPerformer = null;
  assets.forEach(a => {
    if (!a.costBasis || a.costBasis <= 0) return;
    if (((a.qty * a.price - a.costBasis) / a.costBasis) * 100 > 50) strongPerformer = a;
  });
  if (strongPerformer) insights.push({
    text: es ? `${escHtml(strongPerformer.name)} ha tenido un crecimiento notable respecto a tu precio de entrada.` : `${escHtml(strongPerformer.name)} has seen strong growth compared to your entry price.`,
    priority: 2,
  });

  // 4. Low liquidity — priority 2
  const liquidity = assets.filter(a => a.type === 'cash').reduce((s, a) => s + a.qty, 0);
  if (totalValue > 0 && liquidity / totalValue < 0.1) insights.push({
    text: es ? 'Una parte relativamente pequeña de tu cartera está en liquidez.' : 'A relatively small portion of your portfolio is held in liquidity.',
    priority: 2,
  });

  // 5. Recent activity — priority 3
  if (txs.length) {
    const last = txs[0];
    insights.push({
      text: last.type === 'buy'
        ? (es ? `Recientemente aumentaste tu posición en ${escHtml(last.assetName)}.` : `You recently increased your position in ${escHtml(last.assetName)}.`)
        : (es ? `Recientemente redujiste tu posición en ${escHtml(last.assetName)}.`  : `You recently reduced your position in ${escHtml(last.assetName)}.`),
      priority: 3,
    });
  }

  // 6. Enough transaction history — priority 3
  if (hasEnoughHistory()) insights.push({
    text: es ? 'Ya tienes suficiente historial para obtener insights más precisos.' : 'You now have enough history for more accurate insights.',
    priority: 3,
  });

  if (!insights.length) insights.push({
    text: es ? 'Tu cartera parece equilibrada. Puede ser conveniente revisarla periódicamente.' : 'Your portfolio appears balanced. It may be worth reviewing it periodically.',
    priority: 4,
  });

  return insights;
}

function getDaysSince(ts) {
  return (Date.now() - ts) / (1000 * 60 * 60 * 24);
}

function buildAssetTimeline(asset) {
  if (!asset.transactions || !asset.transactions.length) return null;
  const buys = asset.transactions.filter(tx => tx.type === 'buy');
  if (!buys.length || !asset.qty || asset.qty <= 0 || !asset.costBasis) return null;
  return {
    firstTs:      buys[0].ts,
    lastTs:       buys[buys.length - 1].ts,
    avgEntry:     asset.costBasis / asset.qty,
    currentPrice: asset.price,
  };
}

function detectRunUp(asset) {
  const es       = lang === 'es';
  const timeline = buildAssetTimeline(asset);
  if (!timeline || timeline.avgEntry <= 0) return null;
  const growth = ((timeline.currentPrice - timeline.avgEntry) / timeline.avgEntry) * 100;
  const days   = getDaysSince(timeline.firstTs);
  if (growth > 80 && days < 60) {
    return es
      ? `${escHtml(asset.name)} ha subido significativamente en un período relativamente corto.`
      : `${escHtml(asset.name)} has increased significantly over a relatively short period.`;
  }
  return null;
}

function detectStabilization(asset) {
  const es       = lang === 'es';
  const timeline = buildAssetTimeline(asset);
  if (!timeline || timeline.avgEntry <= 0) return null;
  const growth       = ((timeline.currentPrice - timeline.avgEntry) / timeline.avgEntry) * 100;
  const daysSinceLast = getDaysSince(timeline.lastTs);
  if (growth > 50 && daysSinceLast > 7) {
    return es
      ? `${escHtml(asset.name)} mostró un fuerte crecimiento pasado, aunque el movimiento reciente parece más estable.`
      : `${escHtml(asset.name)} has shown strong past growth, although recent movement appears more stable.`;
  }
  return null;
}

function detectAccumulation(asset) {
  const es   = lang === 'es';
  if (!asset.transactions) return null;
  const buys = asset.transactions.filter(tx => tx.type === 'buy');
  if (buys.length >= 3) {
    return es
      ? `Has incrementado tu posición en ${escHtml(asset.name)} en varias ocasiones.`
      : `You have increased your position in ${escHtml(asset.name)} multiple times over time.`;
  }
  return null;
}

function generateTemporalInsights() {
  const insights = [];
  assets.forEach(asset => {
    const runUp = detectRunUp(asset);
    if (runUp) insights.push({ text: runUp, priority: 2 });

    const stable = detectStabilization(asset);
    if (stable) insights.push({ text: stable, priority: 3 });

    const acc = detectAccumulation(asset);
    if (acc) insights.push({ text: acc, priority: 3 });
  });
  return insights;
}

function detectRepetition() {
  const es    = lang === 'es';
  const txs   = getAllTransactions();
  const count = {};
  txs.forEach(tx => { if (tx.type === 'buy') count[tx.assetName] = (count[tx.assetName] || 0) + 1; });
  for (const name in count) {
    if (count[name] >= 3) {
      return {
        text: es
          ? `Has incrementado tu posición en ${escHtml(name)} en varias ocasiones.`
          : `You have increased your position in ${escHtml(name)} multiple times over time.`,
        priority: 2,
      };
    }
  }
  return null;
}

function detectOveractivity() {
  const es     = lang === 'es';
  const txs    = getAllTransactions();
  const recent = txs.filter(tx => Date.now() - tx.ts < 3 * 24 * 60 * 60 * 1000);
  if (recent.length >= 5) {
    return {
      text: es
        ? 'Has sido bastante activo recientemente. Puede valer la pena asegurarte de que tus decisiones sigan alineadas con tu estrategia general.'
        : 'You have been quite active recently. It might be worth ensuring your decisions remain aligned with your broader strategy.',
      priority: 2,
    };
  }
  return null;
}

function detectConfidenceRisk() {
  const es            = lang === 'es';
  const pnl           = getPortfolioPnL();
  const concentration = getTopAssetExposure();
  if (pnl > 40 && concentration > 50) {
    return {
      text: es
        ? 'Una parte significativa de tu cartera ha rendido bien y está concentrada. Puede valer la pena considerar cómo esto afecta el riesgo general.'
        : 'A significant portion of your portfolio has performed well and is concentrated. It may be worth considering how this affects overall risk.',
      priority: 1,
    };
  }
  return null;
}

function detectInactivityAfterGrowth() {
  const es  = lang === 'es';
  const txs = getAllTransactions();
  if (!txs.length) return null;
  const days = getDaysSince(txs[0].ts);
  const pnl  = getPortfolioPnL();
  if (pnl > 30 && days > 10) {
    return {
      text: es
        ? 'Tu cartera ha tenido un buen rendimiento, mientras que la actividad ha sido limitada. Puede valer la pena revisar tu posicionamiento actual.'
        : 'Your portfolio has seen strong performance, while activity has remained limited. It may be worth reviewing your current positioning.',
      priority: 2,
    };
  }
  return null;
}

function generateBehaviorInsights() {
  const insights = [];
  const repetition = detectRepetition();
  if (repetition) insights.push(repetition);
  const overactivity = detectOveractivity();
  if (overactivity) insights.push(overactivity);
  const confidence = detectConfidenceRisk();
  if (confidence) insights.push(confidence);
  const inactivity = detectInactivityAfterGrowth();
  if (inactivity) insights.push(inactivity);
  return insights;
}

const PROFILE_KEY = 'aurix_user_profile';

function getProfile() {
  try { return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {}; } catch { return {}; }
}

function saveProfile(profile) {
  try { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)); } catch {}
}

function buildUserProfile() {
  const txs       = getAllTransactions();
  const now       = Date.now();
  const recentTxs = txs.filter(tx => now - tx.ts < 7 * 24 * 60 * 60 * 1000);
  const profile   = {};

  if (recentTxs.length > 5)      profile.activity = 'high';
  else if (recentTxs.length > 2) profile.activity = 'medium';
  else                           profile.activity = 'low';

  if (assets.length <= 2)      profile.diversification = 'low';
  else if (assets.length <= 5) profile.diversification = 'medium';
  else                         profile.diversification = 'high';

  const concentration = getTopAssetExposure();
  if (concentration > 60)      profile.risk = 'high';
  else if (concentration > 30) profile.risk = 'medium';
  else                         profile.risk = 'low';

  saveProfile(profile);
  return profile;
}

function adaptMessage(text, profile) {
  const es = lang === 'es';
  let result = text;

  if (profile.risk === 'high') {
    result = es
      ? result.replace('puede valer la pena considerar', 'puede valer la pena considerar cuidadosamente')
      : result.replace('may want to consider', 'may want to carefully consider');
  }

  if (profile.diversification === 'low') {
    result += es
      ? ' Una estructura más equilibrada podría ser beneficiosa a largo plazo.'
      : ' A more balanced structure could be beneficial over time.';
  }

  return result;
}

const BEHAVIOR_KEY = 'aurix_behavior';

function getBehavior() {
  try { return JSON.parse(localStorage.getItem(BEHAVIOR_KEY)) || {}; } catch { return {}; }
}

function saveBehavior(data) {
  try { localStorage.setItem(BEHAVIOR_KEY, JSON.stringify(data)); } catch {}
}

function analyzeBehavior() {
  const txs    = getAllTransactions();
  const now    = Date.now();
  const recent = txs.filter(tx => now - tx.ts < 7 * 24 * 60 * 60 * 1000);
  const beh    = { frequency: 'low', impulsive: false, longTerm: false };

  if (recent.length > 5)      beh.frequency = 'high';
  else if (recent.length > 2) beh.frequency = 'medium';

  if (recent.length >= 3) {
    const intervals = recent.map(tx => tx.ts).sort((a, b) => a - b)
      .map((t, i, arr) => i > 0 ? t - arr[i - 1] : null).filter(Boolean);
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avg < 2 * 60 * 60 * 1000) beh.impulsive = true;
  }

  const sells = txs.filter(tx => tx.type === 'sell');
  if (sells.length === 0 && txs.length > 5) beh.longTerm = true;

  saveBehavior(beh);
  return beh;
}

function adaptInsight(text) {
  const es = lang === 'es';
  const b  = getBehavior();

  if (b.frequency === 'high') {
    return text + (es
      ? ' Tomarse un momento para reflexionar puede ayudar a mantener el equilibrio.'
      : ' Taking time to reflect can help maintain balance.');
  }

  if (b.impulsive) {
    return es
      ? text.replace('ha incrementado', 'ha incrementado de forma progresiva')
      : text.replace('has increased', 'has increased steadily over time');
  }

  if (b.longTerm) {
    return text + (es
      ? ' Mantener la consistencia a lo largo del tiempo puede ser valioso.'
      : ' Maintaining consistency over time can be valuable.');
  }

  return text;
}

const DECISION_KEY = 'aurix_decisions';

function getDecisions() {
  try { return JSON.parse(localStorage.getItem(DECISION_KEY)) || []; } catch { return []; }
}

function saveDecisions(data) {
  try { localStorage.setItem(DECISION_KEY, JSON.stringify(data)); } catch {}
}

function recordBuy(tx, marketContext = {}) {
  const decisions = getDecisions();
  decisions.push({
    asset:   tx.assetName || tx.asset || '',
    price:   tx.price,
    ts:      tx.ts || Date.now(),
    context: { trend: marketContext.trend || 'unknown' },
  });
  saveDecisions(decisions.slice(-100));
}

function detectBehaviorPatterns() {
  const decisions = getDecisions();
  if (decisions.length < 3) return null;
  let buysInUptrend = 0;
  decisions.forEach(d => { if (d.context.trend === 'up') buysInUptrend++; });
  const ratio = buysInUptrend / decisions.length;
  if (ratio > 0.7) return { type: 'buying_high', strength: ratio };
  return null;
}

function generateDecisionInsight() {
  const es      = lang === 'es';
  const pattern = detectBehaviorPatterns();
  if (!pattern) return null;
  if (pattern.type === 'buying_high') {
    return {
      text: es
        ? 'Algunas de tus compras recientes se realizaron durante movimientos alcistas. Observar el timing a lo largo del tiempo puede aportar una perspectiva útil.'
        : 'Some of your recent purchases were made during upward price movements. Observing timing over time can provide useful perspective.',
      priority: 2,
    };
  }
  return null;
}

const NARRATIVE_KEY = 'aurix_narrative';

function getNarrativeMemory() {
  try { return JSON.parse(localStorage.getItem(NARRATIVE_KEY)) || []; } catch { return []; }
}

function saveNarrativeMemory(data) {
  try { localStorage.setItem(NARRATIVE_KEY, JSON.stringify(data)); } catch {}
}

function buildUserStory() {
  const story = {};
  getAllTransactions().forEach(tx => {
    if (!story[tx.assetName]) story[tx.assetName] = [];
    story[tx.assetName].push(tx);
  });
  return story;
}

function detectNarrativePatterns() {
  const es      = lang === 'es';
  const story   = buildUserStory();
  const insights = [];
  for (const asset in story) {
    const txs  = story[asset];
    if (txs.length < 3) continue;
    const buys = txs.filter(tx => tx.type === 'buy');
    if (buys.length >= 3) insights.push({
      text: es
        ? `Has ido incrementando gradualmente tu posición en ${escHtml(asset)} a lo largo del tiempo.`
        : `You have been gradually increasing your position in ${escHtml(asset)} over time.`,
      priority: 2,
    });
    const days = (txs[txs.length - 1].ts - txs[0].ts) / (1000 * 60 * 60 * 24);
    if (days > 30) insights.push({
      text: es
        ? `Tu posición en ${escHtml(asset)} se ha desarrollado a lo largo de un período prolongado.`
        : `Your position in ${escHtml(asset)} has developed over a longer period of time.`,
      priority: 3,
    });
  }
  return insights;
}

function shouldShowNarrative(text) {
  const memory = getNarrativeMemory();
  const limit  = 5 * 24 * 60 * 60 * 1000;
  const now    = Date.now();
  return !memory.find(m => m.text === text && (now - m.ts < limit));
}

function storeNarrative(text) {
  const memory = getNarrativeMemory();
  memory.push({ text, ts: Date.now() });
  saveNarrativeMemory(memory.slice(-20));
}

function generateNarrativeInsight() {
  const patterns = detectNarrativePatterns();
  for (const p of patterns) {
    if (shouldShowNarrative(p.text)) {
      storeNarrative(p.text);
      return p;
    }
  }
  return null;
}

const IDENTITY_KEY = 'aurix_identity';

function getIdentity() {
  try { return JSON.parse(localStorage.getItem(IDENTITY_KEY)) || {}; } catch { return {}; }
}

function saveIdentity(data) {
  try { localStorage.setItem(IDENTITY_KEY, JSON.stringify(data)); } catch {}
}

function buildIdentityProfile() {
  const txs    = getAllTransactions();
  const profile = { style: 'balanced' };
  if (txs.length > 20)    profile.style = 'active';
  if (assets.length <= 2) profile.style = 'concentrated';
  saveIdentity(profile);
  return profile;
}

function applyIdentityTone(text) {
  const es       = lang === 'es';
  const identity = getIdentity();
  if (identity.style === 'active') {
    return es
      ? text.replace('puede valer la pena', 'puede valer la pena ocasionalmente')
      : text.replace('may be worth', 'it may be worth occasionally');
  }
  if (identity.style === 'concentrated') {
    return text + (es
      ? ' Una estructura más diversificada podría considerarse a lo largo del tiempo.'
      : ' A more diversified structure could be considered over time.');
  }
  return text;
}

function generateSignatureInsight() {
  const es       = lang === 'es';
  const identity = getIdentity();
  if (identity.style === 'active') {
    return {
      text: es
        ? 'Tu enfoque muestra un alto nivel de actividad, lo que puede beneficiarse de una reflexión periódica.'
        : 'Your approach shows a high level of activity, which may benefit from periodic reflection.',
      priority: 3,
    };
  }
  if (identity.style === 'concentrated') {
    return {
      text: es
        ? 'Tu cartera parece enfocada en un número limitado de posiciones, lo que influye en su comportamiento general.'
        : 'Your portfolio appears focused on a limited number of positions, shaping its overall behavior.',
      priority: 3,
    };
  }
  return {
    text: es
      ? 'Tu cartera refleja un enfoque equilibrado a lo largo del tiempo.'
      : 'Your portfolio reflects a balanced approach over time.',
    priority: 3,
  };
}

const SILENCE_KEY = 'aurix_silence';

function getSilenceMemory() {
  try { return JSON.parse(localStorage.getItem(SILENCE_KEY)) || {}; } catch { return {}; }
}

function saveSilenceMemory(data) {
  try { localStorage.setItem(SILENCE_KEY, JSON.stringify(data)); } catch {}
}

function shouldSpeak(insights) {
  const memory     = getSilenceMemory();
  const hoursSince = (Date.now() - (memory.lastSpoken || 0)) / (1000 * 60 * 60);
  if (hoursSince < 6)                          return false;
  if (!insights.length)                        return false;
  if (!insights.some(i => i.priority <= 2))    return false;
  return true;
}

function markSpoken() {
  const memory = getSilenceMemory();
  memory.lastSpoken = Date.now();
  saveSilenceMemory(memory);
}

function getSilentMessage() {
  const es = lang === 'es';
  return {
    text: es
      ? 'Todo parece estable. Puedes revisar tu cartera cuando lo consideres oportuno.'
      : 'Everything appears stable. You may revisit your portfolio when needed.',
    priority: 4,
    silent: true,
  };
}

const WOW_KEY = 'aurix_wow';

function getWowMemory() {
  try { return JSON.parse(localStorage.getItem(WOW_KEY)) || []; } catch { return []; }
}

function saveWowMemory(data) {
  try { localStorage.setItem(WOW_KEY, JSON.stringify(data)); } catch {}
}

function hasSeenWow(text) { return getWowMemory().includes(text); }

function storeWow(text) {
  const memory = getWowMemory();
  memory.push(text);
  saveWowMemory(memory.slice(-20));
}

function detectWowInsights() {
  const es     = lang === 'es';
  const total  = getTotalPortfolioValue();
  const txs    = getAllTransactions();
  const insights = [];

  // 1. Gains concentration — priority 1
  let topGain = null, topValue = 0;
  assets.forEach(a => {
    if (!a.costBasis) return;
    const pnl = a.qty * a.price - a.costBasis;
    if (pnl > topValue) { topValue = pnl; topGain = a; }
  });
  if (topGain && total > 0 && topValue > total * 0.3) insights.push({
    text: es
      ? `Una parte significativa del crecimiento de tu cartera parece provenir de ${escHtml(topGain.name)}.`
      : `A significant portion of your portfolio growth appears to come from ${escHtml(topGain.name)}.`,
    priority: 1,
  });

  // 2. Buying into strength — priority 1
  const repeatedBuys = {};
  txs.forEach(tx => { if (tx.type === 'buy') repeatedBuys[tx.assetName] = (repeatedBuys[tx.assetName] || 0) + 1; });
  for (const name in repeatedBuys) {
    if (repeatedBuys[name] >= 4) {
      insights.push({
        text: es
          ? `Has incrementado tu posición en ${escHtml(name)} de forma consistente, incluso a medida que su valor evolucionaba.`
          : `You have consistently increased your position in ${escHtml(name)}, even as its value evolved.`,
        priority: 1,
      });
      break;
    }
  }

  // 3. Structure stability — priority 2
  if (assets.length >= 3) insights.push({
    text: es
      ? 'La estructura de tu cartera se ha mantenido relativamente estable a lo largo del tiempo.'
      : 'Your portfolio structure has remained relatively stable over time.',
    priority: 2,
  });

  return insights;
}

function getWowInsight() {
  const candidates = detectWowInsights();
  for (const c of candidates) {
    if (!hasSeenWow(c.text)) { storeWow(c.text); return c; }
  }
  return null;
}

function generateInsights() {
  const profile   = buildUserProfile();
  buildIdentityProfile();
  analyzeBehavior();
  const wow       = getWowInsight();
  const base      = generateBaseInsights();
  const temporal  = generateTemporalInsights();
  const behavior  = generateBehaviorInsights();
  const decision  = generateDecisionInsight();
  const narrative = generateNarrativeInsight();
  const signature = generateSignatureInsight();
  const all       = [
    ...(wow ? [wow] : []),
    ...base, ...temporal, ...behavior,
    ...(decision  ? [decision]  : []),
    ...(narrative ? [narrative] : []),
    signature,
  ];
  all.sort((a, b) => a.priority - b.priority);

  const filtered = all.filter(i => !wasRecentlyShown(i.text));
  const pool     = (filtered.length ? filtered : all).slice(0, 5).map(i => ({
    ...i,
    text: applyIdentityTone(adaptInsight(adaptMessage(i.text, profile))),
  }));

  if (!shouldSpeak(pool)) {
    insightCache = [getSilentMessage()];
    return insightCache;
  }

  markSpoken();
  insightCache = pool;
  return insightCache;
}

function getNextInsight() {
  const pool = insightCache.length ? insightCache : generateInsights();
  if (!pool.length) return '';
  const insight = pool[insightIndex % pool.length];
  insightIndex++;
  storeInsight(insight.text);
  return insight.text;
}

function updateMonsterText(lineEl, newText) {
  if (!lineEl) return;
  lineEl.classList.add('fade-out');
  setTimeout(() => {
    lineEl.textContent = newText;
    lineEl.classList.remove('fade-out');
    lineEl.classList.add('fade-in');
    setTimeout(() => { lineEl.classList.remove('fade-in'); }, 800);
  }, 600);
}

function getInsightTone(text) {
  const t = text.toLowerCase();
  if (t.includes('large part')  || t.includes('concentrated') ||
      t.includes('liquidity')   || t.includes('concentrad')   ||
      t.includes('liquidez')    || t.includes('gran parte')) return 'soft-caution';
  if (t.includes('increased')   || t.includes('strong')       ||
      t.includes('recent')      || t.includes('incrementad')  ||
      t.includes('crecimiento') || t.includes('notable')      ||
      t.includes('recientemente')) return 'soft-positive';
  return 'default';
}

function setMonsterTone(el, tone) {
  el.classList.remove('soft-caution', 'soft-positive');
  if (tone !== 'default') el.classList.add(tone);
}

function animateMonster(elOrb, elText) {
  if (!elOrb || !elText) return;
  const next = getNextInsight();
  const tone = getInsightTone(next);
  setMonsterTone(elOrb, tone);
  elOrb.classList.add('active');
  setTimeout(() => {
    updateMonsterText(elText, next);
    setTimeout(() => { elOrb.classList.remove('active'); }, 1200);
  }, 600);
  setTimeout(() => { setMonsterTone(elOrb, 'default'); }, 4000);
}

function applySubtleVariation(el) {
  if (!el || el.classList.contains('active')) return;
  const scale      = 1 + Math.random() * 0.01;
  const brightness = 0.95 + Math.random() * 0.1;
  el.style.transform = `scale(${scale})`;
  el.style.filter    = `brightness(${brightness})`;
  setTimeout(() => { el.style.transform = ''; el.style.filter = ''; }, 2000);
}

setInterval(() => { applySubtleVariation(document.querySelector('.monster-orb')); }, 10000);

function startInsightRotation() {
  if (_insightInterval) { clearInterval(_insightInterval); _insightInterval = null; }
  const orb  = () => document.querySelector('.monster-orb');
  const line = () => document.querySelector('.monster-line');
  setTimeout(() => { animateMonster(orb(), line()); }, 1000);
  _insightInterval = setInterval(() => { animateMonster(orb(), line()); }, 7000);
}

function getTopAssetExposure() {
  let total = 0, max = 0;
  assets.forEach(a => {
    const v = a.qty * a.price;
    total += v;
    if (v > max) max = v;
  });
  return total ? (max / total) * 100 : 0;
}

function getDiversificationScore() {
  return assets.length;
}

function getPortfolioPnL() {
  let value = 0, cost = 0;
  assets.forEach(a => {
    value += a.qty * a.price;
    cost  += a.costBasis || 0;
  });
  return cost ? ((value - cost) / cost) * 100 : 0;
}

function getRecentTransactions(days = 7) {
  const limit = days * 24 * 60 * 60 * 1000;
  return getAllTransactions().filter(tx => Date.now() - tx.ts < limit);
}

function getMonsterState() {
  const pnl = getPortfolioPnL();
  if (pnl < -20) return 'bad';
  if (pnl <   5) return 'neutral';
  return 'good';
}

function toggleAllTx() {
  showAllTx = !showAllTx;
  switchTab('insights');
}

function renderInsights() {
  generateInsights();
  return `
    <div class="insights-screen">
      <div class="insights-hero">
        <div class="monster-container">
          <div class="monster-orb"></div>
        </div>
        <div class="monster-message" id="monsterMsg">
          <div class="monster-line"></div>
        </div>
      </div>
    </div>`;
}

// ── Bottom nav ─────────────────────────────────────────────
const TAB_KEYS = { home: 'tabHome', insights: 'tabInsights', market: 'tabMarket', profile: 'tabProfile' };

function updateBottomNavActive() {
  document.querySelectorAll('#bottomNav .bn-tab[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === currentTab);
    const span = btn.querySelector('span');
    if (span) span.textContent = T[lang][TAB_KEYS[btn.dataset.tab]] || btn.dataset.tab;
  });
}

function switchTab(tab) {
  currentTab = tab;
  if (_insightInterval) { clearInterval(_insightInterval); _insightInterval = null; }
  const mainEl      = document.querySelector('main');
  const placeholder = document.getElementById('tabPlaceholder');
  if (tab === 'home') {
    mainEl.style.display      = '';
    placeholder.style.display = 'none';
    render();
  } else {
    mainEl.style.display  = 'none';
    placeholder.innerHTML = tab === 'insights'
      ? renderInsights()
      : `<p class="placeholder-label">${tab.charAt(0).toUpperCase() + tab.slice(1)}</p>`;
    placeholder.style.display = '';
    if (tab === 'insights') {
      startInsightRotation();
    }
    updateBottomNavActive();
  }
}

// ── Render ─────────────────────────────────────────────────
function render(animate = false) {
  assets.forEach(asset => {
    migrateLegacyAssetToTransactions(asset);
    sanitizeTransactionPrices(asset);
    syncQtyFromTransactions(asset);
    syncCostBasisFromTransactions(asset);
  });
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

  const categoryValue = activeCategory
    ? filtered.reduce((s, a) => s + toBase(assetNativeValue(a), (a.assetCurrency || 'USD').toUpperCase()), 0)
    : 0;

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

    const darActionsHtml = actionsHtml;

    const txInfo = (() => {
      const buys = (asset.transactions || []).filter(tx => tx.type === 'buy');
      if (!buys.length) return '';
      const avg         = avgBuyPrice(asset);
      const totalBought = buys.reduce((s, tx) => s + tx.qty, 0);
      const avgFmt      = avg != null ? formatCurrency(avg, assetCurr) : '—';
      return `<div class="dar-tx-info">∅ ${avgFmt}</div>`;
    })();

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
        ${buildBadgeHtml(asset, badgeText, 'dar-badge')}
        <div class="dar-info">
          <div class="dar-name">${escHtml(getDisplayName(asset))}</div>
          <div class="dar-sub">${darSubHtml}</div>
          ${txInfo}
        </div>
        <div class="dar-right">
          <div class="dar-value ${flashClass}"${prevValueBase != null ? ` data-from="${prevValueBase.toFixed(6)}" data-to="${valueBase.toFixed(6)}"` : ''}>${formatBase(valueBase)}</div>
          ${categoryValue > 0 ? `<span class="dar-cat-pct">${((valueBase / categoryValue) * 100).toFixed(1)}%</span>` : ''}
          ${darChangeHtml}
          ${pnlData ? `<span class="dar-pnl ${pnlData.abs >= 0 ? 'up' : 'down'}">${pnlData.abs >= 0 ? '+' : '−'}${formatBase(Math.abs(pnlData.abs))} (${pnlData.abs >= 0 ? '+' : '−'}${Math.abs(pnlData.pct).toFixed(1)}%)</span>` : ''}
          <div class="dar-actions">${darActionsHtml}</div>
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
      ${buildBadgeHtml(asset, badgeText)}
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
  updateBottomNavActive();
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function getAssetLogo(symbol, type) {
  const sym = symbol.toLowerCase().trim();
  if (type === 'crypto') {
    const clean = CLEAN_LOGO_OVERRIDE[symbol.toUpperCase().trim()];
    if (clean) return clean;
    return `https://cdn.jsdelivr.net/gh/spothq/cryptocurrency-icons@master/32/color/${sym}.png`;
  }
  if (type === 'stock' || type === 'etf') {
    return `https://financialmodelingprep.com/image-stock/${symbol.toUpperCase().trim()}.png`;
  }
  return null;
}

// ── Logo resolution helpers ─────────────────────────────────

async function _loadCgMap() {
  if (_cgMap) return _cgMap;
  try {
    const raw = localStorage.getItem('_cg_map');
    if (raw) { _cgMap = JSON.parse(raw); return _cgMap; }
    const data = await (await fetch('https://api.coingecko.com/api/v3/coins/list')).json();
    _cgMap = {};
    data.forEach(c => { if (c.symbol) _cgMap[c.symbol.toLowerCase()] = c.id; });
    try { localStorage.setItem('_cg_map', JSON.stringify(_cgMap)); } catch {}
  } catch { _cgMap = {}; }
  return _cgMap;
}

async function _fetchLogoFromCG(sym) {
  if (sym in LOGO_CACHE) return LOGO_CACHE[sym];
  const lsKey  = `_logo_${sym}`;
  const cached = localStorage.getItem(lsKey);
  if (cached !== null) { LOGO_CACHE[sym] = cached || null; return LOGO_CACHE[sym]; }
  try {
    const id = (await _loadCgMap())[sym];
    if (!id) { LOGO_CACHE[sym] = null; try { localStorage.setItem(lsKey, ''); } catch {} return null; }
    const data = await (await fetch(`https://api.coingecko.com/api/v3/coins/${id}`)).json();
    const url  = data?.image?.small || null;
    LOGO_CACHE[sym] = url;
    try { localStorage.setItem(lsKey, url || ''); } catch {}
    return url;
  } catch { LOGO_CACHE[sym] = null; return null; }
}

function _logoFallback(img) {
  const step = parseInt(img.dataset.fallbackStep || '0', 10);
  const sym  = (img.dataset.key || '').toLowerCase().trim();
  if (step === 0) {
    // spothq failed → atomiclabs
    img.dataset.fallbackStep = '1';
    img.src = `https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@master/32/color/${sym}.png`;
  } else if (step === 1) {
    // atomiclabs failed → CoinGecko (async, cached)
    img.dataset.fallbackStep = '2';
    img.onerror = null;
    _fetchLogoFromCG(sym).then(url => {
      if (url) {
        img.src = url;
        img.onload  = () => img.classList.add('loaded');
        img.onerror = () => _logoFinalHide(img);
      } else {
        _logoFinalHide(img);
      }
    });
  } else {
    _logoFinalHide(img);
  }
}

function createFallback(sym) {
  const div = document.createElement('div');
  div.className = 'logo-fallback';
  div.textContent = (sym[0] || '?').toUpperCase();
  return div;
}

function _logoFinalHide(img) {
  const sym = (img.dataset.key || '').trim();
  if (sym && img.closest('.cat-card-visual')) {
    img.style.display = 'none';
    img.parentElement.appendChild(createFallback(sym));
  } else {
    img.style.display = 'none';
    if (img.parentElement) img.parentElement.classList.remove('badge--has-logo');
  }
}

function getAssetLogoUrl(asset) {
  return getAssetLogo(asset.ticker, asset.type);
}

function buildBadgeHtml(asset, badgeText, cls = 'asset-badge') {
  const logoUrl = getAssetLogoUrl(asset);
  if (logoUrl) {
    const isCrypto = asset.type === 'crypto';
    const sym      = escHtml(asset.ticker.toLowerCase().trim());
    const extra    = isCrypto ? ` data-key="${sym}" data-step="0"` : '';
    const onErr    = isCrypto
      ? `_logoFallback(this)`
      : `this.parentElement.classList.remove('badge--has-logo')`;
    return `<div class="${cls} ${asset.type} badge--has-logo">` +
      `<img class="asset-badge-logo" src="${logoUrl}" alt="" loading="lazy" aria-hidden="true"` +
      `${extra} onerror="${onErr}">` +
      `<span class="asset-badge-text">${badgeText}</span>` +
      `</div>`;
  }
  return `<div class="${cls} ${asset.type}">${badgeText}</div>`;
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
        transactions:  [{ type: 'buy', qty, price: price > 0 ? price : 1, ts: Date.now() }],
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
    if (!existing.transactions) existing.transactions = [];
    existing.transactions.push({ type: 'buy', qty, price: pendingPrice, ts: Date.now() });
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
      transactions:  [{ type: 'buy', qty, price: pendingPrice, ts: Date.now() }],
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
    ${buildBadgeHtml(asset, badgeText)}
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
    ${buildBadgeHtml(asset, badgeText)}
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

function validateTransaction(asset, tx) {
  syncQtyFromTransactions(asset);
  const qty   = Number(tx.qty)   || 0;
  const price = Number(tx.price) || 0;
  if (qty   <= 0) { alert('Cantidad inválida');  return false; }
  if (price <= 0) { alert('Precio inválido');    return false; }
  if (tx.type === 'sell') {
    const currentQty = asset.qty || 0;
    if (qty > currentQty) { alert(`No puedes vender más de lo que tienes (${currentQty})`); return false; }
  }
  return true;
}

// ── Transaction system ─────────────────────────────────────
function addTransaction(assetId, type, qty, price) {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return;
  if (!asset.transactions) asset.transactions = [];
  const tx = { type, qty, price, ts: Date.now(), assetName: asset.name };
  asset.transactions.push(tx);
  if (type === 'buy') recordBuy(tx);
  save();
}

let _txAssetId       = null;
let _editingTxIndex  = null;
const txOverlay    = document.getElementById('txOverlay');
const txForm       = document.getElementById('txForm');
const txQtyInput   = document.getElementById('txQty');
const txPriceInput = document.getElementById('txPrice');
const txErrorEl    = document.getElementById('txError');
const txTypeHidden = document.getElementById('txTypeHidden');

function openTxModal(assetId) {
  _txAssetId = assetId;
  txForm.reset();
  txTypeHidden.value = 'buy';
  document.querySelectorAll('#txTypeToggle [data-txtype]')
    .forEach(b => b.classList.toggle('active', b.dataset.txtype === 'buy'));
  txErrorEl.textContent = '';
  const asset = assets.find(a => a.id === assetId);
  if (asset && asset.price && !isNaN(asset.price)) {
    txPriceInput.value = asset.price;
  }
  txOverlay.classList.add('open');
  document.body.classList.add('modal-open');
  setTimeout(() => txQtyInput.focus(), 50);
}

function closeTxModal() {
  txOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  _txAssetId      = null;
  _editingTxIndex = null;
}

document.getElementById('txClose').addEventListener('click', closeTxModal);
txOverlay.addEventListener('click', e => { if (e.target === txOverlay) closeTxModal(); });

document.querySelectorAll('#txTypeToggle [data-txtype]').forEach(btn => {
  btn.addEventListener('click', () => {
    txTypeHidden.value = btn.dataset.txtype;
    document.querySelectorAll('#txTypeToggle [data-txtype]')
      .forEach(b => b.classList.toggle('active', b === btn));
  });
});

txForm.addEventListener('submit', e => {
  e.preventDefault();
  if (!_txAssetId) return;
  const qty   = parseLocalFloat(txQtyInput.value);
  const price = normalizePriceInput(txPriceInput.value);
  if (isNaN(qty)   || qty   <= 0) { txQtyInput.focus();   return; }
  if (isNaN(price) || price <= 0) { txPriceInput.focus(); return; }

  const asset = assets.find(a => a.id === _txAssetId);
  if (!asset) return;
  if (!validateTransaction(asset, { type: txTypeHidden.value, qty, price })) return;

  if (_editingTxIndex !== null) {
    if (asset.transactions && asset.transactions[_editingTxIndex]) {
      const originalTs = asset.transactions[_editingTxIndex].ts;
      asset.transactions[_editingTxIndex] = {
        type:  txTypeHidden.value,
        qty,
        price,
        ts:    originalTs,
      };
      syncCostBasisFromTransactions(asset);
      save();
      render();
      const editedAssetId = _txAssetId;
      closeTxModal();
      openAssetDetailModal(editedAssetId);
    }
  } else {
    const addedAssetId = _txAssetId;
    addTransaction(_txAssetId, txTypeHidden.value, qty, price);
    render();
    closeTxModal();
    openAssetDetailModal(addedAssetId);
  }
});

// ── Asset detail modal ─────────────────────────────────────
const assetDetailOverlay = document.getElementById('assetDetailOverlay');

function openAssetDetailModal(assetId) {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return;
  syncCostBasisFromTransactions(asset);

  const isRE   = asset.type === 'real_estate';
  const isCash = asset.type === 'cash';
  const assetCurr = (asset.assetCurrency || 'USD').toUpperCase();

  document.getElementById('adName').textContent = getDisplayName(asset);

  // Price row (hide for real estate / cash where price isn't meaningful)
  const priceRow = document.getElementById('adPrice').closest('.ad-row');
  if (isRE || isCash) {
    priceRow.style.display = 'none';
  } else {
    priceRow.style.display = '';
    document.getElementById('adPrice').textContent =
      asset.price != null ? formatCurrency(asset.price, assetCurr) : '—';
  }

  // Total value
  const valueBase = assetNativeValue(asset);
  document.getElementById('adValue').textContent =
    valueBase != null ? formatBase(toBase(valueBase, assetCurr)) : '—';
  document.getElementById('adValueLabel').textContent =
    lang === 'es' ? 'Valor total' : 'Total value';

  // PnL
  const pnl = assetPnLBase(asset);
  const pnlEl  = document.getElementById('adPnL');
  const pnlRow = document.getElementById('adPnLRow');
  if (pnl) {
    const sign = pnl.abs >= 0 ? '+' : '';
    pnlEl.textContent = `${sign}${formatBase(pnl.abs)} (${sign}${pnl.pct.toFixed(2)}%)`;
    pnlEl.className = 'ad-value ' + (pnl.abs >= 0 ? 'ad-value--pos' : 'ad-value--neg');
    pnlRow.style.display = '';
  } else {
    pnlRow.style.display = 'none';
  }

  // Transactions section
  const txSection = document.getElementById('adTxSection');
  const txList    = document.getElementById('adTxList');
  const addTxBtn  = document.getElementById('adAddTx');
  document.getElementById('adTxTitle').textContent =
    lang === 'es' ? 'Transacciones' : 'Transactions';
  addTxBtn.textContent = lang === 'es' ? '+ Añadir' : '+ Add';

  if (isRE || isCash) {
    txSection.style.display = 'none';
  } else {
    txSection.style.display = '';
    const txs = asset.transactions || [];
    txList.dataset.assetId = assetId;
    if (!txs.length) {
      txList.innerHTML = `<div class="ad-tx-empty">${lang === 'es' ? 'Sin transacciones' : 'No transactions'}</div>`;
    } else {
      txList.innerHTML = txs.map((tx, i) => {
        const date  = new Date(tx.ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const label = tx.type === 'buy'
          ? (lang === 'es' ? 'Compra' : 'Buy')
          : (lang === 'es' ? 'Venta' : 'Sell');
        const cls   = tx.type === 'buy' ? 'tx-buy' : 'tx-sell';
        return `<div class="ad-tx-row">
          <span class="ad-tx-badge ${cls}">${label}</span>
          <div class="ad-tx-detail">
            <span class="ad-tx-qty">${formatQty(tx.qty)}</span>
            <span class="ad-tx-sub">@ ${formatCurrency(tx.price, assetCurr)} · ${date}</span>
          </div>
          <button class="ad-tx-edit"   data-index="${i}" title="${lang === 'es' ? 'Editar' : 'Edit'}">✎</button>
          <button class="ad-tx-delete" data-index="${i}" title="${lang === 'es' ? 'Eliminar' : 'Delete'}">✕</button>
        </div>`;
      }).reverse().join('');
    }
    addTxBtn.dataset.id = assetId;
  }

  assetDetailOverlay.classList.add('open');
  document.body.classList.add('modal-open');
}

function closeAssetDetailModal() {
  assetDetailOverlay.classList.remove('open');
  document.body.classList.remove('modal-open');
  render();
}

document.getElementById('adClose').addEventListener('click', closeAssetDetailModal);
assetDetailOverlay.addEventListener('click', e => {
  if (e.target === assetDetailOverlay) closeAssetDetailModal();
});
document.getElementById('adAddTx').addEventListener('click', function () {
  const id = this.dataset.id;
  closeAssetDetailModal();
  if (id) openTxModal(id);
});

document.getElementById('adTxList').addEventListener('click', e => {
  const assetId = document.getElementById('adTxList').dataset.assetId;
  const asset   = assets.find(a => a.id === assetId);

  const editBtn = e.target.closest('.ad-tx-edit');
  if (editBtn) {
    if (!asset || !asset.transactions) return;
    const idx = parseInt(editBtn.dataset.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= asset.transactions.length) return;
    const tx = asset.transactions[idx];
    _editingTxIndex = idx;
    closeAssetDetailModal();
    openTxModal(assetId);
    txQtyInput.value   = tx.qty;
    txPriceInput.value = tx.price;
    txTypeHidden.value = tx.type;
    document.querySelectorAll('#txTypeToggle [data-txtype]')
      .forEach(b => b.classList.toggle('active', b.dataset.txtype === tx.type));
    return;
  }

  const delBtn = e.target.closest('.ad-tx-delete');
  if (delBtn) {
    if (!asset || !asset.transactions) return;
    const idx = parseInt(delBtn.dataset.index, 10);
    if (isNaN(idx) || idx < 0 || idx >= asset.transactions.length) return;
    asset.transactions.splice(idx, 1);
    syncCostBasisFromTransactions(asset);
    save();
    render();
    openAssetDetailModal(assetId);
  }
});

// Delegate clicks on asset cards / detail rows → detail modal
assetsListEl.addEventListener('click', e => {
  if (justDragged) return;
  if (e.target.closest('button') || e.target.closest('.asset-edit-strip')) return;
  const card = e.target.closest('.asset-card, .detail-asset-row');
  if (card) openAssetDetailModal(card.dataset.assetId);
});

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
    closeAssetDetailModal();
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
setInterval(refreshPrices, 30_000);         // 30 s — unified atomic price update
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

// ── Cat-card drag & drop ────────────────────────────────────
(function initCatCardDragDrop() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;

  function saveCatOrder() {
    _catOrder = [...grid.querySelectorAll('.cat-card[data-type]')].map(c => c.dataset.type);
    localStorage.setItem(CAT_ORDER_KEY, JSON.stringify(_catOrder));
  }

  // active:  hold timer has fired, drag is armed
  // started: card has actually moved (real drag, not a tap)
  let drag = {
    active: false,
    started: false,
    card: null,
    startX: 0,
    startY: 0,
    pressTimer: null,
  };

  function cleanup() {
    if (!drag.card) return;

    drag.card.style.transform     = '';
    drag.card.style.zIndex        = '';
    drag.card.style.transition    = '';
    drag.card.style.boxShadow     = '';
    drag.card.style.pointerEvents = '';
    drag.card.classList.remove('dragging');

    drag = {
      active: false,
      started: false,
      card: null,
      startX: 0,
      startY: 0,
      pressTimer: null,
    };

    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup',   onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);

    // Restore scroll immediately after any drag interaction ends
    document.body.style.touchAction = 'auto';
  }

  // pointercancel fires when the browser takes over the gesture (e.g. scroll).
  // Clear the timer so drag never activates after a scroll starts.
  function onPointerCancel() {
    clearTimeout(drag.pressTimer);
    drag.card = null;
    window.removeEventListener('pointermove',   onPointerMove);
    window.removeEventListener('pointerup',     onPointerUp);
    window.removeEventListener('pointercancel', onPointerCancel);
  }

  function onPointerMove(e) {
    if (!drag.active) return;  // pointermove is only attached after hold, but guard anyway

    // Block scroll only while the card is actually being dragged
    e.preventDefault();

    drag.started = true;
    const card = drag.card;
    if (!card) return;
    card.style.transform =
      `translate(${e.clientX - drag.startX}px, ${e.clientY - drag.startY}px) scale(1.05)`;
  }

  function onPointerUp(e) {
    if (!drag.card) return;

    clearTimeout(drag.pressTimer);

    // Release any pointer capture so the browser resumes normal touch routing
    try { drag.card.releasePointerCapture(e.pointerId); } catch (_) {}

    const card = drag.card;

    if (!drag.started) {
      // Tap — let existing touchend/click handlers open the card
      cleanup();
      return;
    }

    // Real drag — ensure card is transparent so elementFromPoint sees through it
    card.style.pointerEvents = 'none';
    const el     = document.elementFromPoint(e.clientX, e.clientY);
    card.style.pointerEvents = '';
    const target = el?.closest('.cat-card[data-type]');

    if (target && target !== card) {
      const parent = card.parentNode;
      const nextA  = card.nextSibling;
      const nextB  = target.nextSibling;
      parent.insertBefore(card,   nextB);
      parent.insertBefore(target, nextA);
      saveCatOrder();
    }

    // Block the pointerup from propagating and prevent any default click action
    e.preventDefault();
    e.stopPropagation();

    // Set global flag — the document capture listener will swallow any click
    // that the browser fires in the next 100 ms as a result of this gesture
    justDragged = true;
    setTimeout(() => { justDragged = false; }, 150);

    cleanup();

    // Safety: ensure scroll is re-enabled even if cleanup had an edge case
    setTimeout(() => { document.body.style.touchAction = 'auto'; }, 50);
  }

  const isMobile = 'ontouchstart' in window;

  // ── Touch path (mobile) ────────────────────────────────────────────────────

  // Hard reset — always clears state regardless of intermediate failures
  function resetDrag() {
    clearTimeout(drag.pressTimer);
    if (drag.card) {
      drag.card.style.transform     = '';
      drag.card.style.zIndex        = '';
      drag.card.style.transition    = '';
      drag.card.style.boxShadow     = '';
      drag.card.style.pointerEvents = '';
      drag.card.classList.remove('dragging');
    }
    drag.active  = false;
    drag.started = false;
    drag.card    = null;
    document.body.style.touchAction = 'auto';
  }

  function onTouchStart(e) {
    if (activeCategory) return;
    if (drag.active) return;          // guard: another drag already armed
    drag.card = null;                 // clear any stale reference before starting
    const card = e.target.closest('.cat-card');
    if (!card) return;
    const touch = e.touches[0];
    drag.card    = card;
    drag.startX  = touch.clientX;
    drag.startY  = touch.clientY;
    drag.active  = false;
    drag.started = false;

    // Instant press feedback — user feels the touch immediately
    card.style.transition = 'transform 0.08s ease';
    card.style.transform  = 'scale(0.96)';
    if (navigator.vibrate) navigator.vibrate(5);

    drag.pressTimer = setTimeout(() => {
      if (!drag.card) return;
      drag.active                     = true;
      document.body.style.touchAction = 'none';
      card.style.transition           = 'all 0.15s ease';
      card.style.transform            = 'scale(1.05)';
      card.style.boxShadow            = '0 12px 30px rgba(0,0,0,0.25)';
      card.style.zIndex               = '9999';
      card.style.pointerEvents        = 'none';
      card.classList.add('dragging');
      if (navigator.vibrate) navigator.vibrate(15); // stronger pulse = drag armed
    }, 1500); // 1.5 s hold — optimal balance of speed and intent
  }

  function onTouchMove(e) {
    if (!drag.card) return;

    const touch = e.touches[0];
    const dx = touch.clientX - drag.startX;
    const dy = touch.clientY - drag.startY;

    // Any movement before the hold completes → cancel drag, let browser scroll
    if (!drag.active) {
      if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
        clearTimeout(drag.pressTimer);
        drag.card.style.transform = '';
        drag.card.style.transition = '';
        drag.card = null;
      }
      return;
    }

    // Hold confirmed — track the card
    drag.started = true;
    e.preventDefault();
    drag.card.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
  }

  function onTouchEnd(e) {
    clearTimeout(drag.pressTimer);
    if (!drag.card) return;
    // Released before hold completed — snap scale back
    if (!drag.active) {
      drag.card.style.transform  = '';
      drag.card.style.transition = '';
      drag.card = null;
      return;
    }
    if (drag.started) {
      const touch  = e.changedTouches[0];
      const el     = document.elementFromPoint(touch.clientX, touch.clientY);
      const target = el?.closest('.cat-card[data-type]');
      if (target && target !== drag.card) {
        const parent = drag.card.parentNode;
        const nextA  = drag.card.nextSibling;
        const nextB  = target.nextSibling;
        parent.insertBefore(drag.card, nextB);
        parent.insertBefore(target,    nextA);
        saveCatOrder();
      }
      justDragged = true;
      setTimeout(() => { justDragged = false; }, 150);
    }
    resetDrag();
  }

  // ── Pointer path (desktop) ──────────────────────────────────────────────────

  function onPointerDown(e) {
    if (activeCategory) return;        // disabled in category detail view
    if (drag.card) return;             // interaction already in progress
    const card = e.target.closest('.cat-card');
    if (!card) return;

    drag.card    = card;
    drag.startX  = e.clientX;
    drag.startY  = e.clientY;
    drag.started = false;
    drag.active  = false;

    // Arm drag after 220 ms hold. pointermove is intentionally NOT attached
    // here — adding it on pointerdown would make window non-passive and block
    // scroll even for taps. The browser scrolls freely until hold confirms drag.
    drag.pressTimer = setTimeout(() => {
      if (!drag.card) return; // cancelled by pointercancel before timer fired
      drag.active                     = true;
      document.body.style.touchAction = 'none';
      card.style.zIndex               = '9999';
      card.style.transition           = 'none';
      card.style.pointerEvents        = 'none';
      card.classList.add('dragging');
      // Only now attach pointermove — the non-passive listener no longer
      // blocks scroll because drag is already confirmed
      window.addEventListener('pointermove', onPointerMove);
    }, 220);

    // pointerup handles tap/drop; pointercancel handles browser-scroll takeover
    window.addEventListener('pointerup',     onPointerUp);
    window.addEventListener('pointercancel', onPointerCancel);
  }

  // ── Register whichever event set matches the device ────────────────────────
  if (isMobile) {
    document.addEventListener('touchstart',  onTouchStart, { passive: true });
    document.addEventListener('touchmove',   onTouchMove,  { passive: false });
    document.addEventListener('touchend',    onTouchEnd);
    document.addEventListener('touchcancel', resetDrag);
  } else {
    document.addEventListener('pointerdown', onPointerDown);
  }

  // Per-card click guard — blocks any synthetic click on a cat-card
  // that the browser fires within 150 ms of a drag gesture ending
  grid.querySelectorAll('.cat-card').forEach(card => {
    card.addEventListener('click', e => {
      if (justDragged) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });
})();
