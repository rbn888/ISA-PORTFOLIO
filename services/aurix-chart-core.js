/* ─────────────────────────────────────────────────────────────────
   AurixChartCore — CHART-2 isolated prototype.

   ONE chart engine, MANY surfaces (future). Today: prototype only.

   Public API (attached to window.AurixCharts):
     createChart(container, options) → controller
     createSparkline(container, options) → controller    // sugar for variant: 'sparkline'
     createMockSeries(opts) → AurixSeries
     mountDemo() / destroyDemo()
     isReady() → boolean   (LightweightCharts loaded?)

   Controller contract:
     setData(series, meta?) | setRange(range) | setCurrency(currency)
     setState(state)        | resize()        | destroy()

   No production surface is touched by this module. The legacy Chart.js
   instances and SVG sparklines continue to render as before.
   ───────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── Theme tokens ────────────────────────────────────────────────
  const THEME = Object.freeze({
    bg:        'transparent',
    text:      'rgba(220, 230, 250, 0.42)',
    textHi:    'rgba(225, 233, 255, 0.92)',
    line:      'rgba(138, 166, 255, 0.95)',          // Aurix blue
    lineUp:    'rgba(63, 191, 127, 0.95)',
    lineDown:  'rgba(224, 90, 90, 0.95)',
    areaTop:   'rgba(138, 166, 255, 0.28)',
    areaBot:   'rgba(138, 166, 255, 0.00)',
    areaTopUp: 'rgba(63, 191, 127, 0.22)',
    areaTopDn: 'rgba(224, 90, 90, 0.22)',
    grid:      'rgba(255, 255, 255, 0.035)',
    crosshair: 'rgba(138, 166, 255, 0.40)',
    border:    'rgba(255, 255, 255, 0.06)',
  });

  // ── Internal state ──────────────────────────────────────────────
  const _instances = new Set();
  let _stylesInjected = false;
  let _libLoadWarned  = false;

  function _isLangEs() {
    try {
      return (typeof lang !== 'undefined' && lang === 'es')
          || String(document.documentElement.lang || '').toLowerCase().startsWith('es');
    } catch (_) { return false; }
  }

  function _isReady() {
    return typeof window !== 'undefined'
        && typeof window.LightweightCharts === 'object'
        && typeof window.LightweightCharts.createChart === 'function';
  }

  // ── Inject scoped styles for chart chrome (states, badges, etc.).
  //    Self-contained inside this module so the engine is genuinely
  //    isolated — no styles.css edits.
  function _injectStyles() {
    if (_stylesInjected) return;
    _stylesInjected = true;
    const css = `
      .aurix-chart-host { position: relative; width: 100%; min-height: 0; overflow: hidden; }
      .aurix-chart-host[data-variant="sparkline"] { min-height: 0; }
      .aurix-chart-canvas { position: absolute; inset: 0; }
      .aurix-chart-state {
        position: absolute; inset: 0;
        display: none;
        align-items: center; justify-content: center;
        pointer-events: none;
        font-family: inherit;
        font-size: 12.5px;
        color: rgba(220,230,250,0.55);
        letter-spacing: 0.005em;
        text-align: center;
        padding: 12px;
      }
      .aurix-chart-host[data-state="loading"] .aurix-chart-state--loading,
      .aurix-chart-host[data-state="empty"]   .aurix-chart-state--empty,
      .aurix-chart-host[data-state="error"]   .aurix-chart-state--error {
        display: flex;
      }
      .aurix-chart-host[data-state="loading"] .aurix-chart-canvas,
      .aurix-chart-host[data-state="empty"]   .aurix-chart-canvas,
      .aurix-chart-host[data-state="error"]   .aurix-chart-canvas {
        opacity: 0.0;
      }
      .aurix-chart-skeleton {
        width: 80%;
        height: 60%;
        border-radius: 8px;
        background: linear-gradient(
          90deg,
          rgba(255,255,255,0.03) 0%,
          rgba(138,166,255,0.06) 50%,
          rgba(255,255,255,0.03) 100%
        );
        background-size: 200% 100%;
        animation: aurix-chart-shimmer 1.4s linear infinite;
      }
      @keyframes aurix-chart-shimmer {
        from { background-position: 200% 0; }
        to   { background-position: -200% 0; }
      }
      .aurix-chart-badge {
        position: absolute;
        top: 8px; right: 8px;
        padding: 3px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: rgba(225,233,255,0.78);
        background: rgba(138,166,255,0.10);
        border: 1px solid rgba(138,166,255,0.22);
        pointer-events: none;
      }
      .aurix-chart-badge[hidden] { display: none; }
      .aurix-chart-tooltip {
        position: absolute;
        pointer-events: none;
        z-index: 4;
        min-width: 100px;
        padding: 8px 10px;
        border-radius: 10px;
        background: rgba(14,18,28,0.92);
        border: 1px solid rgba(255,255,255,0.07);
        box-shadow: 0 12px 28px -16px rgba(4,8,16,0.85);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        font-family: inherit;
        font-size: 12px;
        color: rgba(225,233,255,0.92);
        opacity: 0;
        transform: translate(-50%, -100%) translateY(-8px);
        transition: opacity 0.12s ease;
      }
      .aurix-chart-tooltip[data-visible="true"] { opacity: 1; }
      .aurix-chart-tooltip-time {
        font-size: 10.5px;
        color: rgba(220,230,250,0.55);
        letter-spacing: 0.04em;
        text-transform: uppercase;
        margin-bottom: 2px;
      }
      .aurix-chart-tooltip-value {
        font-size: 14px;
        font-weight: 700;
        letter-spacing: -0.005em;
        font-variant-numeric: tabular-nums;
      }
      .aurix-chart-tooltip-value.is-up   { color: #3FBF7F; }
      .aurix-chart-tooltip-value.is-down { color: #E05A5A; }
      .aurix-chart-tooltip-pct {
        margin-top: 2px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.01em;
        font-variant-numeric: tabular-nums;
        color: rgba(220,230,250,0.55);
      }
      .aurix-chart-tooltip-pct.is-up   { color: #3FBF7F; }
      .aurix-chart-tooltip-pct.is-down { color: #E05A5A; }
      /* CHART-4B: belt-and-braces watermark suppression. The 4.x
         attributionLogo:false option is the primary defence; this
         covers any LWC build that ignores it or any DOM element the
         library injects with a recognisable id/href. Scoped strictly
         inside .aurix-chart-host so no global selector is touched. */
      .aurix-chart-host a[href*="tradingview"],
      .aurix-chart-host #tv-attr-logo,
      .aurix-chart-host [id^="tv-attr"] {
        display: none !important;
        pointer-events: none !important;
      }
      /* CHART-4C hotfix: hard touch lock on the dashboard slider while
         the chart is in inspection mode. stopPropagation in the state
         machine already prevents the slider's listeners from running,
         but touch-action:none is the browser-level guarantee that no
         native gesture (pull-to-refresh, scroll, pinch) reclaims the
         finger. Scoped to the explicit attribute we set on enter. */
      [data-chart-inspecting="1"],
      [data-chart-inspecting="1"] * {
        touch-action: none !important;
      }
      .aurix-chart-ranges {
        display: flex;
        gap: 6px;
        margin-bottom: 8px;
      }
      .aurix-chart-range {
        padding: 5px 10px;
        font-size: 11px;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: rgba(220,230,250,0.6);
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.07);
        border-radius: 999px;
        cursor: pointer;
        font-family: inherit;
        transition: color 0.15s ease, background 0.15s ease, border-color 0.15s ease;
      }
      .aurix-chart-range:hover {
        color: rgba(225,233,255,0.92);
        border-color: rgba(138,166,255,0.22);
        background: rgba(138,166,255,0.06);
      }
      .aurix-chart-range[aria-pressed="true"] {
        color: #fff;
        border-color: rgba(138,166,255,0.45);
        background: rgba(138,166,255,0.14);
      }
      .aurix-chart-sandbox {
        display: grid;
        grid-template-columns: 1fr;
        gap: 22px;
        padding: 22px;
        background: rgba(8,12,20,0.92);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 18px;
        color: rgba(225,233,255,0.92);
      }
      .aurix-chart-sandbox h4 {
        font-size: 11px;
        font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(220,230,250,0.55);
        margin-bottom: 10px;
      }
      .aurix-chart-sandbox .demo-card {
        padding: 16px;
        border-radius: 14px;
        background: rgba(255,255,255,0.02);
        border: 1px solid rgba(255,255,255,0.05);
      }
      .aurix-chart-sandbox .demo-row {
        display: flex;
        align-items: center;
        gap: 14px;
      }
      .aurix-chart-sandbox .demo-row .demo-card { flex: 1; }
    `;
    const style = document.createElement('style');
    style.dataset.aurixChartCore = '1';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // ── Mock series generator (CHART-2 only) ───────────────────────
  // Deterministic-ish random walk; intentionally NOT a hard seed so
  // each call shows a slightly different shape. No business logic.
  function createMockSeries(opts) {
    const o = opts || {};
    const range  = o.range  || '7d';
    const trend  = (typeof o.trend === 'number') ? o.trend : 0.0008;
    const base   = (typeof o.base  === 'number') ? o.base  : 18450;
    const points = ({ '24h': 96, '7d': 168, '30d': 180, '3m': 180, '1y': 220, 'all': 250 })[range] || 168;
    const spanMs = ({ '24h': 24*3600e3, '7d': 7*86400e3, '30d': 30*86400e3, '3m': 90*86400e3, '1y': 365*86400e3, 'all': 730*86400e3 })[range] || 7*86400e3;
    const now    = Date.now();
    const step   = spanMs / points;
    let v = base;
    const series = [];
    for (let i = 0; i < points; i++) {
      const t = now - spanMs + i * step;
      const drift  = (Math.random() - 0.48) * base * 0.006;
      const trendy = base * trend * i;
      v = Math.max(1, v + drift + trendy * 0.02);
      series.push({ time: t, value: +v.toFixed(2) });
    }
    return {
      series,
      meta: {
        source: 'mock',
        currency: 'USD',
        asOf: now,
        granularity: range === '24h' ? '15m' : '1h',
        isSynthetic: true,
        completeness: 1,
      },
    };
  }

  // ── Internal helpers ───────────────────────────────────────────
  function _msToSec(ms) { return Math.floor(ms / 1000); }

  function _formatTooltipTime(ms, range) {
    try {
      const d = new Date(ms);
      const esLocale = _isLangEs() ? 'es-ES' : 'en-US';
      if (range === '24h') {
        return d.toLocaleTimeString(esLocale, { hour: '2-digit', minute: '2-digit' });
      }
      if (range === '7d') {
        return d.toLocaleDateString(esLocale, { weekday: 'short', day: '2-digit' });
      }
      return d.toLocaleDateString(esLocale, { day: '2-digit', month: 'short' });
    } catch (_) { return ''; }
  }

  function _formatTooltipValue(value, currency) {
    try {
      const locale = _isLangEs() ? 'es-ES' : 'en-US';
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency || 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);
    } catch (_) { return String(value); }
  }

  // ── Chart factory ──────────────────────────────────────────────
  function createChart(container, options) {
    _injectStyles();
    const opts = Object.assign({
      variant:        'portfolio',  // 'portfolio' | 'asset' | 'sparkline' | 'mini'
      height:         null,
      currency:       'USD',
      showTooltip:    true,
      showCrosshair:  true,
      showTimeScale:  true,
      showPriceScale: true,
      colorMode:      'auto',       // 'auto' | 'positive' | 'negative' | 'neutral'
      compact:        false,
      range:          '7d',
      // CHART-4C: opt-in long-press inspection for mobile. When true,
      // the chart stays touch-inert until a stationary press of
      // ~180ms; then a crosshair + tooltip activate while the finger
      // drags. Release returns to inert (page scroll/swipe normal).
      mobileInspection: false,
    }, options || {});

    if (!container || !(container instanceof HTMLElement)) {
      throw new Error('AurixCharts.createChart: container element required');
    }
    if (opts.variant === 'sparkline' || opts.variant === 'mini') {
      opts.showTooltip    = !!options?.showTooltip;
      opts.showCrosshair  = !!options?.showCrosshair;
      opts.showTimeScale  = false;
      opts.showPriceScale = false;
    }

    // Host element wraps both the chart canvas and the state overlays.
    const host = document.createElement('div');
    host.className = 'aurix-chart-host';
    host.dataset.variant = opts.variant;
    host.dataset.state   = 'loading';
    if (opts.height) host.style.height = opts.height + 'px';
    else if (opts.variant === 'sparkline') host.style.height = '32px';
    else if (opts.variant === 'mini')      host.style.height = '64px';
    else                                    host.style.height = '240px';

    const canvasHolder = document.createElement('div');
    canvasHolder.className = 'aurix-chart-canvas';
    host.appendChild(canvasHolder);

    const tooltip = document.createElement('div');
    tooltip.className = 'aurix-chart-tooltip';
    tooltip.innerHTML = '<div class="aurix-chart-tooltip-time"></div><div class="aurix-chart-tooltip-value"></div>';
    if (opts.showTooltip) host.appendChild(tooltip);

    const badge = document.createElement('div');
    badge.className = 'aurix-chart-badge';
    badge.hidden = true;
    host.appendChild(badge);

    const loading = document.createElement('div');
    loading.className = 'aurix-chart-state aurix-chart-state--loading';
    loading.innerHTML = '<div class="aurix-chart-skeleton"></div>';
    host.appendChild(loading);

    const empty = document.createElement('div');
    empty.className = 'aurix-chart-state aurix-chart-state--empty';
    empty.textContent = _isLangEs() ? 'Sin datos disponibles' : 'No data available';
    host.appendChild(empty);

    const errorEl = document.createElement('div');
    errorEl.className = 'aurix-chart-state aurix-chart-state--error';
    errorEl.textContent = _isLangEs() ? 'No se pudo cargar el gráfico' : 'Chart could not be loaded';
    host.appendChild(errorEl);

    container.appendChild(host);

    // Bail out gracefully if the library never loaded — the consumer
    // still gets a controller with a sane API, but the surface shows
    // the error state and console.warn fires exactly once.
    if (!_isReady()) {
      if (!_libLoadWarned) {
        _libLoadWarned = true;
        console.warn('[AurixCharts] LightweightCharts not loaded — engine running in fallback (state=error).');
      }
      host.dataset.state = 'error';
      const controller = {
        host,
        setData: () => {},
        setRange: () => {},
        setCurrency: () => {},
        setState: (s) => { if (s) host.dataset.state = s; },
        resize: () => {},
        destroy: () => {
          if (host.parentNode) host.parentNode.removeChild(host);
          _instances.delete(controller);
        },
      };
      _instances.add(controller);
      return controller;
    }

    // ── Build the Lightweight Charts instance ───────────────────
    const LWC = window.LightweightCharts;
    // CHART-4B: premium compact currency formatter for the right axis
    // and any LWC-driven numeric output. State is kept in a closure so
    // setCurrency() rebinds it without recreating the chart.
    let _formatterCurrency = (opts.currency || 'USD').toUpperCase();
    const _compactCurrency = (value, currency) => {
      const sym = (currency || _formatterCurrency) === 'EUR' ? '€' : '$';
      if (!Number.isFinite(value)) return '';
      const abs = Math.abs(value);
      if (abs >= 1_000_000) return sym + (value / 1_000_000).toFixed(2) + 'M';
      if (abs >= 10_000)    return sym + (value / 1_000).toFixed(1) + 'K';
      if (abs >= 1_000)     return sym + (value / 1_000).toFixed(2) + 'K';
      if (abs >= 100)       return sym + value.toFixed(0);
      return sym + value.toFixed(2);
    };
    const _priceFormatter = v => _compactCurrency(v, _formatterCurrency);

    const chart = LWC.createChart(canvasHolder, {
      width:  canvasHolder.clientWidth  || 320,
      height: canvasHolder.clientHeight || 240,
      layout: {
        background: { type: 'solid', color: 'rgba(0,0,0,0)' },
        textColor:  THEME.text,
        fontFamily: 'inherit',
        fontSize:   11,
        // CHART-4B: suppress the Lightweight Charts attribution logo so
        // the surface reads as Aurix-native. Library supports this in
        // 4.x; older builds silently ignore the option and we'll catch
        // them via the scoped CSS guard below.
        attributionLogo: false,
      },
      // CHART-4B: pass the compact currency formatter into the chart's
      // localization layer. Right axis ticks and any LWC-default tooltip
      // (we override with our own DOM tooltip) will use it.
      localization: {
        priceFormatter: _priceFormatter,
      },
      grid: {
        vertLines: { color: opts.showPriceScale ? THEME.grid : 'rgba(0,0,0,0)' },
        horzLines: { color: opts.showPriceScale ? THEME.grid : 'rgba(0,0,0,0)' },
      },
      rightPriceScale: {
        visible: !!opts.showPriceScale,
        borderVisible: false,
        scaleMargins: { top: 0.10, bottom: 0.04 },
      },
      leftPriceScale: { visible: false },
      timeScale: {
        visible: !!opts.showTimeScale,
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: opts.showCrosshair
        ? {
            mode: LWC.CrosshairMode ? LWC.CrosshairMode.Magnet : 1,
            vertLine: { color: THEME.crosshair, style: 2, width: 1, labelVisible: false },
            horzLine: { color: THEME.crosshair, style: 2, width: 1, labelVisible: false },
          }
        : { mode: 0 },
      handleScroll: opts.variant === 'sparkline' ? false : true,
      handleScale:  opts.variant === 'sparkline' ? false : true,
    });

    const series = chart.addAreaSeries({
      lineColor:       THEME.line,
      lineWidth:       2,
      topColor:        THEME.areaTop,
      bottomColor:     THEME.areaBot,
      priceLineVisible: false,
      lastValueVisible: opts.variant !== 'sparkline',
      crosshairMarkerVisible: opts.variant !== 'sparkline',
      crosshairMarkerRadius:  3,
      // CHART-4B: custom series-level price format so the price scale
      // marker label (the floating chip next to the crosshair) also
      // uses Aurix compact currency, not Lightweight Charts' default.
      priceFormat: {
        type: 'custom',
        formatter: _priceFormatter,
        minMove: 0.01,
      },
    });

    // Apply colorMode shading at series level.
    function _applyColor(mode) {
      if (mode === 'positive')      series.applyOptions({ lineColor: THEME.lineUp,   topColor: THEME.areaTopUp, bottomColor: THEME.areaBot });
      else if (mode === 'negative') series.applyOptions({ lineColor: THEME.lineDown, topColor: THEME.areaTopDn, bottomColor: THEME.areaBot });
      else                          series.applyOptions({ lineColor: THEME.line,    topColor: THEME.areaTop,   bottomColor: THEME.areaBot });
    }
    if (opts.colorMode && opts.colorMode !== 'auto') _applyColor(opts.colorMode);

    // ── Tooltip wiring ──────────────────────────────────────────
    let _state = {
      currency: opts.currency,
      range:    opts.range,
      data:     [],
      meta:     null,
    };

    // CHART-4C hotfix: shared tooltip renderer reachable from BOTH
    // the LWC subscribeCrosshairMove callback (desktop hover) AND the
    // mobile inspection state machine. Previously the handler bailed
    // on `!param.point`, which is undefined when LWC fires the
    // callback from a programmatic setCrosshairPosition() call — so
    // the tooltip never rendered for the mobile path. Now the state
    // machine can call _renderTooltip(value, timeMs, xClient) directly.
    const _ttTimeEl = (opts.showTooltip)
      ? (tooltip.innerHTML =
          '<div class="aurix-chart-tooltip-time"></div>' +
          '<div class="aurix-chart-tooltip-value"></div>' +
          '<div class="aurix-chart-tooltip-pct"></div>',
         tooltip.querySelector('.aurix-chart-tooltip-time'))
      : null;
    const _ttValEl = opts.showTooltip ? tooltip.querySelector('.aurix-chart-tooltip-value') : null;
    const _ttPctEl = opts.showTooltip ? tooltip.querySelector('.aurix-chart-tooltip-pct')   : null;

    function _renderTooltip(value, timeMs, xClient, yClient) {
      if (!opts.showTooltip || !_ttTimeEl || !_ttValEl) return;
      _ttTimeEl.textContent = _formatTooltipTime(timeMs, _state.range);
      _ttValEl.textContent  = _formatTooltipValue(value, _state.currency);
      const first = _state.data[0]?.value;
      const dir = first == null
        ? 'flat'
        : (value > first ? 'up' : (value < first ? 'down' : 'flat'));
      _ttValEl.classList.toggle('is-up',   dir === 'up');
      _ttValEl.classList.toggle('is-down', dir === 'down');
      if (_ttPctEl) {
        if (first != null && first > 0) {
          const pct = ((value - first) / first) * 100;
          const sign = pct >= 0 ? '+' : '';
          _ttPctEl.textContent = `${sign}${pct.toFixed(2)}%`;
          _ttPctEl.classList.toggle('is-up',   pct > 0.005);
          _ttPctEl.classList.toggle('is-down', pct < -0.005);
        } else {
          _ttPctEl.textContent = '';
        }
      }
      const hostRect = host.getBoundingClientRect();
      const ttW = tooltip.offsetWidth  || 120;
      const ttH = tooltip.offsetHeight || 56;
      const localX = (typeof xClient === 'number') ? (xClient - hostRect.left) : (hostRect.width / 2);
      // y: prefer the supplied yClient (desktop hover provides it);
      // mobile inspection passes only x → pin tooltip near the top.
      const localY = (typeof yClient === 'number')
        ? Math.max(ttH + 6, yClient - hostRect.top)
        : (ttH + 16);
      const left = Math.max(ttW / 2 + 6, Math.min(hostRect.width - ttW / 2 - 6, localX));
      tooltip.style.left = left + 'px';
      tooltip.style.top  = localY + 'px';
      tooltip.dataset.visible = 'true';
    }
    function _hideTooltip() {
      if (tooltip) tooltip.dataset.visible = 'false';
    }

    // CHART-7A: engine-level tooltip lifecycle correctness.
    //
    // Bug fixed here: previous CHART-4C guard kept the tooltip alive
    // when LWC fired subscribeCrosshairMove on desktop pointer-exit
    // (param.time / point / seriesData ALL undefined). The handler
    // bailed out before any _hideTooltip() call → stale tooltip.
    //
    // Fix model:
    //   • _inspectionActive flag set by the mobile state machine
    //     while it owns the tooltip lifecycle (long-press → release).
    //     subscribeCrosshairMove returns early when this is true so
    //     mobile rendering is never overridden.
    //   • When _inspectionActive is false (desktop or mobile-idle),
    //     ANY invalid payload (no time, no data, no point) hides
    //     the tooltip immediately. No exit case slips through.
    //   • Belt-and-braces pointerleave + mouseleave on the host so
    //     even an LWC build that ever misses the leave callback
    //     still cleans up via the DOM.
    //   • destroy() unconditionally hides + clears crosshair so the
    //     last surface state never leaks past teardown.
    let _inspectionActive = false;

    if (opts.showTooltip && opts.showCrosshair) {
      chart.subscribeCrosshairMove(param => {
        // Mobile inspection owns the tooltip — never touch it from
        // this callback during a programmatic setCrosshairPosition.
        if (_inspectionActive) return;
        if (!param || !param.time || !param.point || !param.seriesData?.size) {
          _hideTooltip();
          return;
        }
        const data = param.seriesData.get(series);
        if (!data || typeof data.value !== 'number') {
          _hideTooltip();
          return;
        }
        const ms = (typeof param.time === 'number' ? param.time * 1000 : Date.parse(param.time));
        _renderTooltip(data.value, ms, undefined, undefined);
        // Snap x/y to the actual pointer for premium desktop hover.
        const hostRect = host.getBoundingClientRect();
        tooltip.style.left = Math.max(60, Math.min(hostRect.width - 60, param.point.x)) + 'px';
        tooltip.style.top  = Math.max(60, param.point.y) + 'px';
      });
    }

    // Belt-and-braces leave handlers. Cover the case where LWC's
    // subscribeCrosshairMove doesn't fire (or fires too late) on a
    // fast pointer exit, a modal close that detaches the host, or a
    // window blur. Both events are needed: pointerleave for modern
    // browsers, mouseleave as a fallback for any environment that
    // doesn't synthesize pointer events for a particular input.
    let _onHostLeave = null;
    if (opts.showTooltip) {
      _onHostLeave = () => {
        if (_inspectionActive) return;  // mobile owns its own teardown
        _hideTooltip();
        try { if (typeof chart.clearCrosshairPosition === 'function') chart.clearCrosshairPosition(); } catch (_) {}
      };
      host.addEventListener('pointerleave', _onHostLeave);
      host.addEventListener('mouseleave',   _onHostLeave);
    }

    // ── CHART-4C: mobile inspection state machine ───────────────
    // Premium long-press → crosshair/tooltip → release flow. Opt-in
    // via opts.mobileInspection.
    //
    // Two CHART-4C hotfixes:
    //   1. Listeners attach to the first ancestor whose computed
    //      pointer-events is NOT 'none'. host.parentNode is the
    //      caller's container which is pointer-events:none on mobile,
    //      so listeners attached there never fire (the element isn't
    //      a hit-test target and the cascade hides descendants too).
    //   2. We drive the crosshair via chart.setCrosshairPosition() /
    //      clearCrosshairPosition() — the official LWC API. Synthetic
    //      MouseEvents don't trigger LWC's touch-mode crosshair.
    //      setCrosshairPosition fires subscribeCrosshairMove on its
    //      own, so the existing DOM tooltip handler still lights up.
    let _mInsCleanup = null;
    if (opts.mobileInspection) {
      // Find the first ancestor that can actually receive touches.
      let TARGET = host.parentNode;
      try {
        let cur = host.parentNode;
        const docView = (cur && cur.ownerDocument && cur.ownerDocument.defaultView) || window;
        while (cur && cur instanceof Element) {
          const cs = docView.getComputedStyle(cur);
          if (cs && cs.pointerEvents !== 'none') { TARGET = cur; break; }
          cur = cur.parentNode;
        }
      } catch (_) { /* fall back to host.parentNode */ }

      if (TARGET) {
        const MOVE_TOL = 10;
        const PRESS_MS = 180;
        let pressTimer  = 0;
        let startX = 0, startY = 0;
        let curX = 0,   curY = 0;
        let inspecting = false;
        let suppressNextClick = false;

        const _canvasEl = () => canvasHolder.querySelector('canvas');

        // Walk up to find the nearest dashboard slider root so we can
        // mark inspection on it. CSS / other JS observers can hook
        // [data-chart-inspecting="1"] to lock animations / gestures
        // beyond what stopPropagation already covers.
        const _findSliderRoot = () => {
          let cur = host;
          while (cur && cur instanceof Element) {
            if (cur.id === 'portfolioMobileSlider' ||
                cur.classList?.contains('portfolio-mobile-slider') ||
                cur.classList?.contains('mobile-slider-track')) return cur;
            cur = cur.parentNode;
          }
          return null;
        };
        const sliderRoot = _findSliderRoot();

        // Snap a clientX to the nearest data bar, tell LWC to render
        // its crosshair, AND render our DOM tooltip directly (the LWC
        // subscribeCrosshairMove callback fires with no point info on
        // programmatic setCrosshairPosition, so we cannot rely on it).
        const _crosshairAt = (clientX) => {
          if (!Array.isArray(_state.data) || !_state.data.length) return;
          const c = _canvasEl();
          if (!c) return;
          const rect = c.getBoundingClientRect();
          const x = clientX - rect.left;
          if (x < 0 || x > rect.width) return;
          let tAtX;
          try { tAtX = chart.timeScale().coordinateToTime(x); } catch (_) { return; }
          if (tAtX == null) return;
          const tSec = typeof tAtX === 'number'
            ? tAtX
            : Math.floor(Date.parse(tAtX) / 1000);
          // Linear nearest-neighbour over _state.data (always ≤ a
          // few hundred points after dedupe — fast enough per touch).
          let nearest = null, bestDiff = Infinity;
          for (const p of _state.data) {
            if (!p || typeof p.time !== 'number' || typeof p.value !== 'number') continue;
            const pSec = Math.floor(p.time / 1000);
            const diff = Math.abs(pSec - tSec);
            if (diff < bestDiff) { bestDiff = diff; nearest = p; }
          }
          if (!nearest) return;
          try {
            chart.setCrosshairPosition(nearest.value, Math.floor(nearest.time / 1000), series);
          } catch (_) {}
          // Render our DOM tooltip directly — bypasses the subscribe
          // callback whose param.point is undefined on programmatic
          // crosshair updates.
          _renderTooltip(nearest.value, nearest.time, clientX, undefined);
        };
        const _clearCrosshair = () => {
          try { chart.clearCrosshairPosition(); } catch (_) {}
          _hideTooltip();
        };

        const enter = (x) => {
          inspecting = true;
          // CHART-7A: flip the engine-wide inspection flag so the
          // subscribeCrosshairMove handler stops touching the tooltip
          // while mobile is in charge.
          _inspectionActive = true;
          host.dataset.inspecting = 'true';
          // Mark the dashboard slider root so any external listener
          // (and our touch-action CSS guard below) can lock swipe.
          if (sliderRoot) sliderRoot.setAttribute('data-chart-inspecting', '1');
          _crosshairAt(x);
        };
        const exit = () => {
          if (!inspecting) return;
          inspecting = false;
          _inspectionActive = false;
          delete host.dataset.inspecting;
          if (sliderRoot) sliderRoot.removeAttribute('data-chart-inspecting');
          _clearCrosshair();
        };

        const onTouchStart = (e) => {
          if (inspecting) return;
          if (!e.touches || e.touches.length !== 1) return;
          const t = e.touches[0];
          // Only react when the touch actually started over the
          // chart host's bounding box. The ancestor target may cover
          // a larger area (e.g. the whole card) — we don't want a
          // press on the header / controls to enter inspection.
          const r = host.getBoundingClientRect();
          if (t.clientX < r.left || t.clientX > r.right ||
              t.clientY < r.top  || t.clientY > r.bottom) {
            return;
          }
          startX = curX = t.clientX;
          startY = curY = t.clientY;
          clearTimeout(pressTimer);
          pressTimer = setTimeout(() => {
            pressTimer = 0;
            enter(curX);
          }, PRESS_MS);
        };
        const onTouchMove = (e) => {
          if (!e.touches || e.touches.length === 0) return;
          const t = e.touches[0];
          curX = t.clientX;
          curY = t.clientY;
          if (inspecting) {
            // Block page scroll AND prevent the ancestor carousel /
            // slider listeners from seeing this event. preventDefault
            // alone is not enough — the dashboard slider sets its own
            // isDragging=true on touchstart and would still apply a
            // transform during bubble. stopPropagation cuts the
            // bubble path entirely so the slider never moves.
            try { e.preventDefault();  } catch (_) {}
            try { e.stopPropagation(); } catch (_) {}
            _crosshairAt(curX);
            return;
          }
          if (pressTimer) {
            if (Math.abs(curX - startX) > MOVE_TOL ||
                Math.abs(curY - startY) > MOVE_TOL) {
              clearTimeout(pressTimer);
              pressTimer = 0;
            }
          }
        };
        const onTouchEnd = (e) => {
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = 0; }
          if (inspecting) {
            // Swallow the carousel's touchend so it doesn't apply a
            // final swipe based on the inspection drag's dx.
            try { if (e && e.stopPropagation) e.stopPropagation(); } catch (_) {}
            suppressNextClick = true;
            setTimeout(() => { suppressNextClick = false; }, 350);
            exit();
          }
        };
        const onClickCapture = (e) => {
          if (suppressNextClick) {
            try { e.stopPropagation(); e.preventDefault(); } catch (_) {}
          }
        };

        TARGET.addEventListener('touchstart', onTouchStart, { passive: true });
        TARGET.addEventListener('touchmove',  onTouchMove,  { passive: false });
        TARGET.addEventListener('touchend',   onTouchEnd,   { passive: true });
        TARGET.addEventListener('touchcancel',onTouchEnd,   { passive: true });
        TARGET.addEventListener('click',      onClickCapture, true);

        _mInsCleanup = () => {
          try { clearTimeout(pressTimer); } catch (_) {}
          try { exit(); } catch (_) {}
          TARGET.removeEventListener('touchstart', onTouchStart);
          TARGET.removeEventListener('touchmove',  onTouchMove);
          TARGET.removeEventListener('touchend',   onTouchEnd);
          TARGET.removeEventListener('touchcancel',onTouchEnd);
          TARGET.removeEventListener('click',      onClickCapture, true);
        };
      }
    }

    // ── ResizeObserver (responsive sizing) ─────────────────────
    // CHART-4B: throttle via requestAnimationFrame so a torrent of
    // resize events (drag-resizing the window, mobile slider
    // transitions) coalesces into a single applyOptions + fitContent
    // per frame. Prevents the brief clip / lag observed before.
    let _ro = null;
    let _resizeRafId = 0;
    const _doResize = () => {
      _resizeRafId = 0;
      const w = canvasHolder.clientWidth  || 0;
      const h = canvasHolder.clientHeight || 0;
      if (!w || !h) return;
      try { chart.applyOptions({ width: w, height: h }); } catch (_) {}
      try { chart.timeScale().fitContent(); } catch (_) {}
    };
    if (typeof ResizeObserver === 'function') {
      _ro = new ResizeObserver(() => {
        if (_resizeRafId) return;
        _resizeRafId = requestAnimationFrame(_doResize);
      });
      _ro.observe(canvasHolder);
    }

    // ── Controller ──────────────────────────────────────────────
    // CHART-4B: helper that resolves a directional intent into the
    // colorMode the area series understands. Returns null if the hint
    // is unrecognised, so the caller falls back to 'auto' (first/last).
    function _resolveDirection(hint) {
      if (!hint) return null;
      const h = String(hint).toLowerCase();
      if (h === 'up'   || h === 'positive' || h === '+') return 'positive';
      if (h === 'down' || h === 'negative' || h === '-') return 'negative';
      if (h === 'flat' || h === 'neutral'  || h === '0') return 'neutral';
      return null;
    }

    const controller = {
      host,
      setData(seriesData, meta) {
        const arr = Array.isArray(seriesData) ? seriesData : [];
        if (!arr.length) {
          host.dataset.state = 'empty';
          series.setData([]);
          return;
        }
        // Lightweight Charts wants UTC seconds + ascending order.
        const formatted = arr
          .filter(p => p && typeof p.value === 'number' && Number.isFinite(p.value))
          .map(p => ({ time: _msToSec(p.time), value: p.value }))
          .sort((a, b) => a.time - b.time);
        if (!formatted.length) {
          host.dataset.state = 'empty';
          series.setData([]);
          return;
        }
        // Dedupe identical timestamps (LWC requires strictly ascending).
        const deduped = [];
        let lastT = -1;
        for (const p of formatted) {
          if (p.time === lastT) continue;
          deduped.push(p);
          lastT = p.time;
        }
        series.setData(deduped);
        // CHART-4B: prefer the explicit direction hint when provided in
        // meta. This lets the dashboard pass its own KPI direction
        // (computed from totalValueBase vs series[0]) so the line color
        // never disagrees with the displayed performance indicator.
        const hinted = meta && (meta.direction || meta.directionHint);
        const resolved = _resolveDirection(hinted);
        if (resolved) {
          _applyColor(resolved === 'neutral' ? 'neutral' : resolved);
        } else if (opts.colorMode === 'auto') {
          const first = deduped[0].value;
          const last  = deduped[deduped.length - 1].value;
          _applyColor(last >= first ? 'positive' : 'negative');
        }
        _state.data = arr;
        _state.meta = meta || null;
        // Synthetic badge
        if (meta && meta.isSynthetic) {
          badge.hidden = false;
          badge.textContent = _isLangEs() ? 'Estimación' : 'Estimate';
        } else {
          badge.hidden = true;
        }
        host.dataset.state = 'ready';
        try { chart.timeScale().fitContent(); } catch (_) {}
      },
      setRange(range) {
        _state.range = String(range || '7d');
      },
      setCurrency(currency) {
        const next = String(currency || 'USD').toUpperCase();
        _state.currency = next;
        _formatterCurrency = next;
        // Re-apply localization so the right-axis re-formats with the
        // new currency symbol. Lightweight Charts re-runs the
        // priceFormatter on next tick after applyOptions.
        try {
          chart.applyOptions({
            localization: { priceFormatter: _priceFormatter },
          });
        } catch (_) {}
      },
      // CHART-4B: explicit color direction setter — callable by
      // consumers that compute their own KPI direction (e.g. the
      // dashboard). Idempotent; pass null/'' to revert to auto on the
      // next setData call.
      setDirection(direction) {
        const resolved = _resolveDirection(direction);
        if (resolved) _applyColor(resolved === 'neutral' ? 'neutral' : resolved);
      },
      setState(state) {
        const valid = new Set(['loading', 'empty', 'error', 'ready']);
        if (valid.has(state)) host.dataset.state = state;
      },
      resize() {
        const w = canvasHolder.clientWidth  || 0;
        const h = canvasHolder.clientHeight || 0;
        if (!w || !h) return;
        try { chart.applyOptions({ width: w, height: h }); } catch (_) {}
        try { chart.timeScale().fitContent(); } catch (_) {}
      },
      destroy() {
        // CHART-7A: tooltip + crosshair must be hidden BEFORE the host
        // detaches, even when the controller is destroyed mid-hover
        // (e.g. the asset detail modal closes while the cursor is over
        // the chart). _mInsCleanup also calls exit() which clears
        // mobile inspection state, but desktop hover state lives in
        // the engine itself and needs an explicit close here.
        try { _hideTooltip(); } catch (_) {}
        try { if (typeof chart.clearCrosshairPosition === 'function') chart.clearCrosshairPosition(); } catch (_) {}
        try {
          if (_onHostLeave) {
            host.removeEventListener('pointerleave', _onHostLeave);
            host.removeEventListener('mouseleave',   _onHostLeave);
          }
        } catch (_) {}
        try { if (_mInsCleanup) _mInsCleanup(); } catch (_) {}
        try { if (_resizeRafId) cancelAnimationFrame(_resizeRafId); } catch (_) {}
        try { if (_ro) _ro.disconnect(); } catch (_) {}
        try { chart.remove(); } catch (_) {}
        if (host.parentNode) host.parentNode.removeChild(host);
        _instances.delete(controller);
      },
    };
    _instances.add(controller);
    return controller;
  }

  function createSparkline(container, options) {
    return createChart(container, Object.assign({}, options || {}, {
      variant: 'sparkline',
      showTimeScale: false,
      showPriceScale: false,
      showTooltip: !!(options && options.showTooltip),
      showCrosshair: !!(options && options.showCrosshair),
      height: (options && options.height) || 32,
    }));
  }

  // ── Range pills (optional, reusable) ───────────────────────────
  function createRangePills(container, opts) {
    _injectStyles();
    const o = Object.assign({
      ranges:  ['1D', '1W', '1M', '3M', '1Y', 'ALL'],
      initial: '1W',
      onChange: () => {},
    }, opts || {});
    const wrap = document.createElement('div');
    wrap.className = 'aurix-chart-ranges';
    wrap.setAttribute('role', 'tablist');
    const buttons = o.ranges.map(label => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'aurix-chart-range';
      b.textContent = label;
      b.setAttribute('aria-pressed', label === o.initial ? 'true' : 'false');
      b.addEventListener('click', () => {
        buttons.forEach(x => x.setAttribute('aria-pressed', x === b ? 'true' : 'false'));
        try { o.onChange(label); } catch (_) {}
      });
      wrap.appendChild(b);
      return b;
    });
    container.appendChild(wrap);
    return {
      destroy() { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); },
    };
  }

  // ── Demo / sandbox ─────────────────────────────────────────────
  let _demo = null;

  function mountDemo() {
    if (_demo) return _demo;
    _injectStyles();
    let sandbox = document.getElementById('aurixChartSandbox');
    if (!sandbox) {
      sandbox = document.createElement('div');
      sandbox.id = 'aurixChartSandbox';
      sandbox.className = 'aurix-chart-sandbox';
      sandbox.style.position = 'fixed';
      sandbox.style.right = '16px';
      sandbox.style.top   = '16px';
      sandbox.style.width = 'min(420px, calc(100vw - 32px))';
      sandbox.style.maxHeight = 'calc(100vh - 32px)';
      sandbox.style.overflowY = 'auto';
      sandbox.style.zIndex = '99999';
      sandbox.style.boxShadow = '0 24px 48px -24px rgba(4,8,16,0.95)';
      document.body.appendChild(sandbox);
    }
    sandbox.style.display = 'grid';
    sandbox.innerHTML = `
      <div>
        <button type="button" id="aurixDemoClose"
          style="float:right;padding:6px 10px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);color:rgba(225,233,255,0.85);cursor:pointer;font-family:inherit;font-size:12px;">
          Close
        </button>
        <h4 style="margin-right:60px;">Aurix Chart Sandbox</h4>
      </div>
      <div class="demo-card">
        <h4>Portfolio variant</h4>
        <div id="aurixDemoRangesHost"></div>
        <div id="aurixDemoPortfolio" style="height: 240px;"></div>
      </div>
      <div class="demo-card">
        <h4>Asset variant</h4>
        <div id="aurixDemoAsset" style="height: 220px;"></div>
      </div>
      <div class="demo-row">
        <div class="demo-card">
          <h4>Sparkline</h4>
          <div id="aurixDemoSparkline" style="height: 32px;"></div>
        </div>
        <div class="demo-card">
          <h4>Mini</h4>
          <div id="aurixDemoMini" style="height: 64px;"></div>
        </div>
      </div>
      <div class="demo-row">
        <div class="demo-card">
          <h4>Loading state</h4>
          <div id="aurixDemoLoading" style="height: 120px;"></div>
        </div>
        <div class="demo-card">
          <h4>Empty state</h4>
          <div id="aurixDemoEmpty" style="height: 120px;"></div>
        </div>
      </div>
      <div class="demo-card">
        <h4>Error state</h4>
        <div id="aurixDemoError" style="height: 120px;"></div>
      </div>
    `;

    // Build the demo charts.
    const portfolioMock = createMockSeries({ range: '7d', trend: 0.0010 });
    const assetMock     = createMockSeries({ range: '30d', base: 218, trend: -0.0006 });
    const sparkMock     = createMockSeries({ range: '24h', base: 100, trend: 0.0003 });
    const miniMock      = createMockSeries({ range: '7d', base: 64.50 });

    const portfolio = createChart(document.getElementById('aurixDemoPortfolio'), {
      variant: 'portfolio', height: 240, colorMode: 'auto', range: '1W',
    });
    portfolio.setData(portfolioMock.series, portfolioMock.meta);

    const asset = createChart(document.getElementById('aurixDemoAsset'), {
      variant: 'asset', height: 220, colorMode: 'auto', range: '1M',
    });
    asset.setData(assetMock.series, assetMock.meta);

    const ranges = createRangePills(document.getElementById('aurixDemoRangesHost'), {
      initial: '1W',
      onChange(label) {
        const map = { '1D': '24h', '1W': '7d', '1M': '30d', '3M': '3m', '1Y': '1y', 'ALL': 'all' };
        const r = map[label] || '7d';
        const fresh = createMockSeries({ range: r });
        portfolio.setRange(r);
        portfolio.setData(fresh.series, fresh.meta);
      },
    });

    const sparkline = createSparkline(document.getElementById('aurixDemoSparkline'), {
      colorMode: 'positive',
    });
    sparkline.setData(sparkMock.series, sparkMock.meta);

    const mini = createChart(document.getElementById('aurixDemoMini'), {
      variant: 'mini', height: 64, colorMode: 'auto',
    });
    mini.setData(miniMock.series, miniMock.meta);

    const loading = createChart(document.getElementById('aurixDemoLoading'), {
      variant: 'asset', height: 120, showTimeScale: false, showPriceScale: false,
    });
    loading.setState('loading');

    const emptyChart = createChart(document.getElementById('aurixDemoEmpty'), {
      variant: 'asset', height: 120, showTimeScale: false, showPriceScale: false,
    });
    emptyChart.setData([]);

    const errorChart = createChart(document.getElementById('aurixDemoError'), {
      variant: 'asset', height: 120, showTimeScale: false, showPriceScale: false,
    });
    errorChart.setState('error');

    const closeBtn = document.getElementById('aurixDemoClose');
    if (closeBtn) closeBtn.addEventListener('click', destroyDemo);

    _demo = {
      sandbox,
      controllers: [portfolio, asset, sparkline, mini, loading, emptyChart, errorChart],
      ranges,
    };
    return _demo;
  }

  function destroyDemo() {
    if (!_demo) return;
    try { _demo.controllers.forEach(c => { try { c.destroy(); } catch (_) {} }); } catch (_) {}
    try { _demo.ranges && _demo.ranges.destroy(); } catch (_) {}
    if (_demo.sandbox && _demo.sandbox.parentNode) {
      _demo.sandbox.parentNode.removeChild(_demo.sandbox);
    }
    _demo = null;
  }

  function destroyAll() {
    _instances.forEach(c => { try { c.destroy(); } catch (_) {} });
    _instances.clear();
    destroyDemo();
  }

  // ── Public surface ─────────────────────────────────────────────
  window.AurixCharts = Object.freeze({
    isReady:          _isReady,
    createChart,
    createSparkline,
    createRangePills,
    createMockSeries,
    mountDemo,
    destroyDemo,
    destroyAll,
    THEME,
  });
})();
