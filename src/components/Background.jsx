import React, { useRef, useEffect, useState, lazy, Suspense } from 'react';

// Lazy-load the WebGL scene so three.js doesn't block initial paint.
const Scene3D = lazy(() => import('./Scene3D'));

export default function Background() {
  const scratchCanvasRef = useRef(null);
  const [show3D, setShow3D] = useState(false);

  // Defer the WebGL scene until the browser is idle so it never competes
  // with the preloader / hero entrance animation.
  useEffect(() => {
    const ric = window.requestIdleCallback || ((cb) => setTimeout(cb, 1200));
    const id = ric(() => setShow3D(true));
    return () => {
      if (window.cancelIdleCallback) window.cancelIdleCallback(id);
      else clearTimeout(id);
    };
  }, []);

  useEffect(() => {
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
      
      for(let i = 0; i < count; i++) {
        sctx.beginPath();
        // Start top-right-ish, go bottom-left-ish
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
    
    if (!isMobile) {
      scratchInterval = setInterval(drawScratches, 8000);
    }
    
    return () => {
      window.removeEventListener('resize', resize);
      if (scratchInterval) clearInterval(scratchInterval);
    };
  }, []);

  return (
    <>
      {/* WebGL 3D scene — sits furthest back (z-index -3) */}
      {show3D && (
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      )}

      {/* Readability veil — darkens the 3D so content always reads cleanly.
          Higher opacity + a flat base layer keeps the scene subdued and the
          centre from blooming too bright behind the hero/section text. */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -2,
          background:
            'radial-gradient(ellipse 100% 80% at 50% 45%, rgba(20,18,16,0.90) 0%, rgba(20,18,16,0.80) 45%, rgba(20,18,16,0.66) 100%)',
        }}
      />
      {/* Flat base tint — guarantees a consistent floor of darkness everywhere */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ zIndex: -2, background: 'rgba(20,18,16,0.30)' }}
      />

    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -2 }}>
      {/* Animated CSS Grain for vast performance boost */}
      <div className="absolute inset-0 w-full h-full css-grain" />
      
      {/* Scratch Lines */}
      <canvas 
        ref={scratchCanvasRef} 
        className="absolute inset-0 w-full h-full"
      />
      
      {/* Vignette — z-index -1 layer */}
      <div 
        className="absolute inset-0"
        style={{ 
          zIndex: 1, 
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.65) 100%)' 
        }}
      />
    </div>
    </>
  );
}
