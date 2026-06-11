import React, { useRef, useEffect, useState, lazy, Suspense } from 'react';

// Lazy-load the WebGL scene so three.js doesn't block initial paint.
const Scene3D = lazy(() => import('./Scene3D'));

// ─── FLICKER DEBUG SWITCHES ─────────────────────────────────────────────────
// We're isolating the flicker by elimination. Right now EVERYTHING is OFF except
// the solid dark base. Confirm the page is flicker-free, then flip ONE flag to
// true, rebuild, and look again. The first flag that brings the flicker back is
// the culprit. Toggle order is recommended: SCENE_3D → GRAIN → SCRATCHES.
const ENABLE_3D       = true; // the WebGL scene (particles + wireframes)
const ENABLE_GRAIN    = true; // animated CSS film-grain layer
const ENABLE_SCRATCHES = true; // 2D canvas scratch lines (redraw every 8s)
// ────────────────────────────────────────────────────────────────────────────

export default function Background() {
  const scratchCanvasRef = useRef(null);
  const [show3D, setShow3D] = useState(false);

  // Defer the WebGL scene until the browser is idle so it never competes
  // with the preloader / hero entrance animation.
  useEffect(() => {
    if (!ENABLE_3D) return;
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const id = ric(() => setShow3D(true));
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (!ENABLE_SCRATCHES) return;
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    const scratchCanvas = scratchCanvasRef.current;
    if (!scratchCanvas) return;
    const sctx = scratchCanvas.getContext('2d', { alpha: true });

    let w, h;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      scratchCanvas.width = w;
      scratchCanvas.height = h;
      drawScratches();
    };

    const drawScratches = () => {
      sctx.clearRect(0, 0, w, h);
      const count = Math.floor(Math.random() * 3) + 4; // 4 to 6 lines
      sctx.strokeStyle = 'rgba(255,255,255,0.012)';
      sctx.lineWidth = 0.5;

      for (let i = 0; i < count; i++) {
        sctx.beginPath();
        const sx = Math.random() * w * 1.5;
        const sy = -100;
        const ex = sx - Math.random() * 500 - 300;
        const ey = h + 100;
        const cp1x = sx - Math.random() * 200;
        const cp1y = h * 0.3;
        const cp2x = ex + Math.random() * 200;
        const cp2y = h * 0.7;
        sctx.moveTo(sx, sy);
        sctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, ex, ey);
        sctx.stroke();
      }
    };

    let scratchInterval;
    window.addEventListener('resize', resize);
    resize();
    if (!isMobile) scratchInterval = setInterval(drawScratches, 8000);

    return () => {
      window.removeEventListener('resize', resize);
      if (scratchInterval) clearInterval(scratchInterval);
    };
  }, []);

  // One fixed container, opaque dark fill (the readability backdrop + guaranteed
  // floor). Layers are added on top only when their flag is enabled.
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 0, backgroundColor: '#0b0b0b' }}
    >
      {ENABLE_3D && show3D && (
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      )}

      {/* Neon ambience — two static green glow pools breathing out of the black.
          Static gradients = one-time paint, compositor-cheap (the old flicker
          came from an ANIMATED layer edge, never from static overlays). */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 1,
          background:
            'radial-gradient(ellipse 50% 40% at 12% 18%, rgba(57,255,20,0.05) 0%, transparent 70%),' +
            'radial-gradient(ellipse 55% 45% at 88% 78%, rgba(57,255,20,0.04) 0%, transparent 70%),' +
            // caldera under-light — molten glow seeping up from below the fold
            'radial-gradient(ellipse 85% 38% at 50% 106%, rgba(57,255,20,0.10) 0%, rgba(57,255,20,0.03) 50%, transparent 75%)',
        }}
      />

      {ENABLE_GRAIN && (
        <div className="absolute inset-0 w-full h-full css-grain" style={{ zIndex: 2 }} />
      )}

      {ENABLE_SCRATCHES && (
        <canvas ref={scratchCanvasRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 3 }} />
      )}

      {/* Charcoal vignette — pulls the eye to centre, deepens the volcanic black */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 4,
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
