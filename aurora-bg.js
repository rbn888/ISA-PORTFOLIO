/**
 * aurora-bg.js
 * Standalone animated background for the insights screen.
 * Runs in its own RAF loop — no dependency on app.js.
 */
(function () {
  'use strict';

  // ── Canvas ──────────────────────────────────────────────────
  const canvas = document.getElementById('aurora-bg');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let W = 0, H = 0;

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    canvas.style.width  = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  window.addEventListener('resize', resize, { passive: true });

  // ── Center ───────────────────────────────────────────────────
  const centerX = () => W / 2;
  const centerY = () => H / 2;

  // ── Pointer ──────────────────────────────────────────────────
  let pointerX = 0;
  let pointerY = 0;

  window.addEventListener('mousemove', e => {
    pointerX = e.clientX;
    pointerY = e.clientY;
  }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (e.touches[0]) {
      pointerX = e.touches[0].clientX;
      pointerY = e.touches[0].clientY;
    }
  }, { passive: true });

  // ── Particles ────────────────────────────────────────────────
  const FAR_COUNT = window.innerWidth <= 768 ? 60 : 90;
  const MID_COUNT = window.innerWidth <= 768 ? 30 : 50;
  const COUNT     = FAR_COUNT + MID_COUNT;
  const particles = new Array(COUNT);

  function spawnParticle(layer) {
    const isFar       = layer === 'far';
    const depth       = isFar ? 0.3 + Math.random() * 0.3 : 0.6 + Math.random() * 0.4;
    const baseOpacity = isFar ? 0.2 + Math.random() * 0.3  : 0.4 + Math.random() * 0.4;
    const size        = isFar ? 0.5 + Math.random() * 1.0  : 1.0 + Math.random() * 1.5;

    const radius   = Math.min(W || window.innerWidth, H || window.innerHeight) * 0.35;
    const angle    = Math.random() * Math.PI * 2;
    const distance = Math.pow(Math.random(), 1.5) * radius;
    const cx       = (W || window.innerWidth)  / 2;
    const cy       = (H || window.innerHeight) / 2;

    return {
      x:           cx + Math.cos(angle) * distance,
      y:           cy + Math.sin(angle) * distance,
      vx:          (Math.random() - 0.5) * 0.2,
      vy:          (Math.random() - 0.5) * 0.2,
      size,
      baseOpacity,
      opacity:     baseOpacity,
      depth,
      phase:       Math.random() * Math.PI * 2,
      freq:        0.22 + Math.random() * 0.38,
      seed:        Math.random() * 1000,
      layer,
    };
  }

  function initParticles() {
    let idx = 0;
    for (let i = 0; i < FAR_COUNT; i++) particles[idx++] = spawnParticle('far');
    for (let i = 0; i < MID_COUNT; i++) particles[idx++] = spawnParticle('mid');
  }

  // ── Aurora blobs ─────────────────────────────────────────────
  const BLOB_COUNT  = 6;
  const auroraBlobs = [];

  function makeBlob() {
    return {
      x:      Math.random() * window.innerWidth,
      y:      Math.random() * window.innerHeight,
      radius: 200 + Math.random() * 250,
      seed:   Math.random() * 1000,
      alpha:  0.04 + Math.random() * 0.04,
      hue:    Math.random() < 0.5 ? 185 : 155,
    };
  }

  function initBlobs() {
    for (let i = 0; i < BLOB_COUNT; i++) auroraBlobs.push(makeBlob());
  }

  // ── Glow pulses ──────────────────────────────────────────────
  const GLOW_N = 5;
  const glows  = new Array(GLOW_N);

  function makeGlow(startVisible) {
    const isCyan  = Math.random() < 0.42;
    const hue     = isCyan ? 170 + Math.random() * 30 : 220 + Math.random() * 50;
    const target  = 0.032 + Math.random() * 0.042;
    return {
      x:             Math.random() * window.innerWidth,
      y:             Math.random() * window.innerHeight * 0.85,
      radius:        130 + Math.random() * 230,
      opacity:       startVisible ? Math.random() * target : 0,
      targetOpacity: target,
      phase:         startVisible ? 'hold' : 'in',
      holdMs:        0,
      holdMax:       4000 + Math.random() * 7000,
      speed:         0.0022 + Math.random() * 0.0028,
      hue,
    };
  }

  function initGlows() {
    for (let i = 0; i < GLOW_N; i++) glows[i] = makeGlow(true);
  }

  // ── Micro sparkles ───────────────────────────────────────────
  const SPARKLE_COUNT = 15;
  const sparkles      = [];

  function makeSparkle() {
    return {
      x:    Math.random() * window.innerWidth,
      y:    Math.random() * window.innerHeight,
      seed: Math.random() * 1000,
      size: 0.5 + Math.random() * 1.0,
    };
  }

  function initSparkles() {
    for (let i = 0; i < SPARKLE_COUNT; i++) sparkles.push(makeSparkle());
  }

  // ── Visibility state ─────────────────────────────────────────
  let _active         = false;
  let lastActiveState = null;

  function setActive(val) {
    _active = val;
  }

  function isInsightsActive() {
    const el = document.getElementById('tabPlaceholder');
    return !!el &&
           el.style.display !== 'none' &&
           !!el.querySelector('.insights-screen');
  }

  function initObserver() {
    const el = document.getElementById('tabPlaceholder');
    if (!el) return;
    const obs = new MutationObserver(() => {
      setActive(isInsightsActive());
    });
    obs.observe(el, {
      childList: true,
      attributes: true,
      attributeFilter: ['style'],
    });
  }

  // ── Main loop ────────────────────────────────────────────────
  let _lastTs = 0;

  function animateBackground(ts) {
    requestAnimationFrame(animateBackground);

    const dt = Math.min(ts - _lastTs, 50);
    _lastTs = ts;

    if (lastActiveState !== _active) {
      canvas.style.opacity = _active ? '1' : '0';
      lastActiveState = _active;
    }

    ctx.clearRect(0, 0, W, H);

    const cx = centerX();
    const cy = centerY();
    const maxDist = Math.min(W, H) * 0.5;

    // ── Aurora blobs ──
    for (let i = 0; i < BLOB_COUNT; i++) {
      const b = auroraBlobs[i];
      b.x += Math.sin(ts * 0.0003 + b.seed) * 0.2;
      b.y += Math.cos(ts * 0.0003 + b.seed) * 0.2;
      const gr = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
      gr.addColorStop(0, `hsla(${b.hue},80%,65%,${b.alpha})`);
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Glow pulses ──
    for (let i = 0; i < GLOW_N; i++) {
      const g = glows[i];

      if (g.phase === 'in') {
        g.opacity += g.speed;
        if (g.opacity >= g.targetOpacity) {
          g.opacity = g.targetOpacity;
          g.phase   = 'hold';
        }
      } else if (g.phase === 'hold') {
        g.holdMs += dt;
        if (g.holdMs >= g.holdMax) g.phase = 'out';
      } else {
        g.opacity -= g.speed * 0.55;
        if (g.opacity <= 0) {
          glows[i] = makeGlow(false);
          continue;
        }
      }

      const gr = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.radius);
      gr.addColorStop(0,   `hsla(${g.hue},80%,66%,${g.opacity})`);
      gr.addColorStop(0.5, `hsla(${g.hue},70%,55%,${(g.opacity * 0.28).toFixed(3)})`);
      gr.addColorStop(1,   `hsla(${g.hue},60%,45%,0)`);

      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Particles ──
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];

      // Organic drift
      p.vx += Math.sin(ts * 0.001 * p.freq + p.phase) * 0.0007;
      p.vy += Math.cos(ts * 0.001 * p.freq * 0.68 + p.phase) * 0.0007;

      // Center attraction
      p.vx += (cx - p.x) * 0.00002;
      p.vy += (cy - p.y) * 0.00002;

      // Pointer repel
      const pdx  = p.x - pointerX;
      const pdy  = p.y - pointerY;
      const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
      if (pdist < 120) {
        const force = (120 - pdist) / 120;
        p.vx += pdx * force * 0.02;
        p.vy += pdy * force * 0.02;
      }

      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x  += p.vx;
      p.y  += p.vy;

      // Recycle if escaped
      const cdist = Math.hypot(p.x - cx, p.y - cy);
      if (cdist > maxDist) {
        Object.assign(p, spawnParticle(p.layer));
        continue;
      }

      // Twinkle
      p.opacity = p.baseOpacity + Math.sin(ts * 0.002 + p.seed) * 0.2;

      // Boost near pointer
      if (pdist < 100) {
        p.opacity = Math.min(p.opacity + 0.05, 0.99);
      }

      p.opacity = Math.max(0, p.opacity);

      // Distance fade
      const fade = 1 - Math.min(cdist / maxDist, 1);

      // Color: blue (far) → violet (near)
      const hue = 205 + p.depth * 65;
      const lit = 54  + p.depth * 26;

      ctx.globalAlpha = p.opacity * fade;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue},72%,${lit}%)`;
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // ── Micro sparkles ──
    for (let i = 0; i < SPARKLE_COUNT; i++) {
      const sp    = sparkles[i];
      const alpha = Math.max(0, Math.sin(ts * 0.01 + sp.seed) * 0.5);
      if (alpha < 0.01) continue;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,230,255,${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    resize();
    pointerX = W / 2;
    pointerY = H / 2;
    initParticles();
    initBlobs();
    initGlows();
    initSparkles();
    initObserver();
    setActive(isInsightsActive());
    requestAnimationFrame(animateBackground);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
