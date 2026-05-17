/* ─────────────────────────────────────────────────────────────────
   AurixChartAdapters — CHART-3 historical data foundation.

   ONE chart engine, MANY data sources. This module is the data side.

   Public API (attached to window.AurixChartAdapters):

     yahooHistoryAdapter({ symbol, range, signal? })
     cryptoHistoryAdapter({ coinId, range, signal? })
     portfolioHistoryAdapter({ range })

   Every adapter returns the canonical Aurix shape:

     {
       series: [
         { time: epochMs, value, open?, high?, low?, close?, volume? }
       ],
       meta: {
         source: 'yahoo' | 'coingecko' | 'local-snapshot',
         currency: 'USD',
         granularity: '5m'|'15m'|'1h'|'1d'|'1wk',
         isSynthetic: boolean,
         completeness: number,         // 0..1
         asOf: epochMs
       }
     }

   Rules:
   - All adapters emit values in canonical USD. Base-currency conversion
     is the chart layer's job (toBase at render time).
   - Errors NEVER throw — they return an empty series + meta. The chart
     core renders the empty/error state cleanly.
   - No UI surface consumes adapters in CHART-3. This is infrastructure.
   ───────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const API_BASE = 'https://isa-portfolio-ten.vercel.app';

  // ── Range → provider arg maps ─────────────────────────────────
  // Yahoo accepts named ranges + intervals; the backend already owns
  // that mapping. Crypto / CoinGecko uses `days` (a number).
  const CRYPTO_DAYS = Object.freeze({
    '24h': 1, '7d': 7, '30d': 30, '3m': 90, '1y': 365, 'all': 365,
  });

  // Coarse cumulative window in ms, used to bucket "completeness"
  // metrics for adapter responses.
  const RANGE_SPAN_MS = Object.freeze({
    '24h':       24 * 3600e3,
    '7d':    7  * 86400e3,
    '30d':  30  * 86400e3,
    '3m':   90  * 86400e3,
    '1y':  365  * 86400e3,
    'all': 730  * 86400e3,
  });

  // Expected sample count per range (rough — used for the completeness
  // metric on the meta. Never enforced.)
  const RANGE_EXPECTED = Object.freeze({
    '24h':  96,   // 5-min
    '7d':  168,
    '30d': 180,
    '3m':  180,
    '1y':  220,
    'all': 250,
  });

  function _warn(...args) { try { console.warn('[chart-adapters]', ...args); } catch (_) {} }

  function _emptyResult(source, currency, granularity) {
    return Object.freeze({
      series: [],
      meta: Object.freeze({
        source,
        currency:    (currency || 'USD').toUpperCase(),
        granularity: granularity || '1d',
        isSynthetic: false,
        completeness: 0,
        asOf: Date.now(),
      }),
    });
  }

  function _validRange(r) {
    return typeof r === 'string' && Object.prototype.hasOwnProperty.call(RANGE_SPAN_MS, r);
  }

  function _completenessFor(seriesLen, range) {
    const expected = RANGE_EXPECTED[range] || 1;
    if (expected <= 0) return 0;
    const ratio = seriesLen / expected;
    return Math.max(0, Math.min(1, +ratio.toFixed(3)));
  }

  // ── 1. Yahoo adapter ──────────────────────────────────────────
  async function yahooHistoryAdapter(args) {
    const a = args || {};
    const symbol = String(a.symbol || '').trim();
    const range  = String(a.range  || '').toLowerCase();
    if (!symbol || !_validRange(range)) {
      return _emptyResult('yahoo', 'USD', '1d');
    }

    let res;
    try {
      res = await fetch(
        `${API_BASE}/api/prices/history-yahoo` +
          `?symbol=${encodeURIComponent(symbol)}&range=${encodeURIComponent(range)}`,
        { signal: a.signal, headers: { Accept: 'application/json' } }
      );
    } catch (err) {
      _warn('yahoo fetch fail', symbol, range, err?.message);
      return _emptyResult('yahoo', 'USD', '1d');
    }
    if (!res.ok) {
      _warn('yahoo http', symbol, range, res.status);
      return _emptyResult('yahoo', 'USD', '1d');
    }

    let body;
    try { body = await res.json(); } catch (_) { body = null; }
    if (!body || body.ok !== true || !Array.isArray(body.points)) {
      return _emptyResult('yahoo', 'USD', '1d');
    }

    const granularity = String(body.granularity || '1d');
    const series = [];
    for (const p of body.points) {
      // The endpoint already filters non-finite close values. Belt-and-
      // braces: filter again here so the adapter contract is hard-typed.
      if (!p || typeof p.time !== 'number' || typeof p.close !== 'number' || !Number.isFinite(p.close)) continue;
      series.push({
        time:   p.time,
        value:  p.close,
        open:   Number.isFinite(p.open)   ? p.open   : null,
        high:   Number.isFinite(p.high)   ? p.high   : null,
        low:    Number.isFinite(p.low)    ? p.low    : null,
        close:  p.close,
        volume: Number.isFinite(p.volume) ? p.volume : null,
      });
    }

    // Yahoo's `meta.currency` is preserved verbatim by the backend (or
    // null if it didn't pass the ISO-4217 guard). For the adapter
    // contract, default to USD when the proxy couldn't confirm a code.
    const currency = (body.currency && /^[A-Z]{3}$/.test(body.currency))
      ? body.currency
      : 'USD';

    return {
      series,
      meta: {
        source:       'yahoo',
        currency:     currency,
        granularity:  granularity,
        isSynthetic:  false,
        completeness: _completenessFor(series.length, range),
        asOf:         Date.now(),
      },
    };
  }

  // ── 2. Crypto adapter (CoinGecko via existing proxy) ─────────
  async function cryptoHistoryAdapter(args) {
    const a = args || {};
    const coinId = String(a.coinId || '').trim().toLowerCase();
    const range  = String(a.range  || '').toLowerCase();
    if (!coinId || !_validRange(range)) {
      return _emptyResult('coingecko', 'USD', '1h');
    }
    const days = CRYPTO_DAYS[range];
    if (!days) {
      return _emptyResult('coingecko', 'USD', '1h');
    }

    let res;
    try {
      res = await fetch(
        `${API_BASE}/api/prices/history` +
          `?id=${encodeURIComponent(coinId)}&days=${encodeURIComponent(days)}`,
        { signal: a.signal, headers: { Accept: 'application/json' } }
      );
    } catch (err) {
      _warn('crypto fetch fail', coinId, range, err?.message);
      return _emptyResult('coingecko', 'USD', '1h');
    }
    if (!res.ok) {
      _warn('crypto http', coinId, range, res.status);
      return _emptyResult('coingecko', 'USD', '1h');
    }

    let body;
    try { body = await res.json(); } catch (_) { body = null; }
    const prices = Array.isArray(body?.prices) ? body.prices : [];
    if (!prices.length) return _emptyResult('coingecko', 'USD', '1h');

    // CoinGecko granularity is implicit by `days` per their docs:
    //   <=1d → 5-minute, <=90d → hourly, >90d → daily.
    const granularity = days <= 1 ? '5m' : days <= 90 ? '1h' : '1d';

    const series = [];
    for (const p of prices) {
      if (!Array.isArray(p) || p.length < 2) continue;
      const t = p[0], v = p[1];
      if (typeof t !== 'number' || typeof v !== 'number' || !Number.isFinite(v)) continue;
      series.push({ time: t, value: v });
    }

    return {
      series,
      meta: {
        source:       'coingecko',
        currency:     'USD',
        granularity:  granularity,
        isSynthetic:  false,
        completeness: _completenessFor(series.length, range),
        asOf:         Date.now(),
      },
    };
  }

  // ── 3. Portfolio adapter (local snapshots) ───────────────────
  // Reads the in-memory `portfolioHistory` populated by app.js's
  // recordSnapshot loop. Each entry is { ts: epochMs, value: USD }.
  // The adapter NEVER mutates the underlying array.
  function portfolioHistoryAdapter(args) {
    const a = args || {};
    const range = String(a.range || '').toLowerCase();
    if (!_validRange(range)) {
      return _emptyResult('local-snapshot', 'USD', '5m');
    }

    const raw = (typeof window !== 'undefined' && Array.isArray(window.portfolioHistory))
      ? window.portfolioHistory
      // app.js declares `portfolioHistory` as a top-level `let`; in
      // browser env it's reachable via `window` only when explicitly
      // attached. Fall back to globalThis lookup so the adapter still
      // sees the data when wired via consumers that pass it in.
      : (typeof globalThis !== 'undefined' && Array.isArray(globalThis.portfolioHistory))
        ? globalThis.portfolioHistory
        : [];

    if (!raw.length) return _emptyResult('local-snapshot', 'USD', '5m');

    const now    = Date.now();
    const cutoff = range === 'all' ? 0 : (now - RANGE_SPAN_MS[range]);
    const filtered = [];
    for (const p of raw) {
      if (!p) continue;
      const t = Number(p.ts);
      const v = Number(p.value);
      if (!Number.isFinite(t) || !Number.isFinite(v) || v <= 0) continue;
      if (t < cutoff) continue;
      filtered.push({ time: t, value: v });
    }
    if (!filtered.length) return _emptyResult('local-snapshot', 'USD', '5m');
    filtered.sort((a, b) => a.time - b.time);

    // Granularity inference from median delta between adjacent points.
    let granularity = '5m';
    if (filtered.length >= 2) {
      const deltas = [];
      for (let i = 1; i < filtered.length; i++) deltas.push(filtered[i].time - filtered[i - 1].time);
      deltas.sort((a, b) => a - b);
      const median = deltas[Math.floor(deltas.length / 2)];
      if      (median <= 6 * 60e3)        granularity = '5m';
      else if (median <= 30 * 60e3)       granularity = '15m';
      else if (median <= 2 * 3600e3)      granularity = '1h';
      else if (median <= 36 * 3600e3)     granularity = '1d';
      else                                granularity = '1wk';
    }

    return {
      series: filtered,
      meta: {
        source:       'local-snapshot',
        currency:     'USD',
        granularity:  granularity,
        isSynthetic:  false,
        completeness: _completenessFor(filtered.length, range),
        asOf:         now,
      },
    };
  }

  // ── Public surface (read-only) ───────────────────────────────
  window.AurixChartAdapters = Object.freeze({
    yahooHistoryAdapter,
    cryptoHistoryAdapter,
    portfolioHistoryAdapter,
    // Diagnostics — useful from console without exposing internals.
    _ranges: Object.keys(RANGE_SPAN_MS),
  });
})();
