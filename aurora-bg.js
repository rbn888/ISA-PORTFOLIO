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
  const COUNT = window.innerWidth <= 768 ? 50 : 100;
  const particles = new Array(COUNT);

  function makeParticle() {
    const depth = Math.random();
    const speed = 0.10 + depth * 0.22;
    return {
      x:           Math.random() * window.innerWidth,
      y:           Math.random() * window.innerHeight,
      vx:          (Math.random() - 0.5) * speed,
      vy:          (Math.random() - 0.5) * speed * 0.5,
      size:        0.4 + depth * 1.8,
      baseOpacity: 0.07 + depth * 0.32,
      opacity:     0.07 + depth * 0.32,
      depth,
      phase:       Math.random() * Math.PI * 2,
      freq:        0.22 + Math.random() * 0.38,
    };
  }

  function initParticles() {
    for (let i = 0; i < COUNT; i++) particles[i] = makeParticle();
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

    const t = ts / 1000;

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
      p.vx += Math.sin(t * p.freq + p.phase) * 0.0007;
      p.vy += Math.cos(t * p.freq * 0.68 + p.phase) * 0.0007;

      // Pointer interaction
      const dx   = p.x - pointerX;
      const dy   = p.y - pointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 120) {
        const force = (120 - dist) / 120;
        p.vx += dx * force * 0.02;
        p.vy += dy * force * 0.02;
      }

      p.vx *= 0.98;
      p.vy *= 0.98;
      p.x  += p.vx;
      p.y  += p.vy;

      // Opacity boost near pointer, decay back to base
      if (dist < 100) {
        p.opacity = Math.min(p.baseOpacity + 0.05, 0.99);
      } else {
        p.opacity += (p.baseOpacity - p.opacity) * 0.05;
      }

      // Wrap edges
      if (p.x < -8)    p.x = W + 8;
      if (p.x > W + 8) p.x = -8;
      if (p.y < -8)    p.y = H + 8;
      if (p.y > H + 8) p.y = -8;

      // Color: blue (far) → violet (near)
      const hue = 205 + p.depth * 65;
      const lit = 54  + p.depth * 26;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue},72%,${lit}%,${p.opacity})`;
      ctx.fill();

      // Soft sparkle on near-layer particles
      if (p.depth > 0.78 && Math.sin(t * 1.75 + p.phase * 2.8) > 0.92) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 1.7, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(192,100%,92%,${(p.opacity * 0.65).toFixed(3)})`;
        ctx.fill();
      }
    }
  }

  // ── Init ─────────────────────────────────────────────────────
  function init() {
    resize();
    pointerX = W / 2;
    pointerY = H / 2;
    initParticles();
    initGlows();
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
