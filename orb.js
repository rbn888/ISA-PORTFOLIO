(function () {
  'use strict';

  const canvas = document.getElementById('orb-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const DPR = Math.min(window.devicePixelRatio || 1, 2);

  let W, H, CX, CY, R;
  let particles = [];

  // Three orbital rings at different tilts — creates 3D depth illusion
  const RING_DEFS = [
    { count: 22, rxF: 1.35, ryF: 0.30, tilt: -0.35, speed:  0.00065, r: 34, g: 197, b:  94 },
    { count: 16, rxF: 1.55, ryF: 0.26, tilt:  0.52, speed: -0.00052, r: 34, g: 210, b: 110 },
    { count: 12, rxF: 1.22, ryF: 0.46, tilt:  1.15, speed:  0.00088, r: 55, g: 220, b: 130 },
  ];

  function buildParticles() {
    particles = [];
    for (const d of RING_DEFS) {
      for (let i = 0; i < d.count; i++) {
        particles.push({
          angle: (i / d.count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
          rx:    R * d.rxF * (0.8 + Math.random() * 0.4),
          ry:    R * d.ryF * (0.8 + Math.random() * 0.4),
          tilt:  d.tilt + (Math.random() - 0.5) * 0.2,
          speed: d.speed * (0.65 + Math.random() * 0.7),
          size:  0.5 + Math.random() * 1.6,
          base:  0.25 + Math.random() * 0.55,
          r: d.r, g: d.g, b: d.b,
        });
      }
    }
  }

  function resize() {
    W = canvas.offsetWidth  || 300;
    H = canvas.offsetHeight || 300;
    canvas.width  = W * DPR;
    canvas.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    CX = W / 2;
    CY = H / 2;
    R  = W * 0.4;
    buildParticles();
  }

  function draw(ts) {
    requestAnimationFrame(draw);

    const t      = ts * 0.001;
    const floatY = Math.sin(t * (2 * Math.PI / 7)) * (H * 0.02);
    const oCY    = CY + floatY;

    ctx.clearRect(0, 0, W, H);

    // Sort particles into back (behind sphere) and front
    const back  = [];
    const front = [];
    for (const p of particles) {
      p.angle += p.speed;
      if (Math.sin(p.angle) * Math.cos(p.tilt) >= 0) back.push(p);
      else                                             front.push(p);
    }

    // Back particles — dimmer, occluded by sphere
    for (const p of back) {
      const x     = CX  + Math.cos(p.angle) * p.rx;
      const y     = oCY + Math.sin(p.angle) * p.ry * Math.cos(p.tilt);
      const depth = (Math.sin(p.angle) * Math.cos(p.tilt) + 1) * 0.5;
      ctx.globalAlpha = p.base * (0.08 + depth * 0.10);
      ctx.beginPath();
      ctx.arc(x, y, p.size * 0.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.fill();
    }

    // Sphere — radial gradient from highlight to deep dark
    const grad = ctx.createRadialGradient(
      CX - R * 0.28, oCY - R * 0.32, R * 0.04,
      CX,            oCY,             R
    );
    grad.addColorStop(0,    'rgba(34,197,94,0.22)');
    grad.addColorStop(0.26, 'rgba(18,26,18,0.70)');
    grad.addColorStop(0.60, 'rgba(11,15,26,0.92)');
    grad.addColorStop(1,    'rgba(7,10,18,0.98)');

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(CX, oCY, R, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim light — thin green edge for volume
    const rim = ctx.createRadialGradient(CX, oCY, R * 0.82, CX, oCY, R);
    rim.addColorStop(0, 'rgba(34,197,94,0)');
    rim.addColorStop(1, 'rgba(34,197,94,0.10)');
    ctx.beginPath();
    ctx.arc(CX, oCY, R, 0, Math.PI * 2);
    ctx.fillStyle = rim;
    ctx.fill();

    // Front particles — bright, appear in front of sphere
    for (const p of front) {
      const x     = CX  + Math.cos(p.angle) * p.rx;
      const y     = oCY + Math.sin(p.angle) * p.ry * Math.cos(p.tilt);
      const depth = (-Math.sin(p.angle) * Math.cos(p.tilt) + 1) * 0.5;
      ctx.globalAlpha = p.base * (0.30 + depth * 0.70);
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${p.r},${p.g},${p.b})`;
      ctx.fill();
    }

    ctx.globalAlpha = 1;
  }

  window.addEventListener('resize', resize, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { resize(); requestAnimationFrame(draw); });
  } else {
    resize();
    requestAnimationFrame(draw);
  }
})();
