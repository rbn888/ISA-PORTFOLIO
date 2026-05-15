'use strict';
console.log('APP JS LOADED');

const IS_DEV =
  location.hostname === 'localhost' ||
  location.hostname === '127.0.0.1';

if (typeof SUPABASE_URL === 'undefined') {
  console.error('[SUPABASE ERROR] config.js not loaded');
}
if (typeof window.supabase === 'undefined') {
  console.error('[SUPABASE ERROR] CDN not loaded');
}

let supabaseClient = null;
let currentUser    = null;
let _saveTimer     = null;
let _isSaving      = false;
if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' && window.supabase) {
  supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession:      true,
      autoRefreshToken:    true,
      detectSessionInUrl:  true
    }
  });
  if (IS_DEV) console.log('[SUPABASE] client initialized');
} else {
  console.warn('[SUPABASE] client NOT initialized (missing config)');
}

function safeRedirect(path) {
  const base = 'https://rbn888.github.io/Aurix/';
  window.location.href = base + path;
}

async function getUserId() {
  if (!supabaseClient) return null;
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user?.id || null;
  } catch {
    return null;
  }
}

async function supabaseLoadPortfolio() {
  if (!supabaseClient) return null;
  const userId = await getUserId();
  if (!userId) return null;
  try {
    const { data, error } = await supabaseClient
      .from('user_portfolios')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (IS_DEV) console.warn('[SUPABASE] load error', error);
      return null;
    }
    return data;
  } catch (err) {
    if (IS_DEV) console.warn('[SUPABASE] load exception', err);
    return null;
  }
}

async function supabaseSavePortfolio(catalogAssets, holdings) {
  if (!supabaseClient) return;
  const userId = await getUserId();
  if (!userId) return;
  try {
    const { error } = await supabaseClient
      .from('user_portfolios')
      .upsert({
        user_id: userId,
        assets:  catalogAssets,
        holdings,
        updated_at: new Date().toISOString()
      });
    if (error && IS_DEV) console.warn('[SUPABASE] save error', error);
  } catch (err) {
    if (IS_DEV) console.warn('[SUPABASE] save exception', err);
  }
}

async function saveRemoteSafe(catalogAssets, holdings) {
  try {
    await supabaseSavePortfolio(catalogAssets, holdings);
  } catch (e) {
    if (IS_DEV) console.warn('[DATA] saveRemoteSafe retry', e);
    try {
      await supabaseSavePortfolio(catalogAssets, holdings);
    } catch (e2) {
      if (IS_DEV) console.warn('[DATA] saveRemoteSafe failed', e2);
    }
  }
}

function scheduleSave() {
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(() => { autoSaveToBackend(); }, 500);
}

async function autoSaveToBackend(attempt = 1) {
  if (_isSaving || !currentUser || !supabaseClient) return;

  const localData = getPortfolioData();
  if (!localData || (!localData.assets?.length && !localData.holdings?.length)) {
    if (IS_DEV) console.warn('[DATA] skip autosave (empty data)');
    return;
  }

  const assets   = localData.source === 'new' ? localData.assets   : [];
  const holdings = localData.source === 'new' ? localData.holdings : [];

  try {
    _isSaving = true;
    const { error } = await supabaseClient
      .from('user_portfolios')
      .upsert({
        user_id:    currentUser.id,
        assets,
        holdings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) throw error;
    if (IS_DEV) console.log('[DATA] autosave success');
  } catch (e) {
    if (IS_DEV) console.error('[DATA] autosave error:', e);
    if (attempt < 3) setTimeout(() => autoSaveToBackend(attempt + 1), 1000 * attempt);
  } finally {
    _isSaving = false;
  }
}

function isValidPortfolioData(data) {
  return data &&
    Array.isArray(data.assets) &&
    data.holdings !== null &&
    typeof data.holdings === 'object';
}

async function loadInitialData() {
  const remote = await supabaseLoadPortfolio();
  if (isValidPortfolioData(remote)) {
    if (IS_DEV) console.log('[DATA] loaded from remote');
    return { assets: remote.assets, holdings: remote.holdings };
  }

  try {
    const localAssets   = JSON.parse(localStorage.getItem('aurix_assets')  || 'null');
    const localHoldings = JSON.parse(localStorage.getItem('aurix_holdings') || 'null');
    if (localAssets && localHoldings) {
      if (IS_DEV) console.log('[DATA] remote unavailable, using local cache');
      return { assets: localAssets, holdings: localHoldings };
    }
  } catch (e) {
    if (IS_DEV) console.warn('[DATA] local parse error', e);
  }

  return null;
}

async function loadPortfolioFromBackend(userId) {
  if (!supabaseClient || !userId) return null;
  try {
    const { data, error } = await supabaseClient
      .from('user_portfolios')
      .select('assets, holdings')
      .eq('user_id', userId)
      .single();
    if (error) {
      if (IS_DEV) console.warn('[DATA] Supabase load error:', error.message);
      return null;
    }
    return data || null;
  } catch (err) {
    if (IS_DEV) console.warn('[DATA] Supabase load exception:', err);
    return null;
  }
}

async function initPortfolioData(userId) {
  // 1. Backend (fuente principal)
  const backendData = await loadPortfolioFromBackend(userId);
  if (isValidPortfolioData(backendData) && backendData.assets.length > 0) {
    if (IS_DEV) console.log('[DATA] loaded from Supabase');
    return backendData;
  }

  // 2. localStorage (fallback)
  const localData = getPortfolioData();
  if (localData.source === 'new' && localData.assets?.length > 0) {
    if (IS_DEV) console.log('[DATA] loaded from localStorage');
    return { assets: localData.assets, holdings: localData.holdings };
  }
  if (localData.source === 'legacy' && localData.legacy?.length > 0) {
    if (IS_DEV) console.log('[DATA] loaded from localStorage (legacy)');
    return convertToNewModel(localData.legacy);
  }

  // 3. Usuario nuevo
  if (IS_DEV) console.log('[DATA] empty portfolio initialized');
  return { assets: [], holdings: [] };
}

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) console.error('[AUTH] signup error', error);
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) console.error('[AUTH] login error', error);
  return data;
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

if (supabaseClient && !window.__AUTH_LISTENER__) {
  window.__AUTH_LISTENER__ = true;

  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN') {
      if (!window.location.pathname.includes('index.html')) {
        safeRedirect('index.html');
      }
    }
    if (event === 'SIGNED_OUT') {
      sessionStorage.removeItem('otp_sent');
      safeRedirect('login.html');
    }
  });
}

const waitForSession = () => new Promise(resolve => {
  let done = false;
  const finish = (val) => {
    if (done) return;
    done = true;
    sub.unsubscribe();
    clearTimeout(t);
    resolve(val ?? null);
  };
  const t = setTimeout(() => finish(null), 5000);
  const { data: { subscription: sub } } = supabaseClient.auth.onAuthStateChange((event, sess) => {
    if (event === 'INITIAL_SESSION') {
      finish(sess);
    } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      finish(sess);
    } else if (event === 'SIGNED_OUT') {
      finish(null);
    }
  });
});

const ensureSession = async () => {
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    if (!window.location.pathname.includes('login.html')) {
      safeRedirect('login.html');
    }
    return null;
  }
  return session;
};

async function requireAuth() {
  if (!supabaseClient) {
    safeRedirect('login.html');
    return false;
  }
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      safeRedirect('login.html');
      return false;
    }
    return user;
  } catch {
    safeRedirect('login.html');
    return false;
  }
}

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
    // Market screen
    market_subtitle:   'Descubre y monitoriza activos globales',
    market_search_ph:  'Buscar BTC, Apple, Oro, S&P 500…',
    market_cap:        'Capitalización',
    fear_greed:        'Miedo y Codicia',
    btc_dom:           'Dominancia BTC',
    liquidations:      'Liquidaciones',
    tab_watchlist:     'Mis activos',
    tab_all:           'Todo',
    tab_crypto:        'Cripto',
    tab_stocks:        'Acciones',
    tab_etfs:          'ETFs',
    tab_indices:       'Índices',
    tab_commodities:   'Materias',
    empty_watchlist:   'Añade activos ⭐ para seguirlos aquí',
    market_no_results: 'Sin resultados',
    stale:             'sin actualizar',
    // Metrics placeholder
    metrics_badge:     'Próximamente',
    metrics_title:     'Métricas avanzadas',
    metrics_subtitle:  'Inteligencia de mercado de próxima generación',
    metrics_microcopy: 'Estamos construyendo herramientas avanzadas de análisis institucional para Aurix.',
    metrics_f1:        'Mapas de liquidación',
    metrics_f1_desc:   'Zonas de liquidación forzada en tiempo real entre exchanges.',
    metrics_f2:        'Sentimiento de mercado',
    metrics_f2_desc:   'Señales agregadas alcistas y bajistas del comportamiento del mercado.',
    metrics_f3:        'Señales macro',
    metrics_f3_desc:   'Indicadores top-down que conectan el contexto macro con tu cartera.',
    metrics_f4:        'Flujos cross-asset',
    metrics_f4_desc:   'Hacia dónde rota el capital entre crypto, renta variable y materias.',
    metrics_f5:        'Regímenes de volatilidad',
    metrics_f5_desc:   'Detección del régimen de volatilidad para cada clase de activo.',
    metrics_f6:        'Monitor de riesgo inteligente',
    metrics_f6_desc:   'Alertas en vivo de exposición y concentración de cartera.',
    // Navigation labels (desktop header tabs)
    navDashboard:      'Panel',
    navMarket:         'Mercado',
    navMetrics:        'Métricas',
    navWorkspace:      'Workspace',
    // Tooltips (bottom nav)
    tipSearch:         'Buscar',
    tipMetrics:        'Métricas',
    tipWorkspace:      'Workspace',
    // ARIA labels
    ariaBackHome:      'Volver al inicio',
    ariaPrimaryNav:    'Navegación principal',
    ariaSearch:        'Buscar',
    ariaSettings:      'Ajustes y preferencias',
    ariaCurrency:      'Moneda',
    // Shell labels
    donutTotal:        'total',
    watchlistTitle:    'Lista de seguimiento',
    watchlistTitleCaps:'LISTA DE SEGUIMIENTO',
    bootLoading:       'Cargando…',
    // Search placeholders
    searchAssetPH:     'Buscar activo...',
    reNamePH:          'ej. Apartamento Madrid',
    // Add asset modal toggles
    typeAsset:         'Activo',
    typeLiquidity:     'Liquidez',
    // Transaction modal
    txModalTitle:      'Añadir transacción',
    txTypeLabel:       'Tipo',
    txTypeBuy:         'Compra',
    txTypeSell:        'Venta',
    txPriceLabel:      'Precio por unidad',
    txSubmit:          'Añadir transacción',
    // Asset detail modal
    adValueLabel:      'Valor total',
    adPriceLabel:      'Precio',
    adTxLabel:         'Transacciones',
    adAddBtn:          '+ Añadir',
    // FAB menu
    fabAddAsset:       'Añadir activo',
    fabAddLiquidity:   'Añadir liquidez',
    // Market table headers
    marketColAsset:    'Activo',
    marketColPrice:    'Precio',
    marketCol24h:      '24h',
    // Workspace placeholders
    wsSelectCell:      'Selecciona una celda',
    wsEmptyCell:       'Celda vacía',
    // Validation / errors
    errQtyPositive:    'Introduce una cantidad válida mayor que 0.',
    errQtyMustPositive:'La cantidad debe ser positiva.',
    // Insights
    pctOfPortfolio:    ' de la cartera',
    // Watchlist empty
    watchlistEmpty:    'No hay activos en seguimiento',
    // Status pills
    statusOpen:        'Abierto',
    statusClosed:      'Cerrado',
    // Rent / income labels
    rentSuffix:        '/mes',
    monthlyIncome:     'Ingresos mensuales',
    totalMonthlyIncome:'Ingresos mensuales totales',
    noIncome:          'Sin ingresos',
    // Insights misc strings
    defaultPortfolio:  'la cartera',
    oneAsset:          'un activo',
    // Asset detail extras
    noTransactions:    'Sin transacciones',
    btnEditShort:      'Editar',
    btnDeleteShort:    'Eliminar',
    // Insights history
    insightsHistory:   'Historial',
    insightsNoTx:      'Aún no hay transacciones',
    // Insights ambient (templated)
    ambientDominant:    (name, pct) => `${name} ${pct}% de la cartera. Peso dominante.`,
    ambientGains:       (name, pct) => `${name} +${pct}%. Beneficios sobre la mesa.`,
    ambientCategory:    (label, pct) => `${label} ${pct}% de la cartera. Exposición alta.`,
    ambientOpenPos:     count => `${count} posiciones abiertas. Distribución activa.`,
    // Insights empty-state pool
    insightsEmptyAdd:   'Añade activos para comenzar a recibir insights.',
    insightsEmptyAdd2:  'Añade activos para empezar a recibir insights.',
    insightsEmptyStart: 'Tu cartera está vacía. Empieza añadiendo un activo.',
    // Additional validation
    errQtyGtZero:      'Introduce una cantidad mayor que 0.',
    // Workspace shell
    ws_title:              'Workspace',
    ws_risk_monitor:       'Monitor de riesgo',
    ws_risk_subtitle:      'Señales en vivo de tu cartera',
    ws_risk_signals:       'Señales de riesgo',
    ws_invalid_formula:    'Fórmula inválida',
    ws_unknown_function:   'Función desconocida',
    ws_invalid_range:      'Rango inválido',
    // PR-5 i18n unification — chip lookup, alerts, watchlist, AI actions
    searchLoading:           'Buscando…',
    lookupLoading:           'Obteniendo precio...',
    lookupError:             'Precio no disponible. Selecciona el activo de nuevo para reintentar.',
    invalidQty:              'Cantidad inválida',
    invalidPrice:            'Precio inválido',
    sellExceeds:             max => `No puedes vender más de lo que tienes (${max})`,
    watchlistTrackEmpty:     'Añade activos para seguir el mercado',
    watchlistModalEmpty:     'No hay activos disponibles',
    watchlistModalNoResults: 'Sin resultados',
    aiActionPerformance:     'Ver rendimiento',
    aiActionDistribution:    'Ver distribución',
    aiActionActivity:        'Ver operaciones',
    aiActionLiquidity:       'Ver liquidez',
    ownPrefix:               asset => `Tu ${asset}`,
    txBadgeBuy:              'BUY',
    txBadgeSell:             'SELL',
    addCtxFallback:          '+ Añadir',
    // PR-5 i18n unification — workspace cards & risk signals
    wsCardPortfolioValue:    'Valor de cartera',
    wsCardDailyPnl:          'P&L diario',
    wsCardTopAlloc:          'Asignación principal',
    wsCardCryptoExposure:    'Exposición cripto',
    wsCardAssetCount:        'Nº de activos',
    wsCardRiskScore:         'Riesgo',
    wsRiskBandHigh:          'Alto',
    wsRiskBandModerate:      'Moderado',
    wsRiskBandLow:           'Bajo',
    wsConcentration:         'Concentración',
    wsExposureLabel:         'Exposición',
    wsVolatility:            'Volatilidad',
    wsTopAssetFallback:      'Activo principal',
    wsConcentrationAbove:    (sym, pct) => `${sym} concentración por encima de ${pct}%`,
    wsDominantWeight:        (sym, pct) => `${sym} peso dominante (${pct}%)`,
    wsLowDiversification:    count => `Baja diversificación (${count} posiciones)`,
    wsBalancedExposure:      'Exposición equilibrada',
    wsCryptoExposureHigh:    pct => `Exposición cripto elevada (${pct}%)`,
    wsCryptoExposureMid:     pct => `Exposición cripto ${pct}%`,
    wsEquityWeight:          pct => `Peso renta variable ${pct}%`,
    wsExposureNormal:        'Exposición dentro del rango normal',
    wsSensitivityIncreased:  'Sensibilidad de cartera elevada',
    wsModerateVolatility:    'Volatilidad moderada',
    wsSyncingMarket:         'Sincronizando actualizaciones de mercado',
    wsStableSignal:          'Señal estable',
    wsNoActiveSignals:       'Sin señales de riesgo activas',
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
    // Market screen
    market_subtitle:   'Discover and monitor global assets',
    market_search_ph:  'Search BTC, Apple, Gold, S&P 500…',
    market_cap:        'Market Cap',
    fear_greed:        'Fear & Greed',
    btc_dom:           'BTC Dominance',
    liquidations:      'Liquidations',
    tab_watchlist:     'My Assets',
    tab_all:           'All',
    tab_crypto:        'Crypto',
    tab_stocks:        'Stocks',
    tab_etfs:          'ETFs',
    tab_indices:       'Indices',
    tab_commodities:   'Commodities',
    empty_watchlist:   'Add assets ⭐ to track them here',
    market_no_results: 'No results',
    stale:             'stale data',
    // Metrics placeholder
    metrics_badge:     'Coming Soon',
    metrics_title:     'Advanced Metrics',
    metrics_subtitle:  'Next-generation market intelligence',
    metrics_microcopy: "We're building advanced institutional-grade analytics for Aurix.",
    metrics_f1:        'Liquidation Heatmaps',
    metrics_f1_desc:   'Real-time forced-liquidation zones across major exchanges.',
    metrics_f2:        'Market Sentiment',
    metrics_f2_desc:   'Aggregated bullish and bearish signals from market behaviour.',
    metrics_f3:        'Macro Signals',
    metrics_f3_desc:   'Top-down indicators linking the macro context to your portfolio.',
    metrics_f4:        'Cross-Asset Flows',
    metrics_f4_desc:   'Where capital is rotating between crypto, equities and commodities.',
    metrics_f5:        'Volatility Regimes',
    metrics_f5_desc:   'Volatility regime detection across every asset class you hold.',
    metrics_f6:        'Smart Risk Monitoring',
    metrics_f6_desc:   'Live exposure and concentration alerts for your portfolio.',
    // Navigation labels (desktop header tabs)
    navDashboard:      'Dashboard',
    navMarket:         'Market',
    navMetrics:        'Metrics',
    navWorkspace:      'Workspace',
    // Tooltips (bottom nav)
    tipSearch:         'Search',
    tipMetrics:        'Metrics',
    tipWorkspace:      'Workspace',
    // ARIA labels
    ariaBackHome:      'Back to home',
    ariaPrimaryNav:    'Primary',
    ariaSearch:        'Search',
    ariaSettings:      'Settings & preferences',
    ariaCurrency:      'Currency',
    // Shell labels
    donutTotal:        'total',
    watchlistTitle:    'Watchlist',
    watchlistTitleCaps:'WATCHLIST',
    bootLoading:       'Loading…',
    // Search placeholders
    searchAssetPH:     'Search asset...',
    reNamePH:          'e.g. Madrid Apartment',
    // Add asset modal toggles
    typeAsset:         'Asset',
    typeLiquidity:     'Liquidity',
    // Transaction modal
    txModalTitle:      'Add transaction',
    txTypeLabel:       'Type',
    txTypeBuy:         'Buy',
    txTypeSell:        'Sell',
    txPriceLabel:      'Price per unit',
    txSubmit:          'Add transaction',
    // Asset detail modal
    adValueLabel:      'Total value',
    adPriceLabel:      'Price',
    adTxLabel:         'Transactions',
    adAddBtn:          '+ Add',
    // FAB menu
    fabAddAsset:       'Add asset',
    fabAddLiquidity:   'Add liquidity',
    // Market table headers
    marketColAsset:    'Asset',
    marketColPrice:    'Price',
    marketCol24h:      '24h',
    // Workspace placeholders
    wsSelectCell:      'Select a cell',
    wsEmptyCell:       'Empty cell',
    // Validation / errors
    errQtyPositive:    'Enter a valid quantity greater than 0.',
    errQtyMustPositive:'The quantity must be positive.',
    // Insights
    pctOfPortfolio:    ' of portfolio',
    // Watchlist empty
    watchlistEmpty:    'No assets being tracked',
    // Status pills
    statusOpen:        'Open',
    statusClosed:      'Closed',
    // Rent / income labels
    rentSuffix:        '/mo',
    monthlyIncome:     'Monthly income',
    totalMonthlyIncome:'Total monthly income',
    noIncome:          'No income',
    // Insights misc strings
    defaultPortfolio:  'portfolio',
    oneAsset:          'one asset',
    // Asset detail extras
    noTransactions:    'No transactions',
    btnEditShort:      'Edit',
    btnDeleteShort:    'Delete',
    // Insights history
    insightsHistory:   'History',
    insightsNoTx:      'No transactions yet',
    // Insights ambient (templated)
    ambientDominant:    (name, pct) => `${name} at ${pct}% of portfolio. Dominant weight.`,
    ambientGains:       (name, pct) => `${name} +${pct}%. Gains on the table.`,
    ambientCategory:    (label, pct) => `${label} at ${pct}% of portfolio. High exposure.`,
    ambientOpenPos:     count => `${count} open positions. Active distribution.`,
    // Insights empty-state pool
    insightsEmptyAdd:   'Start adding assets to receive insights.',
    insightsEmptyAdd2:  'Add assets to start receiving portfolio insights.',
    insightsEmptyStart: 'Your portfolio is empty. Start by adding an asset.',
    // Additional validation
    errQtyGtZero:      'Enter a quantity greater than 0.',
    // Workspace shell
    ws_title:              'Workspace',
    ws_risk_monitor:       'Risk Monitor',
    ws_risk_subtitle:      'Live portfolio signals',
    ws_risk_signals:       'Risk Signals',
    ws_invalid_formula:    'Invalid formula',
    ws_unknown_function:   'Unknown function',
    ws_invalid_range:      'Invalid range',
    // PR-5 i18n unification — chip lookup, alerts, watchlist, AI actions
    searchLoading:           'Searching…',
    lookupLoading:           'Fetching price...',
    lookupError:             'Price unavailable. Select the asset again to retry.',
    invalidQty:              'Invalid quantity',
    invalidPrice:            'Invalid price',
    sellExceeds:             max => `Cannot sell more than you own (${max})`,
    watchlistTrackEmpty:     'Add assets to track the market',
    watchlistModalEmpty:     'No assets available',
    watchlistModalNoResults: 'No results',
    aiActionPerformance:     'View performance',
    aiActionDistribution:    'View distribution',
    aiActionActivity:        'View activity',
    aiActionLiquidity:       'View liquidity',
    ownPrefix:               asset => `Your ${asset}`,
    txBadgeBuy:              'BUY',
    txBadgeSell:             'SELL',
    addCtxFallback:          '+ Add',
    // PR-5 i18n unification — workspace cards & risk signals
    wsCardPortfolioValue:    'Portfolio Value',
    wsCardDailyPnl:          'Daily P&L',
    wsCardTopAlloc:          'Top Allocation',
    wsCardCryptoExposure:    'Crypto Exposure',
    wsCardAssetCount:        'Asset Count',
    wsCardRiskScore:         'Risk Score',
    wsRiskBandHigh:          'High',
    wsRiskBandModerate:      'Moderate',
    wsRiskBandLow:           'Low',
    wsConcentration:         'Concentration',
    wsExposureLabel:         'Exposure',
    wsVolatility:            'Volatility',
    wsTopAssetFallback:      'Top asset',
    wsConcentrationAbove:    (sym, pct) => `${sym} concentration above ${pct}%`,
    wsDominantWeight:        (sym, pct) => `${sym} dominant weight (${pct}%)`,
    wsLowDiversification:    count => `Low diversification (${count} positions)`,
    wsBalancedExposure:      'Balanced exposure',
    wsCryptoExposureHigh:    pct => `Crypto exposure elevated (${pct}%)`,
    wsCryptoExposureMid:     pct => `Crypto exposure ${pct}%`,
    wsEquityWeight:          pct => `Equity weight ${pct}%`,
    wsExposureNormal:        'Exposure within normal range',
    wsSensitivityIncreased:  'Portfolio sensitivity increased',
    wsModerateVolatility:    'Moderate volatility profile',
    wsSyncingMarket:         'Syncing market updates',
    wsStableSignal:          'Stable signal',
    wsNoActiveSignals:       'No active risk signals',
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
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const v = T[lang][el.dataset.i18nTitle];
    if (typeof v === 'string') el.title = v;
  });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const v = T[lang][el.dataset.i18nAria];
    if (typeof v === 'string') el.setAttribute('aria-label', v);
  });
  document.documentElement.lang = lang;
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
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-lang]').forEach(b => {
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  applyI18n();
  applyTypeMetaLabels();
  if (currentTab === 'market') {
    renderMarket();
  } else if (currentTab === 'workspace') {
    if (typeof renderWorkspace === 'function') renderWorkspace();
  } else {
    render();
    updateDonut();
    if (_lastUpdateState) setUpdateStatus(_lastUpdateState);
    const af = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
    searchInput.placeholder = T[lang].searchPH[af] || T[lang].searchPH.all;
  }
}

// ── State ──────────────────────────────────────────────────
const STORAGE_KEY    = 'portfolio_assets';
const PRICES_PROXY   = 'https://isa-portfolio-ten.vercel.app/api/prices';

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
  const price = +base.toFixed(base < 10 ? 3 : 2);
  return { price, change24h: null, simulated: true };
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

// Versioned migration system — replaces migrateV2 + migrateSpecB.
(function runMigrations() {
  const VERSION_KEY = 'aurix_data_version';
  const BACKUP_KEY  = 'aurix_data_backup';

  const currentVersion = parseInt(localStorage.getItem(VERSION_KEY) || '0', 10);
  if (currentVersion >= 2) return;

  if (IS_DEV) console.log('[DATA] migration start');

  // Backup before any changes
  try {
    localStorage.setItem(BACKUP_KEY, JSON.stringify({
      portfolio_assets: localStorage.getItem('portfolio_assets'),
      aurix_assets:     localStorage.getItem('aurix_assets'),
      aurix_holdings:   localStorage.getItem('aurix_holdings'),
    }));
  } catch (e) {
    console.warn('[MIGRATE] Backup failed:', e.message);
  }

  // v1 → v2: ensure aurix_assets + aurix_holdings with price_source + provider_id
  try {
    const rawAssets = localStorage.getItem('aurix_assets');
    if (rawAssets) {
      // New model already exists — backfill SPEC B fields where missing
      const catalogAssets = JSON.parse(rawAssets).map(a => {
        if (IS_DEV && !a.provider_id) console.warn('[DATA] missing provider_id → inferred:', a.id);
        return {
          ...a,
          price_source: a.price_source ?? inferPriceSource(a),
          provider_id:  a.provider_id  ?? inferProviderId(a),
        };
      });
      localStorage.setItem('aurix_assets', JSON.stringify(catalogAssets));
    } else {
      // Legacy path: build aurix_assets + aurix_holdings from in-memory assets
      save();
    }
    localStorage.setItem(VERSION_KEY, '2');
    if (IS_DEV) console.log('[DATA] migration success → version 2');
  } catch (e) {
    console.error('[MIGRATE] FAILED — full error:', e);
    console.error('[MIGRATE] Stack:', e.stack);
    if (IS_DEV) console.error('[DATA] migration failed:', e);
  }
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
const _isinCache        = new Map(); // ISIN → { value, ts }; positives kept session-long, negatives expire after _ISIN_NEG_TTL
const _ISIN_NEG_TTL     = 30 * 60 * 1000; // 30 min — avoid permanent null-poisoning on transient OpenFIGI outages
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
let portfolioChartMobile = null;  // mobile slider instance — null on desktop
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
    const data = getPortfolioData();
    if (data.source === 'new') return convertFromNewToFlat(data.assets, data.holdings);
    return data.legacy;
  } catch {
    return [];
  }
}

function save() {
  try {
    const { assets: catalogAssets, holdings } = convertToNewModel(assets);
    saveData({ assets: catalogAssets, holdings });
    scheduleSave();
    // Portfolio mutation invariant: derived financial state must reflect
    // the new asset set immediately so workspace PORTFOLIO.* / EXPOSURE /
    // ALLOCATION formulas see fresh data without waiting for the next
    // market:update tick. recomputeDerivedFinancialState is idempotent
    // and guarded by an internal `processing` flag.
    if (typeof recomputeDerivedFinancialState === 'function') {
      try { recomputeDerivedFinancialState('mutation-sync'); }
      catch (e) { console.warn('[portfolio] derived recompute failed:', e?.message); }
    }
  } catch (e) {
    console.warn('[portfolio] save failed (localStorage full or unavailable):', e);
  }
}

// ── Aurix Data Layer — Phase 1 + SPEC B ───────────────────
function inferPriceSource(a) {
  if (a.type === 'cash')         return 'fx';
  if (a.type === 'real_estate')  return 'manual';
  if (['crypto','stock','etf','metal'].includes(a.type)) return 'api';
  return 'manual';
}

function inferProviderId(a) {
  if (a.type === 'crypto') {
    if (!a.coinId) { console.warn('[DATA][CRITICAL] Missing coinId for crypto:', a.symbol); return null; }
    return `coingecko:${a.coinId}`;
  }
  if (['stock','etf','metal'].includes(a.type)) {
    if (!a.marketSymbol) { console.warn('[DATA][CRITICAL] Missing marketSymbol:', a.symbol); return null; }
    return `twelvedata:${a.marketSymbol}`;
  }
  if (a.type === 'cash' || a.type === 'real_estate') return null;
  return `manual:${a.id}`;
}

function getPortfolioData() {
  try {
    const newAssets   = localStorage.getItem('aurix_assets');
    const newHoldings = localStorage.getItem('aurix_holdings');
    if (newAssets && newHoldings) {
      return {
        assets:   JSON.parse(newAssets),
        holdings: JSON.parse(newHoldings),
        source:   'new',
      };
    }
  } catch { /* fall through to legacy */ }
  try {
    const raw    = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const legacy = Array.isArray(raw) ? raw : (raw?.assets || []);
    return { legacy, source: 'legacy' };
  } catch {
    return { legacy: [], source: 'legacy' };
  }
}

function convertToNewModel(flatAssets) {
  const catalogAssets = flatAssets.map(a => ({
    id:            a.id,
    name:          a.name,
    symbol:        a.ticker,
    type:          a.type,
    currentPrice:  a.price || 0,
    assetCurrency: a.assetCurrency || 'USD',
    change24h:     a.change24h  ?? null,
    prevPrice:     a.prevPrice  ?? null,
    coinId:        a.coinId     ?? null,
    marketSymbol:  a.marketSymbol ?? null,
    karat:         a.karat      ?? null,
    goldUnit:      a.goldUnit   ?? null,
    isin:          a.isin       ?? null,
    rent:          a.rent       ?? null,
    price_source:  inferPriceSource(a),
    provider_id:   inferProviderId(a),
  }));
  catalogAssets.forEach(c => {
    if (c.price_source === 'api' && !c.provider_id) {
      console.error('[DATA][INVALID] Asset cannot be priced via API:', { id: c.id, symbol: c.symbol, type: c.type });
    }
  });
  const holdings = flatAssets.map(a => ({
    id:        a.id,
    asset_id:  a.id,
    quantity:  a.qty,
    avg_price: a.qty > 0 ? (a.costBasis || 0) / a.qty : 0,
    costBasis: a.costBasis || 0,
    transactions: a.transactions || [],
  }));
  return { assets: catalogAssets, holdings };
}

function convertFromNewToFlat(catalogAssets, holdings) {
  const assetMap = new Map(catalogAssets.map(a => [a.id, a]));
  return holdings.map(h => {
    const asset = assetMap.get(h.asset_id);
    if (!asset) {
      if (IS_DEV) console.warn('[DATA] Missing asset for holding:', h.asset_id);
      return null;
    }
    return {
      id:            h.id,
      name:          asset.name,
      ticker:        asset.symbol,
      type:          asset.type,
      qty:           h.quantity,
      price:         asset.currentPrice || 0,
      assetCurrency: asset.assetCurrency || 'USD',
      change24h:     asset.change24h  ?? null,
      prevPrice:     asset.prevPrice  ?? null,
      costBasis:     h.costBasis,
      transactions:  h.transactions || [],
      coinId:        asset.coinId     ?? null,
      marketSymbol:  asset.marketSymbol ?? null,
      karat:         asset.karat      ?? null,
      goldUnit:      asset.goldUnit   ?? null,
      isin:          asset.isin       ?? null,
      rent:          asset.rent       ?? null,
    };
  }).filter(Boolean);
}

function convertToLegacyFormat(catalogAssets, holdings) {
  return convertFromNewToFlat(catalogAssets, holdings);
}

function saveData({ assets: catalogAssets, holdings }) {
  localStorage.setItem('aurix_assets',   JSON.stringify(catalogAssets));
  localStorage.setItem('aurix_holdings', JSON.stringify(holdings));
  const legacy = convertToLegacyFormat(catalogAssets, holdings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ assets: legacy, lastUpdated: Date.now() }));
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
  const locale = lang === 'en' ? 'en-US' : 'es-ES';
  return new Intl.NumberFormat(locale, {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2
  }).format(amount);
}
function formatBase(amount) { return formatCurrency(amount, baseCurrency); }
function formatShort(amount) {
  const sym = baseCurrency === 'EUR' ? '€' : '$';
  const abs = Math.abs(amount);
  if (abs >= 1_000_000) return sym + (amount / 1_000_000).toFixed(2) + 'M';
  if (abs >= 1_000)     return sym + (amount / 1_000).toFixed(1) + 'K';
  return formatBase(amount);
}

// ── Canonical display-currency layer ───────────────────────────────────────
// All UI sites that render a monetary value to the user MUST route through
// formatDisplay / formatDisplayShort. Internal accounting stays USD; this
// pair is the single conversion + formatting bridge to baseCurrency.
//
//   formatDisplay(amount, from='USD')      → "$298.92" / "€275.01"
//   formatDisplayShort(amount, from='USD') → "$1.2K" / "€1.1M"
//
// Out of scope: cash quantities (the qty IS denominated in the asset's own
// currency), historical transaction prices, and `orig-price` tags — those
// keep their native currency by design.
function formatDisplay(amount, from = 'USD') {
  const v = Number(amount);
  if (!Number.isFinite(v)) return formatBase(0);
  return formatBase(toBase(v, from));
}
function formatDisplayShort(amount, from = 'USD') {
  const v = Number(amount);
  if (!Number.isFinite(v)) return formatBase(0);
  return formatShort(toBase(v, from));
}

// ── Currency conversion ─────────────────────────────────────
async function fetchExchangeRate() {
  // FX fetch removed — uses hardcoded default (usdToEur = 0.92)
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

// PR-6: canonical per-asset USD valuation. Single source of truth for any
// consumer that needs an asset's value in USD — applies the native-currency
// conversion (EUR cash and EUR-denominated stocks) and the gold karat
// purity adjustment (via assetNativeValue). All total/exposure/AI
// calculations must funnel through this so drift cannot exist between
// surfaces.
function assetValueUSD(asset) {
  const curr   = (asset.assetCurrency || 'USD').toUpperCase();
  const native = assetNativeValue(asset);
  return curr === 'USD' ? native : native / usdToEur;
}

function totalValueUSD() {
  return assets.reduce((sum, a) => sum + assetValueUSD(a), 0);
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

// Read-only canonical position view. Maps a legacy `assets[]` record to the
// target portfolio engine contract (see PORTFOLIO ENGINE HARDENING spec).
// Persistence is unchanged — this is the consumer-side shape that future
// migrations will move toward. Lookup honours the canonical asset registry
// when available; otherwise falls back to legacy ticker.
function getCanonicalPosition(asset) {
  if (!asset) return null;
  const qty            = Number(asset.qty || asset.amount || asset.quantity || 0);
  const currentPrice   = Number(asset.price || 0);
  const costBasis      = Number(asset.costBasis || 0);
  const avgCost        = qty > 0 ? costBasis / qty : 0;
  const currentValue   = qty * currentPrice;
  const unrealized     = costBasis > 0 ? currentValue - costBasis : 0;
  const realized       = Number(asset.realizedPnL || 0);
  const canonical      = (typeof resolveAsset === 'function')
    ? resolveAsset(asset.ticker || asset.symbol)
    : null;
  return {
    assetId:     canonical?.id || `asset:${String(asset.ticker || asset.symbol || asset.id || '').toLowerCase()}`,
    quantity:    qty,
    acquisition: {
      avgCost,
      currency:  asset.assetCurrency || 'USD',
    },
    valuation: {
      currentPrice,
      currentValue,
    },
    pnl: {
      realized,
      unrealized,
    },
    metadata: {
      type:        canonical?.type || asset.type || 'other',
      displayName: canonical?.displayName || asset.name || asset.ticker || '',
    },
  };
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
let donutChartMobile = null;  // mobile slider instance — null on desktop
const distributionSectionEl = document.getElementById('distributionSection');
const distributionLegendEl  = document.getElementById('distributionLegend');
const donutCenterValEl      = document.getElementById('donutCenterVal');
const donutCenterSubEl      = document.getElementById('donutCenterSub');

let _donutHoverIdx = -1;   // ephemeral hover (index into _donutDist)
let _donutDist     = [];
let activeCategory = null; // persistent category filter ('crypto', 'metal', …, or null)
let currentTab       = 'home';
let currentMarketTab = 'crypto';
let marketSearchData = [];
// ── FC-4: MARKET_DATA is the ABSOLUTE SINGLE SOURCE OF TRUTH ─────────────────
// All live pricing state lives here. No module may own a parallel price store.
// All reads go through the access layer (getMarketAsset / getMarketPrice / etc).
// All writes use safe array replacement — no push/splice on shared references.
// MARKET_DATA_VERSION increments on every write for stale detection.
let MARKET_DATA         = [];
let MARKET_DATA_VERSION = 0;

// ── FC-5: Runtime state ────────────────────────────────────────────────────────
const MARKET_RUNTIME = {
  refreshing:    false,
  cycleId:       0,
  startedAt:     0,
  completedAt:   0,
  lastSuccessAt: 0,
  lastFailureAt: 0,
  health:        'cold',
  lastDurationMs: 0,
  providers:     {},
};
const _refreshLocks = new Set(); // per-label guards — prevents concurrent same-type cycles

// ── FC-9: Derived financial state cache ───────────────────────────────────────
// Centralized computation layer. Consumer-only: never fetches, never writes
// MARKET_DATA, never emits events, never triggers render. Recomputed on demand
// from MARKET_DATA + portfolio holdings.
const DERIVED_FINANCIAL_STATE = {
  version:    0,
  computedAt: 0,
  stale:      true,
  processing: false,

  portfolio: {
    totalValue:      0,
    totalPnL:        0,
    totalPnLPercent: 0,
    assetCount:      0,
    gainers:         [],
    losers:          [],
    allocations:     [],
    exposure:        {},
  },

  market: {
    topMovers:       [],
    gainers:         [],
    losers:          [],
    cryptoMarketCap: null,
  },

  runtime: {
    lastDurationMs: 0,
    recomputations: 0,
    skipped:        0,
    lastSource:     null,
  },
};

// ── FC-10: Financial formula runtime ──────────────────────────────────────────
// Deterministic, sync-only, pure formula engine. Consumes immutable financial
// snapshots; produces a frozen result cache. No fetch, no render, no emits.
const FORMULA_RUNTIME = {
  version:             0,
  recomputations:      0,
  invalidations:       0,
  processing:          false,
  formulas:            new Map(),
  cache:               new Map(),
  dependencies:        new Map(),
  lastComputedAt:      0,
  lastDurationMs:      0,
  // FC-11: dependency graph
  graphVersion:        0,
  dependencyGraph:     new Map(),
  reverseDependencies: new Map(),
  formulaVersions:     new Map(),
  dirtyFormulas:       new Set(),
  recomputeQueue:      [],
  cycleDetections:     0,
  lastGraphBuildAt:    0,
};

// ── FC-7: Portfolio reactive runtime state ────────────────────────────────────
const PORTFOLIO_RUNTIME = {
  stale:                       false,
  lastMarketEventAt:           0,
  lastPortfolioRefreshAt:      0,
  lastChangedSymbols:          [],
  reactiveEvents:              0,
  ignoredEvents:               0,
  processing:                  false,
  // FC-8: deterministic reactive runtime
  debounceMs:                  500,
  debounceTimer:               null,
  scheduled:                   false,
  lastReactiveCalculationAt:   0,
  lastReactiveRenderAt:        0,
  lastRenderVersion:           0,
  lastRecalculationDurationMs: 0,
  lastChangedAssets:           [],
  lastReactiveSource:          null,
};

// ── FC-6: Market event bus ─────────────────────────────────────────────────────
const MARKET_EVENTS = {
  listeners: new Map(),

  subscribe(event, handler) {
    if (typeof handler !== 'function') return () => {};
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event).add(handler);
    return () => { this.listeners.get(event)?.delete(handler); };
  },

  emit(event, payload) {
    const handlers = this.listeners.get(event);
    if (!handlers?.size) return;
    for (const handler of handlers) {
      try {
        handler(payload);
      } catch (e) {
        console.error('[market-events] handler failed:', event, e?.message);
      }
    }
  },

  listenerCount(event) {
    return this.listeners.get(event)?.size ?? 0;
  },
};

// ── FC-5: Refresh lock ────────────────────────────────────────────────────────
async function withMarketRefreshLock(label, fn) {
  if (_refreshLocks.has(label)) {
    console.log(`[market-runtime] refresh skipped: ${label} already running`);
    return;
  }
  _refreshLocks.add(label);
  const cycleId = ++MARKET_RUNTIME.cycleId;
  const t0      = Date.now();
  MARKET_RUNTIME.startedAt = t0;
  MARKET_RUNTIME.refreshing = true;
  if (MARKET_RUNTIME.lastSuccessAt && Date.now() - MARKET_RUNTIME.lastSuccessAt > 60_000) {
    console.warn('[market-runtime] stale snapshot warning');
  }
  console.log(`[market-runtime] cycle start #${cycleId} (${label})`);
  try {
    await fn();
  } finally {
    _refreshLocks.delete(label);
    MARKET_RUNTIME.refreshing     = _refreshLocks.size > 0;
    MARKET_RUNTIME.completedAt    = Date.now();
    MARKET_RUNTIME.lastDurationMs = MARKET_RUNTIME.completedAt - t0;
    console.log(`[market-runtime] cycle complete #${cycleId} (${label}) ${MARKET_RUNTIME.lastDurationMs}ms`);
  }
}

// ── FC-5: Atomic write — validates and replaces one type-slice of MARKET_DATA ─
function commitMarketData(type, items) {
  if (!Array.isArray(items)) return false;
  const valid = items.filter(_isValidMarketItem);
  if (!valid.length) return false; // Phase 8: never overwrite with empty — last snapshot survives
  MARKET_DATA = [...MARKET_DATA.filter(d => d.type !== type), ...valid];
  MARKET_DATA_VERSION++;
  const changedSymbols = valid.map(x => x.symbol).filter(Boolean);
  const snapshot = buildMarketEventSnapshot(type, changedSymbols);
  MARKET_EVENTS.emit('market:update', snapshot);
  if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.market.marketUpdateCount++;
  console.log(`[market-events] emitted ${type} update (${changedSymbols.length} symbols)`);
  return true;
}

// ── FC-5: Runtime health ───────────────────────────────────────────────────────
function getMarketRuntimeHealth() {
  const now   = Date.now();
  const ageMs = MARKET_RUNTIME.lastSuccessAt ? now - MARKET_RUNTIME.lastSuccessAt : Infinity;
  return {
    healthy:       ageMs < 60_000,
    stale:         ageMs >= 60_000,
    critical:      ageMs >= 300_000,
    ageMs,
    lastSuccessAt: MARKET_RUNTIME.lastSuccessAt,
    refreshing:    MARKET_RUNTIME.refreshing,
    cycleId:       MARKET_RUNTIME.cycleId,
    version:       MARKET_DATA_VERSION,
    health:        MARKET_RUNTIME.health,
  };
}

function getMarketEventHealth() {
  return {
    listeners:    { marketUpdate: MARKET_EVENTS.listenerCount('market:update') },
    version:      MARKET_DATA_VERSION,
    runtimeCycle: MARKET_RUNTIME.cycleId,
  };
}

// ── FC-7: Portfolio reactive helpers ──────────────────────────────────────────
function getPortfolioSymbols() {
  try {
    const assetList = Array.isArray(window.PORTFOLIO) ? window.PORTFOLIO
                    : Array.isArray(assets)            ? assets
                    : [];
    return new Set(
      assetList
        .map(a => normalizeSymbol(a?.ticker || a?.symbol || ''))
        .filter(Boolean)
    );
  } catch { return new Set(); }
}

function doesMarketEventAffectPortfolio(snapshot) {
  if (!snapshot?.changedSymbols?.length) return false;
  const portfolioSymbols = getPortfolioSymbols();
  if (!portfolioSymbols.size) return false;
  return snapshot.changedSymbols.some(s => portfolioSymbols.has(normalizeSymbol(s)));
}

async function handleReactivePortfolioUpdate(snapshot) {
  if (!snapshot) return;

  if (PORTFOLIO_RUNTIME.processing) {
    PORTFOLIO_RUNTIME.ignoredEvents++;
    return;
  }

  const affected = doesMarketEventAffectPortfolio(snapshot);

  console.log('[portfolio-reactive] event analysis:', {
    affected,
    changed: snapshot.changedSymbols.length,
    watched: getPortfolioSymbols().size,
  });

  if (!affected) {
    PORTFOLIO_RUNTIME.ignoredEvents++;
    return;
  }

  PORTFOLIO_RUNTIME.processing = true;
  try {
    PORTFOLIO_RUNTIME.lastMarketEventAt   = Date.now();
    PORTFOLIO_RUNTIME.lastChangedSymbols  = snapshot.changedSymbols;
    PORTFOLIO_RUNTIME.reactiveEvents++;

    console.log(
      '[portfolio-reactive] relevant market update:',
      snapshot.type,
      snapshot.changedSymbols.length,
      'symbols'
    );

    // FC-8: schedule debounced reactive recalculation (consumer-only, no fetch).
    scheduleReactivePortfolioRefresh('market-update');
  } catch (e) {
    console.error('[portfolio-reactive] handler failed:', e?.message);
  } finally {
    PORTFOLIO_RUNTIME.processing = false;
  }
}

function getPortfolioReactiveHealth() {
  return {
    stale:                       PORTFOLIO_RUNTIME.stale,
    processing:                  PORTFOLIO_RUNTIME.processing,
    reactiveEvents:              PORTFOLIO_RUNTIME.reactiveEvents,
    ignoredEvents:               PORTFOLIO_RUNTIME.ignoredEvents,
    lastMarketEventAt:           PORTFOLIO_RUNTIME.lastMarketEventAt,
    lastPortfolioRefreshAt:      PORTFOLIO_RUNTIME.lastPortfolioRefreshAt,
    watchedSymbols:              getPortfolioSymbols().size,
    // FC-8: deterministic reactive runtime
    debounceMs:                  PORTFOLIO_RUNTIME.debounceMs,
    scheduled:                   PORTFOLIO_RUNTIME.scheduled,
    lastReactiveCalculationAt:   PORTFOLIO_RUNTIME.lastReactiveCalculationAt,
    lastReactiveRenderAt:        PORTFOLIO_RUNTIME.lastReactiveRenderAt,
    lastReactiveSource:          PORTFOLIO_RUNTIME.lastReactiveSource,
    lastRecalculationDurationMs: PORTFOLIO_RUNTIME.lastRecalculationDurationMs,
    lastChangedAssets:           PORTFOLIO_RUNTIME.lastChangedAssets,
    lastRenderVersion:           PORTFOLIO_RUNTIME.lastRenderVersion,
  };
}

// ── FC-8: Deterministic reactive portfolio runtime ────────────────────────────
// MARKET_DATA → invalidation → debounce → recalculation → controlled render.
// Consumer-only: never fetches, never writes MARKET_DATA, never emits events.

function getReactiveMarketPrice(symbol) {
  if (!symbol) return null;

  const norm = normalizeSymbol(symbol);

  const item = MARKET_DATA.find(x =>
    normalizeSymbol(x.canonicalSymbol || x.symbol) === norm
  );

  if (!item) return null;

  const price = item.current_price ?? item.price ?? null;

  return (typeof price === 'number' && isFinite(price) && price > 0)
    ? price
    : null;
}

function buildPortfolioReactiveHash(assets = []) {
  try {
    return assets
      .map(a => {
        const symbol = normalizeSymbol(a?.ticker || a?.symbol || '');
        const qty    = Number(a?.qty || a?.amount || a?.quantity || 0);
        const price  = Number(a?.price || 0);
        return `${symbol}:${qty}:${price}`;
      })
      .join('|');
  } catch {
    return '';
  }
}

function scheduleReactivePortfolioRefresh(source = 'market-event') {
  PORTFOLIO_RUNTIME.stale              = true;
  PORTFOLIO_RUNTIME.scheduled          = true;
  PORTFOLIO_RUNTIME.lastReactiveSource = source;

  if (PORTFOLIO_RUNTIME.debounceTimer) {
    clearTimeout(PORTFOLIO_RUNTIME.debounceTimer);
  }

  PORTFOLIO_RUNTIME.debounceTimer = setTimeout(
    () => {
      PORTFOLIO_RUNTIME.debounceTimer = null;
      runReactivePortfolioRefresh();
    },
    PORTFOLIO_RUNTIME.debounceMs
  );

  console.log('[portfolio-reactive] refresh scheduled', source);
}

async function runReactivePortfolioRefresh() {
  if (PORTFOLIO_RUNTIME.processing) {
    console.log('[portfolio-reactive] skipped — already processing');
    return;
  }

  PORTFOLIO_RUNTIME.processing = true;

  const t0 = Date.now();

  try {
    // Resolve portfolio: prefer window.PORTFOLIO, fall back to module-level
    // `assets` (same pattern as getPortfolioSymbols) so reactive runtime works
    // regardless of how the portfolio is exposed.
    const portfolioAssets = Array.isArray(window.PORTFOLIO) ? window.PORTFOLIO
                          : Array.isArray(assets)            ? assets
                          : [];

    if (!portfolioAssets.length) {
      PORTFOLIO_RUNTIME.processing = false;
      PORTFOLIO_RUNTIME.scheduled  = false;
      PORTFOLIO_RUNTIME.stale      = false;
      return;
    }

    const beforeHash = buildPortfolioReactiveHash(portfolioAssets);

    const changedAssets = [];

    for (const asset of portfolioAssets) {
      const symbol = asset?.ticker || asset?.symbol;

      const reactivePrice = getReactiveMarketPrice(symbol);

      if (
        typeof reactivePrice === 'number' &&
        reactivePrice > 0 &&
        reactivePrice !== asset.price
      ) {
        asset.price = reactivePrice;
        changedAssets.push(normalizeSymbol(symbol));
      }
    }

    const afterHash = buildPortfolioReactiveHash(portfolioAssets);
    const changed   = beforeHash !== afterHash;

    PORTFOLIO_RUNTIME.lastChangedAssets          = changedAssets;
    PORTFOLIO_RUNTIME.lastReactiveCalculationAt  = Date.now();
    PORTFOLIO_RUNTIME.lastRecalculationDurationMs = Date.now() - t0;

    PORTFOLIO_RUNTIME.processing = false;
    PORTFOLIO_RUNTIME.scheduled  = false;
    PORTFOLIO_RUNTIME.stale      = false;

    console.log('[portfolio-reactive] recalculation complete:', {
      changed,
      assets:   changedAssets.length,
      duration: PORTFOLIO_RUNTIME.lastRecalculationDurationMs,
    });

    if (!changed) return;

    if (PORTFOLIO_RUNTIME.lastRenderVersion === MARKET_DATA_VERSION) {
      console.log('[portfolio-reactive] skipped render — same version');
      return;
    }

    PORTFOLIO_RUNTIME.lastRenderVersion   = MARKET_DATA_VERSION;
    PORTFOLIO_RUNTIME.lastReactiveRenderAt = Date.now();

    // Use EXISTING render path only — no custom pipeline.
    if (typeof render === 'function') {
      render();
    }

    console.log('[portfolio-reactive] render committed');

    // FC-9: invalidate + recompute derived state after a committed render.
    // Consumer-only — does not write MARKET_DATA, render, or emit events.
    invalidateDerivedFinancialState('portfolio-reactive-refresh');
    recomputeDerivedFinancialState('portfolio-reactive-refresh');
  } catch (e) {
    PORTFOLIO_RUNTIME.processing = false;
    console.error('[portfolio-reactive] refresh failed:', e?.message);
  }
}

// ── FC-9: Derived financial state engine ──────────────────────────────────────
// Centralized recomputation of portfolio + market derived metrics.
// Consumer-only: reads MARKET_DATA + holdings, writes only DERIVED_FINANCIAL_STATE.

function invalidateDerivedFinancialState(source = 'unknown') {
  DERIVED_FINANCIAL_STATE.stale              = true;
  DERIVED_FINANCIAL_STATE.runtime.lastSource = source;
  console.log('[derived-state] invalidated:', source);
}

function buildPortfolioAllocations(assets, totalValue) {
  if (!Array.isArray(assets) || !totalValue) return [];

  return assets
    .map(asset => {
      const quantity = Number(asset.qty || asset.amount || asset.quantity || 0);
      const price    = Number(asset.price || 0);
      const value    = quantity * price;

      return {
        symbol:     normalizeSymbol(asset.ticker || asset.symbol || ''),
        value,
        allocation: totalValue > 0 ? value / totalValue : 0,
      };
    })
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value);
}

function buildPortfolioExposure(assets = []) {
  const exposure = {};

  for (const asset of assets) {
    const type     = String(asset.type || 'unknown').toLowerCase();
    const quantity = Number(asset.qty || asset.amount || asset.quantity || 0);
    const price    = Number(asset.price || 0);
    const value    = quantity * price;

    exposure[type] = (exposure[type] || 0) + value;
  }

  return exposure;
}

function recomputeDerivedFinancialState(source = 'unknown') {
  if (DERIVED_FINANCIAL_STATE.processing) {
    DERIVED_FINANCIAL_STATE.runtime.skipped++;
    console.log('[derived-state] skipped recomputation');
    return;
  }

  DERIVED_FINANCIAL_STATE.processing = true;

  const t0 = Date.now();

  try {
    // Same portfolio resolution as FC-8 reactive runtime.
    const portfolioAssets = Array.isArray(window.PORTFOLIO) ? window.PORTFOLIO
                          : Array.isArray(assets)            ? assets
                          : [];

    let totalValue        = 0;
    let totalCostBasis    = 0;
    let totalRealizedPnL  = 0;
    for (const asset of portfolioAssets) {
      const quantity = Number(asset.qty || asset.amount || asset.quantity || 0);
      const price    = Number(asset.price || 0);
      totalValue       += quantity * price;
      totalCostBasis   += Number(asset.costBasis   || 0);
      totalRealizedPnL += Number(asset.realizedPnL || 0);
    }
    // Aggregate P&L: unrealized = open-position MtM gain; realized = locked
    // gain from prior partial sells (persisted on the asset record).
    const totalUnrealizedPnL = totalCostBasis > 0 ? totalValue - totalCostBasis : 0;
    const totalPnL           = totalUnrealizedPnL + totalRealizedPnL;
    const totalPnLPercent    = totalCostBasis > 0 ? (totalPnL / totalCostBasis) * 100 : 0;

    const allocations = buildPortfolioAllocations(portfolioAssets, totalValue);
    const exposure    = buildPortfolioExposure(portfolioAssets);

    const gainers = [...portfolioAssets]
      .filter(a => Number(a.change24h || 0) > 0)
      .sort((a, b) => Number(b.change24h || 0) - Number(a.change24h || 0))
      .slice(0, 5);

    const losers = [...portfolioAssets]
      .filter(a => Number(a.change24h || 0) < 0)
      .sort((a, b) => Number(a.change24h || 0) - Number(b.change24h || 0))
      .slice(0, 5);

    DERIVED_FINANCIAL_STATE.portfolio = Object.freeze({
      totalValue,
      totalCostBasis,
      totalPnL,
      totalPnLPercent,
      unrealizedPnL:   totalUnrealizedPnL,
      realizedPnL:     totalRealizedPnL,
      assetCount:      portfolioAssets.length,
      gainers:         Object.freeze(gainers),
      losers:          Object.freeze(losers),
      allocations:     Object.freeze(allocations),
      exposure:        Object.freeze(exposure),
    });

    DERIVED_FINANCIAL_STATE.version++;
    DERIVED_FINANCIAL_STATE.computedAt              = Date.now();
    DERIVED_FINANCIAL_STATE.stale                   = false;
    DERIVED_FINANCIAL_STATE.runtime.lastDurationMs  = Date.now() - t0;
    DERIVED_FINANCIAL_STATE.runtime.recomputations++;
    DERIVED_FINANCIAL_STATE.runtime.lastSource      = source;

    console.log('[derived-state] recomputed:', {
      assets:   portfolioAssets.length,
      totalValue,
      duration: DERIVED_FINANCIAL_STATE.runtime.lastDurationMs,
    });

    // FC-10/FC-11: cascade into formula runtime with selective invalidation.
    invalidateFinancialFormulas(
      [
        'derived.portfolio.totalvalue',
        'derived.portfolio.assetcount',
        'derived.portfolio.allocations',
      ],
      'derived-state-recomputed',
    );
    recomputeFinancialFormulas('derived-state-recomputed');
  } catch (e) {
    console.error('[derived-state] recomputation failed:', e?.message);
  } finally {
    DERIVED_FINANCIAL_STATE.processing = false;
  }
}

function getDerivedFinancialSnapshot() {
  return Object.freeze({
    version:    DERIVED_FINANCIAL_STATE.version,
    computedAt: DERIVED_FINANCIAL_STATE.computedAt,
    stale:      DERIVED_FINANCIAL_STATE.stale,
    portfolio:  DERIVED_FINANCIAL_STATE.portfolio,
    market:     DERIVED_FINANCIAL_STATE.market,
    runtime:    DERIVED_FINANCIAL_STATE.runtime,
  });
}

function getDerivedStateHealth() {
  return {
    version:        DERIVED_FINANCIAL_STATE.version,
    stale:          DERIVED_FINANCIAL_STATE.stale,
    processing:     DERIVED_FINANCIAL_STATE.processing,
    recomputations: DERIVED_FINANCIAL_STATE.runtime.recomputations,
    skipped:        DERIVED_FINANCIAL_STATE.runtime.skipped,
    lastDurationMs: DERIVED_FINANCIAL_STATE.runtime.lastDurationMs,
    lastSource:     DERIVED_FINANCIAL_STATE.runtime.lastSource,
  };
}

// ── AW-1: Aurix Workspace runtime ─────────────────────────────────────────────
// Reactive financial workspace shell. Consumer-only: reads immutable snapshots
// from the Financial Core, never writes MARKET_DATA, never emits events.
const WORKSPACE_RUNTIME = {
  // AW-1
  initialized:      false,
  activeSheet:      'main',  // legacy alias; activeSheetId is the canonical key
  sheets:           new Map(),
  widgets:          new Map(),
  layoutVersion:    0,
  reactiveUpdates:  0,
  lastComputedAt:   0,
  processing:       false,
  // AW-2: spreadsheet runtime
  activeSheetId:    'main',
  selectedCell:     null,
  editingCell:      null,
  renderVersion:    0,
  recalculations:   0,
  lastCalculatedAt: 0,
  lastRenderAt:     0,
  stale:            false,
  // AW-4: operational interaction surface (consumer-only)
  activeCellId:             null,
  keyboardNavigationEnabled: true,
  lastNavigationAt:         0,
  lastFormulaBarValue:      '',
  // AW-5 §3: professional spreadsheet scale — 12 cols (A→L) × 30 rows.
  gridColumns:              ['A','B','C','D','E','F','G','H','I','J','K','L'],
  gridRows:                 Array.from({ length: 30 }, (_, i) => i + 1),
  // AW-7.1: editing foundation (literal values only; no formulas yet).
  isEditing:                false,
  editingValue:             '',
  lastEditAt:               0,
  // AW-7.2: tracks where the next post-render focus should land.
  // Transient UX hint, NOT a duplicate of editingValue. 'cell' | 'formula' | null.
  _editFocusTarget:         null,
  // AW-7.5: workspace dependency graph engine. Forward edges (this cell
  // depends on these refs) and reverse edges (these cells depend on this ref)
  // power selective topological recompute and cycle detection. Workspace-only;
  // never mixes with the Financial Core formula runtime (FC-10/11).
  dependencyGraph:          new Map(),
  reverseDependencyGraph:   new Map(),
  graphVersion:             0,
  cycleDetections:          0,
  lastGraphBuildAt:         0,
  // AW-8: market + derived version tracking for native financial reactivity.
  // Recalc detects deltas and propagates pseudo-deps (MARKET:* / FINANCIAL:*)
  // so PRICE() / PORTFOLIO.* / EXPOSURE() / ALLOCATION() formulas refresh
  // automatically when the FC pipeline updates.
  lastMarketVersion:        0,
  lastDerivedVersion:       0,
  // AW-9.1: formula autocomplete UX state. Pure presentation — editing source
  // of truth remains editingValue. Desktop-only; mobile gates it via viewport.
  autocompleteOpen:           false,
  autocompleteItems:          [],
  autocompleteSelectedIndex:  0,
  // AW-9.2: inline validation message. UX-only; reuses the AW-8 parser, never
  // evaluates. null when valid / not editing a formula.
  validationMessage:          null,
};

// AW-2: Sheet & Cell models — mutable internals, immutable snapshots.
function createWorkspaceSheet(config = {}) {
  const now = Date.now();
  return {
    id:        config.id   || 'main',
    name:      config.name || 'Untitled Sheet',
    createdAt: now,
    updatedAt: now,
    cells:     new Map(),
    metadata: {
      readonly: !!config.readonly,
      system:   !!config.system,
      version:  Number(config.version || 1),
    },
  };
}

function createWorkspaceCell(config = {}) {
  return {
    id:        config.id,
    type:      config.type     || 'value',  // 'value' | 'formula' | 'computed'
    value:     config.value    ?? null,
    formula:   config.formula  ?? null,
    computed:  config.computed ?? null,
    format:    config.format   || null,
    readonly:  !!config.readonly,
    invalid:   !!config.invalid, // AW-7.4: marked true cuando el parser/evaluator falla
    updatedAt: Date.now(),
  };
}

function _seedMainWorkspaceSheet() {
  const sheet = createWorkspaceSheet({
    id:      'main',
    name:    'Portfolio Workspace',
    system:  true,
    version: 1,
  });

  const seed = [
    // PR-8A: A1/A2/A3 labels translated at render time via the @i18n: prefix.
    // B1/B2 declare cell.format so the computed value renders with the
    // dashboard's currency / integer conventions; B3 returns an allocation
    // object handled by the object branch of _formatComputedValue.
    { id: 'A1', type: 'value',   value: '@i18n:wsCardPortfolioValue' },
    { id: 'B1', type: 'formula', formula: 'portfolio.totalValue',    readonly: true, format: 'currency' },
    { id: 'A2', type: 'value',   value: '@i18n:wsCardAssetCount' },
    { id: 'B2', type: 'formula', formula: 'portfolio.assetCount',    readonly: true, format: 'integer' },
    { id: 'A3', type: 'value',   value: '@i18n:wsCardTopAlloc' },
    { id: 'B3', type: 'formula', formula: 'portfolio.topAllocation', readonly: true },
  ];

  for (const c of seed) {
    sheet.cells.set(c.id, createWorkspaceCell(c));
  }

  return sheet;
}

// Kept for AW-1 backwards compat — returns a frozen seed-shape, no longer used.
function createInitialWorkspaceSheet() {
  return Object.freeze({
    id:        'main',
    name:      'Portfolio Workspace',
    cells:     {},
    widgets:   ['portfolio-summary', 'top-allocations', 'top-movers'],
    createdAt: Date.now(),
  });
}

function _onWorkspaceContainerClick(e) {
  // AW-9.1: click on an autocomplete suggestion → apply, then refocus the
  // input that was being edited.
  const suggestion = e.target.closest('[data-aw91-suggestion-index]');
  if (suggestion) {
    e.preventDefault();
    e.stopPropagation();
    const idx = parseInt(suggestion.dataset.aw91SuggestionIndex, 10);
    const item = WORKSPACE_RUNTIME.autocompleteItems[idx];
    if (item) {
      const targetSelector = WORKSPACE_RUNTIME._editFocusTarget === 'formula'
        ? '[data-formula-bar-input]'
        : '[data-cell-edit-input]';
      const inputEl = document.querySelector(targetSelector)
                   || document.querySelector(_AW72_EDIT_INPUT_SELECTOR);
      if (inputEl) {
        _aw91ApplySuggestion(inputEl, item);
        inputEl.focus();
      }
    }
    return;
  }

  // Click sobre el input de edición inline: dejar al input gestionar focus/caret.
  if (e.target.closest('[data-cell-edit-input]')) return;

  // AW-7.2: click sobre formula bar input.
  const fbInput = e.target.closest('[data-formula-bar-input]');
  if (fbInput) {
    if (fbInput.readOnly) return;                       // system / sin selección
    if (WORKSPACE_RUNTIME.isEditing) return;            // ya editando, deja al input
    const cellId = WORKSPACE_RUNTIME.activeCellId;
    if (!cellId) return;
    const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
    const cell  = sheet?.cells.get(cellId) || null;
    if (!_isWorkspaceCellEditable(cell)) return;
    WORKSPACE_RUNTIME._editFocusTarget = 'formula';
    if (beginWorkspaceCellEdit(cellId)) {
      renderWorkspace();
    }
    return;
  }

  // Cell selection (desktop). Mobile rows are not clickable in AW-3.
  const cellEl = e.target.closest('[data-cell-id]');
  if (cellEl) {
    const id = cellEl.dataset.cellId;
    if (!id) return;

    // AW-7.1 hotfix: el browser despacha `dblclick` en el deepest common
    // inclusive ancestor de los dos targets. Como `renderWorkspace()` re-crea
    // los nodos célula entre click#1 y click#2, el ancestor común termina
    // siendo un nodo SIN data-cell-id y `_onWorkspaceContainerDblClick`
    // bailaba. `e.detail` es un contador a nivel de pointer events que NO
    // se resetea con mutaciones DOM — fuente fiable para detectar dobleclick.
    if (e.detail >= 2) {
      if (WORKSPACE_RUNTIME.isEditing && WORKSPACE_RUNTIME.editingCell === id) return;
      setActiveCell(id);
      WORKSPACE_RUNTIME._editFocusTarget = 'cell';
      if (beginWorkspaceCellEdit(id)) {
        renderWorkspace();
      }
      return;
    }

    // AW-7.1: si estábamos editando otra celda, hacer commit antes de cambiar.
    if (WORKSPACE_RUNTIME.isEditing && WORKSPACE_RUNTIME.editingCell !== id) {
      commitWorkspaceCellEdit();
    }
    if (setActiveCell(id)) {
      renderWorkspace();
    }
    return;
  }
}

// AW-7.1: doble click sobre user cell entra en modo edición.
// Backup path: la detección primaria vive en el click handler vía e.detail.
// Si el browser sí dispara este evento sobre la celda, los guards evitan
// doble-arranque de edición.
function _onWorkspaceContainerDblClick(e) {
  const cellEl = e.target.closest('[data-cell-id]');
  if (!cellEl) return;
  const id = cellEl.dataset.cellId;
  if (!id) return;
  if (WORKSPACE_RUNTIME.isEditing && WORKSPACE_RUNTIME.editingCell === id) return;

  setActiveCell(id);
  WORKSPACE_RUNTIME._editFocusTarget = 'cell';
  if (beginWorkspaceCellEdit(id)) {
    renderWorkspace();
  }
}

// AW-7.1 / AW-7.2: bus de teclado del input de edición (delegado).
// Matchea tanto la celda inline como la formula bar — single source of truth:
// ambos leen y escriben WORKSPACE_RUNTIME.editingValue.
const _AW72_EDIT_INPUT_SELECTOR = '[data-cell-edit-input], [data-formula-bar-input]';

function _onWorkspaceEditInputKeyDown(e) {
  const inputEl = e.target.closest?.(_AW72_EDIT_INPUT_SELECTOR);
  if (!inputEl) return;
  if (!WORKSPACE_RUNTIME.isEditing) return;

  // AW-9.1: when the autocomplete dropdown is open, intercept the navigation
  // and confirmation keys so they drive the dropdown instead of the editor.
  if (WORKSPACE_RUNTIME.autocompleteOpen
      && WORKSPACE_RUNTIME.autocompleteItems
      && WORKSPACE_RUNTIME.autocompleteItems.length > 0) {
    const items = WORKSPACE_RUNTIME.autocompleteItems;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      WORKSPACE_RUNTIME.autocompleteSelectedIndex =
        (WORKSPACE_RUNTIME.autocompleteSelectedIndex + 1) % items.length;
      _aw91RenderAutocomplete(inputEl);
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      WORKSPACE_RUNTIME.autocompleteSelectedIndex =
        (WORKSPACE_RUNTIME.autocompleteSelectedIndex - 1 + items.length) % items.length;
      _aw91RenderAutocomplete(inputEl);
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      _aw91CloseAutocomplete();
      return;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const item = items[WORKSPACE_RUNTIME.autocompleteSelectedIndex];
      _aw91ApplySuggestion(inputEl, item);
      return;
    }
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    cancelWorkspaceCellEdit();
    renderWorkspace();
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    WORKSPACE_RUNTIME.editingValue = inputEl.value;
    commitWorkspaceCellEdit();
    renderWorkspace();
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    WORKSPACE_RUNTIME.editingValue = inputEl.value;
    const cur = WORKSPACE_RUNTIME.editingCell;
    commitWorkspaceCellEdit();
    if (cur) {
      const next = getAdjacentCell(cur, e.shiftKey ? 'left' : 'right');
      if (next) setActiveCell(next);
    }
    renderWorkspace();
    return;
  }
}

// AW-7.1 / AW-7.2: input event sincroniza editingValue y refleja el valor en
// el input gemelo (sin re-render → preserva focus y caret).
function _onWorkspaceEditInputChange(e) {
  const inputEl = e.target.closest?.(_AW72_EDIT_INPUT_SELECTOR);
  if (!inputEl) return;
  if (!WORKSPACE_RUNTIME.isEditing) return;

  WORKSPACE_RUNTIME.editingValue = inputEl.value;

  // AW-7.2: bidirectional live sync — mirror al gemelo (cell ↔ formula bar).
  const otherSelector = inputEl.matches('[data-cell-edit-input]')
    ? '[data-formula-bar-input]'
    : '[data-cell-edit-input]';
  const otherInput = document.querySelector(otherSelector);
  if (otherInput && otherInput !== inputEl && otherInput.value !== inputEl.value) {
    otherInput.value = inputEl.value;
  }

  // AW-9.1: refresh autocomplete state derived from editingValue + caret.
  _aw91UpdateAutocomplete(inputEl);
  // AW-9.2: refresh inline validation (runs after autocomplete so it can
  // anchor relative to the dropdown's current position).
  _aw92UpdateValidation(inputEl);
}

// AW-7.1 / AW-7.2: blur → commit, salvo cuando el foco salta entre los dos
// inputs sincronizados (cell ↔ formula bar) — eso no debe cerrar la edición.
function _onWorkspaceEditInputBlur(e) {
  const inputEl = e.target.closest?.(_AW72_EDIT_INPUT_SELECTOR);
  if (!inputEl) return;
  if (!WORKSPACE_RUNTIME.isEditing) return;

  // AW-7.2 fix: blur también se dispara síncronamente cuando `innerHTML = ...`
  // desconecta el input que tenía foco (el browser saca focus a body antes de
  // re-aplicar focus en el input nuevo). Sin esto, hacer click sobre la
  // formula bar disparaba beginEdit → render → blur sintético en el input
  // viejo → commit/cancel inmediato → edit jamás visible. Si el target está
  // desconectado del DOM, el blur viene del re-render: NO comprometer.
  if (inputEl.isConnected === false) return;

  const next = e.relatedTarget;
  if (next && next.matches?.(_AW72_EDIT_INPUT_SELECTOR)) {
    // Focus going to the synced twin input — keep editing.
    WORKSPACE_RUNTIME._editFocusTarget = next.matches('[data-formula-bar-input]')
      ? 'formula' : 'cell';
    return;
  }

  WORKSPACE_RUNTIME.editingValue = inputEl.value;
  commitWorkspaceCellEdit();
  // No renderWorkspace aquí: blur puede dispararse por click sobre otra celda
  // (que ya re-renderiza) o cambio de tab. Evitamos doble render.
}

// AW-4 §6: Keyboard navigation. Desktop only. Pure interaction layer:
// never recomputes formulas, never writes MARKET_DATA, never emits events.
const _AW4_NAV_KEYS = {
  ArrowUp:    'up',
  ArrowDown:  'down',
  ArrowLeft:  'left',
  ArrowRight: 'right',
  Tab:        'right',
  Enter:      'down',
};

function _onWorkspaceKeyDown(e) {
  if (currentTab !== 'workspace') return;
  if (!WORKSPACE_RUNTIME.keyboardNavigationEnabled) return;
  if (!isWorkspaceDesktop()) return;

  const tgt = e.target;
  if (tgt) {
    const tag = tgt.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    if (tgt.isContentEditable) return;
  }

  if (e.key === 'Escape') {
    if (WORKSPACE_RUNTIME.activeCellId == null) return;
    e.preventDefault();
    setActiveCell(null);
    WORKSPACE_RUNTIME.lastNavigationAt = Date.now();
    renderWorkspace();
    return;
  }

  // AW-7.1: Enter sobre celda user-editable seleccionada → entra a editar.
  // Si la celda es system (formula/readonly) o no hay activa, mantenemos
  // la navegación AW-4 (Enter mueve abajo).
  if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
    const cur = WORKSPACE_RUNTIME.activeCellId;
    if (cur) {
      const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
      const cell  = sheet?.cells.get(cur) || null;
      if (_isWorkspaceCellEditable(cell)) {
        e.preventDefault();
        WORKSPACE_RUNTIME._editFocusTarget = 'cell';
        if (beginWorkspaceCellEdit(cur)) {
          renderWorkspace();
        }
        return;
      }
    }
  }

  // AW-7.1: typing directo sobre user cell seleccionada → edición con char inicial.
  if (
    !e.metaKey && !e.ctrlKey && !e.altKey
    && typeof e.key === 'string' && e.key.length === 1
    && !_AW4_NAV_KEYS[e.key]
  ) {
    const cur = WORKSPACE_RUNTIME.activeCellId;
    if (cur) {
      const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
      const cell  = sheet?.cells.get(cur) || null;
      if (_isWorkspaceCellEditable(cell)) {
        e.preventDefault();
        WORKSPACE_RUNTIME._editFocusTarget = 'cell';
        if (beginWorkspaceCellEdit(cur, e.key)) {
          renderWorkspace();
        }
        return;
      }
    }
  }

  const dir = _AW4_NAV_KEYS[e.key];
  if (!dir) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'Tab' && e.shiftKey) {
    e.preventDefault();
    const cur = WORKSPACE_RUNTIME.activeCellId;
    if (!cur) {
      const cols = WORKSPACE_RUNTIME.gridColumns;
      const rows = WORKSPACE_RUNTIME.gridRows;
      setActiveCell(buildCellId(rows[0], cols[0]));
    } else {
      const next = getAdjacentCell(cur, 'left');
      setActiveCell(next);
    }
    WORKSPACE_RUNTIME.lastNavigationAt = Date.now();
    renderWorkspace();
    return;
  }

  e.preventDefault();
  const cur = WORKSPACE_RUNTIME.activeCellId;
  if (!cur) {
    const cols = WORKSPACE_RUNTIME.gridColumns;
    const rows = WORKSPACE_RUNTIME.gridRows;
    setActiveCell(buildCellId(rows[0], cols[0]));
  } else {
    const next = getAdjacentCell(cur, dir);
    if (next && next !== cur) setActiveCell(next);
  }
  WORKSPACE_RUNTIME.lastNavigationAt = Date.now();
  renderWorkspace();
}

function initializeWorkspaceRuntime() {
  if (WORKSPACE_RUNTIME.initialized) return;
  WORKSPACE_RUNTIME.sheets.set('main', _seedMainWorkspaceSheet());
  WORKSPACE_RUNTIME.activeSheetId = 'main';
  WORKSPACE_RUNTIME.activeSheet   = 'main';
  // AW-7.3: hidratar user cells desde localStorage. System cells protegidas.
  _hydrateWorkspaceFromPersistence();
  WORKSPACE_RUNTIME.initialized   = true;

  // AW-3: attach delegated click handler once on the persistent container.
  const container = document.getElementById('aurixWorkspace');
  if (container && !container._aw3HandlersAttached) {
    container.addEventListener('click',    _onWorkspaceContainerClick);
    // AW-7.1: dblclick → edit + delegated input listeners (use capture for blur
    // since blur doesn't bubble by default).
    container.addEventListener('dblclick', _onWorkspaceContainerDblClick);
    // AW-7.2: input handlers ahora aplican a celda inline + formula bar.
    container.addEventListener('keydown',  _onWorkspaceEditInputKeyDown);
    container.addEventListener('input',    _onWorkspaceEditInputChange);
    container.addEventListener('blur',     _onWorkspaceEditInputBlur, true);
    // AW-9.1: clicking an autocomplete suggestion would otherwise blur the
    // editor and commit; preventDefault on mousedown keeps focus on the input.
    container.addEventListener('mousedown', (ev) => {
      if (ev.target.closest && ev.target.closest('[data-aw91-suggestion-index]')) {
        ev.preventDefault();
      }
    });
    container._aw3HandlersAttached = true;
  }

  // AW-4: workspace-scoped keyboard navigation (desktop only). The handler
  // self-gates on currentTab + viewport so it stays inert outside the workspace.
  if (typeof window !== 'undefined' && !window._aw4KeyboardAttached) {
    document.addEventListener('keydown', _onWorkspaceKeyDown);
    window._aw4KeyboardAttached = true;
  }

  console.log('[workspace] initialized');
}

function getWorkspaceSnapshot() {
  return Object.freeze({
    initialized:     WORKSPACE_RUNTIME.initialized,
    activeSheet:     WORKSPACE_RUNTIME.activeSheet,
    sheets:          Object.freeze(Object.fromEntries(WORKSPACE_RUNTIME.sheets)),
    layoutVersion:   WORKSPACE_RUNTIME.layoutVersion,
    reactiveUpdates: WORKSPACE_RUNTIME.reactiveUpdates,
  });
}

// ── AW-2: Spreadsheet runtime (consumer-only, sync) ───────────────────────────
const _AW2_SUPPORTED_FORMULAS = new Set([
  'portfolio.totalvalue',
  'portfolio.assetcount',
  'portfolio.topallocation',
]);

function resolveWorkspaceFormula(formulaId) {
  if (!formulaId) return null;
  const norm = String(formulaId).trim().toLowerCase();
  if (!_AW2_SUPPORTED_FORMULAS.has(norm)) return null;

  // Read-only consumer of the formula snapshot — never recomputes.
  const snapshot = getFinancialFormulaSnapshot();
  const formulas = snapshot?.formulas || {};

  // Match case-insensitively against registered formula IDs.
  for (const id of Object.keys(formulas)) {
    if (id.toLowerCase() === norm) {
      return formulas[id]?.value ?? null;
    }
  }
  return null;
}

function recalculateWorkspaceSheet(sheetId) {
  // AW-7.5 + AW-8: graph-driven recalc.
  //   - Re-resolves system formulas (B1/B2/B3, FC-snapshot consumer) and
  //     propagates any user formulas that depend on them.
  //   - AW-8: detects MARKET_DATA_VERSION / DERIVED_FINANCIAL_STATE.version
  //     deltas and propagates `MARKET:*` / `FINANCIAL:*` pseudo-deps so
  //     PRICE() / PORTFOLIO.* / EXPOSURE() / ALLOCATION() recompute
  //     reactively when the FC pipeline updates.
  const sheet = WORKSPACE_RUNTIME.sheets.get(sheetId);
  if (!sheet) return false;

  const now = Date.now();
  const changedSystemRefs = new Set();

  for (const cell of sheet.cells.values()) {
    if (cell.type !== 'formula' || !cell.formula || !cell.readonly) continue;
    const next = resolveWorkspaceFormula(cell.formula);
    if (next !== cell.computed) {
      cell.computed = next;
      cell.updatedAt = now;
      changedSystemRefs.add(cell.id);
    }
  }

  for (const id of changedSystemRefs) {
    _propagateWorkspaceChange(id);
  }

  // AW-8: financial reactivity. Detect FC version deltas and propagate the
  // matching pseudo-dep IDs from the reverse graph. Iterating the reverse
  // graph keeps this O(#financial-refs) instead of touching every cell.
  const mv = (typeof MARKET_DATA_VERSION === 'number') ? MARKET_DATA_VERSION : 0;
  if (mv !== WORKSPACE_RUNTIME.lastMarketVersion) {
    WORKSPACE_RUNTIME.lastMarketVersion = mv;
    for (const refId of WORKSPACE_RUNTIME.reverseDependencyGraph.keys()) {
      if (typeof refId === 'string' && refId.startsWith('MARKET:')) {
        _propagateWorkspaceChange(refId);
      }
    }
  }
  const dv = (typeof DERIVED_FINANCIAL_STATE !== 'undefined' && DERIVED_FINANCIAL_STATE)
    ? DERIVED_FINANCIAL_STATE.version : 0;
  if (dv !== WORKSPACE_RUNTIME.lastDerivedVersion) {
    WORKSPACE_RUNTIME.lastDerivedVersion = dv;
    for (const refId of WORKSPACE_RUNTIME.reverseDependencyGraph.keys()) {
      if (typeof refId === 'string' && refId.startsWith('FINANCIAL:')) {
        _propagateWorkspaceChange(refId);
      }
    }
  }

  sheet.updatedAt = now;
  WORKSPACE_RUNTIME.recalculations++;
  WORKSPACE_RUNTIME.lastCalculatedAt = now;
  if (typeof AURIX_TELEMETRY !== 'undefined') {
    AURIX_TELEMETRY.workspace.recomputeRuns++;
    AURIX_TELEMETRY.workspace.recomputeDurationMs.sum   += Date.now() - now;
    AURIX_TELEMETRY.workspace.recomputeDurationMs.count++;
  }
  return true;
}

function _parseCellId(id) {
  const m = String(id || '').match(/^([A-Z]+)(\d+)$/);
  if (!m) return ['', 0];
  return [m[1], parseInt(m[2], 10)];
}

function getWorkspaceSheetSnapshot(sheetId) {
  const sheet = WORKSPACE_RUNTIME.sheets.get(sheetId);
  if (!sheet) return null;

  const cells = {};
  for (const [id, cell] of sheet.cells) {
    cells[id] = Object.freeze({
      id:        cell.id,
      type:      cell.type,
      value:     cell.value,
      formula:   cell.formula,
      computed:  cell.computed,
      format:    cell.format,
      readonly:  cell.readonly,
      invalid:   !!cell.invalid, // AW-7.4
      updatedAt: cell.updatedAt,
    });
  }

  return Object.freeze({
    id:        sheet.id,
    name:      sheet.name,
    createdAt: sheet.createdAt,
    updatedAt: sheet.updatedAt,
    cells:     Object.freeze(cells),
    metadata:  Object.freeze({ ...sheet.metadata }),
  });
}

function selectWorkspaceCell(cellId) {
  // AW-4: legacy entry point — defers to the canonical setActiveCell so the
  // active/selected pair stays mirrored. Intentionally allows empty cells
  // within grid bounds (cells without an entry in sheet.cells are valid
  // navigation targets in AW-4).
  return setActiveCell(cellId);
}

// ── AW-4 §2: Grid coordinate system ───────────────────────────────────────────
// Pure helpers. Foundation for AW-5 editing, AW-6 references, dependency
// tracing and contextual operations. Deterministic, no side effects.
function getCellRow(cellId) {
  const m = String(cellId || '').match(/^([A-Z]+)(\d+)$/);
  return m ? parseInt(m[2], 10) : 0;
}

function getCellColumn(cellId) {
  const m = String(cellId || '').match(/^([A-Z]+)(\d+)$/);
  return m ? m[1] : '';
}

function buildCellId(row, column) {
  return String(column || '') + String(row || '');
}

function _isCellInGridBounds(cellId) {
  const col = getCellColumn(cellId);
  const row = getCellRow(cellId);
  if (!col || !row) return false;
  return WORKSPACE_RUNTIME.gridColumns.includes(col)
      && WORKSPACE_RUNTIME.gridRows.includes(row);
}

function getAdjacentCell(cellId, direction) {
  const cols = WORKSPACE_RUNTIME.gridColumns;
  const rows = WORKSPACE_RUNTIME.gridRows;
  const col  = getCellColumn(cellId);
  const row  = getCellRow(cellId);

  const colIdx = cols.indexOf(col);
  const rowIdx = rows.indexOf(row);
  if (colIdx < 0 || rowIdx < 0) return cellId;

  let nextCol = colIdx;
  let nextRow = rowIdx;
  switch (direction) {
    case 'up':    nextRow = Math.max(0, rowIdx - 1); break;
    case 'down':  nextRow = Math.min(rows.length - 1, rowIdx + 1); break;
    case 'left':  nextCol = Math.max(0, colIdx - 1); break;
    case 'right': nextCol = Math.min(cols.length - 1, colIdx + 1); break;
    default:      return cellId;
  }
  return buildCellId(rows[nextRow], cols[nextCol]);
}

// AW-4 §4: Active cell engine. Single canonical mutator for selection state.
// Allows empty cells inside grid bounds; mirrors selectedCell for backward
// compatibility with AW-2/AW-3 consumers.
function setActiveCell(cellId) {
  if (cellId == null) {
    WORKSPACE_RUNTIME.activeCellId = null;
    WORKSPACE_RUNTIME.selectedCell = null;
    return true;
  }
  if (!_isCellInGridBounds(cellId)) return false;
  WORKSPACE_RUNTIME.activeCellId = cellId;
  WORKSPACE_RUNTIME.selectedCell = cellId;
  return true;
}

// AW-7.1 / AW-7.4: edit-mode lifecycle. Permite literales y, desde AW-7.4,
// también fórmulas user-side (=A1+B1). Sólo readonly bloquea edición —
// system cells siguen protegidas, las user formulas (type='formula',
// readonly:false) son editables como cualquier celda user-owned.
function _isWorkspaceCellEditable(cell) {
  if (!cell) return true; // empty user cell within bounds → editable
  if (cell.readonly) return false;
  return true;
}

function _coerceWorkspaceLiteral(raw) {
  const s = String(raw ?? '').trim();
  if (s === '') return null;
  // Pure number → number; everything else (incl. "15%", "BTC DCA") stays string.
  if (/^-?\d+(?:\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) return n;
  }
  return s;
}

// ── AW-7.4: Safe workspace formula parser v1 ─────────────────────────────────
// Grammar:  =operand operator operand
//   operand : cellRef (e.g., A1) | number (e.g., 10, 0.25, -5)
//   operator: + - * /
// Pure tokenizer + tiny AST. No eval, no Function constructor, no dynamic
// execution. Workspace-only — completamente separado del Financial Formula
// Runtime (FC-10/11). Las celdas system (B1/B2/B3) siguen resolviéndose por
// la ruta existente `resolveWorkspaceFormula` (FC-snapshot consumer-only).

function isWorkspaceFormulaInput(raw) {
  const s = String(raw ?? '').trim();
  return s.length > 1 && s.charCodeAt(0) === 61 /* '=' */;
}

// ── AW-8: Parser V2 — recursive descent + AST ────────────────────────────────
// Grammar (precedence climbing):
//   expression     := additive
//   additive       := multiplicative (('+' | '-') multiplicative)*
//   multiplicative := unary (('*' | '/') unary)*
//   unary          := ('+' | '-')? primary
//   primary        := NUMBER | STRING | '(' expression ')' | identCallOrRef
//   identCallOrRef := IDENT ( '(' argList? ')' | ':' IDENT | ε )
//   argList        := argument (',' argument)*
//   argument       := IDENT ':' IDENT | expression
//
// AST node kinds:
//   { type: 'num',    value }
//   { type: 'str',    value }
//   { type: 'ref',    ref }
//   { type: 'range',  from, to }
//   { type: 'unary',  op, operand }
//   { type: 'binary', op, lhs, rhs }
//   { type: 'call',   name, args }
//
// No eval, no Function constructor, no dynamic execution. Pure tokenizer +
// recursive descent + AST walker. Workspace-only.

function _aw8Tokenize(text) {
  const tokens = [];
  const n = text.length;
  let i = 0;
  while (i < n) {
    const c = text[i];
    // Whitespace
    if (c === ' ' || c === '\t' || c === '\n' || c === '\r') { i++; continue; }
    // Number (digits, optional decimal). Leading '.123' supported.
    if ((c >= '0' && c <= '9') ||
        (c === '.' && i + 1 < n && text[i+1] >= '0' && text[i+1] <= '9')) {
      let j = i + 1;
      while (j < n && ((text[j] >= '0' && text[j] <= '9') || text[j] === '.')) j++;
      const num = Number(text.slice(i, j));
      if (!Number.isFinite(num)) return null;
      tokens.push({ t: 'num', v: num });
      i = j;
      continue;
    }
    // String literal: " or ' delimited (and the curly variants users may paste).
    if (c === '"' || c === "'" || c === '“' || c === '”' || c === '‘' || c === '’') {
      const openers = '"\'“‘';
      const closers = '"\'”’';
      // Accept any closing quote character (smart-quotes, ascii) after open.
      let j = i + 1;
      while (j < n && !closers.includes(text[j]) && text[j] !== c) j++;
      if (j >= n) return null;
      tokens.push({ t: 'str', v: text.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    // Identifier: letters / digits / '_' / '.', must start with letter or '_'.
    if ((c >= 'A' && c <= 'Z') || (c >= 'a' && c <= 'z') || c === '_') {
      let j = i + 1;
      while (j < n) {
        const cj = text[j];
        if ((cj >= 'A' && cj <= 'Z') || (cj >= 'a' && cj <= 'z') ||
            (cj >= '0' && cj <= '9') || cj === '_' || cj === '.') {
          j++;
        } else break;
      }
      tokens.push({ t: 'ident', v: text.slice(i, j).toUpperCase() });
      i = j;
      continue;
    }
    // Operators
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ t: 'op', v: c });
      i++;
      continue;
    }
    // PR-8B: comparison operators. Multi-char (`<=`, `>=`, `<>`) tried first.
    if (c === '<') {
      if (text[i+1] === '=') { tokens.push({ t: 'cmp', v: '<=' }); i += 2; continue; }
      if (text[i+1] === '>') { tokens.push({ t: 'cmp', v: '<>' }); i += 2; continue; }
      tokens.push({ t: 'cmp', v: '<' }); i++; continue;
    }
    if (c === '>') {
      if (text[i+1] === '=') { tokens.push({ t: 'cmp', v: '>=' }); i += 2; continue; }
      tokens.push({ t: 'cmp', v: '>' }); i++; continue;
    }
    if (c === '=') {
      tokens.push({ t: 'cmp', v: '=' }); i++; continue;
    }
    // Punctuation
    if (c === '(') { tokens.push({ t: 'lparen' }); i++; continue; }
    if (c === ')') { tokens.push({ t: 'rparen' }); i++; continue; }
    if (c === ',') { tokens.push({ t: 'comma'  }); i++; continue; }
    if (c === ':') { tokens.push({ t: 'colon'  }); i++; continue; }
    return null; // unknown char
  }
  return tokens;
}

function _isCellRefShape(s) {
  return /^[A-Z]+\d+$/.test(s);
}

function _aw8Peek(state, offset = 0)  { return state.tokens[state.idx + offset]; }
function _aw8Consume(state)            { return state.tokens[state.idx++]; }

function _aw8ParseExpression(state) { return _aw8ParseComparison(state); }

// PR-8B: comparison level sits between expression and additive. Spreadsheet
// convention: comparisons have lower precedence than arithmetic, so
// 1+2>2 parses as (1+2)>2 → 1. Returns 1/0 numerically.
function _aw8ParseComparison(state) {
  let left = _aw8ParseAdditive(state);
  while (_aw8Peek(state)?.t === 'cmp') {
    const op = _aw8Consume(state).v;
    const right = _aw8ParseAdditive(state);
    left = { type: 'binary', op, lhs: left, rhs: right };
  }
  return left;
}

function _aw8ParseAdditive(state) {
  let left = _aw8ParseMultiplicative(state);
  while (_aw8Peek(state)?.t === 'op' && (_aw8Peek(state).v === '+' || _aw8Peek(state).v === '-')) {
    const op = _aw8Consume(state).v;
    const right = _aw8ParseMultiplicative(state);
    left = { type: 'binary', op, lhs: left, rhs: right };
  }
  return left;
}

function _aw8ParseMultiplicative(state) {
  let left = _aw8ParseUnary(state);
  while (_aw8Peek(state)?.t === 'op' && (_aw8Peek(state).v === '*' || _aw8Peek(state).v === '/')) {
    const op = _aw8Consume(state).v;
    const right = _aw8ParseUnary(state);
    left = { type: 'binary', op, lhs: left, rhs: right };
  }
  return left;
}

function _aw8ParseUnary(state) {
  const tok = _aw8Peek(state);
  if (tok && tok.t === 'op' && (tok.v === '+' || tok.v === '-')) {
    const op = _aw8Consume(state).v;
    const operand = _aw8ParseUnary(state);
    if (op === '+') return operand;
    return { type: 'unary', op, operand };
  }
  return _aw8ParsePrimary(state);
}

function _aw8ParsePrimary(state) {
  const tok = _aw8Peek(state);
  if (!tok) throw new Error('aw8:eof');

  if (tok.t === 'num')   { _aw8Consume(state); return { type: 'num', value: tok.v }; }
  if (tok.t === 'str')   { _aw8Consume(state); return { type: 'str', value: tok.v }; }

  if (tok.t === 'lparen') {
    _aw8Consume(state);
    const expr = _aw8ParseExpression(state);
    const close = _aw8Consume(state);
    if (!close || close.t !== 'rparen') throw new Error('aw8:rparen');
    return expr;
  }

  if (tok.t === 'ident') {
    _aw8Consume(state);
    const name = tok.v;
    // Function call: IDENT '(' …
    if (_aw8Peek(state)?.t === 'lparen') {
      _aw8Consume(state);
      const args = [];
      if (_aw8Peek(state)?.t !== 'rparen') {
        args.push(_aw8ParseArg(state));
        while (_aw8Peek(state)?.t === 'comma') {
          _aw8Consume(state);
          args.push(_aw8ParseArg(state));
        }
      }
      const close = _aw8Consume(state);
      if (!close || close.t !== 'rparen') throw new Error('aw8:rparen');
      return { type: 'call', name, args };
    }
    // Range start: A1 ':' A5
    if (_isCellRefShape(name) && _aw8Peek(state)?.t === 'colon') {
      _aw8Consume(state);
      const next = _aw8Consume(state);
      if (!next || next.t !== 'ident' || !_isCellRefShape(next.v)) throw new Error('aw8:range');
      return { type: 'range', from: name, to: next.v };
    }
    // Plain cell reference
    if (_isCellRefShape(name)) {
      return { type: 'ref', ref: name };
    }
    throw new Error('aw8:ident:' + name);
  }

  throw new Error('aw8:unexpected');
}

function _aw8ParseArg(state) {
  // Argument can be a range (IDENT ':' IDENT) or any expression.
  const a = _aw8Peek(state, 0);
  const b = _aw8Peek(state, 1);
  if (a?.t === 'ident' && b?.t === 'colon' && _isCellRefShape(a.v)) {
    const from = _aw8Consume(state).v;
    _aw8Consume(state); // colon
    const to = _aw8Consume(state);
    if (!to || to.t !== 'ident' || !_isCellRefShape(to.v)) throw new Error('aw8:range');
    return { type: 'range', from, to: to.v };
  }
  return _aw8ParseExpression(state);
}

function parseWorkspaceFormula(raw) {
  const s = String(raw ?? '').trim();
  if (!isWorkspaceFormulaInput(s)) return null;
  const body = s.slice(1).trim();
  if (!body) return null;
  const tokens = _aw8Tokenize(body);
  if (!tokens || tokens.length === 0) {
    if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.workspace.parserFailures++;
    return null;
  }
  const state = { tokens, idx: 0 };
  let ast;
  try {
    ast = _aw8ParseExpression(state);
    if (state.idx !== state.tokens.length) {
      if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.workspace.parserFailures++;
      return null;
    }
  } catch (_e) {
    if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.workspace.parserFailures++;
    return null;
  }
  return ast;
}

// ── AW-8: Range expansion + numeric collection ────────────────────────────────

function _expandRange(rangeNode) {
  if (!rangeNode || rangeNode.type !== 'range') return null;
  const m1 = String(rangeNode.from || '').match(/^([A-Z]+)(\d+)$/);
  const m2 = String(rangeNode.to   || '').match(/^([A-Z]+)(\d+)$/);
  if (!m1 || !m2) return null;
  const cols = WORKSPACE_RUNTIME.gridColumns;
  const ci1 = cols.indexOf(m1[1]);
  const ci2 = cols.indexOf(m2[1]);
  if (ci1 < 0 || ci2 < 0) return null;
  const r1 = parseInt(m1[2], 10);
  const r2 = parseInt(m2[2], 10);
  const cMin = Math.min(ci1, ci2), cMax = Math.max(ci1, ci2);
  const rMin = Math.min(r1,  r2),  rMax = Math.max(r1,  r2);
  const ids = [];
  for (let c = cMin; c <= cMax; c++) {
    for (let r = rMin; r <= rMax; r++) {
      ids.push(cols[c] + r);
    }
  }
  return ids;
}

function _aw8RangeNumericValues(rangeNode) {
  const ids = _expandRange(rangeNode);
  if (!ids) return null;
  const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
  if (!sheet) return [];
  const out = [];
  for (const id of ids) {
    const cell = sheet.cells.get(id);
    if (!cell) continue;            // skip empty cells
    if (cell.invalid) continue;     // skip #ERROR / #CYCLE / #DIV/0
    const v = resolveWorkspaceCellReference(id);
    if (typeof v === 'number' && Number.isFinite(v)) out.push(v);
  }
  return out;
}

// ── AW-8: Function registries ────────────────────────────────────────────────

// Custom error code for evaluator control flow (no eval, no exception abuse —
// just a discriminated tag so we can map to the right '#XXX' sentinel).
function _AwEvalError(code) { this.code = code; }
_AwEvalError.prototype = Object.create(Error.prototype);

// PR-8A: numeric coercion for scalar function args. Accepts a 'num' literal
// or any AST node that evaluates to a finite number (refs, binary, calls).
// Centralizes the pattern so the new math functions stay one-liner-ish and
// nested expressions like ROUND(SUM(A1:A3), 2) work as expected.
function _aw8ArgAsNumber(node) {
  if (!node) throw new _AwEvalError('#ERROR');
  const v = (node.type === 'num') ? node.value : _aw8EvalAst(node);
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new _AwEvalError('#ERROR');
  return v;
}

// PR-9: raw ref reader for string functions. The numeric resolver upstream
// throws for non-numeric cell contents — that's correct for arithmetic but
// breaks =LEN(A1) when A1 holds text. This path returns the cell's raw value
// (string | number | '') without coercion. Error tokens and invalid cells
// still throw so =LEN(B_with_error) surfaces #ERROR cleanly.
function _aw8ResolveRefRaw(ref) {
  if (!_isCellInGridBounds(ref)) throw new _AwEvalError('#ERROR');
  const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
  if (!sheet) return '';
  const cell = sheet.cells.get(ref);
  if (!cell) return '';
  if (cell.invalid) throw new _AwEvalError('#ERROR');
  if (cell.type === 'formula') {
    const c = cell.computed;
    if (c == null) return '';
    if (typeof c === 'string' && c.charCodeAt(0) === 35 /* '#' */) throw new _AwEvalError('#ERROR');
    return c;
  }
  return cell.value ?? '';
}

function _aw8ArgAsString(node) {
  if (!node) throw new _AwEvalError('#ERROR');
  if (node.type === 'str') return node.value;
  if (node.type === 'num') return String(node.value);
  if (node.type === 'ref') {
    const v = _aw8ResolveRefRaw(node.ref);
    return v == null ? '' : String(v);
  }
  const v = _aw8EvalAst(node);
  if (v == null) return '';
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new _AwEvalError('#ERROR');
    return String(v);
  }
  return String(v);
}

// PR-9: enumerate raw cell values (number | string) across a range for the
// conditional aggregates. Skips empty / invalid / error-token cells; returns
// null only if the range itself fails to expand. SUMIF/AVGIF additionally
// filter on typeof === 'number' when summing.
function _aw8RangeRawValues(rangeNode) {
  const ids = _expandRange(rangeNode);
  if (!ids) return null;
  const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
  if (!sheet) return [];
  const out = [];
  for (const id of ids) {
    const cell = sheet.cells.get(id);
    if (!cell) continue;
    if (cell.invalid) continue;
    if (cell.type === 'formula') {
      const c = cell.computed;
      if (c == null || c === '') continue;
      if (typeof c === 'string' && c.charCodeAt(0) === 35) continue;
      out.push(c);
    } else {
      const v = cell.value;
      if (v == null || v === '') continue;
      out.push(v);
    }
  }
  return out;
}

// PR-9: predicate builder for SUMIF / COUNTIF / AVGIF. Criteria forms:
//   - numeric AST              → exact numeric match
//   - bare string              → exact case-insensitive string match
//   - "<>N" | ">N" | ">=N"
//     "<N"  | "<=N" | "=N"     → numeric comparator when RHS is finite;
//                                otherwise string equality with "="/"<>".
// Unsupported operator combinations resolve to a never-match predicate so
// the caller surfaces an explicit 0 / #DIV/0 instead of a thrown error.
function _aw8BuildCriteria(node) {
  const raw = _aw8EvalAst(node);
  if (typeof raw === 'number') {
    return c => (typeof c === 'number' && c === raw);
  }
  if (typeof raw === 'string') {
    const m = /^\s*(<>|<=|>=|<|>|=)\s*(.*)$/.exec(raw);
    if (m) {
      const op = m[1];
      const restStr = m[2].trim();
      const restNum = Number(restStr);
      const isNumeric = restStr !== '' && Number.isFinite(restNum);
      if (isNumeric) {
        switch (op) {
          case '<>': return c => !(typeof c === 'number' && c === restNum);
          case '<=': return c => typeof c === 'number' && c <= restNum;
          case '>=': return c => typeof c === 'number' && c >= restNum;
          case '<':  return c => typeof c === 'number' && c <  restNum;
          case '>':  return c => typeof c === 'number' && c >  restNum;
          case '=':  return c => typeof c === 'number' && c === restNum;
        }
      } else {
        const target = restStr.toUpperCase();
        if (op === '<>') return c => String(c ?? '').toUpperCase() !== target;
        if (op === '=')  return c => String(c ?? '').toUpperCase() === target;
        return () => false;
      }
    }
    const target = raw.toUpperCase();
    return c => String(c ?? '').toUpperCase() === target;
  }
  return () => false;
}

// PR-9: ISO-only date coercion. Accepts numeric ms (canonical, returned by
// TODAY/NOW/DATE) or strict "YYYY-MM-DD" optionally followed by
// "Thh:mm[:ss]". Locale-dependent strings (e.g. "01/15/2025") throw #ERROR
// rather than silently parse, so users get a predictable failure instead
// of a wrong date.
function _aw8ToDateMs(node) {
  const v = _aw8EvalAst(node);
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(v.trim());
    if (m) {
      const y = +m[1], mo = +m[2] - 1, d = +m[3];
      const hh = m[4] ? +m[4] : 0, mi = m[5] ? +m[5] : 0, ss = m[6] ? +m[6] : 0;
      const dt = new Date(y, mo, d, hh, mi, ss);
      if (Number.isFinite(dt.getTime())) return dt.getTime();
    }
  }
  throw new _AwEvalError('#ERROR');
}

const _AW8_WORKSPACE_FUNCTIONS = Object.freeze({
  SUM(args) {
    if (args.length !== 1 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const vs = _aw8RangeNumericValues(args[0]);
    if (vs == null) throw new _AwEvalError('#ERROR');
    let s = 0;
    for (const v of vs) s += v;
    return s;
  },
  AVG(args) {
    if (args.length !== 1 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const vs = _aw8RangeNumericValues(args[0]);
    if (vs == null) throw new _AwEvalError('#ERROR');
    if (vs.length === 0) return 0;
    let s = 0;
    for (const v of vs) s += v;
    return s / vs.length;
  },
  MIN(args) {
    if (args.length !== 1 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const vs = _aw8RangeNumericValues(args[0]);
    if (vs == null) throw new _AwEvalError('#ERROR');
    if (vs.length === 0) return 0;
    let m = vs[0];
    for (let i = 1; i < vs.length; i++) if (vs[i] < m) m = vs[i];
    return m;
  },
  MAX(args) {
    if (args.length !== 1 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const vs = _aw8RangeNumericValues(args[0]);
    if (vs == null) throw new _AwEvalError('#ERROR');
    if (vs.length === 0) return 0;
    let m = vs[0];
    for (let i = 1; i < vs.length; i++) if (vs[i] > m) m = vs[i];
    return m;
  },
  // PR-8A: core math. Spreadsheet-standard semantics.
  ROUND(args) {
    if (args.length < 1 || args.length > 2) throw new _AwEvalError('#ERROR');
    const n = _aw8ArgAsNumber(args[0]);
    const d = args.length === 2 ? Math.trunc(_aw8ArgAsNumber(args[1])) : 0;
    const factor = Math.pow(10, d);
    return Math.round(n * factor) / factor;
  },
  ABS(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return Math.abs(_aw8ArgAsNumber(args[0]));
  },
  SQRT(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    const n = _aw8ArgAsNumber(args[0]);
    if (n < 0) throw new _AwEvalError('#ERROR');
    return Math.sqrt(n);
  },
  POW(args) {
    if (args.length !== 2) throw new _AwEvalError('#ERROR');
    const b = _aw8ArgAsNumber(args[0]);
    const e = _aw8ArgAsNumber(args[1]);
    const r = Math.pow(b, e);
    if (!Number.isFinite(r)) throw new _AwEvalError('#ERROR');
    return r;
  },
  MOD(args) {
    // Spreadsheet MOD: result has the sign of the divisor (matches Excel/Sheets).
    if (args.length !== 2) throw new _AwEvalError('#ERROR');
    const n = _aw8ArgAsNumber(args[0]);
    const d = _aw8ArgAsNumber(args[1]);
    if (d === 0) throw new _AwEvalError('#DIV/0');
    return n - Math.floor(n / d) * d;
  },
  INT(args) {
    // Floor toward -infinity (spreadsheet convention; INT(-1.5) === -2).
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return Math.floor(_aw8ArgAsNumber(args[0]));
  },
  COUNT(args) {
    // COUNT(range) — number of numeric (non-invalid) values in the range.
    if (args.length !== 1 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const vs = _aw8RangeNumericValues(args[0]);
    if (vs == null) throw new _AwEvalError('#ERROR');
    return vs.length;
  },
  COUNTA(args) {
    // COUNTA(range) — number of non-empty cells (any value, ignoring invalid).
    if (args.length !== 1 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const ids = _expandRange(args[0]);
    if (!ids) throw new _AwEvalError('#ERROR');
    const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
    if (!sheet) return 0;
    let n = 0;
    for (const id of ids) {
      const cell = sheet.cells.get(id);
      if (!cell || cell.invalid) continue;
      if (cell.type === 'formula') {
        if (cell.computed != null && cell.computed !== '') n++;
      } else {
        if (cell.value != null && cell.value !== '') n++;
      }
    }
    return n;
  },
  // PR-8B: logical formulas. Truthiness convention: any non-zero finite
  // number is true, zero is false. Comparison ops return 1/0 so these
  // chain naturally (IF(A1>10, …)). Branches may evaluate to strings.
  IF(args) {
    if (args.length !== 3) throw new _AwEvalError('#ERROR');
    const cond = _aw8EvalAst(args[0]);
    if (typeof cond !== 'number' || !Number.isFinite(cond)) throw new _AwEvalError('#ERROR');
    return _aw8EvalAst(cond !== 0 ? args[1] : args[2]);
  },
  AND(args) {
    if (args.length === 0) throw new _AwEvalError('#ERROR');
    for (const a of args) {
      const v = _aw8EvalAst(a);
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new _AwEvalError('#ERROR');
      if (v === 0) return 0;
    }
    return 1;
  },
  OR(args) {
    if (args.length === 0) throw new _AwEvalError('#ERROR');
    for (const a of args) {
      const v = _aw8EvalAst(a);
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new _AwEvalError('#ERROR');
      if (v !== 0) return 1;
    }
    return 0;
  },
  NOT(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    const v = _aw8EvalAst(args[0]);
    if (typeof v !== 'number' || !Number.isFinite(v)) throw new _AwEvalError('#ERROR');
    return v === 0 ? 1 : 0;
  },
  IFERROR(args) {
    if (args.length !== 2) throw new _AwEvalError('#ERROR');
    try {
      const v = _aw8EvalAst(args[0]);
      // Catch infinity / NaN as errors so IFERROR(1/0, fallback) works even
      // though arithmetic itself already throws #DIV/0 explicitly.
      if (typeof v === 'number' && !Number.isFinite(v)) throw new _AwEvalError('#ERROR');
      return v;
    } catch (e) {
      if (e instanceof _AwEvalError) return _aw8EvalAst(args[1]);
      throw e;
    }
  },
  // PR-9: conditional aggregations. Single-range form. SUMIF / AVGIF restrict
  // the sum to numeric matches; COUNTIF counts any match (numeric or string).
  // AVGIF returns #DIV/0 when no numeric value matched.
  SUMIF(args) {
    if (args.length !== 2 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const matches = _aw8BuildCriteria(args[1]);
    const vals = _aw8RangeRawValues(args[0]);
    if (vals == null) throw new _AwEvalError('#ERROR');
    let s = 0;
    for (const v of vals) if (matches(v) && typeof v === 'number') s += v;
    return s;
  },
  COUNTIF(args) {
    if (args.length !== 2 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const matches = _aw8BuildCriteria(args[1]);
    const vals = _aw8RangeRawValues(args[0]);
    if (vals == null) throw new _AwEvalError('#ERROR');
    let n = 0;
    for (const v of vals) if (matches(v)) n++;
    return n;
  },
  AVGIF(args) {
    if (args.length !== 2 || args[0].type !== 'range') throw new _AwEvalError('#ERROR');
    const matches = _aw8BuildCriteria(args[1]);
    const vals = _aw8RangeRawValues(args[0]);
    if (vals == null) throw new _AwEvalError('#ERROR');
    let s = 0, n = 0;
    for (const v of vals) if (matches(v) && typeof v === 'number') { s += v; n++; }
    if (n === 0) throw new _AwEvalError('#DIV/0');
    return s / n;
  },
  // PR-9: string utilities. CONCAT takes variable args. LEFT/RIGHT/MID use
  // spreadsheet-standard 1-indexed positions; negative counts → #ERROR.
  CONCAT(args) {
    if (args.length === 0) throw new _AwEvalError('#ERROR');
    let s = '';
    for (const a of args) s += _aw8ArgAsString(a);
    return s;
  },
  LEN(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return _aw8ArgAsString(args[0]).length;
  },
  UPPER(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return _aw8ArgAsString(args[0]).toUpperCase();
  },
  LOWER(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return _aw8ArgAsString(args[0]).toLowerCase();
  },
  TRIM(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return _aw8ArgAsString(args[0]).trim();
  },
  LEFT(args) {
    if (args.length !== 2) throw new _AwEvalError('#ERROR');
    const s = _aw8ArgAsString(args[0]);
    const n = Math.trunc(_aw8ArgAsNumber(args[1]));
    if (n < 0) throw new _AwEvalError('#ERROR');
    return s.slice(0, n);
  },
  RIGHT(args) {
    if (args.length !== 2) throw new _AwEvalError('#ERROR');
    const s = _aw8ArgAsString(args[0]);
    const n = Math.trunc(_aw8ArgAsNumber(args[1]));
    if (n < 0) throw new _AwEvalError('#ERROR');
    if (n === 0) return '';
    return n >= s.length ? s : s.slice(s.length - n);
  },
  MID(args) {
    if (args.length !== 3) throw new _AwEvalError('#ERROR');
    const s = _aw8ArgAsString(args[0]);
    const start = Math.trunc(_aw8ArgAsNumber(args[1]));
    const len   = Math.trunc(_aw8ArgAsNumber(args[2]));
    if (start < 1 || len < 0) throw new _AwEvalError('#ERROR');
    return s.slice(start - 1, start - 1 + len);
  },
  // PR-9: date utilities. Canonical representation is ms-since-epoch so date
  // arithmetic (=TODAY()-7) keeps working. Cells need cell.format='date' to
  // render as a localized date; without it the raw ms surfaces. String input
  // to DAY/MONTH/YEAR/DATEDIF must be ISO-shaped — locale-dependent parsing
  // is deliberately excluded (would silently mis-parse "01/02/2025").
  TODAY(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  },
  NOW(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    return Date.now();
  },
  DATE(args) {
    if (args.length !== 3) throw new _AwEvalError('#ERROR');
    const y = Math.trunc(_aw8ArgAsNumber(args[0]));
    const m = Math.trunc(_aw8ArgAsNumber(args[1]));
    const d = Math.trunc(_aw8ArgAsNumber(args[2]));
    const dt = new Date(y, m - 1, d);
    if (!Number.isFinite(dt.getTime())) throw new _AwEvalError('#ERROR');
    return dt.getTime();
  },
  DAY(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return new Date(_aw8ToDateMs(args[0])).getDate();
  },
  MONTH(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return new Date(_aw8ToDateMs(args[0])).getMonth() + 1;
  },
  YEAR(args) {
    if (args.length !== 1) throw new _AwEvalError('#ERROR');
    return new Date(_aw8ToDateMs(args[0])).getFullYear();
  },
  DATEDIF(args) {
    if (args.length !== 2) throw new _AwEvalError('#ERROR');
    const a = _aw8ToDateMs(args[0]);
    const b = _aw8ToDateMs(args[1]);
    return Math.floor((b - a) / 86400000);
  },
});

// PR-8C: shared aggregator for portfolio PnL formulas. Reads `assets[]`
// once and applies the canonical USD valuation (assetValueUSD from PR-6,
// which already handles gold karat + EUR normalisation). Returning both
// `pnl` and `cost` lets PORTFOLIO.PNL and PORTFOLIO.PNL_PCT share the
// same walk without duplicating portfolio math.
function _aw8PortfolioUnrealizedTotal() {
  if (typeof assets === 'undefined' || !Array.isArray(assets)) return { pnl: 0, cost: 0 };
  let pnl = 0, cost = 0;
  for (const a of assets) {
    if (!a || !a.costBasis || a.costBasis <= 0) continue;
    cost += Number(a.costBasis) || 0;
    const val = (typeof assetValueUSD === 'function') ? assetValueUSD(a) : (Number(a.qty || 0) * Number(a.price || 0));
    pnl += val - Number(a.costBasis);
  }
  return { pnl, cost };
}

// PR-WP5: portfolio analytics aggregator. One walk over assets[] computes
// the per-position pnl%, total cost, win count, and best/worst tickers, so
// PORTFOLIO.COST / WINRATE / BEST / WORST all read from a single shared
// traversal (same pattern as _aw8PortfolioUnrealizedTotal for PNL family).
// Positions with no costBasis are skipped (matches PR-8C convention) so a
// closed or zero-cost position can't skew win-rate or pnl%-ranking.
function _wp5PortfolioAnalytics() {
  const out = { cost: 0, total: 0, wins: 0, best: null, worst: null };
  if (typeof assets === 'undefined' || !Array.isArray(assets)) return out;
  let bestPct = -Infinity, worstPct = Infinity;
  for (const a of assets) {
    if (!a || !a.costBasis || a.costBasis <= 0) continue;
    const cost = Number(a.costBasis) || 0;
    if (cost <= 0) continue;
    out.cost  += cost;
    out.total += 1;
    const val = (typeof assetValueUSD === 'function')
      ? assetValueUSD(a)
      : (Number(a.qty || 0) * Number(a.price || 0));
    const pnl = val - cost;
    const pct = (pnl / cost) * 100;
    if (pnl > 0) out.wins += 1;
    const tk = String(a.ticker || '').toUpperCase();
    if (tk) {
      if (pct > bestPct)  { bestPct  = pct; out.best  = tk; }
      if (pct < worstPct) { worstPct = pct; out.worst = tk; }
    }
  }
  return out;
}

// PR-8C: look up a holding by ticker symbol (case-insensitive). Returns
// null if absent so callers can short-circuit to 0 for missing positions.
function _aw8AssetByTicker(sym) {
  if (typeof assets === 'undefined' || !Array.isArray(assets)) return null;
  const target = String(sym || '').trim().toUpperCase();
  if (!target) return null;
  for (const a of assets) {
    if (a && String(a.ticker || '').toUpperCase() === target) return a;
  }
  return null;
}

// Financial functions: pure consumers of FC snapshots (getMarketSnapshot /
// getDerivedFinancialSnapshot / getMarketPrice). Never fetch, never mutate.
const _AW8_FINANCIAL_FUNCTIONS = Object.freeze({
  PRICE(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const symbol = String(args[0].value || '').trim();
    if (!symbol) throw new _AwEvalError('#ERROR');
    const price = (typeof getMarketPrice === 'function') ? getMarketPrice(symbol) : null;
    if (price == null || !Number.isFinite(price)) throw new _AwEvalError('#ERROR');
    return price;
  },
  'PORTFOLIO.VALUE'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    const snap = (typeof getDerivedFinancialSnapshot === 'function') ? getDerivedFinancialSnapshot() : null;
    return Number(snap?.portfolio?.totalValue || 0);
  },
  'PORTFOLIO.ASSETS'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    const snap = (typeof getDerivedFinancialSnapshot === 'function') ? getDerivedFinancialSnapshot() : null;
    return Number(snap?.portfolio?.assetCount || 0);
  },
  EXPOSURE(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const cat = String(args[0].value || '').trim().toLowerCase();
    if (!cat) throw new _AwEvalError('#ERROR');
    const snap = (typeof getDerivedFinancialSnapshot === 'function') ? getDerivedFinancialSnapshot() : null;
    const exp = snap?.portfolio?.exposure || {};
    if (Object.prototype.hasOwnProperty.call(exp, cat)) return Number(exp[cat] || 0);
    if (cat === 'stocks' && exp.stock != null) return Number(exp.stock || 0); // common alias
    return 0;
  },
  ALLOCATION(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const symbol = String(args[0].value || '').trim().toUpperCase();
    if (!symbol) throw new _AwEvalError('#ERROR');
    const snap = (typeof getDerivedFinancialSnapshot === 'function') ? getDerivedFinancialSnapshot() : null;
    const allocs = snap?.portfolio?.allocations || [];
    for (const a of allocs) {
      if (String(a?.symbol || '').toUpperCase() === symbol) return Number(a.allocation || 0);
    }
    return 0;
  },
  // PR-8C: per-asset reads. Missing holdings resolve to 0 rather than #ERROR
  // so dashboards / templates don't break when a position is closed.
  'ASSET.QTY'(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const a = _aw8AssetByTicker(args[0].value);
    return a ? (Number(a.qty) || 0) : 0;
  },
  'ASSET.PRICE'(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const a = _aw8AssetByTicker(args[0].value);
    return a ? (Number(a.price) || 0) : 0;
  },
  'ASSET.VALUE'(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const a = _aw8AssetByTicker(args[0].value);
    if (!a) return 0;
    return (typeof assetValueUSD === 'function') ? assetValueUSD(a) : (Number(a.qty || 0) * Number(a.price || 0));
  },
  'ASSET.COST'(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const a = _aw8AssetByTicker(args[0].value);
    return a ? (Number(a.costBasis) || 0) : 0;
  },
  'ASSET.PNL'(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const a = _aw8AssetByTicker(args[0].value);
    if (!a || !a.costBasis || a.costBasis <= 0) return 0;
    const val = (typeof assetValueUSD === 'function') ? assetValueUSD(a) : (Number(a.qty || 0) * Number(a.price || 0));
    return val - Number(a.costBasis);
  },
  'ASSET.PNL_PCT'(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const a = _aw8AssetByTicker(args[0].value);
    if (!a || !a.costBasis || a.costBasis <= 0) return 0;
    const val = (typeof assetValueUSD === 'function') ? assetValueUSD(a) : (Number(a.qty || 0) * Number(a.price || 0));
    return ((val - Number(a.costBasis)) / Number(a.costBasis)) * 100;
  },
  // PR-8C: portfolio-wide unrealized aggregates. PORTFOLIO.UNREALIZED is an
  // explicit alias for PORTFOLIO.PNL — same number, separate name for users
  // building open-position dashboards. Both share _aw8PortfolioUnrealizedTotal
  // so the iteration walks `assets[]` exactly once per cell evaluation.
  'PORTFOLIO.PNL'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    return _aw8PortfolioUnrealizedTotal().pnl;
  },
  'PORTFOLIO.PNL_PCT'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    const { pnl, cost } = _aw8PortfolioUnrealizedTotal();
    return cost > 0 ? (pnl / cost) * 100 : 0;
  },
  'PORTFOLIO.UNREALIZED'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    return _aw8PortfolioUnrealizedTotal().pnl;
  },
  // PR-WP5: advanced portfolio analytics. All four read from a single
  // _wp5PortfolioAnalytics walk over assets[]. BEST/WORST return ticker
  // strings (string render path in _formatComputedValue handles them);
  // COST and WINRATE return numbers (WINRATE already multiplied to a
  // percentage to match PORTFOLIO.PNL_PCT convention).
  'PORTFOLIO.COST'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    return _wp5PortfolioAnalytics().cost;
  },
  'PORTFOLIO.WINRATE'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    const a = _wp5PortfolioAnalytics();
    return a.total > 0 ? (a.wins / a.total) * 100 : 0;
  },
  'PORTFOLIO.BEST'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    return _wp5PortfolioAnalytics().best || '';
  },
  'PORTFOLIO.WORST'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    return _wp5PortfolioAnalytics().worst || '';
  },
  // PR-WP5: PORTFOLIO.CAGR is intentionally blocked. portfolioHistory
  // bootstraps with simulated random-walk data (generateSimulatedHistory)
  // on a first-session user, and asset.transactions may carry a synthetic
  // ts from the legacy migrate path. There is no runtime signal that
  // separates real history from simulated, so any CAGR produced would be
  // fake finance math. Surfacing #N/A makes the limitation explicit instead
  // of leaking a misleading number; the slot stays reserved so a future
  // change that records a verifiable inception date can implement it cleanly.
  'PORTFOLIO.CAGR'(args) {
    if (args.length !== 0) throw new _AwEvalError('#ERROR');
    throw new _AwEvalError('#N/A');
  },
  // PR-8C: live 24h change for a market symbol. Prefers MARKET_DATA (the
  // canonical market table populated by the snapshot gateway); falls back
  // to the asset's persisted change24h field for portfolio holdings.
  'PRICE.CHANGE24H'(args) {
    if (args.length !== 1 || args[0].type !== 'str') throw new _AwEvalError('#ERROR');
    const sym = String(args[0].value || '').trim().toUpperCase();
    if (!sym) throw new _AwEvalError('#ERROR');
    if (typeof MARKET_DATA !== 'undefined' && Array.isArray(MARKET_DATA)) {
      for (const m of MARKET_DATA) {
        if (String(m?.symbol || '').toUpperCase() === sym) {
          const c = m.price_change_percentage_24h ?? m.change24h;
          if (typeof c === 'number' && Number.isFinite(c)) return c;
          break;
        }
      }
    }
    const a = _aw8AssetByTicker(sym);
    if (a && typeof a.change24h === 'number' && Number.isFinite(a.change24h)) return a.change24h;
    throw new _AwEvalError('#ERROR');
  },
});

function _aw8CallFunction(name, args) {
  const upper = String(name).toUpperCase();
  const wsFn  = _AW8_WORKSPACE_FUNCTIONS[upper];
  if (wsFn)  return wsFn(args);
  const finFn = _AW8_FINANCIAL_FUNCTIONS[upper];
  if (finFn) return finFn(args);
  // PR-8A: distinguish unknown name from generic eval error.
  throw new _AwEvalError('#NAME?');
}

// ── AW-8: AST evaluator ──────────────────────────────────────────────────────

function _aw8EvalAst(node) {
  if (!node) throw new _AwEvalError('#ERROR');
  switch (node.type) {
    case 'num': return node.value;
    case 'str': return node.value;  // strings only meaningful as fn args
    case 'ref': {
      const v = resolveWorkspaceCellReference(node.ref);
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new _AwEvalError('#ERROR');
      return v;
    }
    case 'range': throw new _AwEvalError('#ERROR'); // ranges only as fn args
    case 'unary': {
      const v = _aw8EvalAst(node.operand);
      if (typeof v !== 'number' || !Number.isFinite(v)) throw new _AwEvalError('#ERROR');
      return node.op === '-' ? -v : v;
    }
    case 'binary': {
      const op = node.op;
      // Arithmetic operators: strict-numeric on both sides (preserved).
      if (op === '+' || op === '-' || op === '*' || op === '/') {
        const l = _aw8EvalAst(node.lhs);
        const r = _aw8EvalAst(node.rhs);
        if (typeof l !== 'number' || !Number.isFinite(l)) throw new _AwEvalError('#ERROR');
        if (typeof r !== 'number' || !Number.isFinite(r)) throw new _AwEvalError('#ERROR');
        switch (op) {
          case '+': return l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/':
            if (r === 0) throw new _AwEvalError('#DIV/0');
            return l / r;
        }
      }
      // PR-8B: equality / inequality. Lax — accepts string literals so
      //   IF("a"="a", …)  works without forcing numeric coercion.
      if (op === '=' || op === '<>') {
        const l = _aw8EvalAst(node.lhs);
        const r = _aw8EvalAst(node.rhs);
        let eq;
        if (typeof l === 'number' && typeof r === 'number') {
          eq = Number.isFinite(l) && Number.isFinite(r) && l === r;
        } else {
          eq = (l === r);
        }
        return (op === '=') ? (eq ? 1 : 0) : (eq ? 0 : 1);
      }
      // PR-8B: ordered comparisons require numeric operands.
      if (op === '<' || op === '<=' || op === '>' || op === '>=') {
        const l = _aw8EvalAst(node.lhs);
        const r = _aw8EvalAst(node.rhs);
        if (typeof l !== 'number' || !Number.isFinite(l)) throw new _AwEvalError('#ERROR');
        if (typeof r !== 'number' || !Number.isFinite(r)) throw new _AwEvalError('#ERROR');
        if (op === '<')  return l <  r ? 1 : 0;
        if (op === '<=') return l <= r ? 1 : 0;
        if (op === '>')  return l >  r ? 1 : 0;
        return l >= r ? 1 : 0;
      }
      throw new _AwEvalError('#ERROR');
    }
    case 'call': return _aw8CallFunction(node.name, node.args || []);
  }
  throw new _AwEvalError('#ERROR');
}

// ── AW-9.1: Formula autocomplete (UX layer over AW-8 engine) ─────────────────
// Centralized suggestion registry — single source of truth, no duplication
// between the engine and the dropdown. `noArgs` controls caret placement on
// insertion: zero-arg functions land the caret after `)`, others inside `(`.
// PR-8A: derive autocomplete catalog from the function registries so adding
// a function in one place automatically updates the suggestion dropdown.
// `noArgs` controls caret placement on insertion (zero-arg functions land
// the caret after `)`); flag stays here as the only piece of metadata that
// can't be inferred from the function body.
const _AW8_NO_ARG_FUNCTIONS = new Set([
  'PORTFOLIO.VALUE', 'PORTFOLIO.ASSETS',
  // PR-8C
  'PORTFOLIO.PNL', 'PORTFOLIO.PNL_PCT', 'PORTFOLIO.UNREALIZED',
  // PR-9
  'TODAY', 'NOW',
  // PR-WP5
  'PORTFOLIO.COST', 'PORTFOLIO.WINRATE', 'PORTFOLIO.BEST', 'PORTFOLIO.WORST', 'PORTFOLIO.CAGR',
]);
const WORKSPACE_FORMULA_SUGGESTIONS = Object.freeze([
  ...Object.keys(_AW8_WORKSPACE_FUNCTIONS).map(key => ({
    key, label: key + '()', kind: 'workspace',
    noArgs: _AW8_NO_ARG_FUNCTIONS.has(key),
  })),
  ...Object.keys(_AW8_FINANCIAL_FUNCTIONS).map(key => ({
    key, label: key + '()', kind: 'financial',
    noArgs: _AW8_NO_ARG_FUNCTIONS.has(key),
  })),
]);

// Extract the trailing identifier-prefix the user is typing, but only when
// the value is a formula (=…). Returns null if the dropdown should not open.
function _aw91ExtractFunctionPrefix(value, caretPos) {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('=')) return null;
  const upTo = (typeof caretPos === 'number' && caretPos >= 0 && caretPos <= value.length)
    ? value.slice(0, caretPos)
    : value;
  // Walk back over [A-Za-z0-9_.] characters.
  let i = upTo.length;
  while (i > 0) {
    const c  = upTo.charCodeAt(i - 1);
    const ok = (c >= 65 && c <= 90)   // A-Z
            || (c >= 97 && c <= 122)  // a-z
            || (c >= 48 && c <= 57)   // 0-9
            ||  c === 95              // _
            ||  c === 46;             // .
    if (!ok) break;
    i--;
  }
  if (i === 0) return null; // would mean no '=' before — shouldn't happen
  const boundary = upTo[i - 1];
  // Only suggest at fresh-identifier positions: after '=', operators, paren,
  // comma, colon, or whitespace. Inside a partially-typed cell ref like
  // '=A1' the boundary would be '=', so we'd still pick 'A1' as prefix —
  // filter returns empty (no fn starts with 'A1') so dropdown closes.
  if (!'=+-*/(,: '.includes(boundary)) return null;
  return upTo.slice(i);
}

function _aw91FilterSuggestions(prefix) {
  const upper = String(prefix || '').toUpperCase();
  if (upper === '') return WORKSPACE_FORMULA_SUGGESTIONS.slice();
  return WORKSPACE_FORMULA_SUGGESTIONS.filter(s => s.key.startsWith(upper));
}

function _aw91RemoveAutocompleteDOM() {
  const container = document.getElementById('aurixWorkspace');
  if (!container) return;
  const drop = container.querySelector('[data-aw91-autocomplete]');
  if (drop) drop.remove();
}

function _aw91CloseAutocomplete() {
  if (!WORKSPACE_RUNTIME.autocompleteOpen
      && !(WORKSPACE_RUNTIME.autocompleteItems && WORKSPACE_RUNTIME.autocompleteItems.length)) {
    _aw91RemoveAutocompleteDOM();
    return;
  }
  WORKSPACE_RUNTIME.autocompleteOpen = false;
  WORKSPACE_RUNTIME.autocompleteItems = [];
  WORKSPACE_RUNTIME.autocompleteSelectedIndex = 0;
  _aw91RemoveAutocompleteDOM();
}

function _aw91RenderAutocomplete(anchorEl) {
  const container = document.getElementById('aurixWorkspace');
  if (!container || !anchorEl) return;
  let drop = container.querySelector('[data-aw91-autocomplete]');
  if (!drop) {
    drop = document.createElement('div');
    drop.setAttribute('data-aw91-autocomplete', '');
    drop.className = 'aurix-formula-autocomplete';
    container.appendChild(drop);
  }

  // AW-9.1a: render content first so we can measure the dropdown's actual
  // height and width to drive flip-on-overflow positioning.
  const items = WORKSPACE_RUNTIME.autocompleteItems;
  const sel   = WORKSPACE_RUNTIME.autocompleteSelectedIndex;
  drop.innerHTML = items.map((item, i) => `
    <div class="aurix-formula-autocomplete-item ${i === sel ? 'is-selected' : ''} is-${_escapeWorkspaceText(item.kind)}"
         data-aw91-suggestion-index="${i}">
      <span class="aurix-formula-autocomplete-label">${_escapeWorkspaceText(item.label)}</span>
      <span class="aurix-formula-autocomplete-kind">${_escapeWorkspaceText(item.kind)}</span>
    </div>
  `).join('');

  // AW-9.1a: width — match editor width within sensible bounds. Override the
  // CSS min-width by setting an explicit width (clamped 220px..360px) so the
  // panel never grows oversized over very wide cells / formula bar.
  const aRect    = anchorEl.getBoundingClientRect();
  const cRect    = container.getBoundingClientRect();
  const W_MIN    = 220;
  const W_MAX    = 360;
  const editorW  = Math.round(aRect.width);
  const width    = Math.max(W_MIN, Math.min(W_MAX, editorW || W_MIN));
  drop.style.width    = width + 'px';
  drop.style.minWidth = '0';

  // Horizontal alignment: left edge of editor, relative to container.
  drop.style.left = (aRect.left - cRect.left) + 'px';

  // AW-9.1a: vertical — render BELOW the editor with a clear 10px gap so the
  // active input text is never visually obscured. If the dropdown would
  // overflow the viewport bottom, flip ABOVE the editor (when that fits).
  // Priority: keep input visible.
  const GAP            = 10;
  const belowTop       = aRect.bottom - cRect.top + GAP;
  drop.style.top       = belowTop + 'px';

  // Now measure the rendered dropdown to decide if we need to flip.
  const dRect          = drop.getBoundingClientRect();
  const dropHeight     = dRect.height || 0;
  const viewportH      = (typeof window !== 'undefined' && window.innerHeight)
                       || document.documentElement.clientHeight
                       || 0;
  const overflowsBelow = (aRect.bottom + GAP + dropHeight) > viewportH;
  if (overflowsBelow) {
    const aboveTopAbs  = aRect.top - GAP - dropHeight;       // viewport-coord
    if (aboveTopAbs >= 0) {
      drop.style.top   = (aRect.top - cRect.top - GAP - dropHeight) + 'px';
    }
    // If above also overflows, leave the default below position — the input
    // is still fully visible (dropdown sits beneath it).
  }
}

function _aw91UpdateAutocomplete(inputEl) {
  if (!inputEl) { _aw91CloseAutocomplete(); return; }
  if (typeof isWorkspaceDesktop === 'function' && !isWorkspaceDesktop()) {
    _aw91CloseAutocomplete();
    return;
  }
  if (!WORKSPACE_RUNTIME.isEditing) { _aw91CloseAutocomplete(); return; }

  const value = inputEl.value;
  const caret = (typeof inputEl.selectionStart === 'number')
    ? inputEl.selectionStart
    : value.length;
  const prefix = _aw91ExtractFunctionPrefix(value, caret);
  if (prefix == null) { _aw91CloseAutocomplete(); return; }

  const items = _aw91FilterSuggestions(prefix);
  if (items.length === 0) { _aw91CloseAutocomplete(); return; }

  WORKSPACE_RUNTIME.autocompleteOpen = true;
  WORKSPACE_RUNTIME.autocompleteItems = items;
  if (WORKSPACE_RUNTIME.autocompleteSelectedIndex >= items.length) {
    WORKSPACE_RUNTIME.autocompleteSelectedIndex = 0;
  }
  _aw91RenderAutocomplete(inputEl);
}

function _aw91ApplySuggestion(inputEl, item) {
  if (!inputEl || !item) return;
  const value = inputEl.value;
  const caret = (typeof inputEl.selectionStart === 'number')
    ? inputEl.selectionStart
    : value.length;
  const prefix = _aw91ExtractFunctionPrefix(value, caret);
  if (prefix == null) return;

  const start    = caret - prefix.length;
  const before   = value.slice(0, start);
  const after    = value.slice(caret);
  const inserted = item.key + '()';
  const newValue = before + inserted + after;
  const newCaret = item.noArgs
    ? before.length + inserted.length         // after final ')'
    : before.length + inserted.length - 1;    // inside '()'

  inputEl.value = newValue;
  try { inputEl.setSelectionRange(newCaret, newCaret); } catch (_) {}
  WORKSPACE_RUNTIME.editingValue = newValue;

  // Mirror the change to the synced twin input (cell ↔ formula bar).
  const twinSelector = inputEl.matches('[data-cell-edit-input]')
    ? '[data-formula-bar-input]'
    : '[data-cell-edit-input]';
  const twin = document.querySelector(twinSelector);
  if (twin && twin !== inputEl && twin.value !== newValue) {
    twin.value = newValue;
  }

  _aw91CloseAutocomplete();
}

// ── AW-9.2: Inline formula validation (UX layer, reuses AW-8 parser) ─────────
// Lightweight feedback while typing. No second parser, no evaluation: parse
// the current editingValue with parseWorkspaceFormula and walk the AST to
// detect unknown function calls. Range issues that the parser rejects get a
// dedicated message via a small heuristic on the raw string. Division by
// zero and cycles are intentionally NOT checked here (runtime concerns).

function _aw92IsRangeError(s) {
  // Triggered only as a follow-up to a parse failure, when a colon is
  // present. Walks each `:` and checks both sides have a cell-ref shape.
  if (typeof s !== 'string' || !s.includes(':')) return false;
  const parts = s.split(':');
  for (let i = 0; i < parts.length - 1; i++) {
    const left  = parts[i];
    const right = parts[i + 1];
    const leftEnd    = /[A-Z]+\d+\s*$/i.test(left);
    const rightStart = /^\s*[A-Z]+\d+/i.test(right);
    if (!leftEnd || !rightStart) return true;
  }
  return false;
}

function _aw92FindUnknownFunction(node) {
  if (!node) return null;
  switch (node.type) {
    case 'call': {
      const upper = String(node.name || '').toUpperCase();
      const known = Object.prototype.hasOwnProperty.call(_AW8_WORKSPACE_FUNCTIONS, upper)
                 || Object.prototype.hasOwnProperty.call(_AW8_FINANCIAL_FUNCTIONS, upper);
      if (!known) return upper;
      for (const a of (node.args || [])) {
        const inner = _aw92FindUnknownFunction(a);
        if (inner) return inner;
      }
      return null;
    }
    case 'binary': return _aw92FindUnknownFunction(node.lhs) || _aw92FindUnknownFunction(node.rhs);
    case 'unary':  return _aw92FindUnknownFunction(node.operand);
    default: return null;
  }
}

function _aw92ValidateFormula(value) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed.startsWith('=')) return null; // not a formula → no message
  if (trimmed === '=')          return null; // just opened — don't error yet

  const parsed = parseWorkspaceFormula(trimmed);
  if (!parsed) {
    if (_aw92IsRangeError(trimmed)) return t('ws_invalid_range');
    return t('ws_invalid_formula');
  }
  const unknown = _aw92FindUnknownFunction(parsed);
  if (unknown) return t('ws_unknown_function');
  return null;
}

function _aw92RemoveValidationDOM() {
  const container = document.getElementById('aurixWorkspace');
  if (!container) return;
  const pill = container.querySelector('[data-aw92-validation]');
  if (pill) pill.remove();
}

function _aw92RenderValidation(anchorEl) {
  const container = document.getElementById('aurixWorkspace');
  if (!container || !anchorEl) return;
  const msg = WORKSPACE_RUNTIME.validationMessage;
  if (!msg) { _aw92RemoveValidationDOM(); return; }

  let pill = container.querySelector('[data-aw92-validation]');
  if (!pill) {
    pill = document.createElement('div');
    pill.setAttribute('data-aw92-validation', '');
    pill.className = 'aurix-formula-validation';
    container.appendChild(pill);
  }
  pill.textContent = msg;

  // Position contextually: below the autocomplete dropdown when it is open
  // AND below the editor; otherwise just below the editor with a small gap.
  const aRect = anchorEl.getBoundingClientRect();
  const cRect = container.getBoundingClientRect();
  const drop  = container.querySelector('[data-aw91-autocomplete]');
  let top;
  if (drop && WORKSPACE_RUNTIME.autocompleteOpen) {
    const dRect = drop.getBoundingClientRect();
    if (dRect.top >= aRect.bottom) {
      top = dRect.bottom - cRect.top + 4; // below the dropdown
    } else {
      top = aRect.bottom - cRect.top + 4; // dropdown flipped above → use editor
    }
  } else {
    top = aRect.bottom - cRect.top + 4;
  }
  pill.style.top  = top + 'px';
  pill.style.left = (aRect.left - cRect.left) + 'px';
}

function _aw92UpdateValidation(inputEl) {
  if (!inputEl) {
    WORKSPACE_RUNTIME.validationMessage = null;
    _aw92RemoveValidationDOM();
    return;
  }
  if (typeof isWorkspaceDesktop === 'function' && !isWorkspaceDesktop()) {
    WORKSPACE_RUNTIME.validationMessage = null;
    _aw92RemoveValidationDOM();
    return;
  }
  if (!WORKSPACE_RUNTIME.isEditing) {
    WORKSPACE_RUNTIME.validationMessage = null;
    _aw92RemoveValidationDOM();
    return;
  }
  const message = _aw92ValidateFormula(inputEl.value);
  WORKSPACE_RUNTIME.validationMessage = message;
  if (message) _aw92RenderValidation(inputEl);
  else         _aw92RemoveValidationDOM();
}

function resolveWorkspaceCellReference(ref /*, sheet (ignorado) */) {
  // AW-7.4 final: el resolver lee SIEMPRE el sheet vivo desde WORKSPACE_RUNTIME,
  // no desde el parámetro `sheet`. En producción aparecen ventanas (cascade
  // FC-10/11, re-entrancia render/commit) donde el caller pasa una referencia
  // que no es el Map mutable —p.ej. un objeto frozen del snapshot, o un sheet
  // sin las celdas user recién insertadas. La lectura directa al runtime
  // garantiza que C1/D1 (o cualquier user literal) se resuelvan exactamente
  // igual que B1 (system formula) — ambos viven en el mismo Map vivo.
  //
  // Reglas:
  //   - empty cell                              → 0
  //   - invalid cell                            → NaN (propaga #ERROR)
  //   - formula cell (system o user) computed   → number, NaN o 0 según shape
  //   - literal value cell con valor numérico   → ese number
  //   - literal value cell con string parseable → number
  //   - todo lo demás                           → NaN

  if (!ref) return NaN;
  if (!_isCellInGridBounds(ref)) return NaN;

  const liveSheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
  if (!liveSheet || !liveSheet.cells) return NaN;
  const cell = liveSheet.cells.get(ref);

  if (!cell) return 0;
  if (cell.invalid) return NaN;

  if (cell.type === 'formula') {
    const c = cell.computed;
    if (typeof c === 'number' && Number.isFinite(c)) return c;
    if (c == null) return 0;
    return NaN;
  }

  const v = cell.value;
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  if (typeof v === 'string') {
    const n = Number(v.trim());
    return Number.isFinite(n) ? n : NaN;
  }
  return NaN;
}

// AW-8: evaluateWorkspaceFormula now drives the full AST. Throws are routed
// through _AwEvalError so '#DIV/0' / '#ERROR' propagate cleanly. The `sheet`
// parameter is kept for signature stability — the resolver reads the live
// runtime directly (AW-7.4 contract).
function evaluateWorkspaceFormula(parsed, _sheet) {
  if (!parsed) return { computed: '#ERROR', invalid: true };
  try {
    const v = _aw8EvalAst(parsed);
    // PR-8B: top-level results may now be strings (IF returning a literal
    // branch) or numbers. Non-finite numbers still surface as #ERROR.
    if (typeof v === 'string') return { computed: v, invalid: false };
    if (typeof v === 'number') {
      if (!Number.isFinite(v)) return { computed: '#ERROR', invalid: true };
      return { computed: v, invalid: false };
    }
    if (v == null) return { computed: '', invalid: false };
    return { computed: '#ERROR', invalid: true };
  } catch (e) {
    if (e && e.code) return { computed: e.code, invalid: true };
    return { computed: '#ERROR', invalid: true };
  }
}

// PR-8A: parser smoke test. Literal-only cases (no sheet context needed).
// Logs only on failure so a healthy boot is silent; wrapped in try so it
// can never break the page. Catches operator-precedence regressions and
// math-function semantic drift on every load.
function _aw8RunSelfTest() {
  const cases = [
    { expr: '=1+2',             expect: 3       },
    { expr: '=10/4',            expect: 2.5     },
    { expr: '=2+3*4',           expect: 14      },
    { expr: '=-5+10',           expect: 5       },
    { expr: '=ROUND(1.234,2)',  expect: 1.23    },
    { expr: '=ROUND(1.5,0)',    expect: 2       },
    { expr: '=ABS(-5)',         expect: 5       },
    { expr: '=SQRT(9)',         expect: 3       },
    { expr: '=POW(2,3)',        expect: 8       },
    { expr: '=MOD(10,3)',       expect: 1       },
    { expr: '=INT(4.9)',        expect: 4       },
    { expr: '=INT(-1.5)',       expect: -2      },
    { expr: '=ROUND(POW(2,4)/3,2)', expect: 5.33 },
    // PR-8B logical + comparison
    { expr: '=1>0',                 expect: 1       },
    { expr: '=1<0',                 expect: 0       },
    { expr: '=5>=5',                expect: 1       },
    { expr: '=2<>3',                expect: 1       },
    { expr: '=4=4',                 expect: 1       },
    { expr: '=IF(1>0,10,20)',       expect: 10      },
    { expr: '=IF(0,10,20)',         expect: 20      },
    { expr: '=IF(1>0,"yes","no")',  expect: 'yes'   },
    { expr: '=AND(1,1,1)',          expect: 1       },
    { expr: '=AND(1,1,0)',          expect: 0       },
    { expr: '=OR(0,0,1)',           expect: 1       },
    { expr: '=OR(0,0,0)',           expect: 0       },
    { expr: '=NOT(1)',              expect: 0       },
    { expr: '=NOT(0)',              expect: 1       },
    { expr: '=IFERROR(SQRT(-1),0)', expect: 0       },
    { expr: '=IFERROR(1/0,42)',     expect: 42      },
    { expr: '=IFERROR(SQRT(9),99)', expect: 3       },
    { expr: '=1+2>2',               expect: 1       }, // precedence: (1+2)>2
    // PR-9 — string + date (selftest has no sheet, so SUMIF/COUNTIF/AVGIF
    // exercised separately via the dedicated harness)
    { expr: '=CONCAT("A","B")',                          expect: 'AB'  },
    { expr: '=LEN("TSLA")',                              expect: 4     },
    { expr: '=UPPER("btc")',                             expect: 'BTC' },
    { expr: '=LOWER("BTC")',                             expect: 'btc' },
    { expr: '=TRIM("  x  ")',                            expect: 'x'   },
    { expr: '=LEFT("HELLO",2)',                          expect: 'HE'  },
    { expr: '=RIGHT("HELLO",3)',                         expect: 'LLO' },
    { expr: '=MID("HELLO",2,3)',                         expect: 'ELL' },
    { expr: '=YEAR(DATE(2025,1,1))',                     expect: 2025  },
    { expr: '=MONTH(DATE(2025,6,15))',                   expect: 6     },
    { expr: '=DAY(DATE(2025,6,15))',                     expect: 15    },
    { expr: '=DATEDIF(DATE(2025,1,1),DATE(2025,1,11))',  expect: 10    },
  ];
  const failures = [];
  for (const c of cases) {
    try {
      const parsed = parseWorkspaceFormula(c.expr);
      const result = evaluateWorkspaceFormula(parsed, null);
      const ok = !result.invalid && (
        typeof c.expect === 'string'
          ? result.computed === c.expect
          : Math.abs(result.computed - c.expect) <= 1e-9
      );
      if (!ok) failures.push(`${c.expr} → ${result.computed} (expected ${c.expect})`);
    } catch (e) {
      failures.push(`${c.expr} threw: ${e?.message || e}`);
    }
  }
  if (failures.length > 0) {
    console.warn('[workspace-selftest] regressions:', failures);
  }
}
try { _aw8RunSelfTest(); } catch (e) { /* never block boot */ }

// ── AW-7.5: Workspace dependency graph engine ────────────────────────────────
// Selective topological recompute. Replaces the brute-force multi-pass loop.
//
//   dependencyGraph        : cellId  → Set<refId>   ("this cell depends on")
//   reverseDependencyGraph : refId   → Set<cellId>  ("these cells depend on")
//
// System formulas (B1/B2/B3, readonly+type='formula', body 'portfolio.*')
// don't have cell-ref deps in the graph (their bodies are bare identifiers,
// not cell refs). They DO appear as targets in reverseDependencyGraph when
// user formulas reference them — that's how a portfolio change propagates
// to user formulas like =B1*0.10.
//
// Cycles are marked with cell.computed='#CYCLE' + cell.invalid=true on every
// member. The resolver returns NaN for invalid cells, so cells outside the
// SCC that depend on it propagate as #ERROR upstream.

// AW-8: dependency extraction walks the full AST. Discovers:
//   - cell refs                   → 'A1', 'B5', ...
//   - ranges (expanded)           → 'A1', 'A2', ..., 'A5'
//   - PRICE("BTC")                → 'MARKET:BTC'
//   - PORTFOLIO.VALUE/.ASSETS()   → 'FINANCIAL:PORTFOLIO_VALUE/_ASSETS'
//   - EXPOSURE("crypto") (any)    → 'FINANCIAL:EXPOSURE'
//   - ALLOCATION("BTC")  (any)    → 'FINANCIAL:ALLOCATION'
function _extractFormulaDependencies(parsed) {
  const deps = new Set();
  if (!parsed) return deps;

  const walk = (node) => {
    if (!node) return;
    switch (node.type) {
      case 'num':
      case 'str':
        return;
      case 'ref':
        if (_isCellInGridBounds(node.ref)) deps.add(node.ref);
        return;
      case 'range': {
        const ids = _expandRange(node);
        if (ids) for (const id of ids) {
          if (_isCellInGridBounds(id)) deps.add(id);
        }
        return;
      }
      case 'unary':  walk(node.operand); return;
      case 'binary': walk(node.lhs); walk(node.rhs); return;
      case 'call': {
        const name = String(node.name || '').toUpperCase();
        // Workspace functions (SUM/AVG/MIN/MAX): walk arg subtrees so any
        // ranges or refs within them are picked up as cell deps.
        if (Object.prototype.hasOwnProperty.call(_AW8_WORKSPACE_FUNCTIONS, name)) {
          for (const a of node.args || []) walk(a);
          return;
        }
        // Financial pseudo-deps. PRICE keys per-symbol so unrelated market
        // updates don't trigger irrelevant recomputes; PORTFOLIO.* / EXPOSURE
        // / ALLOCATION key on coarse FINANCIAL:* tags.
        if (name === 'PRICE') {
          const a = node.args && node.args[0];
          if (a && a.type === 'str' && a.value) {
            deps.add('MARKET:' + String(a.value).toUpperCase());
          }
          return;
        }
        if (name === 'PORTFOLIO.VALUE')  { deps.add('FINANCIAL:PORTFOLIO_VALUE');  return; }
        if (name === 'PORTFOLIO.ASSETS') { deps.add('FINANCIAL:PORTFOLIO_ASSETS'); return; }
        if (name === 'EXPOSURE') {
          // Per-category labelling: a future per-bucket propagator can match
          // FINANCIAL:EXPOSURE:<CAT> precisely. Today the AW-7 recalc still
          // propagates every FINANCIAL:* on derived-state delta — identical
          // runtime behaviour, finer-grained metadata for the next phase.
          const a = node.args && node.args[0];
          if (a && a.type === 'str' && a.value) {
            deps.add('FINANCIAL:EXPOSURE:' + String(a.value).toLowerCase());
          } else {
            deps.add('FINANCIAL:EXPOSURE');
          }
          return;
        }
        if (name === 'ALLOCATION') {
          const a = node.args && node.args[0];
          if (a && a.type === 'str' && a.value) {
            deps.add('FINANCIAL:ALLOCATION:' + String(a.value).toUpperCase());
          } else {
            deps.add('FINANCIAL:ALLOCATION');
          }
          return;
        }
        // PR-8C: per-asset and portfolio-wide reads. Tag with the coarse
        // FINANCIAL:PORTFOLIO pseudo-dep so any mutation that bumps
        // DERIVED_FINANCIAL_STATE.version (which save() always triggers)
        // recomputes these cells. Per-symbol granularity (ASSET:<sym>)
        // is a future refinement; today the recalc walks the whole
        // FINANCIAL:* keyspace anyway, so coarse tagging is sufficient.
        if (name === 'ASSET.QTY'      || name === 'ASSET.PRICE'    ||
            name === 'ASSET.VALUE'    || name === 'ASSET.COST'     ||
            name === 'ASSET.PNL'      || name === 'ASSET.PNL_PCT'  ||
            name === 'PORTFOLIO.PNL'  || name === 'PORTFOLIO.PNL_PCT' ||
            name === 'PORTFOLIO.UNREALIZED' ||
            // PR-WP5: advanced analytics ride the same FINANCIAL:PORTFOLIO
            // pseudo-dep, so any save() / derived-state bump reactivates
            // them without per-function graph plumbing.
            name === 'PORTFOLIO.COST'    || name === 'PORTFOLIO.WINRATE' ||
            name === 'PORTFOLIO.BEST'    || name === 'PORTFOLIO.WORST'   ||
            name === 'PORTFOLIO.CAGR') {
          deps.add('FINANCIAL:PORTFOLIO');
          return;
        }
        // PR-8C: 24h change keys per symbol so unrelated market updates
        // don't trigger recompute (mirrors the PRICE() dep behavior).
        if (name === 'PRICE.CHANGE24H') {
          const a = node.args && node.args[0];
          if (a && a.type === 'str' && a.value) {
            deps.add('MARKET:' + String(a.value).toUpperCase());
          }
          return;
        }
        // Unknown function: still walk args (they may surface refs/ranges
        // even if the call itself will error at evaluate time).
        for (const a of node.args || []) walk(a);
        return;
      }
    }
  };
  walk(parsed);
  return deps;
}

function _setCellDependencies(cellId, deps) {
  // Remove old forward + reverse edges.
  const oldDeps = WORKSPACE_RUNTIME.dependencyGraph.get(cellId);
  if (oldDeps) {
    for (const oldDep of oldDeps) {
      const rev = WORKSPACE_RUNTIME.reverseDependencyGraph.get(oldDep);
      if (rev) {
        rev.delete(cellId);
        if (rev.size === 0) WORKSPACE_RUNTIME.reverseDependencyGraph.delete(oldDep);
      }
    }
  }
  // Insert new forward + reverse edges.
  if (deps && deps.size > 0) {
    WORKSPACE_RUNTIME.dependencyGraph.set(cellId, new Set(deps));
    for (const dep of deps) {
      let rev = WORKSPACE_RUNTIME.reverseDependencyGraph.get(dep);
      if (!rev) {
        rev = new Set();
        WORKSPACE_RUNTIME.reverseDependencyGraph.set(dep, rev);
      }
      rev.add(cellId);
    }
  } else {
    WORKSPACE_RUNTIME.dependencyGraph.delete(cellId);
  }
  WORKSPACE_RUNTIME.graphVersion++;
  WORKSPACE_RUNTIME.lastGraphBuildAt = Date.now();
}

function _clearCellDependencies(cellId) {
  _setCellDependencies(cellId, null);
}

function _isInCycle(cellId) {
  // BFS: starting from cellId's deps, can we reach cellId again?
  const startDeps = WORKSPACE_RUNTIME.dependencyGraph.get(cellId);
  if (!startDeps || startDeps.size === 0) return false;
  const visited = new Set();
  const queue = [...startDeps];
  while (queue.length > 0) {
    const id = queue.shift();
    if (id === cellId) return true;
    if (visited.has(id)) continue;
    visited.add(id);
    const deps = WORKSPACE_RUNTIME.dependencyGraph.get(id);
    if (deps) for (const d of deps) queue.push(d);
  }
  return false;
}

function _collectAffectedDownstream(rootId) {
  // Transitive closure via reverseDependencyGraph (excluding root itself).
  const affected = new Set();
  const queue = [];
  const seedDeps = WORKSPACE_RUNTIME.reverseDependencyGraph.get(rootId);
  if (seedDeps) for (const d of seedDeps) queue.push(d);
  while (queue.length > 0) {
    const id = queue.shift();
    if (affected.has(id)) continue;
    affected.add(id);
    const next = WORKSPACE_RUNTIME.reverseDependencyGraph.get(id);
    if (next) for (const d of next) queue.push(d);
  }
  return affected;
}

function _topologicalOrder(idSet) {
  // DFS post-order: visit deps within the set first, then push self.
  // `visiting` set prevents infinite recursion if the affected set contains a
  // cycle (cycle members still get pushed once each, in some order).
  const order = [];
  const visited = new Set();
  const visiting = new Set();
  const visit = (id) => {
    if (visited.has(id) || visiting.has(id)) return;
    visiting.add(id);
    const deps = WORKSPACE_RUNTIME.dependencyGraph.get(id);
    if (deps) {
      for (const dep of deps) {
        if (idSet.has(dep)) visit(dep);
      }
    }
    visiting.delete(id);
    visited.add(id);
    order.push(id);
  };
  for (const id of idSet) visit(id);
  return order;
}

function _recomputeUserFormulaCell(cell, sheet) {
  const parsed = parseWorkspaceFormula(cell.formula);
  const result = evaluateWorkspaceFormula(parsed, sheet);
  cell.computed = result.computed;
  cell.invalid  = result.invalid;
  cell.updatedAt = Date.now();
  if (typeof AURIX_TELEMETRY !== 'undefined') {
    AURIX_TELEMETRY.workspace.formulaEvalCount++;
    if (result.invalid) AURIX_TELEMETRY.workspace.evalFailures++;
  }
}

function _markCellAsCycle(cell) {
  cell.computed = '#CYCLE';
  cell.invalid  = true;
  cell.updatedAt = Date.now();
  WORKSPACE_RUNTIME.cycleDetections++;
}

function _propagateWorkspaceChange(rootCellId) {
  const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
  if (!sheet) return;

  const affected = _collectAffectedDownstream(rootCellId);
  if (affected.size === 0) return;
  if (typeof AURIX_TELEMETRY !== 'undefined') {
    AURIX_TELEMETRY.workspace.affectedNodeCount.sum   += affected.size;
    AURIX_TELEMETRY.workspace.affectedNodeCount.count++;
  }

  const order = _topologicalOrder(affected);
  for (const id of order) {
    const cell = sheet.cells.get(id);
    if (!cell || cell.type !== 'formula' || !cell.formula || cell.readonly) continue;
    if (_isInCycle(id)) {
      _markCellAsCycle(cell);
    } else {
      _recomputeUserFormulaCell(cell, sheet);
    }
  }
}

function _rebuildAndRecomputeAll(sheet) {
  if (!sheet || !sheet.cells) return;

  WORKSPACE_RUNTIME.dependencyGraph.clear();
  WORKSPACE_RUNTIME.reverseDependencyGraph.clear();

  // 1. Build graph for every user formula cell.
  for (const cell of sheet.cells.values()) {
    if (cell.type === 'formula' && cell.formula && !cell.readonly) {
      const parsed = parseWorkspaceFormula(cell.formula);
      const deps = _extractFormulaDependencies(parsed);
      _setCellDependencies(cell.id, deps);
    }
  }

  // 2. Re-resolve system formulas (FC-snapshot consumer).
  for (const cell of sheet.cells.values()) {
    if (cell.type === 'formula' && cell.formula && cell.readonly) {
      const next = resolveWorkspaceFormula(cell.formula);
      if (next !== cell.computed) {
        cell.computed = next;
        cell.updatedAt = Date.now();
      }
    }
  }

  // 3. Evaluate user formulas in topological order (cycle members → #CYCLE).
  const userFormulas = new Set();
  for (const cell of sheet.cells.values()) {
    if (cell.type === 'formula' && cell.formula && !cell.readonly) {
      userFormulas.add(cell.id);
    }
  }
  const order = _topologicalOrder(userFormulas);
  for (const id of order) {
    const cell = sheet.cells.get(id);
    if (!cell) continue;
    if (_isInCycle(id)) {
      _markCellAsCycle(cell);
    } else {
      _recomputeUserFormulaCell(cell, sheet);
    }
  }

  WORKSPACE_RUNTIME.graphVersion++;
  WORKSPACE_RUNTIME.lastGraphBuildAt = Date.now();
}

function beginWorkspaceCellEdit(cellId, initialValue) {
  if (!_isCellInGridBounds(cellId)) return false;
  const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
  if (!sheet) return false;
  const cell = sheet.cells.get(cellId);
  if (!_isWorkspaceCellEditable(cell)) return false;

  // AW-7.4: si la celda es user formula, sembrar con la formula source —
  // no con el computed — para que el usuario pueda editarla literalmente.
  const seed = (initialValue != null)
    ? String(initialValue)
    : (cell && typeof cell.formula === 'string' && cell.formula.length > 0
         ? cell.formula
         : (cell?.value != null ? String(cell.value) : ''));

  WORKSPACE_RUNTIME.editingCell  = cellId;
  WORKSPACE_RUNTIME.editingValue = seed;
  WORKSPACE_RUNTIME.isEditing    = true;
  WORKSPACE_RUNTIME.lastEditAt   = Date.now();
  return true;
}

function updateWorkspaceEditingValue(value) {
  if (!WORKSPACE_RUNTIME.isEditing) return false;
  WORKSPACE_RUNTIME.editingValue = String(value ?? '');
  return true;
}

function cancelWorkspaceCellEdit() {
  if (!WORKSPACE_RUNTIME.isEditing && WORKSPACE_RUNTIME.editingCell == null) return false;
  WORKSPACE_RUNTIME.editingCell  = null;
  WORKSPACE_RUNTIME.editingValue = '';
  WORKSPACE_RUNTIME.isEditing    = false;
  WORKSPACE_RUNTIME.lastEditAt   = Date.now();
  // AW-9.1: edit ended → close any open autocomplete dropdown.
  _aw91CloseAutocomplete();
  // AW-9.2: edit ended → clear inline validation.
  WORKSPACE_RUNTIME.validationMessage = null;
  _aw92RemoveValidationDOM();
  return true;
}

function commitWorkspaceCellEdit(cellId, value) {
  const targetId = cellId ?? WORKSPACE_RUNTIME.editingCell;
  if (!targetId) return false;
  if (!_isCellInGridBounds(targetId)) return false;

  const sheet = WORKSPACE_RUNTIME.sheets.get(WORKSPACE_RUNTIME.activeSheetId);
  if (!sheet) return false;

  let cell = sheet.cells.get(targetId);
  if (!_isWorkspaceCellEditable(cell)) return false;

  const raw = (value != null) ? value : WORKSPACE_RUNTIME.editingValue;
  const trimmed = String(raw ?? '').trim();

  // AW-7.4: si el input arranca con `=`, ruta de fórmula; si no, literal.
  if (isWorkspaceFormulaInput(trimmed)) {
    // AW-7.4 hardening: evaluate inline so cell.computed/cell.invalid son
    // válidos incluso antes del propagate. AW-7.5 reemplaza el brute-force
    // recalc por un propagate selectivo basado en el dependency graph.
    const parsedNew = parseWorkspaceFormula(trimmed);
    const evalNew   = evaluateWorkspaceFormula(parsedNew, sheet);

    if (!cell) {
      cell = createWorkspaceCell({
        id:       targetId,
        type:     'formula',
        formula:  trimmed,
        computed: evalNew.computed,
        invalid:  evalNew.invalid,
      });
      sheet.cells.set(targetId, cell);
    } else {
      cell.type     = 'formula';
      cell.formula  = trimmed;
      cell.value    = null;
      cell.computed = evalNew.computed;
      cell.invalid  = evalNew.invalid;
      cell.updatedAt = Date.now();
    }

    // AW-7.5: actualizar grafo + cycle detection antes de propagar.
    const deps = _extractFormulaDependencies(parsedNew);
    _setCellDependencies(targetId, deps);
    if (_isInCycle(targetId)) _markCellAsCycle(cell);
  } else {
    const coerced = _coerceWorkspaceLiteral(trimmed);
    if (!cell) {
      if (coerced == null) {
        // Empty input on a non-existent cell → just exit edit mode.
        if (WORKSPACE_RUNTIME.editingCell === targetId) cancelWorkspaceCellEdit();
        return true;
      }
      cell = createWorkspaceCell({ id: targetId, type: 'value', value: coerced });
      sheet.cells.set(targetId, cell);
    } else {
      // Conversión formula → literal limpia campos derivados.
      cell.type     = 'value';
      cell.value    = coerced;
      cell.formula  = null;
      cell.computed = null;
      cell.invalid  = false;
      cell.updatedAt = Date.now();
    }
    // AW-7.5: literal cell — sin deps en el grafo.
    _clearCellDependencies(targetId);
  }
  sheet.updatedAt = Date.now();

  if (WORKSPACE_RUNTIME.editingCell === targetId) {
    WORKSPACE_RUNTIME.editingCell  = null;
    WORKSPACE_RUNTIME.editingValue = '';
    WORKSPACE_RUNTIME.isEditing    = false;
  }
  WORKSPACE_RUNTIME.lastEditAt = Date.now();
  // AW-9.1: edit ended → close any open autocomplete dropdown.
  _aw91CloseAutocomplete();
  // AW-9.2: edit ended → clear inline validation.
  WORKSPACE_RUNTIME.validationMessage = null;
  _aw92RemoveValidationDOM();
  // AW-7.5: propagate selectivo a dependientes downstream (orden topológico).
  _propagateWorkspaceChange(targetId);
  // AW-7.3: persistir tras mutación efectiva (no en el no-op de empty input).
  saveWorkspacePersistence();
  return true;
}

// ── AW-7.3: Workspace persistence (consumer-only, localStorage) ───────────────
// Persiste sólo user cells del sheet 'main'. System cells (readonly:true OR
// type==='formula') jamás se serializan ni se hidratan: vienen siempre del
// runtime financiero. Schema v1 con corruption recovery: payload inválido →
// removeItem + clean state, sin throws.

const _AW73_STORAGE_KEY     = 'aurix.workspace.v1';
const _AW73_SCHEMA_VERSION  = 1;

function _isPersistableCellValue(v) {
  // Sólo primitivos que round-trip limpio por JSON.
  return v === null
      || typeof v === 'string'
      || typeof v === 'number'
      || typeof v === 'boolean';
}

function serializeWorkspaceUserCells(sheet) {
  const userCells = {};
  if (!sheet || !sheet.cells) return userCells;
  for (const [id, cell] of sheet.cells) {
    if (!_isWorkspaceCellEditable(cell)) continue;        // system cells excluidas
    // AW-7.4: persistir formula si la celda es user formula. Sólo se guarda
    // la fórmula (string), nunca el computed (deriva del runtime).
    // PR-8D: include cell.format on both branches when set. Additive field,
    // backwards-compatible with payloads written before PR-8D.
    if (cell.type === 'formula' && typeof cell.formula === 'string' && cell.formula.length > 0) {
      const entry = { formula: cell.formula };
      if (cell.format) entry.format = cell.format;
      userCells[id] = entry;
      continue;
    }
    if (!_isPersistableCellValue(cell.value)) continue;
    const entry = { value: cell.value };
    if (cell.format) entry.format = cell.format;
    userCells[id] = entry;
  }
  return userCells;
}

function _wipeWorkspacePersistence(reason) {
  console.warn('[workspace-persist] wiping (' + reason + ')');
  try { localStorage.removeItem(_AW73_STORAGE_KEY); } catch (_) {}
  return null;
}

function loadWorkspacePersistence() {
  if (typeof localStorage === 'undefined') return null;

  let raw = null;
  try {
    raw = localStorage.getItem(_AW73_STORAGE_KEY);
  } catch (e) {
    console.warn('[workspace-persist] read failed:', e?.message);
    return null;
  }
  if (raw == null) return null;

  let payload = null;
  try {
    payload = JSON.parse(raw);
  } catch (e) {
    return _wipeWorkspacePersistence('corrupted JSON');
  }

  if (!payload || typeof payload !== 'object')                   return _wipeWorkspacePersistence('invalid root');
  if (payload.version !== _AW73_SCHEMA_VERSION)                  return _wipeWorkspacePersistence('version mismatch');
  if (!payload.sheets || typeof payload.sheets !== 'object')     return _wipeWorkspacePersistence('missing sheets');
  const main = payload.sheets.main;
  if (!main || typeof main !== 'object')                         return _wipeWorkspacePersistence('missing main');
  if (!main.userCells || typeof main.userCells !== 'object')     return _wipeWorkspacePersistence('missing userCells');

  return payload;
}

function saveWorkspacePersistence() {
  if (typeof localStorage === 'undefined') return false;
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return false;

  // PR-WP3: include layout (per-column widths + per-row heights) when
  // available. Wrapped in try so a TDZ moment during very early boot
  // (before _WP3 is declared) can never break a save.
  let layout = null;
  try { layout = _wp3SerializeLayout(); } catch (_) { layout = null; }

  const mainSheet = {
    userCells: serializeWorkspaceUserCells(sheet),
  };
  if (layout && (Object.keys(layout.colWidths || {}).length > 0
              || Object.keys(layout.rowHeights || {}).length > 0)) {
    mainSheet.layout = layout;
  }

  const payload = {
    version:   _AW73_SCHEMA_VERSION,
    updatedAt: Date.now(),
    sheets: { main: mainSheet },
  };

  try {
    localStorage.setItem(_AW73_STORAGE_KEY, JSON.stringify(payload));
    return true;
  } catch (e) {
    console.warn('[workspace-persist] save failed:', e?.message);
    return false;
  }
}

function mergeWorkspaceUserCells(sheet, userCells) {
  if (!sheet || !sheet.cells) return 0;
  if (!userCells || typeof userCells !== 'object') return 0;

  let applied = 0;
  for (const id of Object.keys(userCells)) {
    if (!_isCellInGridBounds(id)) continue;                     // fuera de grid → skip
    const incoming = userCells[id];
    if (!incoming || typeof incoming !== 'object') continue;

    const existing = sheet.cells.get(id);
    // AW-7.4: sólo readonly bloquea override (las user formulas type='formula'
    // pero readonly:false SÍ pueden re-aplicarse desde payload).
    if (existing && existing.readonly) continue;

    // AW-7.4: payload con formula → user formula cell.
    if (typeof incoming.formula === 'string' && incoming.formula.length > 0) {
      if (existing) {
        existing.type     = 'formula';
        existing.formula  = incoming.formula;
        existing.value    = null;
        existing.computed = null;
        existing.invalid  = false;
        // PR-8D: round-trip cell.format. Additive field; older payloads
        // without it leave the cell's format null.
        if (typeof incoming.format === 'string') existing.format = incoming.format;
        existing.updatedAt = Date.now();
      } else {
        sheet.cells.set(id, createWorkspaceCell({
          id,
          type:    'formula',
          formula: incoming.formula,
          format:  (typeof incoming.format === 'string') ? incoming.format : null,
        }));
      }
      applied++;
      continue;
    }

    // Literal payload.
    if (!_isPersistableCellValue(incoming.value)) continue;
    if (existing) {
      existing.type     = 'value';
      existing.value    = incoming.value;
      existing.formula  = null;
      existing.computed = null;
      existing.invalid  = false;
      // PR-8D: round-trip cell.format on literal cells too.
      if (typeof incoming.format === 'string') existing.format = incoming.format;
      existing.updatedAt = Date.now();
    } else {
      sheet.cells.set(id, createWorkspaceCell({
        id,
        type:  'value',
        value: incoming.value,
        format: (typeof incoming.format === 'string') ? incoming.format : null,
      }));
    }
    applied++;
  }
  return applied;
}

function _hydrateWorkspaceFromPersistence() {
  const payload = loadWorkspacePersistence();
  if (!payload) return 0;
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return 0;
  const applied = mergeWorkspaceUserCells(sheet, payload.sheets.main.userCells);
  // AW-7.5: rebuild dependency graph + initial topological recompute so that
  // restored formula cells have their computed state ready for first render.
  if (applied > 0) {
    _rebuildAndRecomputeAll(sheet);
  }
  // PR-WP3: hydrate layout (col widths + row heights). Additive — older
  // payloads without `layout` simply leave the maps empty so default
  // grid-template-* fall back to the CSS defaults.
  try { _wp3DeserializeLayout(payload.sheets.main.layout); } catch (_) {}
  console.log('[workspace-persist] hydrated', { applied });
  return applied;
}

function getWorkspaceRuntimeHealth() {
  return {
    sheets:           WORKSPACE_RUNTIME.sheets.size,
    recalculations:   WORKSPACE_RUNTIME.recalculations,
    renderVersion:    WORKSPACE_RUNTIME.renderVersion,
    selectedCell:     WORKSPACE_RUNTIME.selectedCell,
    initialized:      WORKSPACE_RUNTIME.initialized,
    lastCalculatedAt: WORKSPACE_RUNTIME.lastCalculatedAt,
  };
}

function _escapeWorkspaceText(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// AW-3: viewport gate for dual layout. Recomputed on every render (no resize
// listener yet — that lands in AW-4 if needed).
function isWorkspaceDesktop() {
  return typeof window !== 'undefined' && window.innerWidth >= 1024;
}

// PR-8A: format-aware computed value renderer. Cells set cell.format =
// 'currency' | 'percent' | 'number' | 'integer' | 'date' | null. Currency
// routes through formatDisplay so the workspace cell matches the dashboard
// total under any baseCurrency. NaN/Infinity render as '—' instead of
// leaking raw JS strings.
function _formatComputedValue(v, format) {
  if (v == null) return '';

  // Error tokens pass through verbatim (#ERROR, #CYCLE, #NAME?, #DIV/0)
  if (typeof v === 'string' && v.charCodeAt(0) === 35 /* '#' */) return _escapeWorkspaceText(v);

  if (typeof v === 'number') {
    if (!Number.isFinite(v)) return '—';
    switch (format) {
      case 'currency':
        return (typeof formatDisplay === 'function')
          ? _escapeWorkspaceText(formatDisplay(v, 'USD'))
          : v.toFixed(2);
      case 'percent':
        return (v * 100).toFixed(2) + '%';
      case 'integer':
        return String(Math.trunc(v));
      case 'number':
        return v.toFixed(2);
      case 'date': {
        const d = new Date(v);
        return Number.isFinite(d.getTime())
          ? _escapeWorkspaceText(d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US'))
          : '—';
      }
      default:
        return v.toFixed(2);
    }
  }
  if (typeof v === 'object') {
    // AW-3: render allocation objects as "SYMBOL (xx.x%)" instead of raw JSON.
    if (v.symbol) {
      const pct = (typeof v.allocation === 'number')
        ? ` (${(v.allocation * 100).toFixed(1)}%)`
        : '';
      return _escapeWorkspaceText(v.symbol + pct);
    }
    return _escapeWorkspaceText(JSON.stringify(v));
  }
  return _escapeWorkspaceText(String(v));
}

// PR-8A: legacy seed labels that pre-PR-8A users have persisted as raw
// English strings. When found at the canonical seed positions we still
// translate live; user-typed strings elsewhere pass through untouched.
const _AW8_LEGACY_SEED_LABEL_KEYS = Object.freeze({
  'Portfolio Value': 'wsCardPortfolioValue',
  'Assets':          'wsCardAssetCount',
  'Top Allocation':  'wsCardTopAlloc',
});

function _formatWorkspaceCellDisplay(cell) {
  if (cell.type === 'formula') return _formatComputedValue(cell.computed, cell.format);
  const v = cell.value;
  // PR-8A: seed labels carry i18n keys via "@i18n:<key>" prefix so toggling
  // language re-renders them without invalidating persistence.
  if (typeof v === 'string') {
    if (v.startsWith('@i18n:')) {
      const key = v.slice(6);
      const translated = T[lang]?.[key];
      return _escapeWorkspaceText(translated || key);
    }
    // PR-8A: legacy seed strings (pre-i18n persistence) at A1/A2/A3
    // still translate live so existing users see ES labels under ES toggle.
    if ((cell.id === 'A1' || cell.id === 'A2' || cell.id === 'A3')
        && _AW8_LEGACY_SEED_LABEL_KEYS[v]) {
      const translated = T[lang]?.[_AW8_LEGACY_SEED_LABEL_KEYS[v]];
      if (translated) return _escapeWorkspaceText(translated);
    }
  }
  return _escapeWorkspaceText(v ?? '');
}

// AW-5 §9: Risk Monitor signals — consumer-only, derived from the same
// snapshots the grid reads. Returns category buckets so the desktop monitor
// can render Bloomberg-style sections; the flat helper below preserves the
// AW-4 contract for any caller that still wants a flat list.
function _buildWorkspaceRiskCategories() {
  const derived = getDerivedFinancialSnapshot();
  const portfolio   = derived?.portfolio || {};
  const totalValue  = Number(portfolio.totalValue || 0);
  const assetCount  = Number(portfolio.assetCount || 0);
  const exposure    = portfolio.exposure || {};
  const allocations = Array.isArray(portfolio.allocations) ? portfolio.allocations : [];

  const concentration = [];
  const top = allocations[0];
  if (top && Number(top.allocation || 0) > 0.5) {
    const sym = top.symbol || t('wsTopAssetFallback');
    const pct = (Number(top.allocation || 0) * 100).toFixed(0);
    concentration.push({ tone: 'warn', text: t('wsConcentrationAbove')(sym, pct) });
  } else if (top && Number(top.allocation || 0) > 0.35) {
    const sym = top.symbol || t('wsTopAssetFallback');
    const pct = (Number(top.allocation || 0) * 100).toFixed(0);
    concentration.push({ tone: 'info', text: t('wsDominantWeight')(sym, pct) });
  }
  if (assetCount > 0 && assetCount < 4) {
    concentration.push({ tone: 'info', text: t('wsLowDiversification')(assetCount) });
  }
  if (!concentration.length) concentration.push({ tone: 'ok', text: t('wsBalancedExposure') });

  const exposureSignals = [];
  if (totalValue > 0) {
    const crypto = Number(exposure.crypto || 0);
    const cryptoPct = crypto / totalValue;
    if (cryptoPct > 0.4) {
      exposureSignals.push({ tone: 'warn', text: t('wsCryptoExposureHigh')((cryptoPct * 100).toFixed(0)) });
    } else if (cryptoPct > 0.15) {
      exposureSignals.push({ tone: 'info', text: t('wsCryptoExposureMid')((cryptoPct * 100).toFixed(0)) });
    }
    const stocks = Number(exposure.stock || exposure.stocks || 0);
    const stocksPct = stocks / totalValue;
    if (stocksPct > 0.6) {
      exposureSignals.push({ tone: 'info', text: t('wsEquityWeight')((stocksPct * 100).toFixed(0)) });
    }
  }
  if (!exposureSignals.length) {
    exposureSignals.push({ tone: 'ok', text: t('wsExposureNormal') });
  }

  const volatility = [];
  if (totalValue > 0) {
    const cryptoPct = Number(exposure.crypto || 0) / totalValue;
    if (cryptoPct > 0.4) {
      volatility.push({ tone: 'warn', text: t('wsSensitivityIncreased') });
    } else if (cryptoPct > 0.2) {
      volatility.push({ tone: 'info', text: t('wsModerateVolatility') });
    }
  }
  if (WORKSPACE_RUNTIME.stale) {
    volatility.push({ tone: 'info', text: t('wsSyncingMarket') });
  }
  if (!volatility.length) volatility.push({ tone: 'ok', text: t('wsStableSignal') });

  return [
    { id: 'concentration', label: t('wsConcentration'), signals: concentration },
    { id: 'exposure',      label: t('wsExposureLabel'), signals: exposureSignals },
    { id: 'volatility',    label: t('wsVolatility'),    signals: volatility },
  ];
}

function _buildWorkspaceCopilotMessages() {
  // Flat compatibility wrapper for older callers (mobile risk strip etc.).
  const cats = _buildWorkspaceRiskCategories();
  const out = [];
  for (const cat of cats) {
    for (const s of cat.signals) {
      if (s.tone !== 'ok') out.push(s.text);
    }
  }
  if (!out.length) out.push(t('wsNoActiveSignals'));
  return out;
}

function _isNumericDisplay(cell) {
  if (!cell) return false;
  if (cell.type === 'formula') return typeof cell.computed === 'number';
  return typeof cell.value === 'number';
}

function _renderWorkspaceMatrixCell(cellId, cell) {
  const isActive  = WORKSPACE_RUNTIME.activeCellId === cellId;
  const isEditing = WORKSPACE_RUNTIME.isEditing && WORKSPACE_RUNTIME.editingCell === cellId;
  // AW-7.4: is-system = sólo readonly (user formulas type='formula' no
  // readonly NO son system y conservan cursor de celda editable).
  const isSystem  = !!(cell && cell.readonly);
  const isInvalid = !!(cell && cell.invalid);
  const display   = cell ? _formatWorkspaceCellDisplay(cell) : '';
  const cls = [
    'aurix-grid-cell',
    cell?.type === 'formula' ? 'is-formula'  : '',
    cell?.readonly           ? 'is-readonly' : '',
    isSystem                 ? 'is-system'   : '',
    !cell                    ? 'is-empty'    : '',
    _isNumericDisplay(cell)  ? 'is-numeric'  : '',
    isInvalid                ? 'is-invalid'  : '',
    isActive                 ? 'is-active'   : '',
    isEditing                ? 'is-editing'  : '',
  ].filter(Boolean).join(' ');

  if (isEditing) {
    const v = _escapeWorkspaceText(WORKSPACE_RUNTIME.editingValue ?? '');
    return `<div class="${cls}" data-cell-id="${_escapeWorkspaceText(cellId)}" role="gridcell">`
      + `<input class="aurix-cell-edit" data-cell-edit-input data-cell-id="${_escapeWorkspaceText(cellId)}" type="text" value="${v}" autocomplete="off" spellcheck="false" />`
      + `</div>`;
  }

  return `<div class="${cls}" data-cell-id="${_escapeWorkspaceText(cellId)}" role="gridcell">${display}</div>`;
}

function _renderWorkspaceFormulaBarValue(sheet) {
  const id = WORKSPACE_RUNTIME.activeCellId;
  if (!id) {
    return { coord: '', value: '', empty: true, kind: 'none', readonly: true, placeholder: t('wsSelectCell') };
  }
  const cell = sheet.cells[id] || null;

  // AW-7.2: durante edición, formula bar refleja editingValue (live, sin
  // estado paralelo — única fuente mutable: WORKSPACE_RUNTIME.editingValue).
  if (WORKSPACE_RUNTIME.isEditing && WORKSPACE_RUNTIME.editingCell === id) {
    return {
      coord:       id,
      value:       WORKSPACE_RUNTIME.editingValue ?? '',
      empty:       false,
      kind:        'editing',
      readonly:    false,
      placeholder: '',
    };
  }

  // AW-7.2 / AW-7.4: readonly cells (system formulas, future readonly literals)
  // → representación readonly. Las user formulas NO son readonly: caen abajo.
  if (cell && cell.readonly) {
    if (cell.type === 'formula' && cell.formula) {
      return { coord: id, value: '=' + cell.formula, empty: false, kind: 'formula', readonly: true, placeholder: '' };
    }
    const literal = cell.value != null ? String(cell.value) : '';
    return { coord: id, value: literal, empty: literal === '', kind: 'literal', readonly: true, placeholder: '' };
  }

  // AW-7.4: user formula cell — editable; mostrar formula source (ya con '=').
  if (cell && cell.type === 'formula' && cell.formula) {
    return { coord: id, value: cell.formula, empty: false, kind: 'formula', readonly: false, placeholder: '' };
  }

  // AW-7.2: user literal cell.
  if (cell && cell.value != null && cell.value !== '') {
    return { coord: id, value: String(cell.value), empty: false, kind: 'literal', readonly: false, placeholder: '' };
  }
  return { coord: id, value: '', empty: true, kind: 'empty', readonly: false, placeholder: t('wsEmptyCell') };
}

function _renderWorkspaceDesktop(sheet) {
  const cols = WORKSPACE_RUNTIME.gridColumns;
  const rows = WORKSPACE_RUNTIME.gridRows;

  // Sticky column headers row (corner + A/B/.../L)
  const colHeaders = `
    <div class="aurix-grid-corner" aria-hidden="true"></div>
    ${cols.map(c => `<div class="aurix-grid-col-header" role="columnheader">${_escapeWorkspaceText(c)}</div>`).join('')}
  `;

  // Body: row header + N cells per row (incluye celdas vacías)
  const bodyRows = rows.map(r => {
    const rowHeader = `<div class="aurix-grid-row-header" role="rowheader">${r}</div>`;
    const cellHtml  = cols.map(c => {
      const id   = buildCellId(r, c);
      const cell = sheet.cells[id] || null;
      return _renderWorkspaceMatrixCell(id, cell);
    }).join('');
    return rowHeader + cellHtml;
  }).join('');

  // AW-5 §5 / AW-7.2: formula bar como input editable bidireccional.
  const fb = _renderWorkspaceFormulaBarValue(sheet);
  const coordLabel  = fb.coord || '—';
  const coordEmpty  = !fb.coord;
  const valueClass  = [
    'aurix-formula-value',
    fb.empty                 ? 'is-empty'    : '',
    fb.kind === 'formula'    ? 'is-formula'  : '',
    fb.kind === 'literal'    ? 'is-literal'  : '',
    fb.kind === 'editing'    ? 'is-editing'  : '',
    fb.readonly              ? 'is-readonly' : 'is-editable',
  ].filter(Boolean).join(' ');

  // AW-5 §8: terminal-grade Risk Monitor — categorized sections.
  const categories = _buildWorkspaceRiskCategories();
  const riskBody = categories.map(cat => {
    const items = cat.signals.map(s => `
      <li class="aurix-risk-signal is-${_escapeWorkspaceText(s.tone)}">
        <span class="aurix-risk-dot" aria-hidden="true"></span>
        <span class="aurix-risk-text">${_escapeWorkspaceText(s.text)}</span>
      </li>
    `).join('');
    return `
      <section class="aurix-risk-group">
        <h4 class="aurix-risk-group-title">${_escapeWorkspaceText(cat.label)}</h4>
        <ul class="aurix-risk-list">${items}</ul>
      </section>
    `;
  }).join('');

  // Column count drives the CSS grid template (row-header + N data cells)
  const gridStyle = `--aw-grid-cols:${cols.length}`;

  // AW-6 §6: formula bar = command surface. Layout: fx | coord | divider |
  // value (1fr) | sheet-name. One divisor sólo, más respiración alrededor.
  return `
    <div class="aurix-workspace-shell is-desktop">
      <header class="aurix-toolbar" style="grid-template-columns:auto auto auto 1fr auto auto">
        <div class="aurix-formula-fx" aria-hidden="true">fx</div>
        <div class="aurix-formula-coord ${coordEmpty ? 'is-empty' : ''}">${_escapeWorkspaceText(coordLabel)}</div>
        <div class="aurix-formula-divider" aria-hidden="true"></div>
        <input
          class="${valueClass}"
          data-formula-bar-input
          type="text"
          value="${_escapeWorkspaceText(fb.value)}"
          placeholder="${_escapeWorkspaceText(fb.placeholder)}"
          ${fb.readonly ? 'readonly tabindex="-1"' : ''}
          autocomplete="off"
          spellcheck="false"
          aria-label="Formula bar"
        />
        <div class="aurix-sheet-name">${_escapeWorkspaceText(sheet.name)}</div>
        <button type="button" data-aurix-templates
          style="padding:7px 14px;border:1px solid rgba(255,255,255,0.14);border-radius:6px;background:rgba(255,255,255,0.05);color:#e8e8ea;font-family:inherit;font-size:11.5px;letter-spacing:0.08em;text-transform:uppercase;cursor:pointer;font-weight:600;white-space:nowrap"
          aria-label="Open workspace templates">Templates</button>
      </header>
      <div class="aurix-workspace-body">
        <section class="aurix-grid-panel" role="grid" aria-label="Spreadsheet" tabindex="0">
          <div class="aurix-grid-matrix" style="${gridStyle}">
            ${colHeaders}
            ${bodyRows}
          </div>
        </section>
        <aside class="aurix-copilot-panel" aria-label="${_escapeWorkspaceText(t('ws_risk_monitor'))}">
          <div class="aurix-copilot-header">
            <span class="aurix-copilot-eyebrow">${_escapeWorkspaceText(t('ws_risk_monitor'))}</span>
            <span class="aurix-copilot-subtitle">${_escapeWorkspaceText(t('ws_risk_subtitle'))}</span>
          </div>
          <div class="aurix-risk-body">${riskBody}</div>
        </aside>
      </div>
    </div>
  `;
}

function _renderWorkspaceMobile(sheet) {
  // AW-5 §10: executive cockpit. Reads the same derived snapshot as desktop;
  // never mutates state. Six condensed cards arranged in three rows of two,
  // followed by a compact risk strip and the FAB.
  const derived = getDerivedFinancialSnapshot();
  const portfolio  = derived?.portfolio || {};
  const totalValue = Number(portfolio.totalValue || 0);
  const assetCount = Number(portfolio.assetCount || 0);
  const topAlloc   = portfolio.allocations?.[0];
  const exposure   = portfolio.exposure || {};
  const cryptoVal  = Number(exposure.crypto || 0);
  const cryptoPct  = totalValue > 0 ? (cryptoVal / totalValue * 100) : 0;

  const dailyPnl    = (typeof portfolio.dailyPnl === 'number') ? portfolio.dailyPnl : null;
  const dailyPnlPct = (typeof portfolio.dailyPnlPct === 'number') ? portfolio.dailyPnlPct : null;

  // Workspace mobile cards: route monetary values through the canonical
  // display layer so they pick up the global currency toggle uniformly.
  // portfolio.totalValue is the raw qty*price aggregate (USD per dashboard
  // convention) — formatDisplay handles the conversion + formatting.
  const fmtMoney  = v => formatDisplay(v, 'USD');
  const fmtSigned = v => {
    const n = Number(v) || 0;
    return (n >= 0 ? '+' : '') + formatDisplay(n, 'USD');
  };

  const topLabel = topAlloc?.symbol
    ? `${topAlloc.symbol} · ${((topAlloc.allocation || 0) * 100).toFixed(1)}%`
    : '—';

  // AW-5 §10: simple consumer-only risk score — derived from concentration +
  // crypto exposure. Range 0–100 (lower = safer). No new computation pipelines.
  let riskScore = 25;
  if (topAlloc && Number(topAlloc.allocation || 0) > 0.5) riskScore += 25;
  else if (topAlloc && Number(topAlloc.allocation || 0) > 0.35) riskScore += 12;
  if (cryptoPct > 40) riskScore += 25;
  else if (cryptoPct > 15) riskScore += 10;
  if (assetCount > 0 && assetCount < 4) riskScore += 10;
  if (assetCount === 0) riskScore = 0;
  riskScore = Math.min(100, Math.max(0, Math.round(riskScore)));
  const riskBand = riskScore >= 60 ? t('wsRiskBandHigh') : riskScore >= 35 ? t('wsRiskBandModerate') : t('wsRiskBandLow');

  const cards = [
    {
      label: t('wsCardPortfolioValue'),
      value: assetCount === 0 ? '—' : fmtMoney(totalValue),
      tone:  'neutral',
    },
    {
      label: t('wsCardDailyPnl'),
      value: dailyPnl == null ? '—' : fmtSigned(dailyPnl),
      hint:  dailyPnlPct == null ? null : (dailyPnlPct >= 0 ? '+' : '') + dailyPnlPct.toFixed(2) + '%',
      tone:  dailyPnl == null ? 'neutral' : (dailyPnl >= 0 ? 'positive' : 'negative'),
    },
    {
      label: t('wsCardTopAlloc'),
      value: topLabel,
      tone:  'neutral',
    },
    {
      label: t('wsCardCryptoExposure'),
      value: assetCount === 0 ? '—' : cryptoPct.toFixed(1) + '%',
      tone:  cryptoPct > 40 ? 'warn' : 'neutral',
    },
    {
      label: t('wsCardAssetCount'),
      value: String(assetCount),
      tone:  'neutral',
    },
    {
      label: t('wsCardRiskScore'),
      value: assetCount === 0 ? '—' : String(riskScore),
      hint:  assetCount === 0 ? null : riskBand,
      tone:  riskScore >= 60 ? 'warn' : (riskScore >= 35 ? 'info' : 'positive'),
    },
  ];

  const summary = cards.map(c => `
    <div class="aurix-summary-card is-${_escapeWorkspaceText(c.tone || 'neutral')}">
      <div class="aurix-summary-label">${_escapeWorkspaceText(c.label)}</div>
      <div class="aurix-summary-value">${_escapeWorkspaceText(c.value)}</div>
      ${c.hint ? `<div class="aurix-summary-hint">${_escapeWorkspaceText(c.hint)}</div>` : ''}
    </div>
  `).join('');

  // AW-5 §11: compact risk strip (max 3 active signals, fall back to "Stable").
  const flat = _buildWorkspaceCopilotMessages().slice(0, 3);
  const riskItems = flat.map(t => `
    <li class="aurix-mobile-risk-item">
      <span class="aurix-mobile-risk-dot" aria-hidden="true"></span>
      <span class="aurix-mobile-risk-text">${_escapeWorkspaceText(t)}</span>
    </li>
  `).join('');

  return `
    <div class="aurix-workspace-shell is-mobile">
      <header class="aurix-mobile-header">
        <h2 class="aurix-mobile-title">${_escapeWorkspaceText(t('ws_title'))}</h2>
      </header>
      <section class="aurix-mobile-summary">${summary}</section>
      <section class="aurix-mobile-risk" aria-label="${_escapeWorkspaceText(t('ws_risk_signals'))}">
        <header class="aurix-mobile-risk-header">
          <span class="aurix-mobile-risk-eyebrow">${_escapeWorkspaceText(t('ws_risk_signals'))}</span>
        </header>
        <ul class="aurix-mobile-risk-list">${riskItems}</ul>
      </section>
    </div>
  `;
}

function renderWorkspace() {
  const container = document.getElementById('aurixWorkspace');
  if (!container) return;

  initializeWorkspaceRuntime();
  recalculateWorkspaceSheet(WORKSPACE_RUNTIME.activeSheetId);

  const sheet = getWorkspaceSheetSnapshot(WORKSPACE_RUNTIME.activeSheetId);
  if (!sheet) return;

  const isDesktop = isWorkspaceDesktop();
  container.innerHTML = isDesktop
    ? _renderWorkspaceDesktop(sheet)
    : _renderWorkspaceMobile(sheet);

  WORKSPACE_RUNTIME.renderVersion++;
  WORKSPACE_RUNTIME.lastRenderAt   = Date.now();
  WORKSPACE_RUNTIME.reactiveUpdates++;
  WORKSPACE_RUNTIME.lastComputedAt = WORKSPACE_RUNTIME.lastRenderAt;
  WORKSPACE_RUNTIME.stale          = false;

  // AW-7.1 / AW-7.2: focus management. Tras cada render en edit mode, el
  // input correspondiente al entry point recupera el foco con caret al final.
  // _editFocusTarget se setea en cada entry point ('cell' por defecto si nadie
  // lo marca explícitamente) — distinguir cell vs formula bar evita que la
  // edición desde la formula bar salte al input inline tras el render.
  if (WORKSPACE_RUNTIME.isEditing && isDesktop) {
    const target = WORKSPACE_RUNTIME._editFocusTarget === 'formula'
      ? container.querySelector('[data-formula-bar-input]')
      : container.querySelector('[data-cell-edit-input]');
    if (target) {
      target.focus();
      const len = target.value.length;
      try { target.setSelectionRange(len, len); } catch (_) {}
      // AW-9.1: refresh autocomplete after the editor regains focus, so
      // restoring an in-progress formula (typing-entry / re-render mid-edit)
      // keeps the dropdown in sync with editingValue + caret.
      _aw91UpdateAutocomplete(target);
      // AW-9.2: refresh validation in the same focus-restore step.
      _aw92UpdateValidation(target);
    }
  } else {
    // AW-9.1: not editing → ensure the dropdown is gone after re-render.
    _aw91CloseAutocomplete();
    // AW-9.2: not editing → clear inline validation too.
    WORKSPACE_RUNTIME.validationMessage = null;
    _aw92RemoveValidationDOM();
  }

  console.log('[workspace] rendered v' + WORKSPACE_RUNTIME.renderVersion + ' (' + (isDesktop ? 'desktop' : 'mobile') + ')');
}

// ── FC-10: Financial formula engine ───────────────────────────────────────────
// Pure functions only. compute(context) must be deterministic, sync, and free
// of side effects (no fetch, no render, no emit, no MARKET_DATA writes).

function buildFinancialFormulaContext() {
  return Object.freeze({
    market:  getMarketSnapshot(),
    derived: getDerivedFinancialSnapshot(),
    runtime: Object.freeze({
      marketVersion:  MARKET_DATA_VERSION,
      derivedVersion: DERIVED_FINANCIAL_STATE.version,
      formulaVersion: FORMULA_RUNTIME.version,
    }),
  });
}

// FC-11: dependency graph helpers
function normalizeFormulaDependency(dep) {
  return String(dep || '').trim().toLowerCase();
}

function rebuildFormulaDependencyGraph() {
  FORMULA_RUNTIME.dependencyGraph.clear();
  FORMULA_RUNTIME.reverseDependencies.clear();

  for (const [id, formula] of FORMULA_RUNTIME.formulas) {
    const normalizedDeps = (formula.dependencies || [])
      .map(normalizeFormulaDependency)
      .filter(Boolean);

    FORMULA_RUNTIME.dependencyGraph.set(id, normalizedDeps);

    for (const dep of normalizedDeps) {
      if (!FORMULA_RUNTIME.reverseDependencies.has(dep)) {
        FORMULA_RUNTIME.reverseDependencies.set(dep, new Set());
      }
      FORMULA_RUNTIME.reverseDependencies.get(dep).add(id);
    }
  }

  FORMULA_RUNTIME.graphVersion++;
  FORMULA_RUNTIME.lastGraphBuildAt = Date.now();

  console.log('[formula-graph] rebuilt:', {
    formulas:     FORMULA_RUNTIME.formulas.size,
    graphVersion: FORMULA_RUNTIME.graphVersion,
  });
}

function getAffectedFormulas(changedDeps = []) {
  const affected = new Set();
  const queue    = [...changedDeps].map(normalizeFormulaDependency);

  while (queue.length) {
    const dep        = queue.shift();
    const dependents = FORMULA_RUNTIME.reverseDependencies.get(dep);
    if (!dependents) continue;

    for (const formulaId of dependents) {
      if (affected.has(formulaId)) continue;
      affected.add(formulaId);
      queue.push(formulaId);
    }
  }

  return [...affected];
}

function detectFormulaCycles() {
  const visited = new Set();
  const stack   = new Set();

  function visit(node) {
    if (stack.has(node))   return true;
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    const deps = FORMULA_RUNTIME.dependencyGraph.get(node) || [];
    for (const dep of deps) {
      if (FORMULA_RUNTIME.formulas.has(dep)) {
        if (visit(dep)) return true;
      }
    }

    stack.delete(node);
    return false;
  }

  for (const [id] of FORMULA_RUNTIME.formulas) {
    if (visit(id)) {
      FORMULA_RUNTIME.cycleDetections++;
      console.error('[formula-graph] cycle detected:', id);
      return true;
    }
  }

  return false;
}

function registerFinancialFormula(id, dependencies, compute) {
  if (!id || typeof compute !== 'function') return false;

  FORMULA_RUNTIME.formulas.set(id, {
    id,
    dependencies: Array.isArray(dependencies) ? [...new Set(dependencies)] : [],
    compute,
  });

  console.log('[formula-runtime] registered:', id);

  // FC-11: keep dependency graph in sync with formula registry.
  rebuildFormulaDependencyGraph();
  return true;
}

function invalidateFinancialFormulas(changedDependencies = [], reason = 'unknown') {
  FORMULA_RUNTIME.invalidations++;

  const affected = getAffectedFormulas(changedDependencies);
  for (const formulaId of affected) {
    FORMULA_RUNTIME.dirtyFormulas.add(formulaId);
  }

  console.log('[formula-runtime] invalidated:', {
    reason,
    affected: affected.length,
  });
}

function computeFinancialFormula(id) {
  const formula = FORMULA_RUNTIME.formulas.get(id);
  if (!formula) return null;

  try {
    const context = buildFinancialFormulaContext();
    const result  = formula.compute(context);

    FORMULA_RUNTIME.cache.set(id, Object.freeze({
      value:          result,
      computedAt:     Date.now(),
      marketVersion:  MARKET_DATA_VERSION,
      derivedVersion: DERIVED_FINANCIAL_STATE.version,
    }));

    return result;
  } catch (e) {
    console.error('[formula-runtime] compute failed:', id, e?.message);
    return null;
  }
}

function recomputeFinancialFormulas(source = 'unknown') {
  if (FORMULA_RUNTIME.processing) {
    console.log('[formula-runtime] skipped recomputation');
    return;
  }

  FORMULA_RUNTIME.processing = true;

  const t0 = Date.now();

  try {
    if (detectFormulaCycles()) return;

    const dirty = [...FORMULA_RUNTIME.dirtyFormulas];

    for (const formulaId of dirty) {
      computeFinancialFormula(formulaId);
      FORMULA_RUNTIME.formulaVersions.set(formulaId, FORMULA_RUNTIME.version + 1);
    }

    FORMULA_RUNTIME.dirtyFormulas.clear();

    FORMULA_RUNTIME.version++;
    FORMULA_RUNTIME.recomputations++;
    FORMULA_RUNTIME.lastComputedAt = Date.now();
    FORMULA_RUNTIME.lastDurationMs = Date.now() - t0;

    console.log('[formula-runtime] recomputed selective:', {
      dirty:    dirty.length,
      duration: FORMULA_RUNTIME.lastDurationMs,
      source,
    });

    // AW-2: cascade into workspace runtime — sync, consumer-only.
    if (WORKSPACE_RUNTIME.initialized) {
      try {
        recalculateWorkspaceSheet(WORKSPACE_RUNTIME.activeSheetId);
        WORKSPACE_RUNTIME.stale = false;
        if (typeof currentTab !== 'undefined' && currentTab === 'workspace') {
          renderWorkspace();
        }
      } catch (cascadeErr) {
        console.error('[workspace] cascade failed:', cascadeErr?.message);
      }
    }
  } catch (e) {
    console.error('[formula-runtime] recomputation failed:', e?.message);
  } finally {
    FORMULA_RUNTIME.processing = false;
  }
}

function getFinancialFormulaSnapshot() {
  return Object.freeze({
    version:         FORMULA_RUNTIME.version,
    formulas:        Object.freeze(Object.fromEntries(FORMULA_RUNTIME.cache)),
    // FC-11: graph state
    graphVersion:    FORMULA_RUNTIME.graphVersion,
    dirty:           Object.freeze([...FORMULA_RUNTIME.dirtyFormulas]),
    formulaVersions: Object.freeze(Object.fromEntries(FORMULA_RUNTIME.formulaVersions)),
    runtime:         Object.freeze({
      recomputations: FORMULA_RUNTIME.recomputations,
      invalidations:  FORMULA_RUNTIME.invalidations,
      lastComputedAt: FORMULA_RUNTIME.lastComputedAt,
      lastDurationMs: FORMULA_RUNTIME.lastDurationMs,
    }),
  });
}

function getFinancialFormulaHealth() {
  return {
    version:        FORMULA_RUNTIME.version,
    formulas:       FORMULA_RUNTIME.formulas.size,
    cacheEntries:   FORMULA_RUNTIME.cache.size,
    recomputations: FORMULA_RUNTIME.recomputations,
    invalidations:  FORMULA_RUNTIME.invalidations,
    processing:     FORMULA_RUNTIME.processing,
    lastDurationMs: FORMULA_RUNTIME.lastDurationMs,
    // FC-11: graph state
    graphVersion:   FORMULA_RUNTIME.graphVersion,
    dirty:          FORMULA_RUNTIME.dirtyFormulas.size,
    cycles:         FORMULA_RUNTIME.cycleDetections,
    graphBuiltAt:   FORMULA_RUNTIME.lastGraphBuildAt,
  };
}

// ── FC-4: Read access layer ────────────────────────────────────────────────────
// AW-8 symbol-alias map: bridges common external notations (Yahoo Finance
// futures: GC=F / SI=F / CL=F) to the Twelve Data spot symbols Aurix
// actually loads into MARKET_DATA (XAU/USD → XAUUSD, etc.). Applied before
// normalizeSymbol so the existing lookup stays unchanged.
// Resolver aliases consumed by getMarketAsset / getMarketPrice. Single
// source of canonical-symbol mapping used by workspace =PRICE(...) and
// any Financial Core consumer. Yahoo-futures shortcuts plus user-friendly
// names for commodities and major indices.
const MARKET_SYMBOL_ALIASES = {
  // Yahoo-style futures → canonical
  'GC=F':   'XAUUSD',
  'SI=F':   'XAGUSD',
  'CL=F':   'WTI',
  // User-friendly commodity tickers
  XAU:      'XAU/USD',
  XAG:      'XAG/USD',
  GOLD:     'XAU/USD',
  SILVER:   'XAG/USD',
  OIL:      'WTI',
  // User-friendly index shortcuts
  SP500:    '^GSPC',
  'S&P500': '^GSPC',
  NASDAQ:   '^IXIC',
  DOW:      '^DJI',
};

// ── Canonical Asset Registry ───────────────────────────────────────────────
// Single source of identity truth for every asset that Aurix recognises.
// Each entry exposes a stable canonical id, display metadata, the full set of
// known synonyms, and provider keys used downstream by the snapshot gateway.
// Consumers should always go through resolveAsset / getCanonicalAsset rather
// than touching this object directly.
const _ASSET_REGISTRY = Object.freeze({
  // Crypto
  'asset:btc':   { id:'asset:btc',   type:'crypto', symbol:'BTC',   displayName:'Bitcoin',          aliases:['XBT','BITCOIN','BTC/USD','BTC-USD','BTC/USDT','BTCUSD','BTCUSDT'], providerKeys:{ coingecko:'bitcoin' } },
  'asset:eth':   { id:'asset:eth',   type:'crypto', symbol:'ETH',   displayName:'Ethereum',         aliases:['ETHER','ETHEREUM','ETH/USD','ETH-USD','ETHUSD','ETH/USDT'],       providerKeys:{ coingecko:'ethereum' } },
  'asset:usdt':  { id:'asset:usdt',  type:'crypto', symbol:'USDT',  displayName:'Tether',           aliases:['TETHER'],            providerKeys:{ coingecko:'tether' } },
  'asset:bnb':   { id:'asset:bnb',   type:'crypto', symbol:'BNB',   displayName:'BNB',              aliases:['BINANCECOIN'],       providerKeys:{ coingecko:'binancecoin' } },
  'asset:sol':   { id:'asset:sol',   type:'crypto', symbol:'SOL',   displayName:'Solana',           aliases:['SOLANA','SOL/USD'],  providerKeys:{ coingecko:'solana' } },
  'asset:xrp':   { id:'asset:xrp',   type:'crypto', symbol:'XRP',   displayName:'XRP',              aliases:['RIPPLE'],            providerKeys:{ coingecko:'ripple' } },
  'asset:usdc':  { id:'asset:usdc',  type:'crypto', symbol:'USDC',  displayName:'USD Coin',         aliases:['USD-COIN','USDCOIN'],providerKeys:{ coingecko:'usd-coin' } },
  'asset:ada':   { id:'asset:ada',   type:'crypto', symbol:'ADA',   displayName:'Cardano',          aliases:['CARDANO'],           providerKeys:{ coingecko:'cardano' } },
  'asset:avax':  { id:'asset:avax',  type:'crypto', symbol:'AVAX',  displayName:'Avalanche',        aliases:['AVALANCHE'],         providerKeys:{ coingecko:'avalanche-2' } },
  'asset:doge':  { id:'asset:doge',  type:'crypto', symbol:'DOGE',  displayName:'Dogecoin',         aliases:['DOGECOIN'],          providerKeys:{ coingecko:'dogecoin' } },
  'asset:trx':   { id:'asset:trx',   type:'crypto', symbol:'TRX',   displayName:'TRON',             aliases:['TRON'],              providerKeys:{ coingecko:'tron' } },
  'asset:dot':   { id:'asset:dot',   type:'crypto', symbol:'DOT',   displayName:'Polkadot',         aliases:['POLKADOT'],          providerKeys:{ coingecko:'polkadot' } },
  'asset:link':  { id:'asset:link',  type:'crypto', symbol:'LINK',  displayName:'Chainlink',        aliases:['CHAINLINK'],         providerKeys:{ coingecko:'chainlink' } },
  'asset:matic': { id:'asset:matic', type:'crypto', symbol:'MATIC', displayName:'Polygon',          aliases:['POLYGON','MATIC-NETWORK'], providerKeys:{ coingecko:'matic-network' } },
  'asset:shib':  { id:'asset:shib',  type:'crypto', symbol:'SHIB',  displayName:'Shiba Inu',        aliases:['SHIBA-INU','SHIBAINU'], providerKeys:{ coingecko:'shiba-inu' } },
  'asset:ltc':   { id:'asset:ltc',   type:'crypto', symbol:'LTC',   displayName:'Litecoin',         aliases:['LITECOIN'],          providerKeys:{ coingecko:'litecoin' } },
  'asset:bch':   { id:'asset:bch',   type:'crypto', symbol:'BCH',   displayName:'Bitcoin Cash',     aliases:['BITCOIN-CASH'],      providerKeys:{ coingecko:'bitcoin-cash' } },
  'asset:uni':   { id:'asset:uni',   type:'crypto', symbol:'UNI',   displayName:'Uniswap',          aliases:['UNISWAP'],           providerKeys:{ coingecko:'uniswap' } },
  'asset:atom':  { id:'asset:atom',  type:'crypto', symbol:'ATOM',  displayName:'Cosmos',           aliases:['COSMOS'],            providerKeys:{ coingecko:'cosmos' } },
  'asset:xlm':   { id:'asset:xlm',   type:'crypto', symbol:'XLM',   displayName:'Stellar',          aliases:['STELLAR'],           providerKeys:{ coingecko:'stellar' } },
  'asset:near':  { id:'asset:near',  type:'crypto', symbol:'NEAR',  displayName:'NEAR Protocol',    aliases:['NEAR-PROTOCOL'],     providerKeys:{ coingecko:'near' } },
  'asset:apt':   { id:'asset:apt',   type:'crypto', symbol:'APT',   displayName:'Aptos',            aliases:['APTOS'],             providerKeys:{ coingecko:'aptos' } },
  'asset:arb':   { id:'asset:arb',   type:'crypto', symbol:'ARB',   displayName:'Arbitrum',         aliases:['ARBITRUM'],          providerKeys:{ coingecko:'arbitrum' } },
  'asset:op':    { id:'asset:op',    type:'crypto', symbol:'OP',    displayName:'Optimism',         aliases:['OPTIMISM'],          providerKeys:{ coingecko:'optimism' } },

  // Stocks (mirrors STOCKS_UNIVERSE)
  'asset:aapl':  { id:'asset:aapl',  type:'stock',  symbol:'AAPL',  displayName:'Apple Inc.',       aliases:['APPLE','NASDAQ:AAPL'],  providerKeys:{ yahoo:'AAPL', twelvedata:'AAPL' } },
  'asset:msft':  { id:'asset:msft',  type:'stock',  symbol:'MSFT',  displayName:'Microsoft Corp.',  aliases:['MICROSOFT','NASDAQ:MSFT'], providerKeys:{ yahoo:'MSFT', twelvedata:'MSFT' } },
  'asset:nvda':  { id:'asset:nvda',  type:'stock',  symbol:'NVDA',  displayName:'NVIDIA Corp.',     aliases:['NVIDIA','NASDAQ:NVDA'], providerKeys:{ yahoo:'NVDA', twelvedata:'NVDA' } },
  'asset:tsla':  { id:'asset:tsla',  type:'stock',  symbol:'TSLA',  displayName:'Tesla Inc.',       aliases:['TESLA','NASDAQ:TSLA'],  providerKeys:{ yahoo:'TSLA', twelvedata:'TSLA' } },
  'asset:amzn':  { id:'asset:amzn',  type:'stock',  symbol:'AMZN',  displayName:'Amazon.com Inc.',  aliases:['AMAZON','NASDAQ:AMZN'], providerKeys:{ yahoo:'AMZN', twelvedata:'AMZN' } },
  'asset:meta':  { id:'asset:meta',  type:'stock',  symbol:'META',  displayName:'Meta Platforms',   aliases:['FACEBOOK','NASDAQ:META'], providerKeys:{ yahoo:'META', twelvedata:'META' } },
  'asset:googl': { id:'asset:googl', type:'stock',  symbol:'GOOGL', displayName:'Alphabet Inc.',    aliases:['GOOGLE','ALPHABET','NASDAQ:GOOGL'], providerKeys:{ yahoo:'GOOGL', twelvedata:'GOOGL' } },
  'asset:jpm':   { id:'asset:jpm',   type:'stock',  symbol:'JPM',   displayName:'JPMorgan Chase',   aliases:['JPMORGAN','NYSE:JPM'],  providerKeys:{ yahoo:'JPM', twelvedata:'JPM' } },
  'asset:v':     { id:'asset:v',     type:'stock',  symbol:'V',     displayName:'Visa Inc.',        aliases:['VISA','NYSE:V'],        providerKeys:{ yahoo:'V', twelvedata:'V' } },
  'asset:wmt':   { id:'asset:wmt',   type:'stock',  symbol:'WMT',   displayName:'Walmart Inc.',     aliases:['WALMART','NYSE:WMT'],   providerKeys:{ yahoo:'WMT', twelvedata:'WMT' } },
  'asset:brkb':  { id:'asset:brkb',  type:'stock',  symbol:'BRK.B', displayName:'Berkshire Hathaway',aliases:['BRKB','BERKSHIRE'],    providerKeys:{ yahoo:'BRK-B', twelvedata:'BRK.B' } },
  'asset:jnj':   { id:'asset:jnj',   type:'stock',  symbol:'JNJ',   displayName:'Johnson & Johnson',aliases:['NYSE:JNJ'],             providerKeys:{ yahoo:'JNJ', twelvedata:'JNJ' } },
  'asset:pg':    { id:'asset:pg',    type:'stock',  symbol:'PG',    displayName:'Procter & Gamble', aliases:['NYSE:PG'],              providerKeys:{ yahoo:'PG', twelvedata:'PG' } },
  'asset:xom':   { id:'asset:xom',   type:'stock',  symbol:'XOM',   displayName:'Exxon Mobil',      aliases:['EXXON','NYSE:XOM'],     providerKeys:{ yahoo:'XOM', twelvedata:'XOM' } },
  'asset:bac':   { id:'asset:bac',   type:'stock',  symbol:'BAC',   displayName:'Bank of America',  aliases:['NYSE:BAC'],             providerKeys:{ yahoo:'BAC', twelvedata:'BAC' } },
  'asset:avgo':  { id:'asset:avgo',  type:'stock',  symbol:'AVGO',  displayName:'Broadcom Inc.',    aliases:['BROADCOM','NASDAQ:AVGO'], providerKeys:{ yahoo:'AVGO', twelvedata:'AVGO' } },
  'asset:cost':  { id:'asset:cost',  type:'stock',  symbol:'COST',  displayName:'Costco Wholesale', aliases:['COSTCO','NASDAQ:COST'], providerKeys:{ yahoo:'COST', twelvedata:'COST' } },
  'asset:ko':    { id:'asset:ko',    type:'stock',  symbol:'KO',    displayName:'Coca-Cola Co.',    aliases:['COCACOLA','NYSE:KO'],   providerKeys:{ yahoo:'KO', twelvedata:'KO' } },
  'asset:mcd':   { id:'asset:mcd',   type:'stock',  symbol:'MCD',   displayName:'McDonald’s Corp.', aliases:['MCDONALDS','NYSE:MCD'], providerKeys:{ yahoo:'MCD', twelvedata:'MCD' } },
  'asset:nke':   { id:'asset:nke',   type:'stock',  symbol:'NKE',   displayName:'Nike Inc.',        aliases:['NIKE','NYSE:NKE'],      providerKeys:{ yahoo:'NKE', twelvedata:'NKE' } },

  // ETFs
  'asset:spy':   { id:'asset:spy',   type:'etf',    symbol:'SPY',   displayName:'SPDR S&P 500 ETF',  aliases:['SPDR'],            providerKeys:{ yahoo:'SPY', twelvedata:'SPY' } },
  'asset:qqq':   { id:'asset:qqq',   type:'etf',    symbol:'QQQ',   displayName:'Invesco QQQ Trust', aliases:['INVESCO-QQQ'],     providerKeys:{ yahoo:'QQQ', twelvedata:'QQQ' } },
  'asset:voo':   { id:'asset:voo',   type:'etf',    symbol:'VOO',   displayName:'Vanguard S&P 500',  aliases:[],                  providerKeys:{ yahoo:'VOO', twelvedata:'VOO' } },
  'asset:vti':   { id:'asset:vti',   type:'etf',    symbol:'VTI',   displayName:'Vanguard Total Stock Market', aliases:[],        providerKeys:{ yahoo:'VTI', twelvedata:'VTI' } },
  'asset:urth':  { id:'asset:urth',  type:'etf',    symbol:'URTH',  displayName:'iShares MSCI World',aliases:[],                  providerKeys:{ yahoo:'URTH', twelvedata:'URTH' } },
  'asset:vea':   { id:'asset:vea',   type:'etf',    symbol:'VEA',   displayName:'Vanguard Developed Markets', aliases:[],         providerKeys:{ yahoo:'VEA', twelvedata:'VEA' } },

  // Indices
  'asset:gspc':  { id:'asset:gspc',  type:'index',  symbol:'^GSPC', displayName:'S&P 500',           aliases:['SP500','S&P500','SPX','GSPC'], providerKeys:{ yahoo:'^GSPC', twelvedata:'^GSPC' } },
  'asset:ixic':  { id:'asset:ixic',  type:'index',  symbol:'^IXIC', displayName:'NASDAQ Composite',  aliases:['NASDAQ','IXIC','NDX'],         providerKeys:{ yahoo:'^IXIC', twelvedata:'^IXIC' } },
  'asset:dji':   { id:'asset:dji',   type:'index',  symbol:'^DJI',  displayName:'Dow Jones',         aliases:['DOW','DJI','DJIA','DOWJONES'], providerKeys:{ yahoo:'^DJI', twelvedata:'^DJI' } },

  // Commodities
  'asset:xauusd':{ id:'asset:xauusd',type:'commodity', symbol:'XAU/USD', displayName:'Gold (spot)',  aliases:['XAU','GOLD','GC=F','XAUUSD'],   providerKeys:{ yahoo:'GC=F', twelvedata:'XAU/USD' } },
  'asset:xagusd':{ id:'asset:xagusd',type:'commodity', symbol:'XAG/USD', displayName:'Silver (spot)',aliases:['XAG','SILVER','SI=F','XAGUSD'], providerKeys:{ yahoo:'SI=F', twelvedata:'XAG/USD' } },
  'asset:wti':   { id:'asset:wti',   type:'commodity', symbol:'WTI',     displayName:'Crude Oil (WTI)', aliases:['OIL','CL=F','WTIUSD','WTI/USD'], providerKeys:{ yahoo:'CL=F', twelvedata:'WTI' } },
});

// Flat alias → canonical-id index, built once at module init.
// Indexes: symbol, id, every alias, displayName, every provider key.
const _ASSET_ALIAS_INDEX = (() => {
  const idx = Object.create(null);
  const put = (key, id) => {
    if (!key) return;
    const k = String(key).toUpperCase();
    if (!idx[k]) idx[k] = id; // first-write wins (stable resolution)
  };
  for (const asset of Object.values(_ASSET_REGISTRY)) {
    put(asset.symbol, asset.id);
    put(asset.id, asset.id);
    if (asset.displayName) put(asset.displayName, asset.id);
    for (const alias of (asset.aliases || [])) put(alias, asset.id);
    if (asset.providerKeys) {
      for (const v of Object.values(asset.providerKeys)) put(v, asset.id);
    }
  }
  return Object.freeze(idx);
})();

// Public resolver APIs. Pure, never mutate, never fetch.
function resolveAsset(input) {
  if (input == null) return null;
  const raw = String(input).trim();
  if (!raw) return null;
  const upper = raw.toUpperCase();
  // Direct alias hit
  let id = _ASSET_ALIAS_INDEX[upper];
  if (id) return _ASSET_REGISTRY[id];
  // Namespaced form ("coingecko:bitcoin", "twelvedata:AAPL", "NASDAQ:AAPL", ...)
  const colon = upper.indexOf(':');
  if (colon > 0) {
    id = _ASSET_ALIAS_INDEX[upper.slice(colon + 1)];
    if (id) return _ASSET_REGISTRY[id];
  }
  return null;
}

function getCanonicalAsset(id) {
  if (id == null) return null;
  return _ASSET_REGISTRY[String(id).toLowerCase()] ?? null;
}

function resolveProviderKey(asset, provider) {
  if (!asset || !provider) return null;
  const key = asset.providerKeys?.[String(provider).toLowerCase()];
  return key ? `${String(provider).toLowerCase()}:${key}` : null;
}

// ── Observability ─────────────────────────────────────────────────────────
// Lightweight in-memory counters surfaced via window.AURIX_DEBUG. Reset on
// page reload. Pure increments — no side effects, no console spam.
const AURIX_TELEMETRY = {
  startedAt: Date.now(),
  market: {
    refreshAttempts:    0,
    refreshFailures:    0,
    backoffActivations: 0,
    marketUpdateCount:  0,
    staleFallbackUses:  0,
  },
  workspace: {
    formulaEvalCount:    0,
    evalFailures:        0,
    parserFailures:      0,
    cycleDetections:     0, // mirrors WORKSPACE_RUNTIME.cycleDetections
    recomputeRuns:       0,
    recomputeDurationMs: { sum: 0, count: 0 },
    affectedNodeCount:   { sum: 0, count: 0 },
  },
};

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'AURIX_DEBUG', {
    get() {
      const avg = (b) => b.count > 0 ? Math.round(b.sum / b.count) : 0;
      const t   = AURIX_TELEMETRY;
      const mr  = (typeof MARKET_RUNTIME !== 'undefined') ? MARKET_RUNTIME : null;
      const wr  = (typeof WORKSPACE_RUNTIME !== 'undefined') ? WORKSPACE_RUNTIME : null;
      const pr  = (typeof PORTFOLIO_RUNTIME !== 'undefined') ? PORTFOLIO_RUNTIME : null;
      return {
        uptimeMs: Date.now() - t.startedAt,
        market: {
          refreshAttempts:    t.market.refreshAttempts,
          refreshFailures:    t.market.refreshFailures,
          backoffActivations: t.market.backoffActivations,
          marketUpdateEvents: t.market.marketUpdateCount,
          staleFallbackUsage: t.market.staleFallbackUses,
          providers:          mr?.providers || {},
          health:             mr?.health    || 'unknown',
          cycleId:            mr?.cycleId   || 0,
          lastDurationMs:     mr?.lastDurationMs ?? null,
          activeBackoffs:     (typeof MARKET_FAILURE_TS !== 'undefined') ? Object.keys(MARKET_FAILURE_TS).length : 0,
        },
        workspace: {
          formulaEvaluations:    t.workspace.formulaEvalCount,
          formulaFailures:       t.workspace.evalFailures,
          parserFailures:        t.workspace.parserFailures,
          cycleDetections:       wr?.cycleDetections ?? t.workspace.cycleDetections,
          recomputeRuns:         t.workspace.recomputeRuns,
          recomputeDurationMsAvg: avg(t.workspace.recomputeDurationMs),
          recomputeDurationMsTotal: t.workspace.recomputeDurationMs.sum,
          affectedNodeCountAvg:  avg(t.workspace.affectedNodeCount),
          marketVersion:         (typeof MARKET_DATA_VERSION === 'number') ? MARKET_DATA_VERSION : null,
        },
        portfolio: pr ? {
          reactiveEvents:               pr.reactiveEvents,
          ignoredEvents:                pr.ignoredEvents,
          lastRecalculationDurationMs:  pr.lastRecalculationDurationMs,
          stale:                        pr.stale,
        } : null,
      };
    },
    configurable: true,
  });
}

function getMarketAsset(symbol) {
  // Canonical registry first — covers XBT, BITCOIN, GOLD, SP500, NASDAQ:AAPL,
  // coingecko:bitcoin, etc. Falls back to legacy MARKET_SYMBOL_ALIASES if the
  // symbol is not yet in the registry (compatibility layer for unregistered
  // long-tail assets).
  const canonical = resolveAsset(symbol);
  const raw       = canonical
    ? canonical.symbol
    : (MARKET_SYMBOL_ALIASES[String(symbol || '').trim().toUpperCase()]
        || String(symbol || '').trim().toUpperCase());
  const norm      = normalizeSymbol(raw);
  return MARKET_DATA.find(d => normalizeSymbol(d.symbol) === norm) ?? null;
}
function getMarketPrice(symbol) {
  const item  = getMarketAsset(symbol);
  if (!item) return null;
  const price = item.current_price ?? item.price;
  return (typeof price === 'number' && isFinite(price) && price > 0) ? price : null;
}
function getMarketAssetsByType(type) {
  return MARKET_DATA.filter(d => d.type === String(type).toLowerCase());
}
function getMarketSnapshot() {
  return Object.freeze([...MARKET_DATA]);
}

function buildMarketEventSnapshot(type, changedSymbols = []) {
  return Object.freeze({
    type,
    changedSymbols: Object.freeze(
      [...new Set(changedSymbols.filter(Boolean).map(normalizeSymbol))]
    ),
    version:   MARKET_DATA_VERSION,
    timestamp: Date.now(),
    market:    getMarketSnapshot(),
    runtime:   Object.freeze({
      cycleId:    MARKET_RUNTIME.cycleId,
      health:     MARKET_RUNTIME.health,
      refreshing: MARKET_RUNTIME.refreshing,
    }),
  });
}

// ── FC-4: Structural validation — reject corrupt items before entering MARKET_DATA
function _isValidMarketItem(item) {
  if (!item?.symbol || typeof item.symbol !== 'string') return false;
  const price = item.current_price ?? item.price;
  return typeof price === 'number' && isFinite(price) && price > 0 && price < 1e9;
}

function _dedupeMarketData() {
  const map = new Map();
  for (const item of MARKET_DATA) {
    const key = normalizeSymbol(item.symbol);
    if (!key) continue;
    const existing = map.get(key);
    if (!existing || (existing.fallback && !item.fallback)) {
      map.set(key, item);
    }
  }
  MARKET_DATA = Array.from(map.values());
  MARKET_DATA_VERSION++;
}
let MARKET_DATA_FULL = [];
// ── Frontend cache policy ────────────────────────────────────────────────
// Layers, owner, lifetime:
//   MARKET_DATA          canonical reactive store (no TTL; replaced on commit)
//   MARKET_CACHE[tab]    per-tab MARKET_DATA snapshot (60s freshness window
//                        before refreshMarketInBackground fetches again)
//   MARKET_CACHE_TS[tab] timestamp of last successful refresh per tab
//   MARKET_FAILURE_TS    last-failure timestamp; gates 5min backoff
//   PRICE_CACHE[symbol]  last-known price (per-symbol fallback). Capped at
//                        PRICE_CACHE_MAX_AGE — older entries are evicted on
//                        read so we never silently serve infinitely-stale data.
//   MARKET_METRICS_CACHE small UI-only header strings.
const MARKET_METRICS_CACHE = {};
const MARKET_CACHE = {};
const MARKET_CACHE_TS = {};
const MARKET_FAILURE_TS = {};
const MARKET_FAILURE_BACKOFF = 5 * 60 * 1000; // 5 min cooldown after provider failure
const PRICE_CACHE = {};
const PRICE_CACHE_MAX_AGE = 10 * 60 * 1000; // 10 min hard cap on per-symbol fallback
const _LOADING = {};
let _marketSearchQuery = '';
function marketLog(...args) { if (false) console.log('[market]', ...args); }

const MARKET_HEADER_CONFIG = {
  crypto: {
    metricMarketCap:    () => MARKET_METRICS_CACHE?.marketCap    || '$2.5T',
    metricFearGreed:    () => MARKET_METRICS_CACHE?.fearGreed    || '59',
    metricBTCdom:       () => MARKET_METRICS_CACHE?.btcDom       || '52%',
    metricLiquidations: () => MARKET_METRICS_CACHE?.liquidations || '$120M',
  },
  stocks: {
    metricMarketCap:    () => '5,200',
    metricFearGreed:    () => '16,400',
    metricBTCdom:       () => '18.2',
    metricLiquidations: () => '62%',
  },
  etfs: {
    metricMarketCap:    () => '$520',
    metricFearGreed:    () => '$1.2B',
    metricBTCdom:       () => 'QQQ',
    metricLiquidations: () => '$80B',
  },
  indices: {
    metricMarketCap:    () => '5,200',
    metricFearGreed:    () => '39,400',
    metricBTCdom:       () => '18.2',
    metricLiquidations: () => '8,200',
  },
  commodities: {
    metricMarketCap:    () => '$2,300',
    metricFearGreed:    () => '$78',
    metricBTCdom:       () => '104',
    metricLiquidations: () => '3.1%',
  },
};
let showAllTx        = false;
let insightIndex        = 0;
let insightCache            = [];
let lastInsightSignature          = null;
let lastInsightTimestamp          = 0;
let lastDisplayedInsightSignature = null;
const INSIGHT_COOLDOWN      = 60000;

function createInsightSignature(insight) {
  try {
    const base = `${insight.topic}|${insight.priority}|${insight.text}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) {
      hash = ((hash << 5) - hash) + base.charCodeAt(i);
      hash |= 0;
    }
    return hash.toString();
  } catch (_) {
    return null;
  }
}
const INSIGHT_TTL           = 120000;
let _lastInsightText    = '';
let _lastInsightPriority = 4;
let _loopInterval  = null;
let _marketInterval = null;
let currentTopic   = null;
let lastTopics     = [];
let topicHistory   = [];
let lastMessages   = [];
let currentMessage = null;
let messageQueue   = [];
let queueIndex     = 0;
let recentIds      = [];
let _isRefilling   = false;

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
    const valUSD = assetValueUSD(a);
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
  distributionLegendEl.innerHTML = dist.map(({ type, pct }, i) => {
    const m = TYPE_META[type] || TYPE_META.other;
    return `<div class="legend-item" data-idx="${i}">
      <span class="legend-left">
        <span class="legend-dot" style="background:${m.color}"></span>
        <span class="legend-label">${m.label}</span>
      </span>
      <span class="legend-percent">${pct.toFixed(1)}%</span>
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

  // Mobile sync — mirror donut data + legend + center
  if (donutChartMobile) {
    donutChartMobile.data.labels                            = dist.map(d => (TYPE_META[d.type] || TYPE_META.other).label);
    donutChartMobile.data.datasets[0].data                 = dist.map(d => d.pct);
    donutChartMobile.data.datasets[0].backgroundColor      = dist.map(d => (TYPE_META[d.type] || TYPE_META.other).color);
    donutChartMobile.data.datasets[0].hoverBackgroundColor = dist.map(d => lightenHex((TYPE_META[d.type] || TYPE_META.other).color, 1.18));
    donutChartMobile.update(_donutHasData ? 'none' : undefined);
  }
  const _mLegend = document.getElementById('distributionLegendMobile');
  if (_mLegend) _mLegend.innerHTML = distributionLegendEl.innerHTML;
  const _mCenterVal = document.getElementById('donutCenterValMobile');
  const _mCenterSub = document.getElementById('donutCenterSubMobile');
  if (_mCenterVal) _mCenterVal.textContent = donutCenterValEl.textContent;
  if (_mCenterSub) _mCenterSub.textContent = donutCenterSubEl.textContent;

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
            // Chart series are stored in USD (canonical). Route ticks
            // through the canonical display layer so EUR mode shows
            // EUR-converted axis labels, not USD numbers with €.
            callback: v => formatDisplayShort(v, 'USD'),
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
    // Mobile sync — clear
    const _mnd = document.getElementById('chartNoDataMobile');
    const _mch = document.getElementById('chartChangeMobile');
    if (_mnd) _mnd.style.display = '';
    if (_mch) _mch.textContent = '';
    if (portfolioChartMobile) {
      portfolioChartMobile.data.labels = [];
      portfolioChartMobile.data.datasets[0].data = [];
      portfolioChartMobile.update('none');
    }
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

  // Mobile sync — mirror data and change indicator
  const _mnd = document.getElementById('chartNoDataMobile');
  const _mch = document.getElementById('chartChangeMobile');
  if (_mnd) _mnd.style.display = 'none';
  if (_mch) { _mch.textContent = chartChangeEl.textContent; _mch.className = chartChangeEl.className; }
  if (portfolioChartMobile) {
    portfolioChartMobile.data.labels = data.labels;
    portfolioChartMobile.data.datasets[0].data = data.values;
    portfolioChartMobile.update('none');
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
  const unique    = [...new Set(coinIds)];
  const providers = unique.map(id => `coingecko:${id}`);

  const res = await fetch(PRICES_PROXY, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ providers }),
  });

  if (res.status === 429) throw new Error('rate_limit');
  if (!res.ok)            throw new Error(`http_${res.status}`);

  const { prices } = await res.json();

  // Adapt proxy format → CoinGecko format expected by callers
  const result = {};
  for (const id of unique) {
    const entry = prices?.[`coingecko:${id}`];
    if (entry) {
      result[id] = {
        usd:            entry.price     ?? null,
        usd_24h_change: entry.change24h ?? null,
      };
    }
  }
  return result;
}

// CoinGecko search removed — search limited to ASSET_DB
async function searchCoinFallback(_query) {
  return null;
}

// ── Canonical single-symbol price resolver ─────────────────────────────────
// Routes through /api/prices/snapshot so the backend provider chain
// (yahoo primary → twelvedata fallback for stocks/ETFs/indices/commodities)
// is applied uniformly. Returns the USD price as a number, or null if the
// symbol is not in the snapshot registry or the gateway returned nothing.
async function resolveSymbolPrice(symbol) {
  if (!symbol) return null;
  try {
    const url = `${PRICES_PROXY}/snapshot?symbols=${encodeURIComponent(symbol)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const want = symbol.toUpperCase();
    const hit  = (json?.snapshot ?? []).find(
      p => p.symbol === symbol || p.symbol?.toUpperCase() === want
    );
    return Number.isFinite(hit?.price) ? hit.price : null;
  } catch {
    return null;
  }
}

// ── Gold spot price: XAU/USD → GC=F → fallback (single batched snapshot) ──
async function fetchGoldSpotPrice() {
  try {
    const url = `${PRICES_PROXY}/snapshot?symbols=${encodeURIComponent('XAU/USD,GC=F')}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const json = await res.json();
      const bySym = new Map();
      for (const p of (json?.snapshot ?? [])) bySym.set(p.symbol, p);
      const xau = bySym.get('XAU/USD');
      if (xau && Number.isFinite(xau.price) && xau.price > 0) {
        goldPriceUpdatedAt = Date.now();
        return xau.price;
      }
      const gcf = bySym.get('GC=F');
      if (gcf && Number.isFinite(gcf.price) && gcf.price > 0) {
        goldPriceUpdatedAt = Date.now();
        return gcf.price;
      }
    }
  } catch { /* fall through */ }

  // Final fallback: hardcoded — no timestamp update (not a live price)
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
  const cached = _isinCache.get(isin);
  if (cached) {
    // Positive cache: serve forever. Negative cache: only within _ISIN_NEG_TTL.
    if (cached.value !== null || (Date.now() - cached.ts) < _ISIN_NEG_TTL) return cached.value;
    _isinCache.delete(isin);
  }
  const cacheNull = () => { _isinCache.set(isin, { value: null, ts: Date.now() }); return null; };
  try {
    // Proxied via /api/assets/resolve-isin — browser never talks to OpenFIGI.
    const res = await fetch(`${PRICES_PROXY.replace('/api/prices','')}/api/assets/resolve-isin`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body:    JSON.stringify({ isin }),
      signal,
    });
    if (!res.ok) return cacheNull();
    const json  = await res.json();
    const items = json?.data;
    if (!items?.length) return cacheNull();

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
    _isinCache.set(isin, { value: result, ts: Date.now() });
    return result;
  } catch (err) {
    if (err.name !== 'AbortError') cacheNull();
    return null;
  }
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
// ── FC-2 Phase 1: Financial Core — unified market price lookup ────────────
const _fc2FallbackCache = { data: null, ts: 0 };
const _FC2_CACHE_TTL    = 60_000; // 1 min — avoid fetch storms

async function _fetchStocksFallbackFC2() {
  const now = Date.now();
  if (_fc2FallbackCache.data && now - _fc2FallbackCache.ts < _FC2_CACHE_TTL) {
    return _fc2FallbackCache.data;
  }
  try {
    const url  = `${PRICES_PROXY}/snapshot?symbols=${encodeURIComponent(STOCKS_UNIVERSE.join(','))}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const json = await res.json();
    const data = (json?.snapshot ?? [])
      .filter(p => Number.isFinite(p.price))
      .map(p => ({ symbol: p.symbol, name: p.symbol, price: p.price, change24h: p.change24h ?? null }));
    if (data.length) { _fc2FallbackCache.data = data; _fc2FallbackCache.ts = now; }
    return data.length ? data : null;
  } catch { return null; }
}

async function getUnifiedMarketPrice(symbol) {
  const norm = normalizeSymbol(symbol);

  // 1. Check MARKET_DATA first — already-fetched data, no network cost
  const item = MARKET_DATA.find(d => normalizeSymbol(d.symbol) === norm);
  if (item?.price > 0) {
    console.log('[FC2] source: MARKET_DATA', symbol);
    return { price: item.price, change24h: item.change24h ?? null };
  }

  // 2. Fallback: single cached batch snapshot for the stocks universe
  console.log('[FC2] fallback triggered for', symbol);
  const data  = await _fetchStocksFallbackFC2();
  if (!data) return null;
  const found = data.find(d => normalizeSymbol(d.symbol) === norm);
  if (found?.price > 0) return { price: Number(found.price), change24h: found.change24h ?? null };

  return null;
}

// FC-4: crypto portfolio pricing via MARKET_DATA — same pattern as getUnifiedMarketPrice
async function getUnifiedCryptoPrices(cryptos) {
  const result  = {};
  const missing = [];

  for (const a of cryptos) {
    // Portfolio crypto assets have a.ticker ('BTC') that maps to MARKET_DATA symbol
    const ticker = normalizeSymbol(a.ticker || '');
    const item   = ticker
      ? MARKET_DATA.find(d => d.type === 'crypto' && normalizeSymbol(d.symbol) === ticker)
      : null;
    const price  = item ? (item.current_price ?? item.price ?? null) : null;
    if (price > 0) {
      result[a.coinId] = {
        usd:            price,
        usd_24h_change: item.price_change_percentage_24h ?? item.change24h ?? null,
      };
    } else {
      missing.push(a.coinId);
    }
  }

  // Fallback to proxy for any asset not yet in MARKET_DATA (e.g. on cold start)
  if (missing.length) {
    const fetched = await fetchLivePrices(missing);
    Object.assign(result, fetched);
  }

  return result;
}

async function collectMarketPriceData(marketAssets) {
  const results = await Promise.allSettled(
    marketAssets.map(async a => {
      let price = null, change24h = null;
      try {
        if (a.marketSymbol === 'GC=F') {
          price = await fetchGoldSpotPrice();
        } else {
          const data = await getUnifiedMarketPrice(a.marketSymbol);
          price     = data?.price     ?? null;
          change24h = data?.change24h ?? null;
        }
        if (change24h === null) {
          const fb = getFallbackData(a.marketSymbol);
          if (fb) change24h = fb.change24h;
        }
      } catch {
        if (IS_DEV) console.error('[DATA] price fetch error:', a.id);
      }
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
  // FC-7/FC-8: track legacy refresh for reactive health
  PORTFOLIO_RUNTIME.lastReactiveSource     = 'legacy-refresh';
  PORTFOLIO_RUNTIME.lastPortfolioRefreshAt = Date.now();
  PORTFOLIO_RUNTIME.stale = false;
  console.log('[portfolio-reactive] legacy refreshPrices() executed');

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
      ? getUnifiedCryptoPrices(cryptos)   // FC-4: reads MARKET_DATA first, falls back to proxy
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
  if (status === 'open')   return t('liveMarket');
  if (status === 'closed') return t('closed');
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
    'open':   `🟢 ${t('statusOpen')}`,
    'closed': `🔴 ${t('statusClosed')}`,
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
        const rentLabel     = t('rentSuffix');
        const rentLblText   = t('monthlyIncome');
        const multipleProps = typeAssets.filter(a => a.rent > 0).length > 1;
        const rentLblFull   = multipleProps
          ? t('totalMonthlyIncome')
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
    pctEl.textContent = `${((totalValue / portfolioTotal) * 100).toFixed(1)}%${t('pctOfPortfolio')}`;
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
  const typeLabel = tx.type === 'buy' ? t('txBadgeBuy') : t('txBadgeSell');
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
    return `<div class="insights-history-empty">${t('insightsNoTx')}</div>`;
  }
  return `
    <div class="insights-history">
      <div class="insights-history-header">${t('insightsHistory')}</div>
      <div class="ins-tx-list">${txs.map(renderTxRow).join('')}</div>
    </div>`;
}

// PR-6: insights/legacy helper now delegates to the canonical USD total
// so AI surfaces, decision insights and risk scoring see the same number
// the dashboard does (with gold purity + FX normalisation applied).
function getTotalPortfolioValue() {
  return totalValueUSD();
}

function own(asset) {
  return t('ownPrefix')(asset);
}

function generateBaseInsights() {
  const txs        = getAllTransactions();
  const totalValue = getTotalPortfolioValue();
  const candidates = [];

  if (!assets.length) {
    return [{ text: t('insightsEmptyAdd'), priority: 4, topic: 'distribution', score: 0, id: 'empty', semanticKey: 'empty_portfolio', build: null }];
  }

  let maxValue = 0, maxAsset = null;
  assets.forEach(a => { const v = a.qty * a.price; if (v > maxValue) { maxValue = v; maxAsset = a; } });
  const concPct = totalValue > 0 ? Math.round((maxValue / totalValue) * 100) : 0;
  if (totalValue > 0 && concPct > 50 && maxAsset) {
    const nk = maxAsset.name.replace(/\s+/g, '_');
    const nh = escHtml(maxAsset.name);
    candidates.push({
      id: `conc_asset_${nk}_${Math.floor(concPct / 10) * 10}`,
      semanticKey: `${nk}_weight`,
      topic: 'concentration', priority: 1, score: concPct,
      data: { name: nh, pct: concPct },
      build: (d, i) => buildInsightText('concentration_asset', d, i),
    });
    candidates.push({
      id: `risk_conc_asset_${nk}_${Math.floor(concPct / 10) * 10}`,
      semanticKey: `${nk}_concentration_risk`,
      topic: 'concentration', priority: 1, score: concPct - 5,
      data: { name: nh, pct: concPct },
      build: (d, i) => buildInsightText('risk_asset_dominates', d, i),
    });
  }

  const byType = {};
  assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.qty * a.price; });
  for (const type in byType) {
    const typePct = totalValue > 0 ? Math.round((byType[type] / totalValue) * 100) : 0;
    if (typePct > 60) {
      const label = (T[lang].typeMeta && T[lang].typeMeta[type]) || type;
      candidates.push({
        id: `conc_cat_${type}_${Math.floor(typePct / 10) * 10}`,
        semanticKey: `category_${type}_exposure`,
        topic: 'distribution', priority: 1, score: typePct,
        data: { label, pct: typePct },
        build: (d, i) => buildInsightText('concentration_category', d, i),
      });
      break;
    }
  }

  // Performance + risk for top-3 gainers (> 20% up from cost)
  const performers = assets
    .filter(a => a.costBasis > 0)
    .map(a => ({ asset: a, pct: Math.round((a.qty * a.price - a.costBasis) / a.costBasis * 100) }))
    .filter(p => p.pct > 20)
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);

  performers.forEach((p, idx) => {
    const { asset, pct } = p;
    const nk = asset.name.replace(/\s+/g, '_');
    const nh = escHtml(asset.name);
    candidates.push({
      id: `perf_gain_${nk}_${Math.floor(pct / 10) * 10}`,
      semanticKey: `${nk}_performance`,
      topic: 'performance', priority: 2, score: pct,
      data: { name: nh, pct },
      build: (d, i) => buildInsightText('performance_gain', d, i),
    });
    if (idx === 0) {
      candidates.push({
        id: `risk_unrealized_${nk}_${Math.floor(pct / 10) * 10}`,
        semanticKey: `${nk}_unrealized`,
        topic: 'performance', priority: 2, score: pct - 5,
        data: { name: nh, pct },
        build: (d, i) => buildInsightText('risk_unrealized', d, i),
      });
      candidates.push({
        id: `dec_unrealized_${nk}_${Math.floor(pct / 10) * 10}`,
        semanticKey: `${nk}_decision_unrealized`,
        topic: 'activity', priority: 2, score: pct - 10,
        data: { name: nh, pct },
        build: (d, i) => buildInsightText('decision_unrealized_open', d, i),
      });
    }
  });

  // Confidence-risk: concentrated book in profit
  // PR-6: PnL accumulator uses the canonical USD valuation so this matches
  // the dashboard's totalPnL (gold karat + EUR normalised).
  const totalPnl   = assets.reduce((s, a) => s + (a.costBasis > 0 ? assetValueUSD(a) - a.costBasis : 0), 0);
  const portPnlPct = totalValue > 0 && totalPnl > 0 ? Math.round((totalPnl / totalValue) * 100) : 0;
  if (portPnlPct > 10 && maxAsset && concPct > 40) {
    const nk = maxAsset.name.replace(/\s+/g, '_');
    const nh = escHtml(maxAsset.name);
    candidates.push({
      id: `conc_conf_${nk}_${Math.floor(portPnlPct / 10) * 10}`,
      semanticKey: `${nk}_confidence_exposure`,
      topic: 'concentration', priority: 2, score: portPnlPct,
      data: { name: nh, pct: concPct, pnl: portPnlPct },
      build: (d, i) => buildInsightText('concentration_confidence', d, i),
    });
  }

  const liquidity    = assets.filter(a => a.type === 'cash').reduce((s, a) => s + a.qty, 0);
  const liquidityPct = totalValue > 0 ? Math.round((liquidity / totalValue) * 100) : 0;
  if (totalValue > 0 && liquidityPct < 10) {
    candidates.push({
      id: `liq_low_${Math.floor(liquidityPct / 5) * 5}`,
      semanticKey: 'portfolio_liquidity',
      topic: 'liquidity', priority: 2, score: 100 - liquidityPct,
      data: { pct: liquidityPct },
      build: (d, i) => buildInsightText('liquidity_low', d, i),
    });
    candidates.push({
      id: `dec_liq_${Math.floor(liquidityPct / 5) * 5}`,
      semanticKey: 'portfolio_flexibility',
      topic: 'liquidity', priority: 2, score: 95 - liquidityPct,
      data: { pct: liquidityPct },
      build: (d, i) => buildInsightText('decision_low_liquidity', d, i),
    });
  }

  if (txs.length) {
    const last    = txs[0];
    const daysAgo = Math.round(getDaysSince(last.ts));
    const isBuy   = last.type === 'buy';
    const nk      = last.assetName.replace(/\s+/g, '_');
    candidates.push({
      id: `activity_recent_${isBuy ? 'buy' : 'sell'}_${nk}_${daysAgo}`,
      semanticKey: `${nk}_recent_${isBuy ? 'buy' : 'sell'}`,
      topic: 'activity', priority: 3, score: 50,
      data: { name: escHtml(last.assetName), daysAgo },
      build: (d, i) => buildInsightText(isBuy ? 'activity_recent_buy' : 'activity_recent_sell', d, i),
    });
  }

  // Structural snapshot for multi-asset portfolios
  if (assets.length >= 2 && maxAsset && totalValue > 0) {
    candidates.push({
      id: `dist_structure_${assets.length}_${Math.floor(concPct / 10) * 10}`,
      semanticKey: 'portfolio_structure_snapshot',
      topic: 'distribution', priority: 4, score: 15,
      data: { count: assets.length, name: escHtml(maxAsset.name), topPct: concPct },
      build: (d, i) => buildInsightText('distribution_structure', d, i),
    });
  }

  if (!candidates.length) candidates.push({
    id: `dist_no_dominant_${assets.length}`,
    semanticKey: 'portfolio_balance',
    topic: 'distribution', priority: 4, score: 10,
    data: { count: assets.length },
    build: (d, i) => buildInsightText('distribution_no_dominant', d, i),
  });

  return candidates;
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
  const timeline = buildAssetTimeline(asset);
  if (!timeline || timeline.avgEntry <= 0) return null;
  const growth = ((timeline.currentPrice - timeline.avgEntry) / timeline.avgEntry) * 100;
  const days   = getDaysSince(timeline.firstTs);
  if (growth > 80 && days < 60) {
    const nk  = asset.name.replace(/\s+/g, '_');
    const nh  = escHtml(asset.name);
    const pct = Math.round(growth);
    const d   = Math.round(days);
    return [
      {
        id: `perf_runup_${nk}_${Math.floor(growth / 10) * 10}`,
        semanticKey: `${nk}_performance`,
        topic: 'performance', priority: 2, score: pct,
        data: { name: nh, pct, days: d },
        build: (data, i) => buildInsightText('performance_runup', data, i),
      },
      {
        id: `risk_runup_${nk}_${Math.floor(growth / 10) * 10}`,
        semanticKey: `${nk}_unrealized`,
        topic: 'performance', priority: 2, score: pct - 5,
        data: { name: nh, pct, days: d },
        build: (data, i) => buildInsightText('risk_runup_open', data, i),
      },
    ];
  }
  return null;
}

function detectStabilization(asset) {
  const timeline = buildAssetTimeline(asset);
  if (!timeline || timeline.avgEntry <= 0) return null;
  const growth        = ((timeline.currentPrice - timeline.avgEntry) / timeline.avgEntry) * 100;
  const daysSinceLast = getDaysSince(timeline.lastTs);
  if (growth > 50 && daysSinceLast > 7) {
    const nk   = asset.name.replace(/\s+/g, '_');
    const nh   = escHtml(asset.name);
    const pct  = Math.round(growth);
    const days = Math.round(daysSinceLast);
    const base = Math.floor(growth / 10) * 10;
    const dbase = Math.floor(daysSinceLast / 7) * 7;
    return [
      {
        id: `perf_stable_${nk}_${base}_${dbase}`,
        semanticKey: `${nk}_unrealized`,
        topic: 'performance', priority: 3, score: pct,
        data: { name: nh, pct, days },
        build: (d, i) => buildInsightText('performance_stabilization', d, i),
      },
      {
        id: `beh_hold_${nk}_${base}_${dbase}`,
        semanticKey: `${nk}_holding_behavior`,
        topic: 'activity', priority: 3, score: days,
        data: { name: nh, pct, days },
        build: (d, i) => buildInsightText('behavior_holding', d, i),
      },
    ];
  }
  return null;
}

function detectAccumulation(asset) {
  if (!asset.transactions) return null;
  const buys = asset.transactions.filter(tx => tx.type === 'buy');
  if (buys.length >= 3) {
    return {
      id: `activity_accum_${asset.name.replace(/\s+/g, '_')}_${buys.length}`,
      semanticKey: `${asset.name.replace(/\s+/g, '_')}_accumulation`,
      topic: 'activity', priority: 3, score: buys.length * 10,
      data: { name: escHtml(asset.name), count: buys.length },
      build: (d, i) => buildInsightText('activity_accumulation', d, i),
    };
  }
  return null;
}

function generateTemporalInsights() {
  const candidates = [];
  assets.forEach(asset => {
    const runUp = detectRunUp(asset);
    if (runUp) Array.isArray(runUp) ? candidates.push(...runUp) : candidates.push(runUp);
    const stable = detectStabilization(asset);
    if (stable) Array.isArray(stable) ? candidates.push(...stable) : candidates.push(stable);
    const acc = detectAccumulation(asset);
    if (acc) candidates.push(acc);
  });
  return candidates;
}

function detectRepetition() {
  const txs   = getAllTransactions();
  const count = {};
  txs.forEach(tx => { if (tx.type === 'buy') count[tx.assetName] = (count[tx.assetName] || 0) + 1; });
  for (const name in count) {
    if (count[name] >= 3) {
      return {
        id: `activity_rep_${name.replace(/\s+/g, '_')}_${count[name]}`,
        semanticKey: `${name.replace(/\s+/g, '_')}_accumulation`,
        topic: 'activity', priority: 2, score: count[name] * 10,
        data: { name: escHtml(name), count: count[name] },
        build: (d, i) => buildInsightText('activity_repetition', d, i),
      };
    }
  }
  return null;
}

function detectOveractivity() {
  const txs    = getAllTransactions();
  const recent = txs.filter(tx => Date.now() - tx.ts < 3 * 24 * 60 * 60 * 1000);
  if (recent.length >= 5) {
    const assetCounts = {};
    recent.forEach(tx => { assetCounts[tx.assetName] = (assetCounts[tx.assetName] || 0) + 1; });
    const topName = Object.keys(assetCounts).sort((a, b) => assetCounts[b] - assetCounts[a])[0];
    return {
      id: `activity_over_${recent.length}`,
      semanticKey: 'portfolio_overactivity',
      topic: 'activity', priority: 2, score: recent.length * 10,
      data: { count: recent.length, name: topName ? escHtml(topName) : null },
      build: (d, i) => buildInsightText('activity_overactivity', d, i),
    };
  }
  return null;
}

function detectConfidenceRisk() {
  const pnl           = getPortfolioPnL();
  const concentration = getTopAssetExposure();
  if (pnl > 40 && concentration > 50) {
    let topAsset = null, topVal = 0;
    assets.forEach(a => { const v = a.qty * a.price; if (v > topVal) { topVal = v; topAsset = a; } });
    const pnlRound  = Math.round(pnl);
    const concRound = Math.round(concentration);
    const n         = topAsset ? escHtml(topAsset.name) : t('oneAsset');
    const nk        = n.replace(/\s+/g, '_');
    return {
      id: `conc_confidence_${nk}_${Math.floor(concRound / 10) * 10}`,
      semanticKey: `${nk}_concentration_risk`,
      topic: 'concentration', priority: 1, score: concRound + pnlRound,
      data: { name: n, pnl: pnlRound, pct: concRound },
      build: (d, i) => buildInsightText('concentration_confidence', d, i),
    };
  }
  return null;
}

function detectInactivityAfterGrowth() {
  const txs = getAllTransactions();
  if (!txs.length) return null;
  const days = getDaysSince(txs[0].ts);
  const pnl  = getPortfolioPnL();
  if (pnl > 30 && days > 10) {
    let bestAsset = null, bestGain = 0;
    assets.forEach(a => {
      if (!a.costBasis || a.costBasis <= 0) return;
      const g = (a.qty * a.price - a.costBasis) / a.costBasis * 100;
      if (g > bestGain) { bestGain = g; bestAsset = a; }
    });
    const daysRound = Math.round(days);
    const n         = bestAsset ? escHtml(bestAsset.name) : null;
    const nk        = n ? n.replace(/\s+/g, '_') : 'portfolio';
    const pct       = n ? Math.round(bestGain) : Math.round(pnl);
    return {
      id: `activity_inactivity_${daysRound}`,
      semanticKey: `${nk}_unrealized`,
      topic: 'activity', priority: 2, score: pct,
      data: { name: n, pct, days: daysRound },
      build: (d, i) => buildInsightText('activity_inactivity', d, i),
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

function adaptMessage(text) {
  return text;
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
  const pattern = detectBehaviorPatterns();
  if (!pattern) return null;
  if (pattern.type === 'buying_high') {
    const ratioPct = Math.round(pattern.strength * 100);
    return {
      id: `activity_decision_${ratioPct}`,
      semanticKey: 'behavior_buying_trend',
      topic: 'activity', priority: 2, score: ratioPct,
      data: { ratioPct },
      build: (d, i) => buildInsightText('activity_decision', d, i),
    };
  }
  return null;
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
  const story      = buildUserStory();
  const candidates = [];
  for (const asset in story) {
    const txs  = story[asset];
    if (txs.length < 3) continue;
    const nk   = asset.replace(/\s+/g, '_');
    const buys = txs.filter(tx => tx.type === 'buy');
    if (buys.length >= 3) candidates.push({
      id: `narrative_buys_${nk}_${buys.length}`,
      semanticKey: `${nk}_accumulation`,
      topic: 'activity', priority: 2, score: buys.length * 5,
      data: { name: escHtml(asset), count: buys.length },
      build: (d, i) => buildInsightText('activity_narrative_buys', d, i),
    });
    const days = (txs[txs.length - 1].ts - txs[0].ts) / (1000 * 60 * 60 * 24);
    if (days > 30) candidates.push({
      id: `narrative_days_${nk}_${Math.floor(days / 10) * 10}`,
      semanticKey: `${nk}_long_hold`,
      topic: 'activity', priority: 3, score: Math.round(days),
      data: { name: escHtml(asset), days: Math.round(days) },
      build: (d, i) => buildInsightText('activity_narrative_days', d, i),
    });
  }
  return candidates;
}

function generateNarrativeInsight() {
  return selectInsight(detectNarrativePatterns());
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
  return text;
}

function generateSignatureInsight() {
  const identity   = getIdentity();
  const txCount    = getAllTransactions().length;
  const totalValue = getTotalPortfolioValue();
  let topAsset = null, topVal = 0;
  assets.forEach(a => { const v = a.qty * a.price; if (v > topVal) { topVal = v; topAsset = a; } });
  const n      = topAsset ? escHtml(topAsset.name) : null;
  const topPct = topAsset && totalValue > 0 ? Math.round((topVal / totalValue) * 100) : 0;

  if (identity.style === 'active') return {
    id: `sig_active_${txCount}`,
    semanticKey: 'portfolio_activity_style',
    topic: 'activity', priority: 3, score: txCount,
    data: { txCount, name: n },
    build: (d, i) => buildInsightText('activity_signature', d, i),
  };
  if (identity.style === 'concentrated') return {
    id: `sig_concentrated_${assets.length}`,
    semanticKey: 'portfolio_concentration_style',
    topic: 'concentration', priority: 3, score: 50,
    data: { name: n || t('defaultPortfolio'), count: assets.length },
    build: (d, i) => buildInsightText('concentration_signature', d, i),
  };
  return {
    id: `sig_balanced_${assets.length}`,
    semanticKey: 'portfolio_distribution_style',
    topic: 'distribution', priority: 3, score: 50,
    data: { count: assets.length, name: n, topPct },
    build: (d, i) => buildInsightText('distribution_signature', d, i),
  };
}

const messageHistory  = new Map();
const semanticHistory = new Map();

function isUsed(id) {
  const entry = messageHistory.get(id);
  if (!entry) return false;
  return (Date.now() - entry.lastSeen) < 5 * 60 * 1000;
}

function register(id) {
  const entry = messageHistory.get(id) || { count: 0 };
  messageHistory.set(id, { count: entry.count + 1, lastSeen: Date.now() });
}

function getUseCount(id) {
  return (messageHistory.get(id) || { count: 0 }).count;
}

function isSemanticUsed(key) {
  if (!key) return false;
  const entry = semanticHistory.get(key);
  if (!entry) return false;
  return (Date.now() - entry.lastSeen) < 5 * 60 * 1000;
}

function registerSemantic(key) {
  if (key) semanticHistory.set(key, { lastSeen: Date.now() });
}

function isSameIdea(a, b) {
  return !!(a.semanticKey && b.semanticKey && a.semanticKey === b.semanticKey);
}

const TOPIC_BUILDERS = {
  // ── Structure: how the portfolio is organized ──
  concentration_asset: {
    es: { msgs: [d => `${d.name} representa el ${d.pct}% de la cartera.`, d => `${d.name} al ${d.pct}% — activo dominante en la cartera.`] },
    en: { msgs: [d => `${d.name} represents ${d.pct}% of portfolio.`, d => `${d.name} at ${d.pct}% — dominant position.`] },
  },
  concentration_category: {
    es: { msgs: [d => `${d.label} representa el ${d.pct}% del capital invertido.`, d => `El ${d.pct}% de la cartera está concentrado en ${d.label}.`] },
    en: { msgs: [d => `${d.label} represents ${d.pct}% of invested capital.`, d => `${d.pct}% of portfolio concentrated in ${d.label}.`] },
  },
  concentration_confidence: {
    es: { msgs: [d => `Cartera en +${d.pnl}% con ${d.name} al ${d.pct}%.`, d => `${d.name} al ${d.pct}% mientras la cartera sube un ${d.pnl}%.`] },
    en: { msgs: [d => `Portfolio up ${d.pnl}% with ${d.name} at ${d.pct}%.`, d => `${d.name} at ${d.pct}% as portfolio gains ${d.pnl}%.`] },
  },
  concentration_signature: {
    es: { msgs: [d => `${d.name} es el activo principal entre ${d.count} posición${d.count !== 1 ? 'es' : ''}.`] },
    en: { msgs: [d => `${d.name} is the primary asset across ${d.count} position${d.count !== 1 ? 's' : ''}.`] },
  },
  distribution_no_dominant: {
    es: { msgs: [d => `${d.count} posición${d.count !== 1 ? 'es' : ''} sin activo dominante.`, d => `Cartera distribuida en ${d.count} posiciones sin concentración dominante.`] },
    en: { msgs: [d => `${d.count} position${d.count !== 1 ? 's' : ''}, no dominant asset.`, d => `Portfolio across ${d.count} positions, no dominant concentration.`] },
  },
  distribution_signature: {
    es: { msgs: [d => d.name ? `${d.count} posiciones activas. ${d.name} al ${d.topPct}%.` : `Cartera con ${d.count} posiciones distribuidas.`] },
    en: { msgs: [d => d.name ? `${d.count} active positions. ${d.name} at ${d.topPct}%.` : `Portfolio with ${d.count} distributed positions.`] },
  },
  distribution_structure: {
    es: { msgs: [d => d.name ? `${d.count} activos. ${d.name} al ${d.topPct}%.` : `Cartera distribuida entre ${d.count} activos.`, d => d.name ? `Estructura: ${d.count} activos. Mayor posición ${d.name} (${d.topPct}%).` : `${d.count} activos en cartera.`] },
    en: { msgs: [d => d.name ? `${d.count} assets. ${d.name} at ${d.topPct}%.` : `Portfolio spread across ${d.count} assets.`, d => d.name ? `Structure: ${d.count} assets. Top position ${d.name} at ${d.topPct}%.` : `${d.count} assets in portfolio.`] },
  },

  // ── Performance: what is happening ──
  performance_gain: {
    es: { msgs: [d => `${d.name} sube un ${d.pct}% desde tu entrada.`, d => `${d.name} acumula +${d.pct}% sobre tu precio de coste.`, d => `${d.name} genera +${d.pct}% en rentabilidad bruta.`] },
    en: { msgs: [d => `${d.name} up ${d.pct}% from your entry.`, d => `${d.name} at +${d.pct}% on cost basis.`, d => `${d.name} generating +${d.pct}% gross return.`] },
  },
  performance_runup: {
    es: { msgs: [d => `${d.name} sube un ${d.pct}% en ${d.days} días.`, d => `${d.name} lleva ${d.pct}% de ganancia en ${d.days} días.`, d => `${d.name} +${d.pct}% en ${d.days} días desde la primera entrada.`] },
    en: { msgs: [d => `${d.name} up ${d.pct}% in ${d.days} days.`, d => `${d.name} carrying ${d.pct}% gain over ${d.days} days.`, d => `${d.name} +${d.pct}% in ${d.days} days from first entry.`] },
  },
  performance_stabilization: {
    es: { msgs: [d => `${d.name} en +${d.pct}% sin cambios en ${d.days} días.`, d => `${d.name} mantiene +${d.pct}% sin nuevas operaciones en ${d.days} días.`] },
    en: { msgs: [d => `${d.name} at +${d.pct}%, no changes in ${d.days} days.`, d => `${d.name} holding +${d.pct}% with no trades in ${d.days} days.`] },
  },
  performance_growth_driver: {
    es: { msgs: [d => `${d.name} genera el ${d.pct}% del crecimiento total de la cartera.`, d => `${d.name} aporta ${d.pct} de cada 100 puntos de rentabilidad.`] },
    en: { msgs: [d => `${d.name} drives ${d.pct}% of total portfolio growth.`, d => `${d.name} accounts for ${d.pct} of every 100 return points.`] },
  },

  // ── Risk: why it matters ──
  risk_unrealized: {
    es: { msgs: [d => `${d.name} lleva +${d.pct}% en ganancias sin consolidar.`, d => `+${d.pct}% en ${d.name} sin toma de beneficios.`, d => `${d.name} acumula +${d.pct}% no realizados. Posición abierta.`] },
    en: { msgs: [d => `${d.name} carrying +${d.pct}% in unrealized gains.`, d => `+${d.pct}% in ${d.name} with no profit taken.`, d => `${d.name} at +${d.pct}% unrealized. Position open.`] },
  },
  risk_asset_dominates: {
    es: { msgs: [d => `El ${d.pct}% del capital en ${d.name} concentra el riesgo de cartera.`, d => `${d.name} al ${d.pct}% — un único activo domina la exposición.`, d => `Con ${d.name} al ${d.pct}%, la cartera carece de diversificación.`] },
    en: { msgs: [d => `${d.pct}% in ${d.name} concentrates portfolio risk in one position.`, d => `${d.name} at ${d.pct}% — a single asset dominates exposure.`, d => `At ${d.pct}% in ${d.name}, the portfolio lacks diversification.`] },
  },
  risk_runup_open: {
    es: { msgs: [d => `${d.name} +${d.pct}% en ${d.days} días sin consolidar ganancias.`, d => `${d.name} sube ${d.pct}% en ${d.days} días con posición abierta.`] },
    en: { msgs: [d => `${d.name} +${d.pct}% in ${d.days} days with no gains locked in.`, d => `${d.name} up ${d.pct}% over ${d.days} days, position open.`] },
  },
  liquidity_low: {
    es: { msgs: [d => `Liquidez al ${d.pct}%. Reserva de caja muy reducida.`, d => `Solo un ${d.pct}% en efectivo. Capital casi totalmente invertido.`] },
    en: { msgs: [d => `Cash at ${d.pct}%. Very thin liquidity reserve.`, d => `Only ${d.pct}% in cash. Capital almost fully deployed.`] },
  },

  // ── Decision: what to consider ──
  decision_low_liquidity: {
    es: { msgs: [d => `Tu liquidez actual es del ${d.pct}%. Margen de maniobra reducido.`, d => `Solo un ${d.pct}% en efectivo. Capacidad de reacción limitada.`, d => `Con ${d.pct}% en caja, las nuevas oportunidades son difíciles de aprovechar.`] },
    en: { msgs: [d => `Cash at ${d.pct}%. Reduced room to maneuver.`, d => `Only ${d.pct}% in cash. Limited reaction capacity.`, d => `At ${d.pct}% cash, new opportunities are harder to act on.`] },
  },
  decision_unrealized_open: {
    es: { msgs: [d => `Tienes +${d.pct}% en ganancias no realizadas en ${d.name}.`, d => `${d.name} lleva +${d.pct}% sin salida definida.`, d => `Las ganancias de ${d.name} (+${d.pct}%) siguen abiertas.`] },
    en: { msgs: [d => `You have +${d.pct}% unrealized gains in ${d.name}.`, d => `${d.name} at +${d.pct}% with no exit taken.`, d => `${d.name} gains (+${d.pct}%) remain unrealized.`] },
  },

  // ── Behavior: patterns you show ──
  activity_recent_buy: {
    es: { msgs: [d => `${d.name} comprado hace ${d.daysAgo} día${d.daysAgo !== 1 ? 's' : ''}.`] },
    en: { msgs: [d => `${d.name} bought ${d.daysAgo} day${d.daysAgo !== 1 ? 's' : ''} ago.`] },
  },
  activity_recent_sell: {
    es: { msgs: [d => `${d.name} vendido hace ${d.daysAgo} día${d.daysAgo !== 1 ? 's' : ''}.`] },
    en: { msgs: [d => `${d.name} sold ${d.daysAgo} day${d.daysAgo !== 1 ? 's' : ''} ago.`] },
  },
  activity_repetition: {
    es: { msgs: [d => `${d.name} aumentado ${d.count} veces. Patrón de acumulación activo.`, d => `${d.count} entradas distintas en ${d.name}. Alta convicción sostenida.`] },
    en: { msgs: [d => `${d.name} added ${d.count} times. Active accumulation pattern.`, d => `${d.count} separate entries in ${d.name}. Sustained high conviction.`] },
  },
  activity_overactivity: {
    es: { msgs: [d => d.name ? `${d.count} operaciones en 3 días, mayoría en ${d.name}.` : `${d.count} operaciones en los últimos 3 días.`, d => d.name ? `Actividad elevada: ${d.count} ops en 3 días, lideradas por ${d.name}.` : `Frecuencia alta: ${d.count} operaciones en 3 días.`] },
    en: { msgs: [d => d.name ? `${d.count} trades in 3 days, mostly in ${d.name}.` : `${d.count} trades in the last 3 days.`, d => d.name ? `High activity: ${d.count} ops in 3 days, led by ${d.name}.` : `${d.count} operations logged in 3 days.`] },
  },
  activity_inactivity: {
    es: { msgs: [d => d.name ? `${d.name} en +${d.pct}% sin operaciones en ${d.days} días.` : `Sin operaciones en ${d.days} días. Cartera en +${d.pct}%.`, d => d.name ? `Llevas ${d.days} días sin ajustar ${d.name} (+${d.pct}%).` : `${d.days} días sin actividad. Rentabilidad: +${d.pct}%.`] },
    en: { msgs: [d => d.name ? `${d.name} at +${d.pct}%, no trades in ${d.days} days.` : `No trades in ${d.days} days. Portfolio at +${d.pct}%.`, d => d.name ? `${d.days} days without touching ${d.name} (+${d.pct}%).` : `${d.days} days inactive. Return: +${d.pct}%.`] },
  },
  activity_accumulation: {
    es: { msgs: [d => `${d.name} construido en ${d.count} compras distintas.`, d => `${d.count} entradas en ${d.name} a distintos precios.`] },
    en: { msgs: [d => `${d.name} built across ${d.count} separate buys.`, d => `${d.count} entries in ${d.name} at different prices.`] },
  },
  activity_decision: {
    es: { msgs: [d => `El ${d.ratioPct}% de tus compras recientes fueron en tendencia alcista.`, d => `${d.ratioPct} de cada 100 compras se realizaron durante subidas.`] },
    en: { msgs: [d => `${d.ratioPct}% of your recent buys were during uptrends.`, d => `${d.ratioPct} out of 100 buys happened during price rises.`] },
  },
  activity_wow_buys: {
    es: { msgs: [d => d.gain !== null ? `${d.name} comprado ${d.count} veces. Posición en +${d.gain}%.` : `${d.name} en ${d.count} entradas distintas.`] },
    en: { msgs: [d => d.gain !== null ? `${d.name} bought ${d.count} times. Position at +${d.gain}%.` : `${d.name} across ${d.count} separate entries.`] },
  },
  activity_narrative_buys: {
    es: { msgs: [d => `${d.name} — ${d.count} compras registradas.`] },
    en: { msgs: [d => `${d.name} — ${d.count} recorded buys.`] },
  },
  activity_narrative_days: {
    es: { msgs: [d => `${d.name} acumulado durante ${d.days} días.`] },
    en: { msgs: [d => `${d.name} accumulated over ${d.days} days.`] },
  },
  activity_signature: {
    es: { msgs: [d => d.name ? `${d.txCount} ops registradas. ${d.name} posición principal.` : `${d.txCount} operaciones registradas en total.`] },
    en: { msgs: [d => d.name ? `${d.txCount} trades logged. ${d.name} primary position.` : `${d.txCount} total trades logged.`] },
  },
  behavior_holding: {
    es: { msgs: [d => `${d.name} en +${d.pct}% sin operaciones en ${d.days} días.`, d => `Llevas ${d.days} días sin ajustar ${d.name} (+${d.pct}%).`] },
    en: { msgs: [d => `${d.name} at +${d.pct}%, not touched in ${d.days} days.`, d => `${d.days} days holding ${d.name} at +${d.pct}% without changes.`] },
  },
};

function buildInsightText(key, data, idx) {
  const l = lang === 'es' ? 'es' : 'en';
  const b = TOPIC_BUILDERS[key]?.[l];
  if (!b) return null;
  return b.msgs[idx % b.msgs.length](data);
}

const FORBIDDEN_WORDS_VALIDATE = ['puede', 'ayudar', 'importante', 'considera', 'recuerda', 'try', 'help', 'important', 'remember', 'consider'];

function validate(text) {
  if (!text || text.length < 20) return false;
  if (!/\d/.test(text)) return false;
  if (FORBIDDEN_WORDS_VALIDATE.some(w => text.toLowerCase().includes(w))) return false;
  return true;
}

function selectInsight(candidates) {
  if (!candidates || !candidates.length) return null;
  const hasBuild  = candidates.filter(c => c.build);
  const fresh     = hasBuild.filter(c => !isUsed(c.id) && !isSemanticUsed(c.semanticKey));
  const semaFresh = fresh.length > 0 ? fresh : hasBuild.filter(c => !isSemanticUsed(c.semanticKey));
  const pool      = semaFresh.length > 0 ? semaFresh : hasBuild;
  if (!pool.length) return null;
  pool.sort((a, b) => b.score - a.score);
  const chosen = pool[0];
  const idx    = getUseCount(chosen.id);
  const text   = chosen.build(chosen.data, idx);
  if (!validate(text)) return null;
  register(chosen.id);
  registerSemantic(chosen.semanticKey);
  return { id: chosen.id, topic: chosen.topic, priority: chosen.priority, score: chosen.score, semanticKey: chosen.semanticKey, assetSlug: chosen.data && chosen.data.name ? String(chosen.data.name).replace(/\s+/g, '_').toLowerCase() : null, text };
}

function inferInsightType(c) {
  const sk = (c.semanticKey || '').toLowerCase();
  const t  = c.topic || '';
  if (sk.endsWith('_performance') || sk.endsWith('_growth_driver'))         return 'performance';
  if (sk.endsWith('_unrealized')  || sk.endsWith('_concentration_risk')     ||
      sk.endsWith('_weight')       || sk.includes('category_')               ||
      sk === 'portfolio_liquidity' || t === 'concentration')                  return 'risk';
  if (sk === 'portfolio_flexibility' || sk === 'behavior_buying_trend' ||
      sk.includes('_decision_'))                                              return 'decision';
  if (t === 'activity' || sk.includes('_accumulation') || sk.includes('_recent_') ||
      sk.endsWith('_long_hold')    || sk.endsWith('_holding_behavior'))       return 'behavior';
  return 'structure';
}

function getAmbientMessages() {
  const totalValue = getTotalPortfolioValue();

  if (assets.length > 0) {
    const pool = [];

    // Top asset by value
    let topByVal = null, topVal = 0;
    assets.forEach(a => {
      const v = a.qty * a.price;
      if (v > topVal) { topVal = v; topByVal = a; }
    });
    if (topByVal && totalValue > 0) {
      const pct = Math.round((topVal / totalValue) * 100);
      pool.push(t('ambientDominant')(escHtml(topByVal.name), pct));
    }

    // Best performer by % gain
    let bestPerformer = null, bestGain = 0;
    assets.forEach(a => {
      if (!a.costBasis || a.costBasis <= 0) return;
      const g = (a.qty * a.price - a.costBasis) / a.costBasis * 100;
      if (g > bestGain) { bestGain = g; bestPerformer = a; }
    });
    if (bestPerformer && bestGain > 0) {
      pool.push(t('ambientGains')(escHtml(bestPerformer.name), Math.round(bestGain)));
    }

    // Dominant category
    const byType = {};
    assets.forEach(a => { byType[a.type] = (byType[a.type] || 0) + a.qty * a.price; });
    const types = Object.keys(byType);
    if (types.length >= 2) {
      const topType = types.sort((a, b) => byType[b] - byType[a])[0];
      const typePct = totalValue > 0 ? Math.round((byType[topType] / totalValue) * 100) : 0;
      const label   = (T[lang].typeMeta && T[lang].typeMeta[topType]) || topType;
      pool.push(t('ambientCategory')(label, typePct));
    }

    // Open positions count
    if (assets.length > 1) {
      pool.push(t('ambientOpenPos')(assets.length));
    }

    if (pool.length > 0) {
      return pool.map(text => ({ text, priority: 4, ambient: true }));
    }
  }

  // Fallback when no assets
  const fallback = [t('insightsEmptyAdd2'), t('insightsEmptyStart')];
  return fallback.map(text => ({ text, priority: 4, ambient: true }));
}

const EVOLUTION_KEY = 'aurix_evolution';

function getEvolution() {
  try { return JSON.parse(localStorage.getItem(EVOLUTION_KEY)) || { level: 1, interactions: 0 }; }
  catch { return { level: 1, interactions: 0 }; }
}

function saveEvolution(data) {
  localStorage.setItem(EVOLUTION_KEY, JSON.stringify(data));
}

function trackInteraction() {
  const evo = getEvolution();
  evo.interactions++;
  if (evo.interactions > 20) evo.level = 2;
  if (evo.interactions > 60) evo.level = 3;
  saveEvolution(evo);
}

function detectWowInsights() {
  const total      = getTotalPortfolioValue();
  const txs        = getAllTransactions();
  const candidates = [];

  let topGain = null, topValue = 0;
  assets.forEach(a => {
    if (!a.costBasis) return;
    const pnl = a.qty * a.price - a.costBasis;
    if (pnl > topValue) { topValue = pnl; topGain = a; }
  });
  if (topGain && total > 0 && topValue > total * 0.3) {
    const pct = Math.round((topValue / total) * 100);
    const nk  = topGain.name.replace(/\s+/g, '_');
    candidates.push({
      id: `wow_growth_${nk}_${Math.floor(pct / 10) * 10}`,
      semanticKey: `${nk}_growth_driver`,
      topic: 'performance', priority: 1, score: pct,
      data: { name: escHtml(topGain.name), pct },
      build: (d, i) => buildInsightText('performance_growth_driver', d, i),
    });
  }

  const repeatedBuys = {};
  txs.forEach(tx => { if (tx.type === 'buy') repeatedBuys[tx.assetName] = (repeatedBuys[tx.assetName] || 0) + 1; });
  for (const name in repeatedBuys) {
    if (repeatedBuys[name] >= 4) {
      const cnt  = repeatedBuys[name];
      const aObj = assets.find(a => a.name === name);
      const gain = aObj && aObj.costBasis > 0
        ? Math.round(((aObj.qty * aObj.price - aObj.costBasis) / aObj.costBasis) * 100)
        : null;
      const nk = name.replace(/\s+/g, '_');
      candidates.push({
        id: `wow_buys_${nk}_${cnt}`,
        semanticKey: `${nk}_accumulation`,
        topic: 'activity', priority: 1, score: cnt * 10,
        data: { name: escHtml(name), count: cnt, gain },
        build: (d, i) => buildInsightText('activity_wow_buys', d, i),
      });
      break;
    }
  }

  if (assets.length >= 3) {
    let topAsset = null, topVal = 0;
    assets.forEach(a => { const v = a.qty * a.price; if (v > topVal) { topVal = v; topAsset = a; } });
    const topPct = total > 0 && topAsset ? Math.round((topVal / total) * 100) : 0;
    candidates.push({
      id: `wow_structure_${assets.length}_${Math.floor(topPct / 10) * 10}`,
      semanticKey: 'portfolio_structure',
      topic: 'distribution', priority: 2, score: topPct,
      data: { count: assets.length, name: topAsset ? escHtml(topAsset.name) : null, topPct },
      build: (d, i) => buildInsightText('distribution_structure', d, i),
    });
  }

  return candidates;
}

function getWowInsight() {
  return selectInsight(detectWowInsights());
}

async function generateInsights() {
  let marketInsight = null;
  try {
    const market      = await getMarketSignals();
    // PR-6: read from the canonical USD valuation so AI exposure/liquidity
    // ratios match the dashboard totals exactly (gold karat + FX applied).
    const total       = totalValueUSD();
    const cryptoValue = assets.filter(a => a.type === 'crypto').reduce((s, a) => s + assetValueUSD(a), 0);
    const cashValue   = assets.filter(a => a.type === 'cash').reduce((s, a) => s + assetValueUSD(a), 0);
    const topCrypto   = assets.filter(a => a.type === 'crypto').sort((a, b) => assetValueUSD(b) - assetValueUSD(a))[0];
    const portfolio   = {
      cryptoExposure: total > 0 ? (cryptoValue / total) * 100 : 0,
      liquidity:      total > 0 ? (cashValue   / total) * 100 : 0,
      topCryptoAsset: topCrypto ? topCrypto.name : null,
      lang,
    };
    const insight = generateInsight(market, portfolio);
    const message = insight?.message?.trim() ?? '';
    const validSeverities = new Set(['low', 'medium', 'high']);
    if (insight && message.length > 0 && insight.type && validSeverities.has(insight.severity)) {
      const mktId = 'market_' + insight.type;
      register(mktId);
      marketInsight = {
        id:        mktId,
        text,
        topic:     insight.type,
        priority:  insight.severity === 'high' ? 0 : insight.severity === 'medium' ? 1 : 2,
        createdAt: Date.now(),
      };
    }
  } catch (err) { console.error('[InsightEngine]', err); }

  buildUserProfile();
  buildIdentityProfile();
  analyzeBehavior();

  const VALID_TOPICS = new Set(['concentration', 'performance', 'activity', 'distribution', 'liquidity']);
  const decisionC    = generateDecisionInsight();
  const signatureC   = generateSignatureInsight();
  const allCandidates = [
    ...generateBaseInsights(),
    ...generateTemporalInsights(),
    ...generateBehaviorInsights(),
    ...(decisionC  ? [decisionC]  : []),
    ...detectNarrativePatterns(),
    ...(signatureC ? [signatureC] : []),
    ...detectWowInsights(),
  ].filter(c => c && c.build && VALID_TOPICS.has(c.topic));

  // Reduce to one candidate per semanticKey
  const bySemanticKey = new Map();
  for (const c of allCandidates) {
    const key = c.semanticKey || c.id;
    if (!bySemanticKey.has(key)) bySemanticKey.set(key, []);
    bySemanticKey.get(key).push(c);
  }

  const selected = [];
  for (const [, skCandidates] of bySemanticKey) {
    const insight = selectInsight(skCandidates);
    if (insight) selected.push(insight);
  }

  // Annotate with insight type and sort: unseen first, then priority, then score
  for (const i of selected) i.insightType = inferInsightType(i);
  selected.sort((a, b) => {
    const aSeen = wasRecentlyShown(a.text) ? 1 : 0;
    const bSeen = wasRecentlyShown(b.text) ? 1 : 0;
    if (aSeen !== bSeen) return aSeen - bSeen;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return b.score - a.score;
  });

  // Select top 5: 1 per insight type, max 2 per asset
  const FIVE_TYPES = ['performance', 'risk', 'decision', 'behavior', 'structure'];
  const typeGroups = {};
  for (const i of selected) {
    if (!typeGroups[i.insightType]) typeGroups[i.insightType] = [];
    typeGroups[i.insightType].push(i);
  }

  const usedSemantic = new Set();
  const assetCap     = {};
  const pool         = [];

  for (const type of FIVE_TYPES) {
    const group = typeGroups[type] || [];
    for (const candidate of group) {
      if (usedSemantic.has(candidate.semanticKey)) continue;
      const slug = candidate.assetSlug;
      if (slug && (assetCap[slug] || 0) >= 2) continue;
      pool.push(candidate);
      usedSemantic.add(candidate.semanticKey);
      if (slug) assetCap[slug] = (assetCap[slug] || 0) + 1;
      break;
    }
  }

  const ACTION_MAP = {
    performance:   { label: t('aiActionPerformance'),  type: 'view_performance'  },
    concentration: { label: t('aiActionDistribution'), type: 'view_distribution' },
    activity:      { label: t('aiActionActivity'),     type: 'view_activity'     },
    liquidity:     { label: t('aiActionLiquidity'),    type: 'view_liquidity'    },
  };

  const finalPool = pool.map(i => ({
    ...i,
    action: i.priority <= 1 && ACTION_MAP[i.topic] ? ACTION_MAP[i.topic] : undefined,
  }));

  insightCache = finalPool.length ? finalPool : getAmbientMessages().map(i => ({ ...i, topic: 'ambient' }));

  try {
    if (marketInsight !== null) {
      const sig       = createInsightSignature(marketInsight);
      const now       = Date.now();
      const duplicate = sig === lastInsightSignature && (now - lastInsightTimestamp) < INSIGHT_COOLDOWN;
      if (!insightCache.some(i => i.text === marketInsight.text) && !duplicate) {
        insightCache.unshift(marketInsight);
        lastInsightSignature = sig;
        lastInsightTimestamp = now;
      }
    }
  } catch (err) { console.error('[InsightDedup]', err); }

  return insightCache;
}

let _insightIndex = 0;


// =====================================
// AURIX — FINAL MONSTER ENGINE (CLEAN)
// =====================================

let orbColor    = { r: 147, g: 112, b: 219 };
let targetColor = { r: 147, g: 112, b: 219 };

const monsterState = {
  x: 0, y: 0, tx: 0, ty: 0,
  scale: 1, targetScale: 1,
  glow: 0.5, targetGlow: 0.5,
  wobbleAmp: 1, targetWobbleAmp: 1,
  pulseFreq: 1, targetPulseFreq: 1,
  hovered: false,
};

function updateTarget(x, y) {
  monsterState.tx = (x / window.innerWidth - 0.5) * 20;
  monsterState.ty = (y / window.innerHeight - 0.5) * 20;
}

window.addEventListener("mousemove", (e) => {
  updateTarget(e.clientX, e.clientY);
});

window.addEventListener("touchmove", (e) => {
  if (!e.touches || !e.touches[0]) return;
  updateTarget(e.touches[0].clientX, e.touches[0].clientY);
}, { passive: true });

let _hoverListenerAdded = false;

function monsterLoop() {
  const orb = document.querySelector(".monster-orb");

  if (!orb) {
    requestAnimationFrame(monsterLoop);
    return;
  }

  if (!_hoverListenerAdded) {
    orb.addEventListener('mouseenter', () => { monsterState.hovered = true; });
    orb.addEventListener('mouseleave', () => { monsterState.hovered = false; });
    _hoverListenerAdded = true;
  }

  const t  = Date.now() / 1000;
  const lf = 0.025;

  monsterState.glow      += (monsterState.targetGlow      - monsterState.glow)      * lf;
  monsterState.wobbleAmp += (monsterState.targetWobbleAmp - monsterState.wobbleAmp) * lf;
  monsterState.pulseFreq += (monsterState.targetPulseFreq - monsterState.pulseFreq) * lf;

  orbColor.r += (targetColor.r - orbColor.r) * 0.05;
  orbColor.g += (targetColor.g - orbColor.g) * 0.05;
  orbColor.b += (targetColor.b - orbColor.b) * 0.05;

  const w     = monsterState.wobbleAmp;
  const f     = monsterState.pulseFreq;
  const idleX = (Math.sin(t * 0.42 * f) * 3.5 + Math.cos(t * 0.27 * f) * 1.8) * w;
  const idleY = (Math.cos(t * 0.35 * f) * 3.0 + Math.sin(t * 0.19 * f) * 2.0) * w;

  monsterState.x     += ((monsterState.tx + idleX) - monsterState.x) * 0.06;
  monsterState.y     += ((monsterState.ty + idleY) - monsterState.y) * 0.06;
  monsterState.scale += (monsterState.targetScale - monsterState.scale) * 0.08;

  const deformX = 1 + Math.abs(monsterState.x) * 0.015;
  const deformY = 1 + Math.abs(monsterState.y) * 0.015;

  monsterState._breathTime = (monsterState._breathTime || 0) + 0.01;
  const _breathScale = 1 + Math.sin(monsterState._breathTime) * 0.02;
  const finalScaleX = deformX * _breathScale;
  const finalScaleY = deformY * _breathScale;

  orb.style.transform = `translate(${monsterState.x}px, ${monsterState.y}px) scale(${finalScaleX}, ${finalScaleY})`;

  // Dynamic color from PnL
  const pnl = getPortfolioPnL();
  if (pnl > 0) {
    targetColor.r = 80;  targetColor.g = 200; targetColor.b = 120;
  } else if (pnl < 0) {
    targetColor.r = 220; targetColor.g = 90;  targetColor.b = 60;
  } else {
    targetColor.r = 147; targetColor.g = 112; targetColor.b = 219;
  }

  const color      = `${Math.round(orbColor.r)},${Math.round(orbColor.g)},${Math.round(orbColor.b)}`;
  const hMult      = monsterState.hovered ? 1.4 : 1;
  const g          = monsterState.glow * hMult;
  const volatility = Math.min(Math.abs(pnl) / 50, 1);
  const intensity  = 0.15 + volatility * 0.2;
  const pulse      = Math.sin(t * 2) * 12;

  const r1 = Math.round(40 + g * 40 + pulse);
  const r2 = Math.round(80 + g * 80 + pulse * 1.5);
  const ri = Math.round(30 + g * 20);
  const a1 = +Math.min(intensity + g * 0.3, 0.9).toFixed(2);
  const a2 = +Math.min(intensity * 0.7 + g * 0.15, 0.6).toFixed(2);
  const ai = +(0.2 + g * 0.2).toFixed(2);
  orb.style.boxShadow = `0 0 ${r1}px rgba(${color},${a1}), 0 0 ${r2}px rgba(${color},${a2}), inset 0 0 ${ri}px rgba(${color},${ai})`;

  requestAnimationFrame(monsterLoop);
}

monsterLoop();

function monsterReact() {
  monsterState.targetScale = 1.06;

  setTimeout(() => {
    monsterState.targetScale = 1;
  }, 700);
}


function updateOrbState() {
  if (!currentMessage) return;
  const p = currentMessage.priority || 4;
  const t = currentMessage.topic   || '';

  const topicMap = {
    performance:   { glow: 0.6, wobble: 1.0, freq: 1.0 },
    concentration: { glow: 0.8, wobble: 0.6, freq: 1.1 },
    activity:      { glow: 0.5, wobble: 1.6, freq: 1.3 },
    liquidity:     { glow: 0.3, wobble: 0.8, freq: 0.8 },
    distribution:  { glow: 0.5, wobble: 1.0, freq: 1.0 },
    ambient:       { glow: 0.3, wobble: 1.0, freq: 0.9 },
  };
  const base = topicMap[t] || { glow: 0.5, wobble: 1.0, freq: 1.0 };

  const pMod = p === 1 ? 1.5 : p === 3 ? 0.7 : 1;

  monsterState.targetGlow      = Math.min(base.glow * pMod, 1);
  monsterState.targetWobbleAmp = base.wobble * (p === 1 ? 1.1 : p === 3 ? 0.85 : 1);
  monsterState.targetPulseFreq = base.freq   * (p === 1 ? 1.2 : p === 3 ? 0.80 : 1);
}



function getCurrentContext() {
  return currentTab || 'home';
}

function applyContext(el) {
  el.classList.remove('ctx-home', 'ctx-asset', 'ctx-insights', 'ctx-market');
  el.classList.add(`ctx-${getCurrentContext()}`);
}

function applyPnlToOrb() {}

function getContextTiming() {
  const ctx = getCurrentContext();
  if (ctx === 'insights') return 5000;
  if (ctx === 'asset')    return 7000;
  if (ctx === 'market')   return 9000;
  return 8000;
}

function handleMonsterAction(type) {
  const tabMap = {
    view_performance:  'home',
    view_distribution: 'home',
    view_activity:     'insights',
    view_liquidity:    'home',
  };
  const tab = tabMap[type];
  if (tab) switchTab(tab);
}

async function refillQueue() {
  if (_isRefilling) return;
  _isRefilling = true;
  try {
    const fresh    = await generateInsights();
    const filtered = fresh.filter(i => !recentIds.includes(i.id || i.text));
    messageQueue   = filtered.length ? filtered : (fresh.length ? fresh : messageQueue);
    queueIndex     = 0;
  } finally { _isRefilling = false; }
}

function fadeOutMessage(cb) {
  const el       = document.querySelector('.monster-line');
  const actionEl = document.getElementById('monsterAction');
  if (actionEl) { actionEl.classList.remove('visible'); actionEl.textContent = ''; actionEl.onclick = null; }
  if (el) el.classList.remove('visible');
  setTimeout(cb, 400);
}

function fadeInMessage(msg) {
  const el       = document.querySelector('.monster-line');
  const actionEl = document.getElementById('monsterAction');
  if (!el) return;
  el.textContent = msg.text;
  void el.offsetWidth;
  el.classList.add('visible');
  currentMessage = msg;
  updateOrbState();
  monsterReact();
  if (msg.action && actionEl) {
    setTimeout(() => {
      actionEl.textContent = msg.action.label;
      actionEl.onclick = () => handleMonsterAction(msg.action.type);
      void actionEl.offsetWidth;
      actionEl.classList.add('visible');
    }, 800);
  }
}

function showNextMessage() {
  if (!messageQueue.length) return;
  if (queueIndex >= messageQueue.length) { queueIndex = 0; refillQueue(); }
  const next = messageQueue[queueIndex++];
  if (!next) return;
  const rid = next.id || next.text;
  recentIds.push(rid);
  if (recentIds.length > 10) recentIds.shift();
  fadeOutMessage(() => fadeInMessage(next));
}

function startInsightRotation() {
  const o = document.querySelector('.monster-orb');
  if (o) { applyContext(o); applyPnlToOrb(o); }
  if (_loopInterval) { clearInterval(_loopInterval); _loopInterval = null; }
  messageQueue = []; queueIndex = 0;
  refillQueue().then(() => {
    setTimeout(() => showNextMessage(), 800);
    _loopInterval = setInterval(() => showNextMessage(), 3000);
  });
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
  return `
    <div class="insights-screen">
      <div class="insights-hero">
        <div class="monster-container">
          <div class="monster-wrap">
            <div class="monster-orb">
              <div class="monster-core"></div>
            </div>
          </div>
        </div>
        <div class="monster-message" id="monsterMsg">
          <div class="monster-line"></div>
          <div class="monster-action" id="monsterAction"></div>
        </div>
      </div>
    </div>`;
}

// ── Market tab ─────────────────────────────────────────────
function resetMarketUIState() {
  _marketSearchQuery = '';
  const input = document.getElementById('marketSearchInput');
  if (input) input.value = '';
}

function renderMarket() {
  resetMarketUIState();
  const container = document.getElementById('tabPlaceholder');
  if (!container) return;
  container.innerHTML = `
    <div class="market-screen">
      <div class="market-header">
        <div class="market-title">${t('tabMarket')}</div>
        <div class="market-subtitle">${t('market_subtitle')}</div>
      </div>
      <div class="market-search-wrap">
        <svg class="market-search-icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4.6-4.6"/></svg>
        <input
          type="text"
          id="marketSearchInput"
          placeholder="${t('market_search_ph')}"
          autocomplete="off"
          spellcheck="false"
        />
      </div>
      <div class="market-tabs">
        <button class="market-tab ${currentMarketTab==='watchlist'?'active':''}" data-market="watchlist">${t('tab_watchlist')}</button>
        <button class="market-tab ${currentMarketTab==='all'?'active':''}" data-market="all">${t('tab_all')}</button>
        <button class="market-tab ${currentMarketTab==='crypto'?'active':''}" data-market="crypto">${t('tab_crypto')}</button>
        <button class="market-tab ${currentMarketTab==='stocks'?'active':''}" data-market="stocks">${t('tab_stocks')}</button>
        <button class="market-tab ${currentMarketTab==='etfs'?'active':''}" data-market="etfs">${t('tab_etfs')}</button>
        <button class="market-tab ${currentMarketTab==='indices'?'active':''}" data-market="indices">${t('tab_indices')}</button>
        <button class="market-tab ${currentMarketTab==='commodities'?'active':''}" data-market="commodities">${t('tab_commodities')}</button>
      </div>
      <div class="market-body">
        <div class="market-main">
          <div id="marketList" class="market-section"></div>
        </div>
      </div>
    </div>
  `;
  // Preserve currentMarketTab across re-renders (e.g. language switch)
  if (!currentMarketTab) currentMarketTab = 'crypto';
  updateMarketTabUI();
  updateMarketHeader();
  initMarketTabs();
  initMarketSearch();
  // Event delegation for star toggles — set once, covers all dynamic rows
  const screen = container.querySelector('.market-screen');
  if (screen) {
    screen.addEventListener('click', e => {
      const btn = e.target.closest('.watchlist-btn');
      if (!btn) return;
      e.stopPropagation();
      const sym     = btn.dataset.symbol;
      const isAdded = toggleWatchlist(sym);
      document.querySelectorAll(`.watchlist-btn[data-symbol="${sym}"]`).forEach(b => {
        b.textContent = isAdded ? '★' : '☆';
        b.classList.toggle('active', isAdded);
      });
      renderCurrentMarketView();
    });
  }
  ensureMarketData();
  prefetchAllMarkets();
  if (_marketInterval) clearInterval(_marketInterval);
  _marketInterval = setInterval(() => refreshMarketInBackground(currentMarketTab), 30000);
}

function _findMktItem(sym, data) {
  const norm = normalizeSymbol(sym);
  return data.find(d => normalizeSymbol(d.symbol) === norm) || null;
}

function generateMarketInsights(data) {
  const insights = [];
  const tab = currentMarketTab;

  if (tab === 'crypto' || tab === 'indices' || !tab) {
    const btc = _findMktItem('BTC', data);
    const eth = _findMktItem('ETH', data);
    const btcChg = btc?.change24h ?? btc?.change ?? null;
    const ethChg = eth?.change24h ?? eth?.change ?? null;
    if (btcChg !== null && btcChg > 0.8)
      insights.push({ type: 'bullish', text: 'Crypto showing strength',
        signal: 'Momentum building — watch BTC breakout' });
    else if (btcChg !== null && btcChg < -0.8)
      insights.push({ type: 'bearish', text: 'Crypto under pressure',
        signal: 'Watch for support levels — volatility elevated' });
    if (ethChg !== null && btcChg !== null && Math.abs(ethChg - btcChg) > 2)
      insights.push({ type: 'neutral', text: 'Altcoin divergence detected',
        signal: 'ETH moving independently from BTC — watch spreads' });
  }

  if (tab === 'stocks' || tab === 'indices' || !tab) {
    const spy = _findMktItem('SPY', data);
    const spyChg = spy?.change24h ?? spy?.change ?? null;
    if (spyChg !== null && spyChg > 0.5)
      insights.push({ type: 'bullish', text: 'Equities rallying',
        signal: 'Broad market strength — risk-on momentum' });
    else if (spyChg !== null && spyChg < -0.5)
      insights.push({ type: 'bearish', text: 'Equities under pressure',
        signal: 'Risk-off sentiment — watch defensive assets' });
  }

  if (tab === 'commodities' || !tab) {
    const gold = _findMktItem('XAUUSD', data);
    const goldChg = gold?.change24h ?? gold?.change ?? null;
    if (goldChg !== null && goldChg > 0.5)
      insights.push({ type: 'neutral', text: 'Gold rising',
        signal: 'Possible hedge demand increasing — risk-off signal' });
    else if (goldChg !== null && goldChg < -0.5)
      insights.push({ type: 'neutral', text: 'Gold falling',
        signal: 'Risk-on mood — capital rotating to equities' });
  }

  if (tab === 'etfs') {
    const qqq = _findMktItem('QQQ', data);
    const qqqChg = qqq?.change24h ?? qqq?.change ?? null;
    if (qqqChg !== null && qqqChg > 0.8)
      insights.push({ type: 'bullish', text: 'Tech ETFs outperforming',
        signal: 'Growth momentum — watch mega-cap tech' });
    else if (qqqChg !== null && qqqChg < -0.5)
      insights.push({ type: 'bearish', text: 'Tech ETFs selling off',
        signal: 'Tech rotation underway — watch value vs growth' });
  }

  return insights.slice(0, 3);
}

function renderMarketInsights(data) {
  const el = document.getElementById('marketInsights');
  if (!el) return;
  const insights = generateMarketInsights(data);
  if (!insights.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="insight-row">${
    insights.map(i => `
      <div class="insight ${i.type}">
        <span class="insight-text">${i.text}</span>
        ${i.signal ? `<span class="insight-signal">${i.signal}</span>` : ''}
      </div>`).join('')
  }</div>`;
  el.querySelectorAll('.insight').forEach(pill => {
    pill.addEventListener('click', () => pill.classList.toggle('active'));
  });
}

function renderMarketTickerStrip(data) {
  const el = document.getElementById('marketTickerStrip');
  if (!el || !data.length) return;
  const picks = ['BTC', 'ETH', 'SPY', 'XAUUSD']
    .map(sym => data.find(d => normalizeSymbol(d.symbol) === normalizeSymbol(sym)))
    .filter(Boolean);
  if (!picks.length) return;
  el.innerHTML = picks.map(item => {
    const chg = item.change24h ?? item.change ?? null;
    if (chg === null) return `<span>${item.symbol}</span>`;
    const cls  = chg >= 0 ? 't-up' : 't-down';
    const sign = chg >= 0 ? '+' : '';
    return `${item.symbol}&nbsp;<span class="${cls}">${sign}${chg.toFixed(1)}%</span>`;
  }).join('&ensp;·&ensp;');
}

function renderMyAssetsBlock(data) {
  const watchedSet = new Set(getWatchlist().map(normalizeSymbol));
  const filtered = data.filter(item =>
    watchedSet.has(normalizeSymbol(item.symbol || item.provider_id))
  );
  if (!filtered.length) {
    return `<div class="empty-watchlist">${t('empty_watchlist')}</div>`;
  }
  const sorted = [...filtered].sort((a, b) => {
    if (a.change24h == null && b.change24h != null) return 1;
    if (a.change24h != null && b.change24h == null) return -1;
    const changeA = Math.abs(a.change24h || 0);
    const changeB = Math.abs(b.change24h || 0);
    if (changeB !== changeA) return changeB - changeA;
    if (b.price !== a.price) return (b.price || 0) - (a.price || 0);
    return a.symbol.localeCompare(b.symbol);
  });
  const tableHeader = `<div class="market-table-header"><div>${t('marketColAsset')}</div><div>${t('marketColPrice')}</div><div>${t('marketCol24h')}</div><div></div><div></div></div>`;
  return `<div class="market-section-header">${t('tab_watchlist')}</div>${tableHeader}${sorted.map(renderMarketItem).join('')}`;
}

function renderAllAssets(data) {
  const map = new Map();
  for (const item of data) {
    const key = normalizeSymbol(item.symbol || item.provider_id);
    if (key && !map.has(key)) map.set(key, item);
  }
  const final = Array.from(map.values());
  if (!final.length) {
    return `<div class="market-empty">${t('market_no_results')}</div>`;
  }
  const tableHeader = `<div class="market-table-header"><div>${t('marketColAsset')}</div><div>${t('marketColPrice')}</div><div>${t('marketCol24h')}</div><div></div><div></div></div>`;
  return `<div class="market-section-header">${t('tab_all')}</div>${tableHeader}${final.map(renderMarketItem).join('')}`;
}

function renderCurrentMarketView() {
  const el = document.getElementById('marketList');
  if (!el) return;

  if (!Array.isArray(MARKET_DATA)) return;

  const VALID_TABS = ['watchlist','all','crypto','stocks','etfs','indices','commodities'];
  if (!VALID_TABS.includes(currentMarketTab)) return;

  const data = Object.freeze([...MARKET_DATA]);

  let html;
  if (_marketSearchQuery) {
    const q = normalizeSymbol(_marketSearchQuery);
    const results = data.filter(item => {
      const sym  = normalizeSymbol(item.symbol);
      const name = (item.name || '').toLowerCase();
      return sym.includes(q) || name.includes(_marketSearchQuery);
    }).slice(0, 15);
    html = results.length
      ? results.map(renderMarketItem).join('')
      : `<div class="market-empty">${t('market_no_results')}</div>`;
  } else if (currentMarketTab === 'watchlist') {
    html = renderMyAssetsBlock(data);
  } else if (currentMarketTab === 'all') {
    html = renderAllAssets(data);
  } else {
    const activeType = _TAB_TO_TYPE[currentMarketTab];
    if (!activeType) return;
    html = renderFromCache(activeType, data);
  }

  const renderKey = `${currentMarketTab}|${_marketSearchQuery}|${html.length}`;
  if (el._lastKey === renderKey) return;
  el._lastKey = renderKey;
  el.innerHTML = html;
  renderFeaturedBlock(data);
  renderMarketTickerStrip(data);
  requestAnimationFrame(() => renderMarketInsights(data));
}

function initMarketSearch() {
  const input = document.getElementById('marketSearchInput');
  if (!input) return;
  input.addEventListener('input', e => {
    _marketSearchQuery = e.target.value.trim().toLowerCase();
    renderCurrentMarketView();
  });
}

function updateMarketHeader() {
  try {
    const config = MARKET_HEADER_CONFIG[currentMarketTab];
    if (!config) return;
    Object.entries(config).forEach(([id, fn]) => {
      const el = document.getElementById(id);
      if (!el) return;
      try {
        const newVal = fn();
        if (el.textContent === newVal) return;
        el.textContent = newVal;
        el.classList.remove('value-flash-up', 'value-flash-down');
        void el.offsetWidth;
        el.classList.add('value-flash-up');
      } catch (_) {}
    });
  } catch (_) {}
}

const _TYPE_LABEL = {
  crypto: () => t('tab_crypto'), stocks: () => t('tab_stocks'), stock: () => t('tab_stocks'),
  etfs: () => t('tab_etfs'), indices: () => t('tab_indices'), commodities: () => t('tab_commodities'),
};
const _TAB_TO_TYPE = { crypto: 'crypto', stocks: 'stock', etfs: 'etfs', indices: 'indices', commodities: 'commodities' };

function renderFromCache(type, data) {
  const normalizedType = String(type).toLowerCase().trim();
  const items = data.filter(d => String(d.type).toLowerCase().trim() === normalizedType);
  if (!items.length) {
    return `<div class="market-skeleton">${Array.from({ length: 8 }).map(() => `
      <div class="market-row skeleton">
        <div class="skeleton-circle"></div>
        <div class="skeleton-text"></div>
        <div class="skeleton-price"></div>
        <div class="skeleton-change"></div>
        <div class="skeleton-change"></div>
      </div>`).join('')}</div>`;
  }
  const label = _TYPE_LABEL[normalizedType]?.() ?? normalizedType;
  const tableHeader = `<div class="market-table-header"><div>${t('marketColAsset')}</div><div>${t('marketColPrice')}</div><div>${t('marketCol24h')}</div><div></div><div></div></div>`;
  return `<div class="market-section-header">${label}</div>${tableHeader}${items.map(renderMarketItem).join('')}`;
}

function ensureMarketData() {
  if (currentMarketTab === 'watchlist' || currentMarketTab === 'all') {
    renderCurrentMarketView();
    return;
  }
  if (MARKET_CACHE[currentMarketTab]) {
    MARKET_DATA = MARKET_CACHE[currentMarketTab];
    renderCurrentMarketView();
    return;
  }
  hydrateMarket(currentMarketTab);
}

// Instant render from cache/MARKET_DATA/fallback, then background refresh
function hydrateMarket(tab) {
  if (!document.getElementById('marketList')) return;
  if (tab === 'watchlist') { renderCurrentMarketView(); return; }
  if (tab === 'all')       { renderCurrentMarketView(); return; }
  const type = _TAB_TO_TYPE[tab];
  if (!type) return;

  // Use cached or already-loaded data for instant render
  const cached   = MARKET_CACHE[tab]; // simple array or undefined
  const inMemory = MARKET_DATA.filter(d => d.type?.toLowerCase() === type.toLowerCase());

  if (cached?.length) {
    MARKET_DATA = cached;
  } else if (inMemory.length) {
    // already in MARKET_DATA — nothing to set
  } else {
    // first ever load — use local fallback so UI is never blank
    const fb = _buildFallbackItems(tab);
    if (fb.length) _applyTypeItems(tab, fb);
  }

  renderCurrentMarketView();
  refreshMarketInBackground(tab);
}

// Apply normalized item array to MARKET_DATA for a given tab type
function _applyTypeItems(tab, items) {
  const type = _TAB_TO_TYPE[tab];
  if (!type) return;
  if (tab === 'crypto') {
    // crypto items arrive in CoinGecko raw format — use _setCryptoData
    _setCryptoData(items);
    return;
  }
  commitMarketData(type, items);
}

// Build local fallback items for any tab (synchronous, no network)
function _buildFallbackItems(tab) {
  if (tab === 'crypto')      return CRYPTO_FALLBACK; // CoinGecko raw format — _setCryptoData handles it
  if (tab === 'stocks') {
    const assetStocks = ASSET_DB.filter(a => a.type === 'stock');
    return assetStocks.map(a => {
      const sym = normalizeSymbol(a.marketSymbol || a.ticker);
      const fb  = getFallbackData(sym);
      return normalizeMarketData(
        fb ? { name: a.name, price: fb.price, percent_change_24h: fb.change24h, fallback: true } : { name: a.name },
        'stock', sym
      );
    });
  }
  if (tab === 'etfs')        return MARKET_ETFS.map(s => _buildItem(s, null, FALLBACK_PRICES, 'etfs'));
  if (tab === 'indices')     return MARKET_INDICES.map(s => _buildItem(s, null, INDEX_FALLBACKS, 'indices'));
  if (tab === 'commodities') return MARKET_COMMODITIES.map(s => _buildItem(s, null, COMMODITY_FALLBACKS, 'commodities'));
  return [];
}

const MARKET_CACHE_TTL = 60 * 1000; // 1 minute

// Background refresh per type — respects TTL, prevents concurrent calls
async function refreshMarketInBackground(tab) {
  if (_LOADING[tab]) return;
  const failAge = Date.now() - (MARKET_FAILURE_TS[tab] || 0);
  if (failAge < MARKET_FAILURE_BACKOFF) {
    if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.market.backoffActivations++;
    return;
  }
  const age = Date.now() - (MARKET_CACHE_TS[tab] || 0);
  if (MARKET_CACHE[tab]?.length && age < MARKET_CACHE_TTL) return;
  if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.market.refreshAttempts++;

  _LOADING[tab] = true;
  try {
    switch (tab) {
      case 'crypto':      await _refreshCrypto();      break;
      case 'stocks':      await _refreshStocks();      break;
      case 'etfs':        await _refreshGeneric(tab, MARKET_ETFS,        FALLBACK_PRICES,      'ETFs');       break;
      case 'indices':     await _refreshGeneric(tab, MARKET_INDICES,     INDEX_FALLBACKS,      'Índices');    break;
      case 'commodities': await _refreshGeneric(tab, MARKET_COMMODITIES, COMMODITY_FALLBACKS,  'Materias');   break;
    }
    MARKET_CACHE_TS[tab] = Date.now();
  } finally {
    _LOADING[tab] = false;
  }
}

async function _refreshCrypto() {
  const CRYPTO_IDS = [
    { id: 'bitcoin',              symbol: 'BTC',   name: 'Bitcoin'          },
    { id: 'ethereum',             symbol: 'ETH',   name: 'Ethereum'         },
    { id: 'tether',               symbol: 'USDT',  name: 'Tether'           },
    { id: 'binancecoin',          symbol: 'BNB',   name: 'BNB'              },
    { id: 'solana',               symbol: 'SOL',   name: 'Solana'           },
    { id: 'ripple',               symbol: 'XRP',   name: 'XRP'              },
    { id: 'usd-coin',             symbol: 'USDC',  name: 'USD Coin'         },
    { id: 'cardano',              symbol: 'ADA',   name: 'Cardano'          },
    { id: 'avalanche-2',          symbol: 'AVAX',  name: 'Avalanche'        },
    { id: 'dogecoin',             symbol: 'DOGE',  name: 'Dogecoin'         },
    { id: 'tron',                 symbol: 'TRX',   name: 'TRON'             },
    { id: 'polkadot',             symbol: 'DOT',   name: 'Polkadot'         },
    { id: 'chainlink',            symbol: 'LINK',  name: 'Chainlink'        },
    { id: 'matic-network',        symbol: 'MATIC', name: 'Polygon'          },
    { id: 'wrapped-bitcoin',      symbol: 'WBTC',  name: 'Wrapped Bitcoin'  },
    { id: 'shiba-inu',            symbol: 'SHIB',  name: 'Shiba Inu'        },
    { id: 'dai',                  symbol: 'DAI',   name: 'Dai'              },
    { id: 'litecoin',             symbol: 'LTC',   name: 'Litecoin'         },
    { id: 'bitcoin-cash',         symbol: 'BCH',   name: 'Bitcoin Cash'     },
    { id: 'uniswap',              symbol: 'UNI',   name: 'Uniswap'          },
    { id: 'stellar',              symbol: 'XLM',   name: 'Stellar'          },
    { id: 'cosmos',               symbol: 'ATOM',  name: 'Cosmos'           },
    { id: 'okb',                  symbol: 'OKB',   name: 'OKB'              },
    { id: 'monero',               symbol: 'XMR',   name: 'Monero'           },
    { id: 'ethereum-classic',     symbol: 'ETC',   name: 'Ethereum Classic' },
    { id: 'filecoin',             symbol: 'FIL',   name: 'Filecoin'         },
    { id: 'hedera-hashgraph',     symbol: 'HBAR',  name: 'Hedera'           },
    { id: 'internet-computer',    symbol: 'ICP',   name: 'Internet Computer'},
    { id: 'vechain',              symbol: 'VET',   name: 'VeChain'          },
    { id: 'aptos',                symbol: 'APT',   name: 'Aptos'            },
    { id: 'near',                 symbol: 'NEAR',  name: 'NEAR Protocol'    },
    { id: 'aave',                 symbol: 'AAVE',  name: 'Aave'             },
    { id: 'arbitrum',             symbol: 'ARB',   name: 'Arbitrum'         },
    { id: 'optimism',             symbol: 'OP',    name: 'Optimism'         },
    { id: 'algorand',             symbol: 'ALGO',  name: 'Algorand'         },
    { id: 'quant-network',        symbol: 'QNT',   name: 'Quant'            },
    { id: 'the-graph',            symbol: 'GRT',   name: 'The Graph'        },
    { id: 'injective-protocol',   symbol: 'INJ',   name: 'Injective'        },
    { id: 'fantom',               symbol: 'FTM',   name: 'Fantom'           },
    { id: 'immutable-x',          symbol: 'IMX',   name: 'Immutable'        },
    { id: 'theta-token',          symbol: 'THETA', name: 'Theta Network'    },
    { id: 'tezos',                symbol: 'XTZ',   name: 'Tezos'            },
    { id: 'flow',                 symbol: 'FLOW',  name: 'Flow'             },
    { id: 'the-sandbox',          symbol: 'SAND',  name: 'The Sandbox'      },
    { id: 'decentraland',         symbol: 'MANA',  name: 'Decentraland'     },
    { id: 'axie-infinity',        symbol: 'AXS',   name: 'Axie Infinity'    },
    { id: 'eos',                  symbol: 'EOS',   name: 'EOS'              },
    { id: 'neo',                  symbol: 'NEO',   name: 'NEO'              },
    { id: 'kucoin-shares',        symbol: 'KCS',   name: 'KuCoin Token'     },
    { id: 'maker',                symbol: 'MKR',   name: 'Maker'            },
    { id: 'pancakeswap-token',    symbol: 'CAKE',  name: 'PancakeSwap'      },
    { id: 'curve-dao-token',      symbol: 'CRV',   name: 'Curve DAO'        },
    { id: 'synthetix-network-token', symbol: 'SNX', name: 'Synthetix'       },
    { id: 'compound-governance-token', symbol: 'COMP', name: 'Compound'     },
    { id: 'chiliz',               symbol: 'CHZ',   name: 'Chiliz'           },
    { id: 'gala',                 symbol: 'GALA',  name: 'Gala'             },
    { id: 'enjincoin',            symbol: 'ENJ',   name: 'Enjin Coin'       },
    { id: '1inch',                symbol: '1INCH', name: '1inch'            },
    { id: 'loopring',             symbol: 'LRC',   name: 'Loopring'         },
    { id: 'basic-attention-token', symbol: 'BAT',  name: 'Basic Attention'  },
    { id: 'zilliqa',              symbol: 'ZIL',   name: 'Zilliqa'          },
    { id: 'iota',                 symbol: 'MIOTA', name: 'IOTA'             },
    { id: 'dash',                 symbol: 'DASH',  name: 'Dash'             },
    { id: 'zcash',                symbol: 'ZEC',   name: 'Zcash'            },
    { id: 'waves',                symbol: 'WAVES', name: 'Waves'            },
    { id: 'decred',               symbol: 'DCR',   name: 'Decred'           },
    { id: 'nem',                  symbol: 'XEM',   name: 'NEM'              },
    { id: 'bitcoin-sv',           symbol: 'BSV',   name: 'Bitcoin SV'       },
    { id: 'ontology',             symbol: 'ONT',   name: 'Ontology'         },
    { id: 'qtum',                 symbol: 'QTUM',  name: 'Qtum'             },
    { id: 'icon',                 symbol: 'ICX',   name: 'ICON'             },
    { id: 'lisk',                 symbol: 'LSK',   name: 'Lisk'             },
    { id: 'nano',                 symbol: 'NANO',  name: 'Nano'             },
    { id: 'siacoin',              symbol: 'SC',    name: 'Siacoin'          },
    { id: 'storj',                symbol: 'STORJ', name: 'Storj'            },
    { id: 'ocean-protocol',       symbol: 'OCEAN', name: 'Ocean Protocol'   },
    { id: 'render-token',         symbol: 'RNDR',  name: 'Render'           },
    { id: 'sui',                  symbol: 'SUI',   name: 'Sui'              },
    { id: 'sei-network',          symbol: 'SEI',   name: 'Sei'              },
    { id: 'celestia',             symbol: 'TIA',   name: 'Celestia'         },
    { id: 'starknet',             symbol: 'STRK',  name: 'Starknet'         },
    { id: 'pyth-network',         symbol: 'PYTH',  name: 'Pyth Network'     },
    { id: 'jito-governance-token', symbol: 'JTO',  name: 'Jito'             },
    { id: 'wormhole',             symbol: 'W',     name: 'Wormhole'         },
    { id: 'jupiter-exchange-solana', symbol: 'JUP', name: 'Jupiter'         },
    { id: 'pendle',               symbol: 'PENDLE', name: 'Pendle'          },
    { id: 'floki',                symbol: 'FLOKI', name: 'FLOKI'            },
    { id: 'pepe',                 symbol: 'PEPE',  name: 'Pepe'             },
    { id: 'bonk',                 symbol: 'BONK',  name: 'Bonk'             },
    { id: 'dogwifcoin',           symbol: 'WIF',   name: 'dogwifhat'        },
    { id: 'mantra-dao',           symbol: 'OM',    name: 'MANTRA'           },
    { id: 'worldcoin-wld',        symbol: 'WLD',   name: 'Worldcoin'        },
    { id: 'blur',                 symbol: 'BLUR',  name: 'Blur'             },
    { id: 'dydx-chain',           symbol: 'DYDX',  name: 'dYdX'             },
    { id: 'gmx',                  symbol: 'GMX',   name: 'GMX'              },
    { id: 'rocket-pool',          symbol: 'RPL',   name: 'Rocket Pool'      },
    { id: 'lido-dao',             symbol: 'LDO',   name: 'Lido DAO'         },
    { id: 'frax-share',           symbol: 'FXS',   name: 'Frax Share'       },
    { id: 'convex-finance',       symbol: 'CVX',   name: 'Convex Finance'   },
    { id: 'yearn-finance',        symbol: 'YFI',   name: 'yearn.finance'    },
  ];
  await withMarketRefreshLock('crypto', async () => {
  const t0 = Date.now();
  try {
    const symbols = CRYPTO_IDS.map(c => c.symbol);
    const url     = `${PRICES_PROXY}/snapshot?symbols=${encodeURIComponent(symbols.join(','))}`;
    const res     = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const json     = await res.json();
    const priceBy  = new Map();
    for (const p of (json?.snapshot ?? [])) {
      if (p?.symbol && Number.isFinite(p.price)) priceBy.set(p.symbol, p);
    }
    const items = CRYPTO_IDS
      .map(c => {
        const hit = priceBy.get(c.symbol);
        if (!hit) return null;
        return {
          symbol:                      c.symbol,
          name:                        c.name,
          current_price:               hit.price,
          price_change_percentage_24h: hit.change24h ?? null,
          source:                      'coingecko',
        };
      })
      .filter(Boolean);

    if (!items.length) return;
    _setCryptoData(items);
    MARKET_RUNTIME.providers.coingecko = { successAt: Date.now(), latencyMs: Date.now() - t0, healthy: true };
    MARKET_RUNTIME.lastSuccessAt = Date.now();
    MARKET_RUNTIME.health = 'healthy';
    console.log(`[market-runtime] crypto refresh success ${Date.now() - t0}ms`);
    if (currentMarketTab === 'crypto' || currentMarketTab === 'watchlist' || currentMarketTab === 'all') renderCurrentMarketView();
  } catch (e) {
    MARKET_RUNTIME.providers.coingecko = { failureAt: Date.now(), healthy: false };
    MARKET_RUNTIME.lastFailureAt = Date.now();
    if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.market.refreshFailures++;
    console.error('[market-runtime] provider failure: coingecko', e.message);
  }
  });
}

async function _refreshStocks() {
  await withMarketRefreshLock('stocks', async () => {
  const t0 = Date.now();
  try {
    const url  = `${PRICES_PROXY}/snapshot?symbols=${encodeURIComponent(STOCKS_UNIVERSE.join(','))}`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`http_${res.status}`);
    const json = await res.json();
    const data = (json?.snapshot ?? [])
      .filter(p => Number.isFinite(p.price))
      .map(p => ({ symbol: p.symbol, name: p.symbol, price: p.price, change24h: p.change24h ?? null }));
    if (!data.length) {
      MARKET_FAILURE_TS['stocks'] = Date.now();
      console.warn(`[market-runtime] stocks empty payload — backoff ${MARKET_FAILURE_BACKOFF / 1000}s`);
      return;
    }
    _setStocksData(data);
    MARKET_CACHE['stocks'] = [...MARKET_DATA];
    MARKET_RUNTIME.providers.stocksApi = { successAt: Date.now(), latencyMs: Date.now() - t0, healthy: true };
    MARKET_RUNTIME.lastSuccessAt = Date.now();
    MARKET_RUNTIME.health = 'healthy';
    delete MARKET_FAILURE_TS['stocks'];
    console.log(`[market-runtime] stocks refresh success ${Date.now() - t0}ms`);
    if (currentMarketTab === 'stocks' || currentMarketTab === 'watchlist' || currentMarketTab === 'all') renderCurrentMarketView();
  } catch (e) {
    MARKET_RUNTIME.providers.stocksApi = { failureAt: Date.now(), healthy: false };
    MARKET_RUNTIME.lastFailureAt = Date.now();
    MARKET_FAILURE_TS['stocks'] = Date.now();
    if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.market.refreshFailures++;
    console.error('[market-runtime] provider failure: stocks-api', e.message);
  }
  });
}

async function _refreshGeneric(tab, symbols, fallbackMap, title) {
  const type = _TAB_TO_TYPE[tab];
  await withMarketRefreshLock(tab, async () => {
  const t0 = Date.now();
  try {
    // Single batched call replaces N× per-symbol POST fan-out.
    // On any failure → snapshotMap stays empty → _buildItem falls back via
    // getCachedPrice / getFallbackData / fallbackMap (existing chain).
    const snapshotMap = new Map();
    try {
      const url = `${PRICES_PROXY}/snapshot?symbols=${encodeURIComponent(symbols.join(','))}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const json = await res.json();
        for (const item of (json?.snapshot ?? [])) {
          if (item?.symbol && Number.isFinite(item.price)) {
            snapshotMap.set(item.symbol, item);
          }
        }
      }
    } catch (err) {
      console.log('[market-runtime] snapshot fetch failed for', tab, '·', err.message);
    }

    const results = symbols.map(symbol => {
      const hit  = snapshotMap.get(symbol);
      const data = hit ? { price: hit.price, previousClose: null } : null;
      return _buildItem(symbol, data, fallbackMap, type);
    });
    const safeResults = results.filter(item => item && item.symbol);
    if (commitMarketData(type, safeResults)) {
      _dedupeMarketData();
      MARKET_CACHE[tab] = [...MARKET_DATA];
      MARKET_RUNTIME.lastSuccessAt = Date.now();
      MARKET_RUNTIME.health = 'healthy';
      delete MARKET_FAILURE_TS[tab];
      console.log(`[market-runtime] ${tab} refresh success ${Date.now() - t0}ms`);
      if (currentMarketTab === tab || currentMarketTab === 'watchlist' || currentMarketTab === 'all') renderCurrentMarketView();
    } else {
      MARKET_FAILURE_TS[tab] = Date.now();
      console.warn(`[market-runtime] ${tab} produced no data — backoff ${MARKET_FAILURE_BACKOFF / 1000}s`);
    }
  } catch (e) {
    MARKET_RUNTIME.lastFailureAt = Date.now();
    MARKET_FAILURE_TS[tab] = Date.now();
    if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.market.refreshFailures++;
    console.error('[market-runtime] provider failure:', tab, e.message);
  }
  });
}

// Prefetch all non-active tabs in background after initial render
function prefetchAllMarkets() {
  const tabs = ['crypto', 'stocks', 'etfs', 'indices', 'commodities'];
  setTimeout(() => {
    tabs.filter(t => t !== currentMarketTab).forEach(t => refreshMarketInBackground(t));
  }, 500);
}

const _SNAPSHOT = [
  { symbol: 'BTC',    label: 'Bitcoin' },
  { symbol: 'ETH',    label: 'Ethereum' },
  { symbol: 'SPY',    label: 'S&P 500' },
  { symbol: 'XAUUSD', label: 'Gold' },
];

function renderFeaturedBlock(data) {
  const container = document.getElementById('marketFeatured');
  if (!container) return;
  const cards = _SNAPSHOT.map(({ symbol, label }) => {
    const item = data.find(d => normalizeSymbol(d.symbol) === normalizeSymbol(symbol));
    if (!item) return '';
    const chg = item.change24h ?? item.change ?? null;
    const cls = chg == null ? '' : chg >= 0 ? 'green' : 'red';
    return `<div class="featured-card">
      <div>${label}</div>
      <div>${safePrice(item.price)}</div>
      ${chg != null ? `<div class="${cls}">${safeChange(chg)}</div>` : ''}
    </div>`;
  }).filter(Boolean).join('');
  container.innerHTML = cards;
}

function initMarketTabs() {
  document.querySelectorAll('.market-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.dataset.market;
      if (!type || type === currentMarketTab) return;
      currentMarketTab = type;
      resetMarketUIState();
      updateMarketTabUI();
      updateMarketHeader();
      hydrateMarket(type);
    });
  });
}

function updateMarketTabUI() {
  document.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
  const active = document.querySelector(`.market-tab[data-market="${currentMarketTab}"]`);
  if (active) active.classList.add('active');
}

function renderMarketByType(type) {
  if (type === 'crypto')      { hydrateMarket('crypto');      return; }
  if (type === 'stocks')      { hydrateMarket('stocks');      return; }
  if (type === 'etfs')        { hydrateMarket('etfs');        return; }
  if (type === 'indices')     { hydrateMarket('indices');     return; }
  if (type === 'commodities') { hydrateMarket('commodities'); return; }
}


const MARKET_ETFS        = ['SPY','QQQ','VOO','VTI','URTH'];
const MARKET_INDICES     = ['^GSPC','^IXIC','^DJI'];
const MARKET_COMMODITIES = ['XAU/USD','XAG/USD','WTI'];
// Canonical live stock universe (resolved by the snapshot gateway registry).
const STOCKS_UNIVERSE = [
  'AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','JPM','V','WMT',
  'BRK.B','JNJ','PG','XOM','BAC','AVGO','COST','KO','MCD','NKE',
];
const INDEX_FALLBACKS    = { '^GSPC': 5300, '^IXIC': 18500, '^DJI': 42000 };
const COMMODITY_FALLBACKS = { 'XAU/USD': 2320, 'XAG/USD': 27, 'WTI': 80 };
const INDEX_NAMES        = { '^GSPC': 'S&P 500', '^IXIC': 'NASDAQ', '^DJI': 'Dow Jones' };
const COMMODITY_NAMES    = { 'XAU/USD': 'Gold', 'XAG/USD': 'Silver', 'WTI': 'Oil (WTI)' };

function _buildItem(symbol, data, fallbackMap, type) {
  const name = INDEX_NAMES[symbol] ?? COMMODITY_NAMES[symbol] ?? symbol;
  if (data?.price) {
    const norm = normalizeSymbol(symbol);
    _updatePriceCache({ symbol: norm, price: data.price, timestamp: Date.now(), source: 'twelve-data' });
    return normalizeMarketData({ name, price: data.price }, type, symbol);
  }
  const cached = getCachedPrice(symbol);
  if (cached) {
    if (typeof AURIX_TELEMETRY !== 'undefined') AURIX_TELEMETRY.market.staleFallbackUses++;
    return normalizeMarketData({ name, price: cached.price, fallback: true }, type, symbol);
  }
  const fb = getFallbackData(symbol) ?? { price: fallbackMap?.[symbol] ?? null, change24h: 0 };
  return normalizeMarketData(
    { name, price: fb.price, percent_change_24h: fb.change24h, fallback: true },
    type, symbol
  );
}

function loadStocks()      { hydrateMarket('stocks');      }
function loadETFs()        { hydrateMarket('etfs');        }
function loadIndices()     { hydrateMarket('indices');     }
function loadCommodities() { hydrateMarket('commodities'); }

async function loadMarketData() {
  ensureMarketData();
}

const CRYPTO_FALLBACK = [
  { symbol: 'BTC',  name: 'Bitcoin',   current_price: 97000,  price_change_percentage_24h: 1.2,  image: 'https://assets.coingecko.com/coins/images/1/thumb/bitcoin.png' },
  { symbol: 'ETH',  name: 'Ethereum',  current_price: 3400,   price_change_percentage_24h: 0.8,  image: 'https://assets.coingecko.com/coins/images/279/thumb/ethereum.png' },
  { symbol: 'USDT', name: 'Tether',    current_price: 1.00,   price_change_percentage_24h: 0.01, image: 'https://assets.coingecko.com/coins/images/325/thumb/Tether.png' },
  { symbol: 'BNB',  name: 'BNB',       current_price: 680,    price_change_percentage_24h: -0.5, image: 'https://assets.coingecko.com/coins/images/825/thumb/bnb-icon2_2x.png' },
  { symbol: 'SOL',  name: 'Solana',    current_price: 185,    price_change_percentage_24h: 2.1,  image: 'https://assets.coingecko.com/coins/images/4128/thumb/solana.png' },
  { symbol: 'XRP',  name: 'XRP',       current_price: 2.40,   price_change_percentage_24h: -1.3, image: 'https://assets.coingecko.com/coins/images/44/thumb/xrp-symbol-white-128.png' },
  { symbol: 'USDC', name: 'USD Coin',  current_price: 1.00,   price_change_percentage_24h: 0.00, image: 'https://assets.coingecko.com/coins/images/6319/thumb/usdc.png' },
  { symbol: 'ADA',  name: 'Cardano',   current_price: 0.92,   price_change_percentage_24h: 1.5,  image: 'https://assets.coingecko.com/coins/images/975/thumb/cardano.png' },
  { symbol: 'AVAX', name: 'Avalanche', current_price: 38,     price_change_percentage_24h: -0.9, image: 'https://assets.coingecko.com/coins/images/12559/thumb/Avalanche_Circle_RedWhite_Trans.png' },
  { symbol: 'DOGE', name: 'Dogecoin',  current_price: 0.19,   price_change_percentage_24h: 0.6,  image: 'https://assets.coingecko.com/coins/images/5/thumb/dogecoin.png' },
];

function generateSparkline(change) {
  const points = [];
  let value = 50;
  for (let i = 0; i < 20; i++) {
    value += (Math.random() - 0.5) * 5 + (change || 0) * 0.2;
    points.push(Math.max(5, Math.min(95, value)));
  }
  return points;
}

function renderSparkline(points, isUp = true) {
  const width = 80, height = 30;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * width;
    const y = height - (p / 100) * height;
    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const color = isUp ? '#00ff88' : '#ff4d4d';
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><path d="${path}" stroke="${color}" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function normalizeMarketData(raw, type, symbol) {
  const sym      = normalizeSymbol(symbol);
  const normType = String(type).toLowerCase();
  if (!raw) {
    return { symbol: sym, name: sym, price: null, change: null, change24h: null, type: normType, fallback: true };
  }
  const change = raw.percent_change_24h ?? raw.change24h ?? raw.change ?? null;
  return {
    symbol:   sym,
    name:     raw.name    || sym,
    price:    raw.price   ?? raw.close ?? null,
    change,
    change24h: change,
    type: normType,
    fallback: raw.fallback || false
  };
}

// ── Price Engine v2.2 — Consistency & Symbol Integrity ───────────────────────

const PROVIDER_WEIGHT = {
  binance:      1.0,
  coingecko:    0.7,
  twelve:       0.8,
  'stocks-api': 0.8,
  fallback:     0.3,
};

function normalizeTimestamp(ts) {
  return typeof ts === 'number' ? ts : Date.now();
}

function canonicalSymbol(symbol, type) {
  const s = normalizeSymbol(symbol);
  if (type === 'crypto') {
    const stripped = s.replace(/USDT$/, '').replace(/USD$/, '');
    return stripped || s; // guard: never return empty string
  }
  return s;
}

function normalizePriceItem(raw, source, type) {
  const symbol = canonicalSymbol(raw.symbol || raw.ticker, type);
  return {
    symbol,
    name:      raw.name || symbol,
    price:     Number(raw.price ?? raw.current_price ?? null),
    change24h: raw.change24h ?? raw.price_change_percentage_24h ?? null,
    timestamp: normalizeTimestamp(raw.timestamp),
    source,
    type,
    fallback:  !!raw.fallback,
  };
}

function isValidPrice(item, type) {
  if (!item) return false;
  if (typeof item.price !== 'number') return false;
  if (isNaN(item.price)) return false;
  if (item.price <= 0) return false;
  if (!isFinite(item.price)) return false;
  if (item.price > 1e9) return false;
  const maxAge = type === 'crypto' ? 15000 : 60000;
  if (Date.now() - item.timestamp > maxAge) return false;
  return true;
}

function filterStale(candidates, type) {
  const maxAge = type === 'crypto' ? 20000 : 60000;
  const now = Date.now();
  return candidates.filter(c => now - c.timestamp < maxAge);
}

function enforceTimeConsistency(candidates) {
  if (candidates.length < 2) return candidates;
  const timestamps = candidates.map(c => c.timestamp);
  const max = Math.max(...timestamps);
  const min = Math.min(...timestamps);
  if (max - min > 10000) {
    const recent = candidates.filter(c => c.timestamp > max - 5000);
    return recent.length ? recent : candidates;
  }
  return candidates;
}

function hasEnoughProviders(candidates) {
  const uniqueSources = new Set(candidates.map(c => c.source));
  return uniqueSources.size >= 2;
}

function getMaxDeviation(type) {
  return type === 'crypto' ? 0.25 : 0.05;
}

function removeOutliers(candidates, type) {
  if (candidates.length < 3) return candidates;
  const prices = candidates.map(c => c.price);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const maxDev = getMaxDeviation(type ?? candidates[0]?.type);
  return candidates.filter(c => Math.abs(c.price - avg) / avg < maxDev);
}

function computeConfidence(candidates) {
  if (candidates.length >= 3) return 0.9;
  if (candidates.length === 2) return 0.7;
  return 0.5;
}

function weightedMedian(candidates) {
  const expanded = [];
  for (const c of candidates) {
    const weight  = PROVIDER_WEIGHT[c.source] ?? 0.5;
    const repeats = Math.max(1, Math.round(weight * 10));
    for (let i = 0; i < repeats; i++) expanded.push(c.price);
  }
  expanded.sort((a, b) => a - b);
  return expanded[Math.floor(expanded.length / 2)];
}

function resolvePrice(candidates) {
  if (!candidates.length) return null;
  const sorted = [...candidates].sort((a, b) => {
    if (a.fallback && !b.fallback) return 1;
    if (!a.fallback && b.fallback) return -1;
    return b.timestamp - a.timestamp;
  });
  return sorted[0];
}

function resolveConsensusPrice(candidates) {
  if (!candidates.length) return null;
  const valid = candidates.filter(c => isValidPrice(c, c.type));
  if (!valid.length) return null;
  // Single-source: skip consensus, return best candidate directly
  if (!hasEnoughProviders(valid)) {
    return getBestCandidate(valid, valid[0]?.type ?? 'stock') ?? null;
  }
  const price = weightedMedian(valid);
  if (price <= 0 || !isFinite(price)) return null;
  return { ...valid[0], price, source: 'consensus', fallback: false, timestamp: Date.now() };
}

function getBestCandidate(candidates, type) {
  return [...candidates]
    .filter(c => isValidPrice(c, type))
    .sort((a, b) => (PROVIDER_WEIGHT[b.source] ?? 0.5) - (PROVIDER_WEIGHT[a.source] ?? 0.5))[0] ?? null;
}

function getCachedPrice(symbol) {
  const key   = normalizeSymbol(symbol);
  const entry = PRICE_CACHE[key];
  if (!entry) return null;
  const age = Date.now() - entry.timestamp;
  if (age > PRICE_CACHE_MAX_AGE) { delete PRICE_CACHE[key]; return null; }
  return {
    symbol:     key,
    price:      entry.price,
    timestamp:  entry.timestamp,
    source:     entry.source,
    confidence: age > 60000 ? 0.3 : (entry.confidence ?? 0.5),
    fallback:   true,
  };
}

function _updatePriceCache(item) {
  if (!(item.symbol && typeof item.price === 'number' && !isNaN(item.price) && item.price > 0 && isFinite(item.price))) return;
  const existing = PRICE_CACHE[item.symbol];
  if (existing && Math.abs(item.price - existing.price) / existing.price > 0.5) return; // >50% jump — suspicious
  PRICE_CACHE[item.symbol] = {
    price:      item.price,
    timestamp:  item.timestamp ?? Date.now(),
    source:     item.source ?? 'unknown',
    confidence: item.confidence ?? 0.5,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

function _setCryptoData(raw) {
  // Normalize all candidates from CoinGecko proxy
  const candidates = raw.map(c => normalizePriceItem(c, c.source ?? 'coingecko', 'crypto'));

  // Group by symbol — first item wins for name/change24h (primary source first)
  const bySymbol = new Map();
  for (const c of candidates) {
    if (!c.symbol) continue;
    if (!bySymbol.has(c.symbol)) bySymbol.set(c.symbol, { name: c.name, change24h: c.change24h, list: [] });
    bySymbol.get(c.symbol).list.push(c);
  }

  const cryptoItems = [];
  for (const [symbol, { name, change24h, list }] of bySymbol) {
    const valid    = list.filter(c => isValidPrice(c, 'crypto'));
    const pool     = valid.length ? valid : list;
    const fresh    = filterStale(pool, 'crypto');
    const safe     = fresh.length ? fresh : pool;
    const timely   = enforceTimeConsistency(safe);
    const usable   = timely.length ? timely : safe;
    const clean    = removeOutliers(usable, 'crypto');
    const resolved = resolveConsensusPrice(clean);

    let price;
    if (resolved) {
      price = resolved.price;
      _updatePriceCache({ symbol, price, timestamp: resolved.timestamp, source: resolved.source, confidence: computeConfidence(valid) });
    } else {
      const best = getBestCandidate(list, 'crypto');
      if (best) {
        price = best.price;
        _updatePriceCache({ symbol, price, timestamp: best.timestamp, source: best.source, confidence: 0.5 });
      } else {
        price = getCachedPrice(symbol)?.price ?? null;
      }
    }

    if (!isFinite(price) || price > 1e9) continue;
    const chg    = change24h ?? 0;
    const mdItem = {
      symbol,
      canonicalSymbol:             canonicalSymbol(symbol, 'crypto'),
      name,
      price,
      current_price:               price,
      change:                      chg,
      change24h:                   chg,
      price_change_percentage_24h: chg,
      type:                        'crypto',
      provider:                    'coingecko',
      confidence:                  computeConfidence(valid),
      timestamp:                   Date.now(),
    };
    if (_isValidMarketItem(mdItem)) cryptoItems.push(mdItem);
  }

  if (commitMarketData('crypto', cryptoItems)) {
    _dedupeMarketData();
    MARKET_CACHE['crypto'] = [...MARKET_DATA];
  }
}

function loadCrypto() {
  hydrateMarket('crypto');
}

function _setStocksData(data) {
  const candidates = data.map(item => normalizePriceItem(item, 'stocks-api', 'stock'));

  // Group by symbol — deduplicates and prepares for consensus
  const bySymbol = new Map();
  for (const c of candidates) {
    if (!c.symbol) continue;
    if (!bySymbol.has(c.symbol)) bySymbol.set(c.symbol, { name: c.name, change24h: c.change24h, list: [] });
    bySymbol.get(c.symbol).list.push(c);
  }

  const mapped = [];
  for (const [symbol, { name, change24h, list }] of bySymbol) {
    const valid    = list.filter(c => isValidPrice(c, 'stock'));
    const pool     = valid.length ? valid : list;
    const fresh    = filterStale(pool, 'stock');
    const safe     = fresh.length ? fresh : pool;
    const timely   = enforceTimeConsistency(safe);
    const usable   = timely.length ? timely : safe;
    const clean    = removeOutliers(usable, 'stock');
    const resolved = resolveConsensusPrice(clean);

    let price;
    if (resolved) {
      price = resolved.price;
      _updatePriceCache({ symbol, price, timestamp: resolved.timestamp, source: resolved.source, confidence: computeConfidence(valid) });
    } else {
      const best = getBestCandidate(list, 'stock');
      if (best) {
        price = best.price;
        _updatePriceCache({ symbol, price, timestamp: best.timestamp, source: best.source, confidence: 0.5 });
      } else {
        price = getCachedPrice(symbol)?.price ?? null;
      }
    }

    if (!isFinite(price) || price > 1e9) continue;
    const mdItem = {
      symbol,
      canonicalSymbol:             canonicalSymbol(symbol, 'stock'),
      name,
      price,
      current_price:               price,
      change24h:                   change24h ?? null,
      price_change_percentage_24h: change24h ?? null,
      type:                        'stock',
      provider:                    resolved?.source ?? 'stocks-api',
      confidence:                  computeConfidence(valid),
      timestamp:                   Date.now(),
    };
    if (_isValidMarketItem(mdItem)) mapped.push(mdItem);
  }

  if (commitMarketData('stock', mapped)) {
    _dedupeMarketData();
  }
}

const MARKET_STOCKS = ['AAPL','MSFT','NVDA','TSLA','AMZN','META','GOOGL','JPM','V','WMT'];


function renderMarketItem(item) {
  if (!item || !item.symbol) return '';
  const price   = item.current_price ?? item.price ?? null;
  const chg     = item.price_change_percentage_24h ?? item.change24h ?? item.change ?? null;
  const name    = item.name || item.symbol;
  const normSym = normalizeSymbol(item.symbol);
  const watched = isInWatchlist(normSym);
  const chart   = renderSparkline(generateSparkline(chg ?? 0), (chg ?? 0) >= 0);
  return `
    <div class="market-row" data-symbol="${normSym}">
      <div class="col col-asset">
        <div class="asset-wrapper">
          <div class="asset-icon">${item.symbol[0]}</div>
          <div class="asset-text">
            <div class="asset-symbol">${item.symbol}</div>
            <div class="asset-name">${name}</div>
          </div>
        </div>
      </div>
      <div class="col col-price">${safePrice(price)}</div>
      <div class="col col-change ${chg > 0 ? 'is-up' : chg < 0 ? 'is-down' : ''}">
        ${safeChange(chg)}
      </div>
      <div class="col col-chart">${chart}</div>
      <div class="col col-action">
        <button class="watchlist-btn ${watched ? 'active' : ''}" data-symbol="${normSym}">${watched ? '★' : '☆'}</button>
      </div>
    </div>
  `;
}

function safeNumber(val, fallback = '—') {
  return (typeof val === 'number' && !isNaN(val)) ? val : fallback;
}
function safePrice(val) {
  if (typeof val !== 'number' || isNaN(val)) return '—';
  // PR-7 hotfix C-1: market list / featured cards must honor the global
  // baseCurrency toggle. Value is USD-canonical (source: snapshot gateway);
  // route through toBase + dynamic symbol so EUR mode shows €, not mixed $.
  // fmtMktPrice precision behavior preserved (4-decimals for sub-$1 prices).
  const sym = baseCurrency === 'EUR' ? '€' : '$';
  return `${sym}${fmtMktPrice(toBase(val, 'USD'))}`;
}
function safeChange(val) {
  if (typeof val !== 'number' || isNaN(val)) return '—';
  return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
}

function fmtMktPrice(p) {
  if (!p || isNaN(p)) return '—';
  if (p < 1)    return p.toFixed(4);
  if (p < 1000) return p.toFixed(2);
  return p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Bottom nav ─────────────────────────────────────────────
const TAB_KEYS = { home: 'tabHome', insights: 'tabInsights', market: 'tabMarket', profile: 'tabProfile' };
const NAV_ORDER = ['home', 'market', 'search', 'profile', 'workspace'];

function enforceNavOrder() {
  const container = document.getElementById('bottomNav');
  if (!container) return;
  NAV_ORDER.forEach(tab => {
    const el = container.querySelector(`[data-tab="${tab}"]`);
    if (el) container.appendChild(el);
  });
}

function updateBottomNavActive() {
  document.querySelectorAll('#bottomNav .item[data-tab]').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === currentTab);
  });
  document.querySelectorAll('.header-tab[data-tab]').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === currentTab);
  });
  enforceNavOrder();
}

function switchView(view) {
  const hv = document.getElementById('hero-view');
  if (!hv) return;
  const isHero = view === 'hero';
  hv.hidden = !isHero;
  if (isHero) {
    document.body.classList.add('hero-active');
    window.startOrb?.();
  } else {
    document.body.classList.remove('hero-active');
    window.stopOrb?.();
  }
}

// Premium "coming soon" surface for the Metrics tab. Presentation only —
// no fetching, no live data. Communicates product vision while the real
// metrics module is being built.
function renderMetricsPlaceholder() {
  const features = [
    { glyph: '<rect x="4" y="4" width="5" height="5" rx="1"/><rect x="11" y="4" width="5" height="5" rx="1"/><rect x="18" y="4" width="2" height="5" rx="1"/><rect x="4" y="11" width="5" height="5" rx="1"/><rect x="11" y="11" width="5" height="5" rx="1"/><rect x="4" y="18" width="5" height="2" rx="1"/>' },
    { glyph: '<path d="M4 16l5-5 4 3 7-8"/><path d="M20 6v4h-4"/>' },
    { glyph: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18"/>' },
    { glyph: '<path d="M4 8h12"/><path d="M13 5l3 3-3 3"/><path d="M20 16H8"/><path d="M11 13l-3 3 3 3"/>' },
    { glyph: '<path d="M3 16l4-8 4 6 4-10 4 8 2-3"/>' },
    { glyph: '<path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/>' },
  ];
  const cards = features.map((f, i) => `
    <article class="metrics-feature-card">
      <div class="metrics-feature-glyph">
        <svg viewBox="0 0 24 24" aria-hidden="true">${f.glyph}</svg>
      </div>
      <h3 class="metrics-feature-title">${t('metrics_f' + (i + 1))}</h3>
      <p class="metrics-feature-desc">${t('metrics_f' + (i + 1) + '_desc')}</p>
    </article>
  `).join('');
  return `
    <section class="metrics-screen">
      <header class="metrics-hero">
        <span class="metrics-badge">
          <span class="metrics-badge-dot"></span>
          <span>${t('metrics_badge')}</span>
        </span>
        <h1 class="metrics-title">${t('metrics_title')}</h1>
        <p class="metrics-subtitle">${t('metrics_subtitle')}</p>
        <p class="metrics-microcopy">${t('metrics_microcopy')}</p>
      </header>
      <div class="metrics-feature-grid">${cards}</div>
    </section>
  `;
}

function switchTab(tab) {
  switchView('dashboard'); // always collapse hero when navigating
  currentTab = tab;
  if (_loopInterval)   { clearInterval(_loopInterval);   _loopInterval   = null; }
  if (_marketInterval) { clearInterval(_marketInterval); _marketInterval = null; }
  // AW-6.1: opt the workspace tab out of the .app shell constraints so the
  // grid can run full-bleed. Pure presentation toggle, no logic side-effects.
  document.body.classList.toggle('workspace-active', tab === 'workspace');
  const mainEl      = document.querySelector('main');
  const placeholder = document.getElementById('tabPlaceholder');
  const workspaceEl = document.getElementById('aurixWorkspace');
  if (tab === 'home') {
    mainEl.style.display      = '';
    placeholder.style.display = 'none';
    if (workspaceEl) workspaceEl.style.display = 'none';
    render();
    updateBottomNavActive();
  } else if (tab === 'workspace') {
    mainEl.style.display      = 'none';
    placeholder.style.display = 'none';
    if (workspaceEl) workspaceEl.style.display = '';
    renderWorkspace();
    updateBottomNavActive();
  } else {
    mainEl.style.display       = 'none';
    placeholder.style.display  = '';
    if (workspaceEl) workspaceEl.style.display = 'none';
    if (tab === 'insights') {
      placeholder.innerHTML = renderInsights();
      startInsightRotation();
    } else if (tab === 'market') {
      renderMarket();
    } else if (tab === 'profile') {
      placeholder.innerHTML = renderMetricsPlaceholder();
    } else {
      const _label = tab.charAt(0).toUpperCase() + tab.slice(1);
      placeholder.innerHTML = `<p class="placeholder-label">${_label}</p>`;
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
      btnAddCtxEl.textContent = (T[lang].addCtx || {})[activeCategory] || t('addCtxFallback');
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
    const rentLabel = t('rentSuffix');
    const bannerEl = document.createElement('div');
    bannerEl.className = 'rent-banner' + (totalRentBase > 0 ? '' : ' rent-banner--zero');
    bannerEl.innerHTML = totalRentBase > 0
      ? `<span class="rent-banner-label">${t('monthlyIncome')}</span>
         <span class="rent-banner-value">+${formatBase(totalRentBase)}${rentLabel}</span>`
      : `<span class="rent-banner-label">${t('monthlyIncome')}</span>
         <span class="rent-banner-zero">${t('noIncome')}</span>`;
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
      ? `<span class="asset-rent">+${formatDisplay(asset.rent, assetCurr)}${t('rentSuffix')}</span>`
      : '';

    const subLineHtml = isCash
      ? `<span class="units">${formatCurrency(asset.qty, assetCurr)} ${t('cashLabel')}</span>`
      : isRE
        ? `<span class="units">${assetCurr === 'EUR' ? '€' : '$'} ${assetCurr}</span>
           ${rentHtml}`
        : isGold
          ? `<span class="units">${qtyUnitStr}</span>
             <span class="price">${formatDisplay(asset.price, assetCurr)}${t('perTrOz')}${origHtml ? ` · ${origHtml}` : ''}</span>
             ${changeHtml}`
          : `<span class="units">${qtyUnitStr}</span>
             <span class="price">${formatDisplay(asset.price, assetCurr)}${t('perUnit')}${origHtml ? ` · ${origHtml}` : ''}</span>
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
        ? `${formatDisplay(asset.price, assetCurr)}${isGold ? t('perTrOz') : t('perUnit')}`
        : '';
      const darRentHtml = (isRE && asset.rent > 0)
        ? `<span class="dar-rent">+${formatDisplay(asset.rent, assetCurr)}${t('rentSuffix')}</span>`
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
  } catch {}
  _cgMap = {};
  return _cgMap;
}

async function _fetchLogoFromCG(sym) {
  if (sym in LOGO_CACHE) return LOGO_CACHE[sym];
  const lsKey  = `_logo_${sym}`;
  const cached = localStorage.getItem(lsKey);
  if (cached !== null) { LOGO_CACHE[sym] = cached || null; return LOGO_CACHE[sym]; }
  LOGO_CACHE[sym] = null;
  return null;
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

// ── Real-time API search (proxied via backend) ───────────────────────────
// Browser never talks to Yahoo or CORS proxies directly — backend forwards
// to Yahoo Finance and returns the already-shaped result set.
async function searchYahooFinance(query, signal) {
  const url = `${PRICES_PROXY.replace('/api/prices','')}/api/search/assets?q=${encodeURIComponent(query)}`;
  try {
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const json = await res.json();
    return Array.isArray(json?.results) ? json.results : null;
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    return null;
  }
}

// CoinGecko search removed — search limited to ASSET_DB
async function searchCoinGeckoAPI(_query, _signal) {
  return [];
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
    ? `<div class="suggestion-loading"><span class="sugg-dot-anim">···</span> ${t('searchLoading')}</div>`
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

  setLookupStatus('loading', t('lookupLoading'));

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
        // Gold: dedicated source chain (XAU/USD → GC=F → fallback) via snapshot
        price = await fetchGoldSpotPrice();
      } else {
        price = await resolveSymbolPrice(entry.marketSymbol);
        if (!price) {
          const fb = getFallbackData(entry.marketSymbol);
          price    = fb?.price ?? null;
        }
      }
    }

    if (price) {
      pendingPrice            = price;
      chipPriceEl.textContent = formatDisplay(price, 'USD');
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
      chipPriceEl.textContent = formatDisplay(fb.price, 'USD');
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

document.addEventListener('click', trackInteraction);

// Logo → home
document.addEventListener('click', (e) => {
  const logo = e.target.closest('#logoHome');
  if (!logo) return;
  if (typeof switchTab === 'function') switchTab('home');
});

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

  // Reset type toggle to "Activo"
  document.querySelectorAll('.type-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.type === 'asset')
  );

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
            const price = await resolveSymbolPrice(figiResult.symbol);
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
    previewTotal.textContent = formatDisplay(qty, rePendingCurrency);
    return;
  }
  // Manual ISIN mode: qty × manual price (if any), in selected manualCurrency
  if (isManualMode) {
    const price = parseLocalFloat(document.getElementById('manualPrice')?.value) || 0;
    previewTotal.textContent = formatDisplay(qty * price, manualCurrency);
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
  previewTotal.textContent = formatDisplay(value, 'USD');
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
    setLookupStatus('error', t('lookupError'));
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
  previewValueLeft.textContent = formatDisplay(assetNativeValue(remainingAsset), cur);
  reduceWarning.classList.toggle('visible', remaining === 0 && amount > 0);
}

reduceQtyInput.addEventListener('input', updateReducePreview);

reduceForm.addEventListener('submit', e => {
  e.preventDefault();
  const asset  = assets.find(a => a.id === reduceTargetId);
  if (!asset) return;

  const amount = parseLocalFloat(reduceQtyInput.value);
  if (isNaN(amount) || amount <= 0) {
    reduceError.textContent = t('errQtyPositive');
    return;
  }
  if (amount > asset.qty) {
    reduceError.textContent = t('cantExceed')(formatQty(asset.qty));
    return;
  }

  const remaining  = asset.qty - amount;
  const wasRemoved = remaining === 0;
  const reduceType = asset.type;
  // Tax-lot-ready ledger: record the sell at the current price.
  // Realized P&L uses blended avg cost (current accounting model) and is
  // added to a persistent realizedPnL field. Tax-lot methods (FIFO/LIFO)
  // can later consume the transactions[] array without schema changes.
  const avgCostPerUnit = (asset.costBasis && asset.qty > 0) ? asset.costBasis / asset.qty : 0;
  const currentPrice   = Number(asset.price);
  const realized       = (Number.isFinite(currentPrice) && currentPrice > 0)
    ? (currentPrice - avgCostPerUnit) * amount
    : 0;
  if (!Array.isArray(asset.transactions)) asset.transactions = [];
  asset.transactions.push({
    type:  'sell',
    qty:   amount,
    price: Number.isFinite(currentPrice) ? currentPrice : 0,
    ts:    Date.now(),
  });
  asset.realizedPnL = Number(asset.realizedPnL || 0) + (Number.isFinite(realized) ? realized : 0);
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
    addError.textContent = t('errQtyMustPositive');
    previewAddQtyTotal.textContent    = '—';
    previewAddValueTotal.textContent  = '—';
    return;
  }

  const newQty   = asset.qty + amount;
  const newAsset = { ...asset, qty: newQty };
  previewAddQtyTotal.textContent   = isCash
    ? formatCurrency(newQty, assetCurr)
    : isGold ? `${formatQty(newQty)} ${asset.goldUnit || 'g'}` : formatQty(newQty);
  previewAddValueTotal.textContent = formatDisplay(assetNativeValue(newAsset), assetCurr);
}

addQtyInput.addEventListener('input', updateAddPreview);

addForm.addEventListener('submit', e => {
  e.preventDefault();
  const asset = assets.find(a => a.id === addTargetId);
  if (!asset) return;

  const amount = parseLocalFloat(addQtyInput.value);
  if (isNaN(amount) || amount <= 0) {
    addError.textContent = t('errQtyPositive');
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
    errorEl.textContent = t('errQtyGtZero');
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
  // Propagate currency change to other surfaces that read baseCurrency at
  // render time (workspace summary cards, market list).
  if (currentTab === 'workspace' && typeof renderWorkspace === 'function') {
    renderWorkspace();
  } else if (currentTab === 'market' && typeof renderMarket === 'function') {
    renderMarket();
  }
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
  if (qty   <= 0) { alert(t('invalidQty'));   return false; }
  if (price <= 0) { alert(t('invalidPrice')); return false; }
  if (tx.type === 'sell') {
    const currentQty = asset.qty || 0;
    if (qty > currentQty) { alert(t('sellExceeds')(currentQty)); return false; }
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
      onPortfolioChange(true);
      const editedAssetId = _txAssetId;
      closeTxModal();
      openAssetDetailModal(editedAssetId);
    }
  } else {
    const addedAssetId = _txAssetId;
    addTransaction(_txAssetId, txTypeHidden.value, qty, price);
    render();
    onPortfolioChange(true);
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
      asset.price != null ? formatDisplay(asset.price, assetCurr) : '—';
  }

  // Total value
  const valueBase = assetNativeValue(asset);
  document.getElementById('adValue').textContent =
    valueBase != null ? formatDisplay(valueBase, assetCurr) : '—';
  document.getElementById('adValueLabel').textContent = t('adValueLabel');

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
  document.getElementById('adTxTitle').textContent = t('adTxLabel');
  addTxBtn.textContent = t('adAddBtn');

  if (isRE || isCash) {
    txSection.style.display = 'none';
  } else {
    txSection.style.display = '';
    const txs = asset.transactions || [];
    txList.dataset.assetId = assetId;
    if (!txs.length) {
      txList.innerHTML = `<div class="ad-tx-empty">${t('noTransactions')}</div>`;
    } else {
      txList.innerHTML = txs.map((tx, i) => {
        const date  = new Date(tx.ts).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
        const label = tx.type === 'buy' ? t('txTypeBuy') : t('txTypeSell');
        const cls   = tx.type === 'buy' ? 'tx-buy' : 'tx-sell';
        return `<div class="ad-tx-row">
          <span class="ad-tx-badge ${cls}">${label}</span>
          <div class="ad-tx-detail">
            <span class="ad-tx-qty">${formatQty(tx.qty)}</span>
            <span class="ad-tx-sub">@ ${formatCurrency(tx.price, assetCurr)} · ${date}</span>
          </div>
          <button class="ad-tx-edit"   data-index="${i}" title="${t('btnEditShort')}">✎</button>
          <button class="ad-tx-delete" data-index="${i}" title="${t('btnDeleteShort')}">✕</button>
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
    onPortfolioChange(true);
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
document.querySelector('.header-title')
  ?.addEventListener('click', () => { switchView('hero'); });

document.querySelectorAll('#bottomNav .item[data-tab]').forEach(el => {
  el.addEventListener('click', () => {
    const tab = el.dataset.tab;
    if (tab === 'search') { openModal(); return; }
    document.querySelectorAll('#bottomNav .item').forEach(i => i.classList.remove('active'));
    el.classList.add('active');
    switchTab(tab);
  });
});
document.querySelectorAll('.header-tab[data-tab]').forEach(el => {
  el.addEventListener('click', () => switchTab(el.dataset.tab));
});
document.getElementById('assetsBackBtn')
  ?.addEventListener('click', () => setActiveCategory(null));
btnAdd.addEventListener('click', openModal);
document.getElementById('headerSearch')?.addEventListener('click', openModal);
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

// ── Modal type toggle (Activo / Liquidez) ──────────────────
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (btn.dataset.type === 'liquidity') {
      closeModal();
      openLiquidityModal();
    }
  });
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

// ── Mobile portfolio slider ────────────────────────────────

function initMobileCharts() {
  const mCanvas = document.getElementById('portfolioChartMobile');
  if (mCanvas && !portfolioChartMobile) {
    portfolioChartMobile = new Chart(mCanvas.getContext('2d'), {
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
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
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
              // Asset-detail chart ticks: same canonical conversion as the
              // dashboard chart above. Series are USD-denominated.
              callback: v => formatDisplayShort(v, 'USD'),
            },
          },
        },
        animation: { duration: 800, easing: 'easeOutQuart' },
      },
    });
  }

  const dCanvas = document.getElementById('donutChartMobile');
  if (dCanvas && !donutChartMobile) {
    donutChartMobile = new Chart(dCanvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          hoverBackgroundColor: [],
          borderColor: '#1a1a1a',
          borderWidth: 2,
          hoverOffset: 12,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '70%',
        rotation: -90,
        layout: { padding: 6 },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        animation: { animateRotate: true, animateScale: false, duration: 900, easing: 'easeOutQuart' },
      },
    });
  }
}

function initMobileSlider() {
  const track = document.getElementById('mobileSliderTrack');
  if (!track) return;

  const container = document.getElementById('portfolioMobileSlider');
  const dots = document.querySelectorAll('.m-dot');

  const totalSlides = 2;
  const lastIndex   = totalSlides - 1;
  let currentIndex  = 0;

  const DISTANCE_THRESHOLD = 50;   // px  — minimum drag to count as swipe
  const VELOCITY_THRESHOLD = 0.3;  // px/ms — flick speed override

  // Gesture state
  let startX       = 0;
  let startY       = 0;
  let startTime    = 0;
  let isDragging   = false;
  let isHorizontal = null;
  let slideW       = 0;  // container width captured on touchstart

  function goTo(idx) {
    currentIndex = Math.max(0, Math.min(idx, lastIndex));
    track.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
    track.style.transform  = `translateX(${-(currentIndex * slideW)}px)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
  }

  track.addEventListener('touchstart', e => {
    const t = e.touches[0];
    startX    = t.clientX;
    startY    = t.clientY;
    startTime = Date.now();
    isDragging   = true;
    isHorizontal = null;
    slideW = container.offsetWidth;
    track.style.transition = 'none';
  }, { passive: true });

  // non-passive — preventDefault() needed to block scroll on horizontal swipe
  track.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const t  = e.touches[0];
    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    if (isHorizontal === null) {
      isHorizontal = Math.abs(dx) > Math.abs(dy);
    }
    if (!isHorizontal) return;

    e.preventDefault(); // block page scroll — horizontal gesture confirmed

    // Edge resistance: pulling beyond first/last slide feels weighted
    let effectiveDx = dx;
    if (currentIndex === 0        && dx > 0) effectiveDx *= 0.35;
    if (currentIndex === lastIndex && dx < 0) effectiveDx *= 0.35;

    track.style.transform = `translateX(${-(currentIndex * slideW) + effectiveDx}px)`;
  }, { passive: false });

  track.addEventListener('touchend', e => {
    if (!isDragging) return;
    isDragging   = false;
    isHorizontal = null;

    const dx       = e.changedTouches[0].clientX - startX;
    const dt       = Date.now() - startTime;
    const velocity = dx / dt; // px/ms

    let nextIndex = currentIndex;
    if (Math.abs(dx) > DISTANCE_THRESHOLD || Math.abs(velocity) > VELOCITY_THRESHOLD) {
      if (dx < 0) nextIndex++;
      else        nextIndex--;
    }

    goTo(nextIndex);
  }, { passive: true });
}

// ── Init ───────────────────────────────────────────────────
// Apply saved base currency to menu toggle
document.querySelectorAll('.menu-curr-btn')
  .forEach(b => b.classList.toggle('active', b.dataset.currency === baseCurrency));

// Set initial perf-toggle currency button label to match base currency
const _perfCurrBtn = document.getElementById('perfCurrBtn');
if (_perfCurrBtn) _perfCurrBtn.textContent = baseCurrency === 'EUR' ? '€' : '$';

document.getElementById('appRoot').style.opacity = '0';

(async () => {
  if (window.__APP_BOOTED__) return;
  window.__APP_BOOTED__ = true;

  try {
    const session = await waitForSession();

    if (!session) {
      if (!window.location.pathname.includes('login.html')) {
        safeRedirect('login.html');
      }
      return;
    }

    currentUser = session.user;
    if (IS_DEV) console.log('[AUTH] session restored:', currentUser?.email);

    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname);
    }

    const portfolioData = await initPortfolioData(currentUser.id);
    assets = convertFromNewToFlat(portfolioData.assets, portfolioData.holdings);
    if (portfolioData.assets.length > 0) {
      saveData({ assets: portfolioData.assets, holdings: portfolioData.holdings });
    }

    document.getElementById('appRoot').style.opacity = '';
    render(true);
    const loader = document.getElementById('bootLoader');
    if (loader) {
      loader.style.opacity = '0';
      setTimeout(() => loader.remove(), 200);
    }
  } catch (e) {
    console.error('[BOOT ERROR]', e);
    if (!window.location.pathname.includes('login.html')) {
      safeRedirect('login.html');
    }
  }
})();

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

if (window.innerWidth <= 768) {
  initMobileCharts();
  updateChart();   // sync mobile chart after instance created
  updateDonut();   // sync mobile donut after instance created
  initMobileSlider();
}

fetchExchangeRate().then(() => {
  render();
  // Cold-start: populate derived state + formula cache from localStorage assets
  // so the workspace shows real values before refreshPrices completes.
  recomputeDerivedFinancialState('cold-start');
  recomputeFinancialFormulas('cold-start');
  updateChart();
  updateDonut();
});

refreshPrices().then(() => marketStore.start());
setInterval(() => refreshPrices().then(() => marketStore.syncFromRefresh()), 30_000);  // 30 s

// FC-7: portfolio reactive subscriber
const unsubscribePortfolioReactive = MARKET_EVENTS.subscribe('market:update', handleReactivePortfolioUpdate);

// FC-9: derived state invalidation subscriber — lazy mark, no recompute here.
// Recomputation is owned by the reactive refresh path (post-render).
const unsubscribeDerivedInvalidate = MARKET_EVENTS.subscribe('market:update', () => {
  invalidateDerivedFinancialState('market-update');
});

// AW-2 / AW-8: workspace reactive subscriber.
// AW-2 originally marked stale only, deferring recompute to the FC-10
// cascade. AW-8 broke that assumption: workspace formulas can reference
// market symbols (=PRICE("BTC")) that the user does NOT hold in the
// portfolio, in which case the FC cascade never fires (it gates on
// doesMarketEventAffectPortfolio). To honour the AW-8 reactive contract
// — "BTC updates → =PRICE('BTC') recomputes" — the subscriber now also
// drives recalculateWorkspaceSheet directly. Recalc itself is selective
// and graph-driven (AW-7.5), so this is no longer "heavy" work.
const unsubscribeWorkspaceReactive = MARKET_EVENTS.subscribe('market:update', () => {
  WORKSPACE_RUNTIME.stale = true;
  if (!WORKSPACE_RUNTIME.initialized) return;
  try {
    recalculateWorkspaceSheet(WORKSPACE_RUNTIME.activeSheetId);
    if (typeof currentTab !== 'undefined' && currentTab === 'workspace' &&
        typeof renderWorkspace === 'function') {
      renderWorkspace();
    }
  } catch (e) {
    console.error('[workspace-reactive] recalc failed:', e?.message);
  }
});

// ── PR-8D: Workspace UX fundamentals ─────────────────────────────────────────
// Copy/paste (TSV via navigator.clipboard), undo/redo (bounded history ring),
// click+drag multi-cell selection, and per-cell format shortcuts. All state
// lives in _AW8D so the existing WORKSPACE_RUNTIME shape stays untouched.
// Persistence round-trips the new `cell.format` field; older payloads ignore
// it without breaking (additive schema, no version bump).

const _AW8D = {
  history:  { stack: [], index: -1, max: 50 },
  selection: { startId: null, endId: null },
  isDraggingSelection: false,
};

function _aw8dCellsInRect(startId, endId) {
  if (!startId || !endId) return [];
  const cols = WORKSPACE_RUNTIME.gridColumns;
  const m1 = String(startId).match(/^([A-Z]+)(\d+)$/);
  const m2 = String(endId).match(/^([A-Z]+)(\d+)$/);
  if (!m1 || !m2) return [];
  const ci1 = cols.indexOf(m1[1]), ci2 = cols.indexOf(m2[1]);
  if (ci1 < 0 || ci2 < 0) return [];
  const r1 = +m1[2], r2 = +m2[2];
  const cMin = Math.min(ci1, ci2), cMax = Math.max(ci1, ci2);
  const rMin = Math.min(r1, r2),  rMax = Math.max(r1, r2);
  const ids = [];
  for (let r = rMin; r <= rMax; r++) {
    for (let c = cMin; c <= cMax; c++) ids.push(cols[c] + r);
  }
  return ids;
}

function _aw8dCurrentSelection() {
  const sel = _AW8D.selection;
  if (sel.startId && sel.endId) {
    const ids = _aw8dCellsInRect(sel.startId, sel.endId);
    if (ids.length > 0) return ids;
  }
  return WORKSPACE_RUNTIME.activeCellId ? [WORKSPACE_RUNTIME.activeCellId] : [];
}

function _aw8dUpdateSelectionStyle() {
  const ids = new Set(_aw8dCellsInRect(_AW8D.selection.startId, _AW8D.selection.endId));
  // Inline outline so we don't depend on CSS authoring; reset cleanly when
  // the cell leaves the rectangle.
  document.querySelectorAll('[data-cell-id]').forEach(el => {
    if (ids.size > 1 && ids.has(el.dataset.cellId)) {
      el.style.outline = '1px solid rgba(63, 191, 127, 0.6)';
      el.style.outlineOffset = '-1px';
    } else if (el.style.outline && el.style.outline.includes('63, 191, 127')) {
      el.style.outline = '';
      el.style.outlineOffset = '';
    }
  });
}

// ── History (undo / redo) ────────────────────────────────────────────────────
function _aw8dRecordHistory() {
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return;
  const snap = serializeWorkspaceUserCells(sheet);
  const snapStr = JSON.stringify(snap);
  const last = _AW8D.history.index >= 0 ? _AW8D.history.stack[_AW8D.history.index] : null;
  if (last != null && JSON.stringify(last) === snapStr) return;
  // Truncate any forward (redo) branch before recording the new state.
  _AW8D.history.stack.length = _AW8D.history.index + 1;
  _AW8D.history.stack.push(snap);
  if (_AW8D.history.stack.length > _AW8D.history.max) {
    _AW8D.history.stack.shift();
  } else {
    _AW8D.history.index++;
  }
}

function _aw8dApplyHistorySnapshot(snap) {
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return;
  // Wipe non-readonly cells; system seeds (B1/B2/B3) preserved by the
  // readonly check.
  for (const id of [...sheet.cells.keys()]) {
    const c = sheet.cells.get(id);
    if (c && !c.readonly) sheet.cells.delete(id);
  }
  mergeWorkspaceUserCells(sheet, snap);
  // Rebuild dependency edges for any restored user formulas.
  for (const [id, cell] of sheet.cells) {
    if (cell.type === 'formula' && cell.formula && !cell.readonly) {
      const parsed = parseWorkspaceFormula(cell.formula);
      _setCellDependencies(id, _extractFormulaDependencies(parsed));
    }
  }
  recalculateWorkspaceSheet(WORKSPACE_RUNTIME.activeSheetId);
  if (typeof renderWorkspace === 'function') renderWorkspace();
}

function _aw8dUndo() {
  if (_AW8D.history.index <= 0) return false;
  _AW8D.history.index--;
  _aw8dApplyHistorySnapshot(_AW8D.history.stack[_AW8D.history.index]);
  return true;
}

function _aw8dRedo() {
  if (_AW8D.history.index >= _AW8D.history.stack.length - 1) return false;
  _AW8D.history.index++;
  _aw8dApplyHistorySnapshot(_AW8D.history.stack[_AW8D.history.index]);
  return true;
}

// History records after every persisted save. Cheap (one JSON.stringify of
// the user-cells subset, plus the ring slice).
const _aw8dOriginalSavePersistence = saveWorkspacePersistence;
saveWorkspacePersistence = function() {
  const r = _aw8dOriginalSavePersistence.apply(this, arguments);
  try { _aw8dRecordHistory(); } catch (_) { /* never break save on history failure */ }
  return r;
};

// ── Copy / Paste (TSV via Clipboard API) ─────────────────────────────────────
function _aw8dRectAsTSV(startId, endId) {
  const cols = WORKSPACE_RUNTIME.gridColumns;
  const m1 = String(startId).match(/^([A-Z]+)(\d+)$/);
  const m2 = String(endId).match(/^([A-Z]+)(\d+)$/);
  if (!m1 || !m2) return '';
  const ci1 = cols.indexOf(m1[1]), ci2 = cols.indexOf(m2[1]);
  const r1 = +m1[2], r2 = +m2[2];
  const cMin = Math.min(ci1, ci2), cMax = Math.max(ci1, ci2);
  const rMin = Math.min(r1, r2),  rMax = Math.max(r1, r2);
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return '';
  const rows = [];
  for (let r = rMin; r <= rMax; r++) {
    const cells = [];
    for (let c = cMin; c <= cMax; c++) {
      const id = cols[c] + r;
      const cell = sheet.cells.get(id);
      if (!cell) { cells.push(''); continue; }
      if (cell.type === 'formula' && cell.formula) {
        cells.push('=' + cell.formula);
      } else if (cell.value != null) {
        cells.push(String(cell.value));
      } else {
        cells.push('');
      }
    }
    rows.push(cells.join('\t'));
  }
  return rows.join('\n');
}

async function _aw8dCopySelection() {
  const start = _AW8D.selection.startId || WORKSPACE_RUNTIME.activeCellId;
  const end   = _AW8D.selection.endId   || WORKSPACE_RUNTIME.activeCellId;
  if (!start) return;
  const tsv = _aw8dRectAsTSV(start, end || start);
  if (!tsv) return;
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsv);
    }
  } catch (_) { /* permissions denied — silent */ }
}

async function _aw8dPasteAt(targetId) {
  if (!targetId) return;
  let text = '';
  try {
    if (navigator && navigator.clipboard && navigator.clipboard.readText) {
      text = await navigator.clipboard.readText();
    }
  } catch (_) { return; }
  if (!text) return;

  const cols = WORKSPACE_RUNTIME.gridColumns;
  const m = String(targetId).match(/^([A-Z]+)(\d+)$/);
  if (!m) return;
  const ci0 = cols.indexOf(m[1]);
  const r0  = +m[2];
  if (ci0 < 0) return;
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return;

  const rows = text.replace(/\r\n?/g, '\n').replace(/\n$/, '').split('\n');
  const maxRow = WORKSPACE_RUNTIME.gridRows.length;
  for (let dr = 0; dr < rows.length; dr++) {
    const fields = rows[dr].split('\t');
    for (let dc = 0; dc < fields.length; dc++) {
      const ci = ci0 + dc;
      const rr = r0 + dr;
      if (ci >= cols.length || rr > maxRow) continue;
      const id = cols[ci] + rr;
      const existing = sheet.cells.get(id);
      if (existing && existing.readonly) continue;
      const raw = fields[dc];
      if (raw == null || raw === '') { sheet.cells.delete(id); continue; }
      if (raw.startsWith('=') && raw.length > 1) {
        sheet.cells.set(id, createWorkspaceCell({
          id, type: 'formula', formula: raw.slice(1),
          format: existing?.format ?? null,
        }));
      } else {
        const trimmed = raw.trim();
        const asNum = Number(trimmed);
        const value = (trimmed !== '' && Number.isFinite(asNum)) ? asNum : raw;
        sheet.cells.set(id, createWorkspaceCell({
          id, type: 'value', value,
          format: existing?.format ?? null,
        }));
      }
    }
  }
  for (const [id, cell] of sheet.cells) {
    if (cell.type === 'formula' && cell.formula && !cell.readonly) {
      const parsed = parseWorkspaceFormula(cell.formula);
      _setCellDependencies(id, _extractFormulaDependencies(parsed));
    }
  }
  saveWorkspacePersistence();
  recalculateWorkspaceSheet(WORKSPACE_RUNTIME.activeSheetId);
  if (typeof renderWorkspace === 'function') renderWorkspace();
}

// ── Format shortcuts ─────────────────────────────────────────────────────────
function _aw8dApplyFormatToSelection(format) {
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return;
  const ids = _aw8dCurrentSelection();
  let touched = 0;
  for (const id of ids) {
    const cell = sheet.cells.get(id);
    if (!cell || cell.readonly) continue;
    cell.format = format;
    cell.updatedAt = Date.now();
    touched++;
  }
  if (!touched) return;
  saveWorkspacePersistence();
  if (typeof renderWorkspace === 'function') renderWorkspace();
}

// ── Global keyboard + mouse wiring ───────────────────────────────────────────
// All gated on the workspace tab being active. Edit-input focus is left alone
// so users can still type natively inside the cell / formula bar.
function _aw8dIsInEditInput(target) {
  return !!(target && target.closest && (
    target.closest('[data-cell-edit-input]') ||
    target.closest('[data-formula-bar-input]')
  ));
}

document.addEventListener('keydown', (e) => {
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;
  const mod = e.ctrlKey || e.metaKey;
  if (!mod) return;
  if (_aw8dIsInEditInput(e.target)) return;       // don't hijack typing
  const k = e.key.toLowerCase();

  // Format shortcuts: Cmd/Ctrl+Shift+1..4
  if (e.shiftKey && !e.altKey) {
    const map = { '1': 'integer', '2': 'number', '3': 'percent', '4': 'currency' };
    if (Object.prototype.hasOwnProperty.call(map, e.key)) {
      e.preventDefault();
      _aw8dApplyFormatToSelection(map[e.key]);
      return;
    }
  }

  if (k === 'c') { e.preventDefault(); _aw8dCopySelection(); return; }
  if (k === 'v') {
    const target = WORKSPACE_RUNTIME.activeCellId
      || _AW8D.selection.startId
      || null;
    if (target) { e.preventDefault(); _aw8dPasteAt(target); }
    return;
  }
  if (k === 'z' && !e.shiftKey)  { e.preventDefault(); _aw8dUndo(); return; }
  if (k === 'z' &&  e.shiftKey)  { e.preventDefault(); _aw8dRedo(); return; }
  if (k === 'y')                 { e.preventDefault(); _aw8dRedo(); return; }
});

// Click + drag rectangular selection. Skips when the mousedown lands inside
// an editing input so committing/blurring an edit isn't disrupted.
document.addEventListener('mousedown', (e) => {
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;
  if (_aw8dIsInEditInput(e.target)) return;
  const cellEl = e.target.closest && e.target.closest('[data-cell-id]');
  if (!cellEl) return;
  const id = cellEl.dataset.cellId;
  if (!id) return;
  _AW8D.isDraggingSelection = true;
  _AW8D.selection.startId = id;
  _AW8D.selection.endId   = id;
  _aw8dUpdateSelectionStyle();
});

document.addEventListener('mousemove', (e) => {
  if (!_AW8D.isDraggingSelection) return;
  const cellEl = e.target.closest && e.target.closest('[data-cell-id]');
  if (!cellEl) return;
  const id = cellEl.dataset.cellId;
  if (!id || id === _AW8D.selection.endId) return;
  _AW8D.selection.endId = id;
  _aw8dUpdateSelectionStyle();
});

document.addEventListener('mouseup', () => {
  _AW8D.isDraggingSelection = false;
});

// Seed history with the initial state once persistence has loaded.
try { _aw8dRecordHistory(); } catch (_) { /* boot-time history seed is best-effort */ }

// ── PR-WP3: professional spreadsheet interaction polish ─────────────────────
// Column / row resize (drag handles on headers, persisted), right-click
// context menu, Delete/Backspace clears the selection, Cmd/Ctrl+A selects
// the visible grid, Esc closes the menu. All gated on the workspace tab
// and the edit-input focus check. No parser / engine changes.
const _WP3 = {
  colWidths:  new Map(),         // col letter → px
  rowHeights: new Map(),         // row number → px
  resize: { mode: null, key: null, startCoord: 0, startSize: 0 },
  menuEl: null,
  outsideHandler: null,
};
const _WP3_COL_DEFAULT = 128;
const _WP3_ROW_DEFAULT = 44;
const _WP3_COL_MIN     = 60;
const _WP3_COL_MAX     = 400;
const _WP3_ROW_MIN     = 24;
const _WP3_ROW_MAX     = 200;
const _WP3_EDGE_PX     = 6;
const _WP3_CORNER_W    = 52;
const _WP3_HEADER_H    = 38;

function _wp3SerializeLayout() {
  const colWidths  = {};
  const rowHeights = {};
  for (const [k, v] of _WP3.colWidths)  colWidths[k]  = v;
  for (const [k, v] of _WP3.rowHeights) rowHeights[k] = v;
  return { colWidths, rowHeights };
}

function _wp3DeserializeLayout(layout) {
  _WP3.colWidths.clear();
  _WP3.rowHeights.clear();
  if (!layout || typeof layout !== 'object') return;
  if (layout.colWidths && typeof layout.colWidths === 'object') {
    for (const k of Object.keys(layout.colWidths)) {
      const v = Number(layout.colWidths[k]);
      if (Number.isFinite(v) && v >= _WP3_COL_MIN && v <= _WP3_COL_MAX) {
        _WP3.colWidths.set(k, v);
      }
    }
  }
  if (layout.rowHeights && typeof layout.rowHeights === 'object') {
    for (const k of Object.keys(layout.rowHeights)) {
      const rk = Number(k);
      const v  = Number(layout.rowHeights[k]);
      if (Number.isFinite(rk) && Number.isFinite(v)
          && v >= _WP3_ROW_MIN && v <= _WP3_ROW_MAX) {
        _WP3.rowHeights.set(rk, v);
      }
    }
  }
}

// Re-applies grid-template-columns / grid-template-rows after every render
// so resize state survives recompute / language toggle / undo cycles.
function _wp3ApplyLayout() {
  const matrix = document.querySelector('.aurix-grid-matrix');
  if (!matrix) return;
  const cols = WORKSPACE_RUNTIME.gridColumns;
  const rows = WORKSPACE_RUNTIME.gridRows;
  const colTpl = [_WP3_CORNER_W + 'px'].concat(cols.map(c => {
    const w = _WP3.colWidths.get(c);
    return (Number.isFinite(w)) ? `${w}px` : 'minmax(128px, 1fr)';
  })).join(' ');
  const rowTpl = [_WP3_HEADER_H + 'px'].concat(rows.map(r => {
    const h = _WP3.rowHeights.get(r);
    return (Number.isFinite(h)) ? `${h}px` : 'minmax(44px, auto)';
  })).join(' ');
  matrix.style.gridTemplateColumns = colTpl;
  matrix.style.gridTemplateRows    = rowTpl;
}

// Wrap renderWorkspace so layout is re-applied on every render.
const _wp3OriginalRender = renderWorkspace;
renderWorkspace = function() {
  const r = _wp3OriginalRender.apply(this, arguments);
  try { _wp3ApplyLayout(); } catch (_) { /* layout best-effort */ }
  return r;
};

// Locate a resize edge under the pointer; returns the affected col letter
// or row number plus the current rendered size. Returns null when the
// pointer is on a header but not on its edge (so plain header clicks fall
// through to existing handlers).
function _wp3FindResizeEdge(target, clientX, clientY) {
  if (!target || !target.closest) return null;
  const colHeader = target.closest('.aurix-grid-col-header');
  if (colHeader) {
    const rect = colHeader.getBoundingClientRect();
    if (clientX >= rect.right - _WP3_EDGE_PX && clientX <= rect.right + _WP3_EDGE_PX) {
      const col = colHeader.textContent.trim();
      if (WORKSPACE_RUNTIME.gridColumns.indexOf(col) >= 0) {
        return { type: 'col', key: col, size: rect.width };
      }
    }
    return null;
  }
  const rowHeader = target.closest('.aurix-grid-row-header');
  if (rowHeader) {
    const rect = rowHeader.getBoundingClientRect();
    if (clientY >= rect.bottom - _WP3_EDGE_PX && clientY <= rect.bottom + _WP3_EDGE_PX) {
      const row = parseInt(rowHeader.textContent.trim(), 10);
      if (Number.isFinite(row)) {
        return { type: 'row', key: row, size: rect.height };
      }
    }
    return null;
  }
  return null;
}

// Mousedown — capture phase, before PR-8D's drag-selection sees the event.
// PR-8D's listener only fires for `[data-cell-id]` elements, so headers
// don't conflict — but using capture ensures resize wins if the DOM ever
// changes.
document.addEventListener('mousedown', (e) => {
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;
  if (_aw8dIsInEditInput(e.target)) return;
  if (e.button !== 0) return;       // left-click only
  const edge = _wp3FindResizeEdge(e.target, e.clientX, e.clientY);
  if (!edge) return;
  e.preventDefault();
  e.stopPropagation();
  _WP3.resize.mode       = edge.type;
  _WP3.resize.key        = edge.key;
  _WP3.resize.startCoord = (edge.type === 'col') ? e.clientX : e.clientY;
  _WP3.resize.startSize  = edge.size;
  document.body.style.cursor = (edge.type === 'col') ? 'col-resize' : 'row-resize';
}, true);

// Mousemove: live cursor hint on hover + actual resize while dragging.
document.addEventListener('mousemove', (e) => {
  if (_WP3.resize.mode) {
    const r = _WP3.resize;
    const delta = (r.mode === 'col' ? e.clientX : e.clientY) - r.startCoord;
    if (r.mode === 'col') {
      const next = Math.max(_WP3_COL_MIN, Math.min(_WP3_COL_MAX, r.startSize + delta));
      _WP3.colWidths.set(r.key, next);
    } else {
      const next = Math.max(_WP3_ROW_MIN, Math.min(_WP3_ROW_MAX, r.startSize + delta));
      _WP3.rowHeights.set(r.key, next);
    }
    _wp3ApplyLayout();
    return;
  }
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;
  const edge = _wp3FindResizeEdge(e.target, e.clientX, e.clientY);
  const want = edge ? (edge.type === 'col' ? 'col-resize' : 'row-resize') : '';
  const cur  = document.body.style.cursor;
  if (cur !== want && (cur === '' || cur === 'col-resize' || cur === 'row-resize')) {
    document.body.style.cursor = want;
  }
});

document.addEventListener('mouseup', () => {
  if (!_WP3.resize.mode) return;
  _WP3.resize.mode = null;
  _WP3.resize.key  = null;
  document.body.style.cursor = '';
  // Persist sizes (history wrapper de-dups since userCells didn't change).
  try { saveWorkspacePersistence(); } catch (_) {}
});

// ── Context menu ────────────────────────────────────────────────────────────
function _wp3CloseContextMenu() {
  if (_WP3.menuEl && _WP3.menuEl.parentNode) {
    _WP3.menuEl.parentNode.removeChild(_WP3.menuEl);
  }
  _WP3.menuEl = null;
  if (_WP3.outsideHandler) {
    document.removeEventListener('mousedown', _WP3.outsideHandler, true);
    _WP3.outsideHandler = null;
  }
}

function _wp3ClearSelection(fallbackId) {
  let ids = _aw8dCurrentSelection();
  if ((!ids || ids.length === 0) && fallbackId) ids = [fallbackId];
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet || !ids || ids.length === 0) return;
  let changed = 0;
  for (const id of ids) {
    const cell = sheet.cells.get(id);
    if (!cell) continue;
    if (cell.readonly) continue;
    sheet.cells.delete(id);
    if (typeof _setCellDependencies === 'function') _setCellDependencies(id, []);
    changed++;
  }
  if (!changed) return;
  saveWorkspacePersistence();
  recalculateWorkspaceSheet(WORKSPACE_RUNTIME.activeSheetId);
  renderWorkspace();
}

function _wp3OpenContextMenu(clientX, clientY, anchorCellId) {
  _wp3CloseContextMenu();
  const target = anchorCellId || WORKSPACE_RUNTIME.activeCellId;
  const items = [
    { label: 'Clear',            act: () => _wp3ClearSelection(target) },
    { label: 'Copy',             act: () => _aw8dCopySelection() },
    { label: 'Paste',            act: () => _aw8dPasteAt(target) },
    null,
    { label: 'Undo',             act: () => _aw8dUndo() },
    { label: 'Redo',             act: () => _aw8dRedo() },
    null,
    { label: 'Format: Currency', act: () => _aw8dApplyFormatToSelection('currency') },
    { label: 'Format: Percent',  act: () => _aw8dApplyFormatToSelection('percent')  },
    { label: 'Format: Number',   act: () => _aw8dApplyFormatToSelection('number')   },
    { label: 'Format: Integer',  act: () => _aw8dApplyFormatToSelection('integer')  },
  ];
  const menu = document.createElement('div');
  menu.setAttribute('role', 'menu');
  menu.style.cssText = [
    'position:fixed',
    `left:${clientX}px`,
    `top:${clientY}px`,
    'background:#1c1c20',
    'color:#e8e8ea',
    'border:1px solid rgba(255,255,255,0.10)',
    'border-radius:6px',
    'box-shadow:0 10px 30px rgba(0,0,0,0.45)',
    'padding:4px 0',
    'min-width:180px',
    'font-family:ui-monospace,SFMono-Regular,Menlo,monospace',
    'font-size:13px',
    'z-index:10000',
    'user-select:none',
  ].join(';');
  for (const item of items) {
    if (item == null) {
      const sep = document.createElement('div');
      sep.style.cssText = 'height:1px;background:rgba(255,255,255,0.08);margin:4px 0';
      menu.appendChild(sep);
      continue;
    }
    const row = document.createElement('div');
    row.setAttribute('role', 'menuitem');
    row.style.cssText = 'padding:6px 14px;cursor:pointer';
    row.textContent = item.label;
    row.addEventListener('mouseenter', () => { row.style.background = 'rgba(255,255,255,0.06)'; });
    row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
    row.addEventListener('click', (ev) => {
      ev.stopPropagation();
      _wp3CloseContextMenu();
      try { item.act(); } catch (_) {}
    });
    menu.appendChild(row);
  }
  document.body.appendChild(menu);
  _WP3.menuEl = menu;
  _WP3.outsideHandler = (ev) => {
    if (_WP3.menuEl && !_WP3.menuEl.contains(ev.target)) _wp3CloseContextMenu();
  };
  // Defer attach so the contextmenu's own mousedown doesn't immediately close.
  setTimeout(() => {
    if (_WP3.outsideHandler) {
      document.addEventListener('mousedown', _WP3.outsideHandler, true);
    }
  }, 0);
}

document.addEventListener('contextmenu', (e) => {
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;
  if (_aw8dIsInEditInput(e.target)) return;     // native menu in inputs
  const cellEl = e.target.closest && e.target.closest('[data-cell-id]');
  if (!cellEl) return;
  e.preventDefault();
  const id = cellEl.dataset.cellId;
  if (id) {
    const inSel = _AW8D.selection.startId
               && _aw8dCellsInRect(_AW8D.selection.startId, _AW8D.selection.endId).includes(id);
    if (!inSel) {
      _AW8D.selection.startId = id;
      _AW8D.selection.endId   = id;
      WORKSPACE_RUNTIME.activeCellId = id;
      _aw8dUpdateSelectionStyle();
    }
  }
  _wp3OpenContextMenu(e.clientX, e.clientY, id);
});

// ── Keyboard polish ─────────────────────────────────────────────────────────
// PR-8D's keydown listener already handles Cmd/Ctrl-based shortcuts; this
// supplementary listener covers Delete / Backspace / Cmd+A / Esc without
// interfering with cell-edit / formula-bar typing.
document.addEventListener('keydown', (e) => {
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;

  if (e.key === 'Escape') {
    if (_WP3.menuEl) { _wp3CloseContextMenu(); return; }
    // Edit-input Escape is already handled by _onWorkspaceEditInputKeyDown.
  }

  if (_aw8dIsInEditInput(e.target)) return;   // don't hijack typing

  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    _wp3ClearSelection(WORKSPACE_RUNTIME.activeCellId);
    return;
  }

  const mod = e.ctrlKey || e.metaKey;
  if (mod && !e.shiftKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    const cols = WORKSPACE_RUNTIME.gridColumns;
    const rows = WORKSPACE_RUNTIME.gridRows;
    if (cols.length && rows.length) {
      _AW8D.selection.startId = cols[0] + rows[0];
      _AW8D.selection.endId   = cols[cols.length - 1] + rows[rows.length - 1];
      _aw8dUpdateSelectionStyle();
    }
    return;
  }
});

// Apply layout once on boot too (covers the initial render that happened
// before this block evaluated).
try { _wp3ApplyLayout(); } catch (_) {}

// ── PR-WP4: professional investor starter templates ────────────────────────
// Prebuilt sheets the user can apply in one click. Each template lists the
// exact cells to set; all formulas are real (use the existing PR-8/9 registry,
// no engine changes). Applying a template clears non-readonly cells first,
// then writes the template — system seeds (B1/B2/B3 readonly) are preserved
// automatically because the writer skips readonly conflicts.
const _WP4 = { menuEl: null, outsideHandler: null };

const _WP4_TEMPLATES = [
  {
    id:          'portfolio-overview',
    name:        'Portfolio Overview',
    description: 'Key portfolio metrics plus live BTC and TSLA prices',
    build: () => [
      // A1-A3 carry @i18n: labels so EN/ES toggle keeps working; B1-B3 are
      // system readonly (Portfolio Value / Asset Count / Top Allocation).
      { id: 'A1', type: 'value',   value: '@i18n:wsCardPortfolioValue' },
      { id: 'A2', type: 'value',   value: '@i18n:wsCardAssetCount' },
      { id: 'A3', type: 'value',   value: '@i18n:wsCardTopAlloc' },
      { id: 'A4', type: 'value',   value: 'Portfolio PnL' },
      { id: 'B4', type: 'formula', formula: '=PORTFOLIO.PNL()',     format: 'currency' },
      { id: 'A5', type: 'value',   value: 'Portfolio PnL %' },
      { id: 'B5', type: 'formula', formula: '=PORTFOLIO.PNL_PCT()', format: 'number'   },
      { id: 'A6', type: 'value',   value: 'Crypto Exposure' },
      { id: 'B6', type: 'formula', formula: '=EXPOSURE("crypto")',  format: 'currency' },
      { id: 'A7', type: 'value',   value: 'BTC Price' },
      { id: 'B7', type: 'formula', formula: '=PRICE("BTC")',        format: 'currency' },
      { id: 'A8', type: 'value',   value: 'TSLA Price' },
      { id: 'B8', type: 'formula', formula: '=PRICE("TSLA")',       format: 'currency' },
    ],
  },
  {
    id:          'risk-monitor',
    name:        'Risk Monitor',
    description: 'Exposure, concentration watch, and top holdings',
    build: () => [
      { id: 'A1', type: 'value',   value: '@i18n:wsCardPortfolioValue' },
      { id: 'A2', type: 'value',   value: '@i18n:wsCardAssetCount' },
      { id: 'A3', type: 'value',   value: '@i18n:wsCardTopAlloc' },
      { id: 'A4', type: 'value',   value: 'Portfolio PnL' },
      { id: 'B4', type: 'formula', formula: '=PORTFOLIO.PNL()',     format: 'currency' },
      { id: 'A5', type: 'value',   value: 'Portfolio PnL %' },
      { id: 'B5', type: 'formula', formula: '=PORTFOLIO.PNL_PCT()', format: 'number'   },
      { id: 'A6', type: 'value',   value: 'Crypto Exposure' },
      { id: 'B6', type: 'formula', formula: '=EXPOSURE("crypto")',  format: 'currency' },
      // Concentration watch
      { id: 'A8',  type: 'value',   value: 'Concentration Watch' },
      { id: 'A9',  type: 'value',   value: 'BTC alloc'  },
      { id: 'B9',  type: 'formula', formula: '=ALLOCATION("BTC")',  format: 'number' },
      { id: 'A10', type: 'value',   value: 'ETH alloc'  },
      { id: 'B10', type: 'formula', formula: '=ALLOCATION("ETH")',  format: 'number' },
      { id: 'A11', type: 'value',   value: 'TSLA alloc' },
      { id: 'B11', type: 'formula', formula: '=ALLOCATION("TSLA")', format: 'number' },
      // Top holdings (live)
      { id: 'A13', type: 'value',   value: 'Top Holdings (live)' },
      { id: 'A14', type: 'value',   value: 'BTC value'  },
      { id: 'B14', type: 'formula', formula: '=ASSET.VALUE("BTC")',  format: 'currency' },
      { id: 'A15', type: 'value',   value: 'ETH value'  },
      { id: 'B15', type: 'formula', formula: '=ASSET.VALUE("ETH")',  format: 'currency' },
      { id: 'A16', type: 'value',   value: 'TSLA value' },
      { id: 'B16', type: 'formula', formula: '=ASSET.VALUE("TSLA")', format: 'currency' },
    ],
  },
  {
    id:          'position-analyzer',
    name:        'Position Analyzer',
    description: 'Inspect any holding (asks for ticker; defaults to TSLA)',
    needsTicker: true,
    build: (ticker) => {
      // ASSET.* requires a literal string arg today (see PR-8C registry — no
      // engine relaxation in WP-4). Templates bake the ticker into each
      // formula at apply time; users re-apply the template to switch ticker.
      const t = String(ticker || 'TSLA').trim().toUpperCase() || 'TSLA';
      return [
        { id: 'A1', type: 'value',   value: '@i18n:wsCardPortfolioValue' },
        { id: 'A2', type: 'value',   value: '@i18n:wsCardAssetCount' },
        { id: 'A3', type: 'value',   value: '@i18n:wsCardTopAlloc' },
        { id: 'A5', type: 'value',   value: 'Position Analyzer' },
        { id: 'A6', type: 'value',   value: 'Ticker' },
        { id: 'B6', type: 'value',   value: t },
        { id: 'A7', type: 'value',   value: 'Quantity' },
        { id: 'B7', type: 'formula', formula: `=ASSET.QTY("${t}")`,        format: 'number'   },
        { id: 'A8', type: 'value',   value: 'Price' },
        { id: 'B8', type: 'formula', formula: `=ASSET.PRICE("${t}")`,      format: 'currency' },
        { id: 'A9', type: 'value',   value: 'Value' },
        { id: 'B9', type: 'formula', formula: `=ASSET.VALUE("${t}")`,      format: 'currency' },
        { id: 'A10', type: 'value',  value: 'Cost Basis' },
        { id: 'B10', type: 'formula', formula: `=ASSET.COST("${t}")`,      format: 'currency' },
        { id: 'A11', type: 'value',  value: 'PnL' },
        { id: 'B11', type: 'formula', formula: `=ASSET.PNL("${t}")`,       format: 'currency' },
        { id: 'A12', type: 'value',  value: 'PnL %' },
        { id: 'B12', type: 'formula', formula: `=ASSET.PNL_PCT("${t}")`,   format: 'number'   },
        { id: 'A13', type: 'value',  value: '24h Change %' },
        { id: 'B13', type: 'formula', formula: `=PRICE.CHANGE24H("${t}")`, format: 'number'   },
      ];
    },
  },
  {
    id:          'market-watch',
    name:        'Market Watch',
    description: 'Live prices and 24h change for BTC, ETH, TSLA, AAPL, SPY, S&P 500',
    build: () => {
      const rows = [
        { id: 'A1', type: 'value', value: '@i18n:wsCardPortfolioValue' },
        { id: 'A2', type: 'value', value: '@i18n:wsCardAssetCount' },
        { id: 'A3', type: 'value', value: '@i18n:wsCardTopAlloc' },
        { id: 'A5', type: 'value', value: 'Market Watch' },
        { id: 'A6', type: 'value', value: 'Symbol' },
        { id: 'B6', type: 'value', value: 'Price' },
        { id: 'C6', type: 'value', value: '24h %' },
      ];
      // S&P 500 uses the canonical ^GSPC symbol. PRICE() resolves via the
      // alias map; PRICE.CHANGE24H does a direct MARKET_DATA lookup, so the
      // canonical symbol is what works for both.
      const tickers = [
        ['BTC',     'BTC'],
        ['ETH',     'ETH'],
        ['TSLA',    'TSLA'],
        ['AAPL',    'AAPL'],
        ['SPY',     'SPY'],
        ['S&P 500', '^GSPC'],
      ];
      tickers.forEach(([label, sym], i) => {
        const r = 7 + i;
        rows.push({ id: `A${r}`, type: 'value',   value: label });
        rows.push({ id: `B${r}`, type: 'formula', formula: `=PRICE("${sym}")`,           format: 'currency' });
        rows.push({ id: `C${r}`, type: 'formula', formula: `=PRICE.CHANGE24H("${sym}")`, format: 'number'   });
      });
      return rows;
    },
  },
];

function _wp4ApplyTemplate(template, ticker) {
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  if (!sheet) return false;
  // Wipe non-readonly cells (system seeds stay because they're readonly).
  for (const id of [...sheet.cells.keys()]) {
    const c = sheet.cells.get(id);
    if (c && !c.readonly) {
      sheet.cells.delete(id);
      try { _setCellDependencies(id, []); } catch (_) {}
    }
  }
  // Write template cells; readonly conflicts (e.g. B1/B2/B3) are skipped.
  const cells = template.build(ticker);
  for (const spec of cells) {
    if (!_isCellInGridBounds(spec.id)) continue;
    const existing = sheet.cells.get(spec.id);
    if (existing && existing.readonly) continue;
    sheet.cells.set(spec.id, createWorkspaceCell({
      id:      spec.id,
      type:    spec.type,
      value:   spec.type === 'value'   ? spec.value   : null,
      formula: spec.type === 'formula' ? spec.formula : null,
      format:  spec.format || null,
    }));
  }
  // Rebuild dep graph + evaluate user formulas in topological order before
  // render so the user sees computed values on the first frame.
  _rebuildAndRecomputeAll(sheet);
  saveWorkspacePersistence();
  if (typeof renderWorkspace === 'function') renderWorkspace();
  return true;
}

function _wp4CloseSelector() {
  if (_WP4.menuEl && _WP4.menuEl.parentNode) {
    _WP4.menuEl.parentNode.removeChild(_WP4.menuEl);
  }
  _WP4.menuEl = null;
  if (_WP4.outsideHandler) {
    document.removeEventListener('mousedown', _WP4.outsideHandler, true);
    _WP4.outsideHandler = null;
  }
}

function _wp4ConfirmAndApply(template) {
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  const hasUserData = sheet && [...sheet.cells.values()].some(c => c && !c.readonly);
  let ticker = null;
  if (template.needsTicker) {
    const raw = (typeof window !== 'undefined' && window.prompt)
      ? window.prompt('Ticker symbol for Position Analyzer:', 'TSLA')
      : 'TSLA';
    if (raw == null) return;       // user cancelled the prompt
    ticker = String(raw).trim().toUpperCase() || 'TSLA';
  }
  if (hasUserData && typeof window !== 'undefined' && window.confirm) {
    const ok = window.confirm(`Apply "${template.name}"? This replaces current workspace cells (system seeds preserved).`);
    if (!ok) return;
  }
  _wp4ApplyTemplate(template, ticker);
}

function _wp4OpenSelector(anchor) {
  _wp4CloseSelector();
  const rect = anchor && anchor.getBoundingClientRect
    ? anchor.getBoundingClientRect()
    : { right: window.innerWidth - 24, bottom: 80 };
  const menu = document.createElement('div');
  menu.setAttribute('role', 'menu');
  menu.style.cssText = [
    'position:fixed',
    `right:${Math.max(16, window.innerWidth - rect.right)}px`,
    `top:${rect.bottom + 6}px`,
    'background:#1c1c20',
    'color:#e8e8ea',
    'border:1px solid rgba(255,255,255,0.10)',
    'border-radius:8px',
    'box-shadow:0 14px 36px rgba(0,0,0,0.5)',
    'padding:8px 0',
    'min-width:280px',
    'max-width:340px',
    'font-family:ui-monospace,SFMono-Regular,Menlo,monospace',
    'font-size:13px',
    'z-index:10000',
    'user-select:none',
  ].join(';');

  const title = document.createElement('div');
  title.textContent = 'Workspace Templates';
  title.style.cssText = 'padding:6px 16px 8px;color:#a3a3a9;text-transform:uppercase;letter-spacing:0.08em;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.06);margin-bottom:4px';
  menu.appendChild(title);

  for (const tpl of _WP4_TEMPLATES) {
    const row = document.createElement('div');
    row.setAttribute('role', 'menuitem');
    row.style.cssText = 'padding:10px 16px;cursor:pointer';
    const name = document.createElement('div');
    name.style.cssText = 'font-weight:600';
    name.textContent = tpl.name;
    const desc = document.createElement('div');
    desc.style.cssText = 'font-size:11px;color:rgba(255,255,255,0.55);margin-top:2px;line-height:1.4';
    desc.textContent = tpl.description;
    row.appendChild(name);
    row.appendChild(desc);
    row.addEventListener('mouseenter', () => { row.style.background = 'rgba(255,255,255,0.06)'; });
    row.addEventListener('mouseleave', () => { row.style.background = 'transparent'; });
    row.addEventListener('click', (ev) => {
      ev.stopPropagation();
      _wp4CloseSelector();
      _wp4ConfirmAndApply(tpl);
    });
    menu.appendChild(row);
  }

  document.body.appendChild(menu);
  _WP4.menuEl = menu;
  _WP4.outsideHandler = (ev) => {
    if (_WP4.menuEl && !_WP4.menuEl.contains(ev.target)) _wp4CloseSelector();
  };
  setTimeout(() => {
    if (_WP4.outsideHandler) {
      document.addEventListener('mousedown', _WP4.outsideHandler, true);
    }
  }, 0);
}

// Templates button click — document-level so the button works after every
// re-render without needing per-render rebinding.
document.addEventListener('click', (e) => {
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;
  const btn = e.target.closest && e.target.closest('[data-aurix-templates]');
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  if (_WP4.menuEl) _wp4CloseSelector();
  else              _wp4OpenSelector(btn);
});

// Esc closes the template selector (when not editing a cell).
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (typeof currentTab !== 'string' || currentTab !== 'workspace') return;
  if (_WP4.menuEl) { _wp4CloseSelector(); }
});

// ── PR-WP6B: safe AI template foundation ───────────────────────────────────
// Deterministic intent handlers + a pure validator that gates every spec
// before it touches the runtime. A future WP-6C LLM layer should only
// produce {intent, params} JSON — never formulas or cell shapes — so
// hallucinated functions or out-of-bounds writes die here, not in eval.
//
// No backend, no model call, no fake data. window.__wp6 exposes the three
// methods to the console for end-to-end testing.

const _WP6_ALLOWED_FORMATS  = new Set(['currency','percent','number','integer','date']);
const _WP6_BLOCKED_FUNCTIONS = new Set(['PORTFOLIO.CAGR']);

function _wp6CollectCalledNames(ast) {
  const names = new Set();
  const walk = (n) => {
    if (!n) return;
    switch (n.type) {
      case 'call':
        names.add(String(n.name || '').toUpperCase());
        for (const a of n.args || []) walk(a);
        return;
      case 'unary':  walk(n.operand); return;
      case 'binary': walk(n.lhs); walk(n.rhs); return;
      default: return;
    }
  };
  walk(ast);
  return names;
}

// Intra-template cycle check. Only catches cycles formed *between* template
// cells; refs to existing-sheet cells are not traced because _wp4ApplyTemplate
// wipes non-readonly cells before write, so prior user formulas can't close
// a cycle with template cells.
function _wp6CheckIntraTemplateCycles(template) {
  const depGraph = new Map();
  for (const spec of template.cells) {
    if (!spec || spec.type !== 'formula') continue;
    const parsed = parseWorkspaceFormula(spec.formula);
    if (!parsed) continue;
    const deps = _extractFormulaDependencies(parsed);
    const cellDeps = new Set();
    for (const d of deps) if (/^[A-Z]+\d+$/.test(d)) cellDeps.add(d);
    depGraph.set(spec.id, cellDeps);
  }
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  for (const id of depGraph.keys()) color.set(id, WHITE);
  const visit = (id) => {
    color.set(id, GRAY);
    for (const dep of depGraph.get(id) || []) {
      const c = color.get(dep);
      if (c === GRAY) return true;
      if (c === WHITE && visit(dep)) return true;
    }
    color.set(id, BLACK);
    return false;
  };
  for (const id of depGraph.keys()) {
    if (color.get(id) === WHITE && visit(id)) return true;
  }
  return false;
}

function validateAITemplate(template) {
  const errors = [];
  if (!template || typeof template !== 'object') {
    return { ok: false, errors: ['template must be an object'] };
  }
  if (!Array.isArray(template.cells)) {
    return { ok: false, errors: ['template.cells must be an array'] };
  }
  for (let i = 0; i < template.cells.length; i++) {
    const spec = template.cells[i];
    const tag = `cell[${i}]${spec && spec.id ? ' '+spec.id : ''}`;
    if (!spec || typeof spec !== 'object') { errors.push(`${tag}: not an object`); continue; }
    if (typeof spec.id !== 'string' || !_isCellInGridBounds(spec.id)) {
      errors.push(`${tag}: id "${spec.id}" out of grid bounds`); continue;
    }
    if (spec.type !== 'value' && spec.type !== 'formula') {
      errors.push(`${tag}: type must be 'value' or 'formula'`); continue;
    }
    if (spec.format != null && !_WP6_ALLOWED_FORMATS.has(spec.format)) {
      errors.push(`${tag}: format "${spec.format}" not allowed`);
    }
    if (spec.type === 'value') {
      const t = typeof spec.value;
      if (t !== 'string' && t !== 'number') {
        errors.push(`${tag}: value must be string or number, got ${t}`);
      }
    } else { // formula
      if (typeof spec.formula !== 'string') {
        errors.push(`${tag}: formula must be a string`); continue;
      }
      if (!spec.formula.startsWith('=')) {
        errors.push(`${tag}: formula must start with '='`); continue;
      }
      const parsed = parseWorkspaceFormula(spec.formula);
      if (!parsed) {
        errors.push(`${tag}: formula does not parse: ${spec.formula}`); continue;
      }
      const calledNames = _wp6CollectCalledNames(parsed);
      for (const name of calledNames) {
        if (_WP6_BLOCKED_FUNCTIONS.has(name)) {
          errors.push(`${tag}: uses blocked function ${name}`);
        } else if (!Object.prototype.hasOwnProperty.call(_AW8_WORKSPACE_FUNCTIONS, name)
                && !Object.prototype.hasOwnProperty.call(_AW8_FINANCIAL_FUNCTIONS, name)) {
          errors.push(`${tag}: unknown function ${name}`);
        }
      }
    }
  }
  if (errors.length === 0 && _wp6CheckIntraTemplateCycles(template)) {
    errors.push('template contains intra-template circular cell references');
  }
  return errors.length === 0 ? { ok: true } : { ok: false, errors };
}

// ── Deterministic intent handlers ──────────────────────────────────────────
// Each handler returns a fully-formed AI template object:
//   { title, description, cells: CellSpec[] }
// Four reuse the WP-4 templates; two are new (dividend tracker, FIRE calc).
// No external/fake data — dividend yields and FIRE parameters are seeded
// with neutral defaults the user fills in.
function _wp6LookupWP4(id) {
  return _WP4_TEMPLATES.find(t => t.id === id);
}

const _WP6_INTENT_HANDLERS = {
  portfolio_summary: () => {
    const tpl = _wp6LookupWP4('portfolio-overview');
    return { title: 'Portfolio Summary', description: tpl.description, cells: tpl.build() };
  },
  risk_dashboard: () => {
    const tpl = _wp6LookupWP4('risk-monitor');
    return { title: 'Risk Dashboard', description: tpl.description, cells: tpl.build() };
  },
  position_analysis: (params) => {
    const tpl = _wp6LookupWP4('position-analyzer');
    const ticker = String((params && params.ticker) || 'TSLA').trim().toUpperCase() || 'TSLA';
    return { title: 'Position Analysis', description: tpl.description, cells: tpl.build(ticker) };
  },
  market_watch: () => {
    const tpl = _wp6LookupWP4('market-watch');
    return { title: 'Market Watch', description: tpl.description, cells: tpl.build() };
  },
  dividend_tracker: () => {
    // No external dividend feed. User fills B (qty) and C (div/share) per
    // row; D computes annual dividend, and D14 totals across six rows.
    const tickers = ['AAPL', 'KO', 'MCD', 'JNJ', 'SPY', 'VOO'];
    const cells = [
      { id: 'A1', type: 'value', value: '@i18n:wsCardPortfolioValue' },
      { id: 'A2', type: 'value', value: '@i18n:wsCardAssetCount' },
      { id: 'A3', type: 'value', value: '@i18n:wsCardTopAlloc' },
      { id: 'A5', type: 'value', value: 'Dividend Tracker' },
      { id: 'A6', type: 'value', value: 'Symbol' },
      { id: 'B6', type: 'value', value: 'Qty' },
      { id: 'C6', type: 'value', value: 'Div/Share' },
      { id: 'D6', type: 'value', value: 'Annual' },
    ];
    tickers.forEach((sym, i) => {
      const r = 7 + i;
      cells.push({ id: `A${r}`, type: 'value',   value: sym });
      cells.push({ id: `B${r}`, type: 'value',   value: 0 });
      cells.push({ id: `C${r}`, type: 'value',   value: 0, format: 'currency' });
      cells.push({ id: `D${r}`, type: 'formula', formula: `=B${r}*C${r}`, format: 'currency' });
    });
    cells.push({ id: 'A14', type: 'value',   value: 'Total' });
    cells.push({ id: 'D14', type: 'formula', formula: '=SUM(D7:D12)', format: 'currency' });
    return {
      title: 'Dividend Tracker',
      description: 'Enter qty and div/share per ticker — annual income computes automatically',
      cells,
    };
  },
  fire_calculator: (params) => {
    // Pure compounding math: FV = P*(1+r)^n + C*((1+r)^n - 1)/r
    const p = params || {};
    const ageNow   = Number.isFinite(+p.currentAge)     ? +p.currentAge     : 30;
    const ageGoal  = Number.isFinite(+p.targetAge)      ? +p.targetAge      : 50;
    const savings  = Number.isFinite(+p.currentSavings) ? +p.currentSavings : 50000;
    const contrib  = Number.isFinite(+p.annualContrib)  ? +p.annualContrib  : 30000;
    const retPct   = Number.isFinite(+p.expectedReturn) ? +p.expectedReturn : 7;
    return {
      title: 'FIRE Calculator',
      description: 'Edit B6-B11 to model your scenario; B12 projects future value via compounding',
      cells: [
        { id: 'A1', type: 'value', value: '@i18n:wsCardPortfolioValue' },
        { id: 'A2', type: 'value', value: '@i18n:wsCardAssetCount' },
        { id: 'A3', type: 'value', value: '@i18n:wsCardTopAlloc' },
        { id: 'A5',  type: 'value',   value: 'FIRE Calculator' },
        { id: 'A6',  type: 'value',   value: 'Current Age' },
        { id: 'B6',  type: 'value',   value: ageNow,  format: 'integer' },
        { id: 'A7',  type: 'value',   value: 'Target Age' },
        { id: 'B7',  type: 'value',   value: ageGoal, format: 'integer' },
        { id: 'A8',  type: 'value',   value: 'Years' },
        { id: 'B8',  type: 'formula', formula: '=B7-B6', format: 'integer' },
        { id: 'A9',  type: 'value',   value: 'Current Savings' },
        { id: 'B9',  type: 'value',   value: savings, format: 'currency' },
        { id: 'A10', type: 'value',   value: 'Annual Contribution' },
        { id: 'B10', type: 'value',   value: contrib, format: 'currency' },
        { id: 'A11', type: 'value',   value: 'Expected Return %' },
        { id: 'B11', type: 'value',   value: retPct,  format: 'number' },
        { id: 'A12', type: 'value',   value: 'Future Value' },
        { id: 'B12', type: 'formula',
          formula: '=B9*POW(1+B11/100,B8)+B10*(POW(1+B11/100,B8)-1)/(B11/100)',
          format: 'currency' },
      ],
    };
  },
};

// ── Dev entry point: window.__wp6 ──────────────────────────────────────────
// Exposed so future WP-6C (LLM layer) can be smoke-tested from the console,
// and so the validator can be exercised against adversarial inputs without
// any backend. NEVER call this from production code paths — the templates
// UI / future AI surface go through their own confirmation flow.
function _wp6BuildIntent(intent, params) {
  const handler = _WP6_INTENT_HANDLERS[intent];
  if (!handler) return { error: `unknown intent: ${intent}` };
  return handler(params || {});
}

function _wp6ApplyIntent(intent, params) {
  const template = _wp6BuildIntent(intent, params);
  if (template.error) return { ok: false, errors: [template.error] };
  const v = validateAITemplate(template);
  if (!v.ok) return v;
  // Reuse WP-4 confirmation if the user has non-readonly data on the sheet.
  const sheet = WORKSPACE_RUNTIME.sheets.get('main');
  const hasUserData = sheet && [...sheet.cells.values()].some(c => c && !c.readonly);
  if (hasUserData && typeof window !== 'undefined' && window.confirm) {
    const ok = window.confirm(`Apply "${template.title}"? This replaces current workspace cells.`);
    if (!ok) return { ok: false, errors: ['user cancelled'] };
  }
  // Adapter: _wp4ApplyTemplate expects a {build:(ticker)=>cells} shape.
  _wp4ApplyTemplate({ build: () => template.cells });
  return { ok: true };
}

if (typeof window !== 'undefined') {
  window.__wp6 = {
    intents:  Object.keys(_WP6_INTENT_HANDLERS),
    validate: validateAITemplate,
    build:    _wp6BuildIntent,
    apply:    _wp6ApplyIntent,
  };
}

// FC-10: register base financial formulas (pure consumers of derived snapshot).
registerFinancialFormula(
  'portfolio.totalValue',
  ['derived.portfolio.totalValue'],
  context => context.derived.portfolio.totalValue,
);
registerFinancialFormula(
  'portfolio.assetCount',
  ['derived.portfolio.assetCount'],
  context => context.derived.portfolio.assetCount,
);
registerFinancialFormula(
  'portfolio.topAllocation',
  ['derived.portfolio.allocations'],
  context => context.derived.portfolio.allocations?.[0] || null,
);

// FC-11: prime dirty set so the first derived recomputation has work to do.
invalidateFinancialFormulas(
  [
    'derived.portfolio.totalvalue',
    'derived.portfolio.assetcount',
    'derived.portfolio.allocations',
  ],
  'initial-bootstrap',
);
recomputeFinancialFormulas('initial-bootstrap');

// FC-6: debug subscriber — validates reactive runtime, non-invasive
const unsubscribeMarketDebug = MARKET_EVENTS.subscribe('market:update', snapshot => {
  console.log(
    '[market-events] update received:',
    snapshot.type,
    snapshot.changedSymbols.length,
    'symbols',
    `v${snapshot.version}`
  );
});

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

  if (exit) {
    exit.addEventListener('click', () => { closeMenu(); signOut(); });
  }
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

// ── Watchlist Store (single source of truth) ───────────────
const watchlistStore = (() => {
  const KEY   = 'aurix_watchlist';
  const _subs = [];
  let _list;

  function _defaultList() {
    return (Array.isArray(assets) ? assets : [])
      .filter(a => a.qty > 0)
      .map(a => a.sym || a.name);
  }

  function _persist() { localStorage.setItem(KEY, JSON.stringify(_list)); }
  function _notify()  { _subs.forEach(fn => fn()); }

  const _stored = localStorage.getItem(KEY);
  _list = _stored ? JSON.parse(_stored) : _defaultList();

  return {
    getWatchlist: ()  => [..._list],
    includes:     key => _list.includes(key),
    add(key)          { if (!_list.includes(key)) { _list = [..._list, key]; _persist(); _notify(); } },
    remove(key)       { _list = _list.filter(k => k !== key); _persist(); _notify(); },
    subscribe:    fn  => _subs.push(fn),
  };
})();

// ── Global Watchlist API (thin wrappers over watchlistStore) ─
const WATCHLIST_KEY = 'aurix_watchlist'; // same key as watchlistStore

function normalizeSymbol(symbol) {
  if (!symbol) return '';
  return String(symbol)
    .toUpperCase()
    .replace(/\.[A-Z]{1,3}$/, '') // strip exchange suffixes: .US .L .DE .F etc.
    .replace(/\//g, '')
    .replace(/-/g, '')
    .replace(/^\^/, '')           // strip index prefix: ^GSPC → GSPC
    .trim();
}

function getWatchlist() {
  return watchlistStore.getWatchlist();
}

function setWatchlist(list) {
  const norm    = list.map(normalizeSymbol);
  const current = watchlistStore.getWatchlist();
  current.forEach(k => { if (!norm.includes(k)) watchlistStore.remove(k); });
  norm.forEach(k  => { if (!current.includes(k)) watchlistStore.add(k); });
}

function isInWatchlist(symbol) {
  return watchlistStore.includes(normalizeSymbol(symbol));
}

function toggleWatchlist(symbol) {
  const norm = normalizeSymbol(symbol);
  if (watchlistStore.includes(norm)) {
    watchlistStore.remove(norm);
    return false;
  }
  watchlistStore.add(norm);
  return true;
}

// ── Market Store (live prices + smooth interpolation) ──────
const marketStore = (() => {
  const POLL_MS = 5000;
  let _prices       = {};  // key → { price, prev, display, target, history, isReal }
  let _rafMap       = {};
  let _drawThrottle = {};
  let _timer        = null;

  // Random walk with momentum — 32 pts, organic, no straight segments
  function _genInitialHistory(base) {
    let v = base;
    const out = [];
    for (let i = 0; i < 32; i++) {
      const drift    = (Math.random() - 0.5) * base * 0.002;
      const momentum = i > 1 ? (out[i - 1] - out[i - 2]) * 0.35 : 0;
      v += drift + momentum;
      out.push(v);
    }
    return out;
  }

  function _smooth(data) {
    return data.map((curr, i, a) =>
      ((a[i - 1] ?? curr) + curr + (a[i + 1] ?? curr)) / 3
    );
  }

  // Best seed for a key — uses assets[] if available
  function _seedFor(key) {
    if (Array.isArray(assets)) {
      const a = assets.find(x => (x.sym || x.name) === key);
      if (a?.price > 0) return a.price;
    }
    return _prices[key]?.display ?? _prices[key]?.price ?? 100;
  }

  // ── Sparkline ────────────────────────────────────────────
  function _drawSpark(key, force) {
    const canvas = document.querySelector('.watchlist-spark[data-key="' + key + '"]');
    if (!canvas) return;

    // Lazy-init entry with fake history if it doesn't exist yet
    if (!_prices[key]) {
      const seed = _seedFor(key);
      _prices[key] = { price: null, prev: null, display: null, target: null,
                       history: _genInitialHistory(seed), isReal: false };
    }

    const { history, isReal } = _prices[key];

    // Throttle — only on real-data redraws; force bypasses
    if (!force && isReal) {
      const now = Date.now();
      if (now - (_drawThrottle[key] ?? 0) < 120) return;
      _drawThrottle[key] = now;
    }

    if (isReal) {
      canvas.classList.remove('placeholder');
      canvas.classList.add('ready');
    } else {
      canvas.classList.add('placeholder');
      canvas.classList.remove('ready');
    }

    const dpr = window.devicePixelRatio || 1;
    const W = 70, H = 22;
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    // Smooth → midpoint interpolation (32 → ~60 pts)
    const smoothed = _smooth(history);
    const pts = [];
    for (let i = 0; i < smoothed.length - 1; i++) {
      pts.push(smoothed[i]);
      pts.push((smoothed[i] + smoothed[i + 1]) / 2);
    }
    pts.push(smoothed[smoothed.length - 1]);

    const min      = Math.min(...pts);
    const max      = Math.max(...pts);
    const price    = _prices[key].price ?? _prices[key].display ?? _seedFor(key);
    const range    = Math.max(max - min, price * 0.002) || 1;
    const delta    = pts[pts.length - 1] - pts[0];
    const isUp     = delta >  Math.max(Math.abs(max) * 0.001, 0.01);
    const isDown   = delta < -Math.max(Math.abs(max) * 0.001, 0.01);
    const color    = isReal
      ? (isUp ? '#22c55e' : isDown ? '#ef4444' : '#9ca3af')
      : '#9ca3af';

    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, color + '55');
    grad.addColorStop(1, color + 'ff');

    const xs = pts.map((_, i) => (i / (pts.length - 1)) * W);
    const ys = pts.map(v => H - ((v - min) / range) * (H - 2) - 1);

    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = grad;
    ctx.lineWidth   = 1.2;
    ctx.lineJoin    = 'round';
    ctx.lineCap     = 'round';

    ctx.beginPath();
    ctx.moveTo(xs[0], ys[0]);
    for (let i = 0; i < xs.length - 1; i++) {
      const xc = (xs[i] + xs[i + 1]) / 2;
      const yc = (ys[i] + ys[i + 1]) / 2;
      ctx.quadraticCurveTo(xs[i], ys[i], xc, yc);
    }
    ctx.lineTo(xs[xs.length - 1], ys[ys.length - 1]);
    ctx.stroke();

    // Live dot — only with real data
    if (isReal) {
      const lastY = ys[ys.length - 1];
      ctx.shadowBlur  = 3;
      ctx.shadowColor = color;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(W, lastY, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.shadowBlur  = 0;
      ctx.globalAlpha = 1;
    }
  }

  // ── DOM helpers ──────────────────────────────────────────
  function _updateDOM(key, value) {
    const text = value ? formatBase(value) : '--';
    const dash = document.querySelector('.watchlist-price[data-key="' + key + '"]');
    if (dash) dash.textContent = text;
    const modal = document.querySelector('.watchlist-modal-row[data-key="' + key + '"] .watchlist-modal-price');
    if (modal) modal.textContent = text;
  }

  function _triggerFlash(key, from, to) {
    if (from === to) return;
    const cls = to > from ? 'price-up' : 'price-down';
    [
      document.querySelector('.watchlist-price[data-key="' + key + '"]'),
      document.querySelector('.watchlist-modal-row[data-key="' + key + '"] .watchlist-modal-price'),
    ].forEach(el => {
      if (!el) return;
      el.classList.remove('price-up', 'price-down');
      void el.offsetWidth;
      el.classList.add(cls);
    });
  }

  // ── Interpolation ────────────────────────────────────────
  function _animatePrice(key) {
    const item = _prices[key];
    if (!item) return;
    const from  = item.display;
    const to    = item.target;
    const delta = Math.abs(to - from);
    if (delta < 0.001) { item.display = to; _updateDOM(key, to); return; }

    if (_rafMap[key]) cancelAnimationFrame(_rafMap[key]);

    const duration = Math.min(400, Math.max(250, delta * 5));
    const start    = performance.now();

    function frame(now) {
      const t     = Math.min((now - start) / duration, 1);
      const eased = t * (2 - t);                        // quadratic ease-out
      const value = from + (to - from) * eased;
      item.display = value;
      _updateDOM(key, value);

      if (t < 1) {
        _rafMap[key] = requestAnimationFrame(frame);
      } else {
        item.display = to;
        delete _rafMap[key];
        _updateDOM(key, to);
        _triggerFlash(key, from, to);
      }
    }
    _rafMap[key] = requestAnimationFrame(frame);
  }

  // ── Price setter ─────────────────────────────────────────
  function _set(key, newPrice) {
    const entry = _prices[key];
    if (entry?.price === newPrice) return;
    // Skip sub-noise (< 0.03% change)
    if (entry?.price && Math.abs(newPrice - entry.price) / entry.price < 0.0003) return;

    const display = entry?.display ?? null;

    // Preserve existing history — continue, never reset
    let history = entry?.history;
    if (!history || history.length < 2) {
      history = _genInitialHistory(newPrice);
    } else if (!entry.isReal) {
      // Rescale fake history to real price range before first real push
      const center = history.reduce((s, v) => s + v, 0) / history.length;
      if (center > 0) history = history.map(v => v * (newPrice / center));
    }

    history.push(newPrice);
    if (history.length > 40) history.shift();

    _prices[key] = {
      price:   newPrice,
      prev:    display ?? entry?.price ?? newPrice,
      display: display ?? newPrice,
      target:  newPrice,
      history,
      isReal:  true,
    };
    _animatePrice(key);
    _drawSpark(key);
  }

  // Mirror non-crypto prices from main 30 s refresh cycle
  function syncFromRefresh() {
    if (!Array.isArray(assets)) return;
    watchlistStore.getWatchlist().forEach(key => {
      const a = assets.find(x => (x.sym || x.name) === key);
      if (a?.price > 0) _set(key, a.price);
    });
  }

  // Batch CoinGecko poll — crypto only, single request
  async function _pollCrypto() {
    if (!Array.isArray(assets)) return;
    const cryptos = watchlistStore.getWatchlist()
      .map(key => assets.find(a => (a.sym || a.name) === key && a.type === 'crypto' && a.coinId))
      .filter(Boolean);
    if (!cryptos.length) return;
    try {
      const coinIds = [...new Set(cryptos.map(a => a.coinId))];
      const data    = await fetchLivePrices(coinIds);
      // Stagger per-asset to feel like real market data arriving
      cryptos.forEach(a => {
        const usd = data[a.coinId]?.usd;
        if (usd > 0) {
          const delay = Math.round(Math.random() * Math.random() * 120);
          setTimeout(() => _set(a.sym || a.name, usd), delay);
        }
      });
    } catch {}
  }

  function _restartPolling() {
    if (_timer) clearInterval(_timer);
    syncFromRefresh();
    _pollCrypto();
    _timer = setInterval(_pollCrypto, POLL_MS);
  }

  watchlistStore.subscribe(_restartPolling);

  return {
    getPrice:   key => _prices[key] ?? null,
    redrawAll:  ()  => watchlistStore.getWatchlist().forEach(k => _drawSpark(k, true)),
    syncFromRefresh,
    start:      _restartPolling,
  };
})();

// ── Tracking Card ──────────────────────────────────────────
(function initTrackingCard() {
  if (!window.matchMedia('(min-width: 1024px)').matches) return;

  const content = document.getElementById('trackingContent');
  if (!content) return;

  const TICKER_ASSETS = [
    { sym: 'BTC',  id: 'bitcoin' },
    { sym: 'ETH',  id: 'ethereum' },
    { sym: 'ORO',  price: '—', change: '—', positive: null },
    { sym: 'NVDA', price: '—', change: '—', positive: null },
    { sym: 'S&P',  price: '—', change: '—', positive: null },
  ];

  async function fetchTickerPrices() {
    const coinAssets = TICKER_ASSETS.filter(a => a.id);
    try {
      const data = await fetchLivePrices(coinAssets.map(a => a.id));
      TICKER_ASSETS.forEach(a => {
        if (!a.id || !data[a.id]) return;
        const usd = data[a.id].usd;
        const ch  = data[a.id].usd_24h_change;
        a.price    = usd != null ? '$' + usd.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '—';
        a.change   = ch  != null ? (ch >= 0 ? '+' : '') + ch.toFixed(2) + '%' : '—';
        a.positive = ch  != null ? ch >= 0 : null;
      });
    } catch {}
  }

  function renderTicker() {
    const items = TICKER_ASSETS.map(a =>
      '<div class="ticker-item">' +
        '<span class="ticker-sym">' + a.sym + '</span>' +
        '<span class="ticker-price">' + (a.price || '—') + '</span>' +
      '</div>'
    ).join('');
    content.innerHTML =
      '<div class="tracking-ticker-wrap">' +
        '<div class="tracking-ticker">' + items + items + '</div>' +
      '</div>';
  }

  function renderWatchlist() {
    const top = [...assets]
      .filter(a => a.price > 0 && watchlistStore.includes(a.sym || a.name))
      .sort((a, b) => b.price - a.price)
      .slice(0, 5);

    if (top.length === 0) {
      content.innerHTML =
        '<div class="watchlist-empty">' +
          '<div class="watchlist-empty-dot"></div>' +
          '<span>' + t('watchlistTrackEmpty') + '</span>' +
        '</div>';
      return;
    }

    // Skip rebuild if structure is identical — animation loop keeps prices live
    const keys = top.map(a => a.sym || a.name);
    const rows = [...content.querySelectorAll('.watchlist-row[data-key]')];
    if (rows.length === top.length && keys.every((k, i) => k === rows[i]?.dataset.key)) return;

    const html = top.map(a => {
      const key   = a.sym || a.name;
      const pd    = marketStore.getPrice(key);
      const price = pd?.display ?? pd?.price ?? a.price;
      return '<div class="watchlist-row" data-key="' + key + '">' +
        '<span class="watchlist-sym">' + key + '</span>' +
        '<canvas class="watchlist-spark placeholder" data-key="' + key + '"></canvas>' +
        '<span class="watchlist-price" data-key="' + key + '">' + (price ? formatBase(price) : '--') + '</span>' +
      '</div>';
    }).join('');
    content.innerHTML = '<div class="watchlist-preview">' + html + '</div>';
    marketStore.redrawAll();
  }

  async function render() {
    const hasAssets = Array.isArray(assets) && assets.some(a => a.qty > 0);
    if (hasAssets) {
      renderWatchlist();
    } else {
      await fetchTickerPrices();
      renderTicker();
    }
  }

  watchlistStore.subscribe(render);
  render();
})();

// ── Watchlist Modal ─────────────────────────────────────────
let _wlEditing   = false;
let _wlLastAdded = null;

function _wlRenderBody() {
  const body = document.getElementById('watchlistModalBody');
  if (!body) return;

  const tracked = Array.isArray(assets)
    ? assets
        .filter(a => a.qty > 0 && watchlistStore.includes(a.sym || a.name))
        .sort((a, b) => (b.price * b.qty) - (a.price * a.qty))
    : [];

  if (tracked.length === 0) {
    body.innerHTML = '<div class="watchlist-modal-empty">' + t('watchlistEmpty') + '</div>';
  } else {
    body.innerHTML = tracked.map(a => {
      const key       = a.sym || a.name;
      const pd        = marketStore.getPrice(key);
      const rawPrice  = pd?.display ?? pd?.price ?? a.price;
      const price     = rawPrice ? formatBase(rawPrice) : '—';
      const editClass = _wlEditing ? ' editing' : '';
      const removeBtn = _wlEditing
        ? '<button class="remove-btn" data-key="' + key + '">✕</button>'
        : '';
      return '<div class="watchlist-modal-row' + editClass + '" data-key="' + key + '">' +
        '<span class="watchlist-modal-sym">'   + (a.sym  || '') + '</span>' +
        '<span class="watchlist-modal-name">'  + (a.name || '') + '</span>' +
        '<span class="watchlist-modal-price">' + price          + '</span>' +
        removeBtn +
      '</div>';
    }).join('');

    // Animate newly added row
    if (_wlLastAdded) {
      const newRow = body.querySelector('[data-key="' + _wlLastAdded + '"]');
      if (newRow) {
        newRow.classList.add('new', 'highlight');
        setTimeout(() => newRow.classList.remove('highlight'), 400);
        newRow.addEventListener('animationend', () => newRow.classList.remove('new'), { once: true });
      }
      _wlLastAdded = null;
    }

    // Remove with exit animation
    body.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const row = btn.closest('.watchlist-modal-row');
        row.classList.add('removing');
        setTimeout(() => {
          watchlistStore.remove(btn.dataset.key);
          _wlRenderBody();
          _wlRenderPanel();
        }, 180);
      });
    });
  }

  const addBtn = document.getElementById('watchlistAddBtn');
  if (addBtn) {
    addBtn.textContent = _wlEditing ? '✓' : '+';
    addBtn.classList.toggle('add-button--active', _wlEditing);
  }
}

function _wlRenderPanel() {
  const panel   = document.getElementById('addAssetPanel');
  const results = document.getElementById('addAssetResults');
  if (!panel || !results) return;

  panel.classList.toggle('hidden', !_wlEditing);
  if (!_wlEditing) return;

  const query  = (document.getElementById('addAssetInput')?.value || '').toLowerCase();
  const hidden = Array.isArray(assets)
    ? assets.filter(a => a.qty > 0 && !watchlistStore.includes(a.sym || a.name))
    : [];
  const filtered = hidden.filter(a =>
    !query ||
    (a.sym  || '').toLowerCase().includes(query) ||
    (a.name || '').toLowerCase().includes(query)
  );

  if (filtered.length === 0) {
    results.innerHTML = '<div class="watchlist-modal-empty" style="padding:8px 0 0">' +
      (hidden.length === 0 ? t('watchlistModalEmpty') : t('watchlistModalNoResults')) + '</div>';
  } else {
    results.innerHTML = filtered.map(a =>
      '<div class="add-asset-result" data-key="' + (a.sym || a.name) + '">' +
        '<span class="watchlist-modal-sym">'  + (a.sym  || '') + '</span>' +
        '<span class="watchlist-modal-name">' + (a.name || '') + '</span>' +
      '</div>'
    ).join('');

    results.querySelectorAll('.add-asset-result').forEach(el => {
      el.addEventListener('click', () => {
        _wlLastAdded = el.dataset.key;
        watchlistStore.add(el.dataset.key);
        _wlRenderBody();
        _wlRenderPanel();
      });
    });
  }
}

function toggleWatchlistEditMode() {
  _wlEditing = !_wlEditing;
  _wlRenderBody();
  _wlRenderPanel();
}

function openWatchlistModal() {
  const modal = document.getElementById('watchlist-modal');
  if (!modal) return;
  _wlEditing = false;
  modal.classList.remove('hidden');
  // Double rAF ensures display:flex is applied before transition starts
  requestAnimationFrame(() => requestAnimationFrame(() => modal.classList.add('open')));
  _wlRenderBody();
  _wlRenderPanel();
}

function closeWatchlistModal() {
  const modal = document.getElementById('watchlist-modal');
  if (!modal) return;
  modal.classList.remove('open');
  setTimeout(() => modal.classList.add('hidden'), 200);
  _wlEditing = false;
}

document.addEventListener('DOMContentLoaded', () => {
  enforceNavOrder();

  const modal = document.getElementById('watchlist-modal');
  if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeWatchlistModal(); });

  const card = document.querySelector('.watchlist-inner-card');
  if (card) card.addEventListener('click', openWatchlistModal);

  const input = document.getElementById('addAssetInput');
  if (input) input.addEventListener('input', _wlRenderPanel);

  // Hero CTA — dismiss hero, show dashboard
  const heroCta = document.getElementById('heroCtaBtn');
  if (heroCta) {
    heroCta.addEventListener('click', () => {
      switchView('dashboard');
      switchTab('home');
    });
  }

});

// ── Mobile FAB ─────────────────────────────────────────────
(function initFab() {
  const fab  = document.getElementById('portfolioFab');
  const menu = document.getElementById('fabMenuGlobal');
  if (!fab) return;

  fab.addEventListener('click', e => {
    e.stopPropagation();

    if (window.innerWidth <= 768) {
      openModal();
      return;
    }

    if (!menu) return;
    const rect = fab.getBoundingClientRect();
    menu.style.top  = (rect.bottom + 10) + 'px';
    menu.style.left = (rect.right - 190) + 'px';
    menu.classList.toggle('open');
  });

  if (menu) {
    document.addEventListener('click', e => {
      if (!fab.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    menu.querySelector('[data-action="asset"]').onclick    = openModal;
    menu.querySelector('[data-action="liquidity"]').onclick = openLiquidityModal;
  }
})();

if (IS_DEV) {
  console.log('[DEBUG] SUPABASE_URL:', typeof SUPABASE_URL);
  console.log('[DEBUG] supabase object:', typeof window.supabase);
}

