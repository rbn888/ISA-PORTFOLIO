const SEVERITY_RANK = { low: 1, medium: 2, high: 3 };
const SCORE_MAP     = { high: 3, medium: 2, low: 1 };

const INSIGHT_CONFIG = {
  thresholds: {
    highExposure:        60,
    veryHighExposure:    70,
    volatilityExposure:  50,
    lowLiquidity:        15,
    criticalLiquidity:   10,
  }
};

const SAFE_DEFAULT = { type: 'neutral', message: '', severity: 'low' };

function normalizeMarket(market) {
  if (!market || typeof market !== 'object') return null;
  return {
    trend:      typeof market.trend      === 'string' ? market.trend.toLowerCase()      : null,
    momentum:   typeof market.momentum   === 'string' ? market.momentum.toLowerCase()   : null,
    volatility: typeof market.volatility === 'string' ? market.volatility.toLowerCase() : null,
  };
}

function normalizePortfolio(portfolio) {
  if (!portfolio || typeof portfolio !== 'object') return null;
  return {
    cryptoExposure: typeof portfolio.cryptoExposure === 'number' && !isNaN(portfolio.cryptoExposure) ? portfolio.cryptoExposure : null,
    liquidity:      typeof portfolio.liquidity      === 'number' && !isNaN(portfolio.liquidity)      ? portfolio.liquidity      : null,
  };
}

function generateInsight(market, portfolio) {
  market    = normalizeMarket(market);
  portfolio = normalizePortfolio(portfolio);

  try {
    const candidates = [];

    // Rule 1 — High risk: strong downtrend + high exposure
    if (
      market && portfolio &&
      market.trend === 'down' &&
      market.momentum === 'strong' &&
      typeof portfolio.cryptoExposure === 'number' &&
      portfolio.cryptoExposure >= INSIGHT_CONFIG.thresholds.highExposure
    ) {
      let score = SCORE_MAP['high'];
      if (market.momentum === 'strong')                                          score += 1;
      if (portfolio.cryptoExposure > INSIGHT_CONFIG.thresholds.veryHighExposure) score += 1;
      if (typeof portfolio.liquidity === 'number' && portfolio.liquidity < 10) score += 2;
      candidates.push({ type: 'risk', message: 'High exposure during strong downtrend.', severity: 'high', score });
    }

    // Rule 2 — Volatility warning
    if (
      market && portfolio &&
      market.volatility === 'high' &&
      typeof portfolio.cryptoExposure === 'number' &&
      portfolio.cryptoExposure >= INSIGHT_CONFIG.thresholds.volatilityExposure
    ) {
      let score = SCORE_MAP['medium'];
      if (market.momentum === 'strong')                                          score += 1;
      if (portfolio.cryptoExposure > INSIGHT_CONFIG.thresholds.veryHighExposure) score += 1;
      if (typeof portfolio.liquidity === 'number' && portfolio.liquidity < 10) score += 2;
      candidates.push({ type: 'risk', message: 'High exposure in volatile market.', severity: 'medium', score });
    }

    // Rule 3 — Low liquidity
    if (
      portfolio &&
      typeof portfolio.liquidity === 'number' &&
      portfolio.liquidity <= INSIGHT_CONFIG.thresholds.lowLiquidity
    ) {
      let score = SCORE_MAP['high'];
      if (portfolio.liquidity < INSIGHT_CONFIG.thresholds.criticalLiquidity) score += 2;
      candidates.push({ type: 'liquidity', message: 'Very low liquidity.', severity: 'high', score });
    }

    // Rule 4 — Strong uptrend opportunity
    if (
      market && portfolio &&
      market.trend === 'up' &&
      market.momentum === 'strong' &&
      typeof portfolio.cryptoExposure === 'number' &&
      portfolio.cryptoExposure >= INSIGHT_CONFIG.thresholds.volatilityExposure
    ) {
      let score = SCORE_MAP['medium'];
      if (market.momentum === 'strong')                                          score += 1;
      if (portfolio.cryptoExposure > INSIGHT_CONFIG.thresholds.veryHighExposure) score += 1;
      candidates.push({ type: 'opportunity', message: 'High exposure in strong uptrend.', severity: 'medium', score });
    }

    if (candidates.length > 0) {
      const best = candidates.sort((a, b) => b.score - a.score)[0];
      const valid = best && typeof best.message === 'string' && best.type && SCORE_MAP[best.severity];
      if (valid) return { type: best.type, message: best.message, severity: best.severity };
      // invalid best → fall through to legacy fallback
    }
  } catch (_) {}

  // Fallback: legacy logic
  try {
    const candidates = [];

    if (market && market.trend === 'down' && portfolio && portfolio.cryptoExposure > 60) {
      candidates.push({ type: 'risk', message: 'High crypto exposure in a declining market.', severity: 'high' });
    }

    if (market && market.trend === 'up' && portfolio && portfolio.cryptoExposure > 60) {
      candidates.push({ type: 'opportunity', message: 'High crypto exposure in a rising market.', severity: 'medium' });
    }

    if (portfolio && portfolio.liquidity < 10) {
      candidates.push({ type: 'liquidity', message: 'Liquidity below critical threshold.', severity: 'medium' });
    }

    if (candidates.length === 0) {
      return { type: 'neutral', message: 'No significant signals detected.', severity: 'low' };
    }

    const result = candidates.reduce((top, current) =>
      SEVERITY_RANK[current.severity] > SEVERITY_RANK[top.severity] ? current : top
    );

    const valid = result && typeof result.message === 'string' && result.type && SEVERITY_RANK[result.severity];
    return valid ? result : SAFE_DEFAULT;
  } catch (_) {}

  return SAFE_DEFAULT;
}
