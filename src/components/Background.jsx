import React, { useRef, useEffect } from 'react';

export default function Background() {
  const grainCanvasRef = useRef(null);
  const scratchCanvasRef = useRef(null);

  useEffect(() => {
    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    
    const grainCanvas = grainCanvasRef.current;
    if (!grainCanvas) return;
    const gctx = grainCanvas.getContext('2d', { alpha: false });
    
    const scratchCanvas = scratchCanvasRef.current;
    const sctx = scratchCanvas ? scratchCanvas.getContext('2d', { alpha: true }) : null;

    let w, h;
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      
      // Scale down drawing buffer to 1/2 size for massive performance boost,
      // CSS scales it back to 100%, creating perfectly organic chunky grain.
      grainCanvas.width = Math.floor(w / 1.5);
      grainCanvas.height = Math.floor(h / 1.5);
      
      if (scratchCanvas) {
        scratchCanvas.width = w;
        scratchCanvas.height = h;
        drawScratches();
      }
      
      if (isMobile) {
        drawGrain();
      }
    };

    const drawScratches = () => {
      if (!sctx) return;
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

    const drawGrain = () => {
      const cw = grainCanvas.width;
      const ch = grainCanvas.height;
      if (!cw || !ch) return;
      const imgData = gctx.createImageData(cw, ch);
      const data = imgData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Base gray layer, adding noise -28 to +28
        const val = 120 + ((Math.random() * 56) - 28);
        data[i]     = val; // R
        data[i + 1] = val; // G
        data[i + 2] = val; // B
        data[i + 3] = 255; // Opaque for buffer put speed
      }
      gctx.putImageData(imgData, 0, 0);
    };

    let frameId;
    let lastTime = 0;
    const fps = 24;
    const interval = 1000 / fps;

    const loop = (time) => {
      frameId = requestAnimationFrame(loop);
      const delta = time - lastTime;
      if (delta > interval) {
        lastTime = time - (delta % interval);
        drawGrain();
      }
    };
    
    let scratchInterval;
    
    window.addEventListener('resize', resize);
    resize();
    
    if (!isMobile) {
      frameId = requestAnimationFrame(loop);
      scratchInterval = setInterval(drawScratches, 8000);
    }
    
    return () => {
      window.removeEventListener('resize', resize);
      if (frameId) cancelAnimationFrame(frameId);
      if (scratchInterval) clearInterval(scratchInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -2 }}>
      {/* Animated Grain */}
      <canvas 
        ref={grainCanvasRef} 
        className="absolute inset-0 w-full h-full mix-blend-overlay"
        style={{ 
          willChange: 'contents',
          opacity: 0.038 // Matches prompt rgba requirement computationally efficiently
        }}
      />
      
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
  );
}
