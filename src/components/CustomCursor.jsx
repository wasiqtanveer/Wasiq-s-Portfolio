import React, { useRef, useEffect } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import { playTick } from '../hooks/useSound';

const isTouch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

export default function CustomCursor() {
  const dotRef  = useRef(null);
  const ringRef = useRef(null);

  // ── Click audio + ring pulse ──────────────────────────────────────────
  useEffect(() => {
    const onClick = () => {
      // Routed through the shared preference — silent unless sound is on.
      playTick({ from: 600, to: 120, gain: 0.12, duration: 0.05 });

      // Quick pulse on ring — GSAP handles all transforms
      if (ringRef.current) {
        gsap.fromTo(ringRef.current,
          { scale: 0.6 },
          { scale: 1, duration: 0.4, ease: 'back.out(2)', overwrite: 'auto' }
        );
      }
    };
    window.addEventListener('mousedown', onClick);
    return () => window.removeEventListener('mousedown', onClick);
  }, []);

  // ── Core cursor: all transforms owned by GSAP ─────────────────────────
  useGSAP(() => {
    if (isTouch) return;

    const dot  = dotRef.current;
    const ring = ringRef.current;

    // Initialize at centre
    gsap.set([dot, ring], {
      x: window.innerWidth  / 2,
      y: window.innerHeight / 2,
      scale: 1,
      xPercent: -50,
      yPercent: -50,
    });

    // Create hardware-accelerated quickTo instances
    const xToDot = gsap.quickTo(dot, "x", { duration: 0.05, ease: "power3" });
    const yToDot = gsap.quickTo(dot, "y", { duration: 0.05, ease: "power3" });
    const xToRing = gsap.quickTo(ring, "x", { duration: 0.25, ease: "power3" });
    const yToRing = gsap.quickTo(ring, "y", { duration: 0.25, ease: "power3" });

    // ── Mouse move ──────────────────────────────────────────────────────
    const onMove = (e) => {
      xToDot(e.clientX);
      yToDot(e.clientY);
      xToRing(e.clientX);
      yToRing(e.clientY);
    };
    window.addEventListener('mousemove', onMove, { passive: true });

    // ── Hover expand/contract — GSAP owns scale, no CSS conflict ─────────
    // Tight, premium response: quick to grow, no lag on shrink.
    const onHover = (e) => {
      const hovered = e.detail.hovered;
      // Dot: grow to 1.5× on hover, shrink back on leave
      gsap.to(dot, {
        scale: hovered ? 1.5 : 1,
        duration: 0.22,
        ease: 'power3.out',
        overwrite: 'auto',
      });
      // Ring: grow to 1.8× on hover, back to 1 on leave
      gsap.to(ring, {
        scale: hovered ? 1.8 : 1,
        duration: 0.25,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };
    window.addEventListener('cursor-hover', onHover);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('cursor-hover', onHover);
    };
  }, []);

  if (isTouch) return null;

  return (
    <>
      <div
        ref={dotRef}
        id="cursor-dot"
        aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 99999,
                 width: 8, height: 8, borderRadius: '50%' }}
        className="cursor-gradient shadow-[0_0_12px_rgba(57,255,20,0.4)] will-change-transform"
      />
      <div
        ref={ringRef}
        id="cursor-ring"
        aria-hidden="true"
        style={{ position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 99999,
                 width: 28, height: 28 }}
        className="will-change-transform"
      >
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-[2px] h-[10px] cursor-gradient opacity-70" />
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[2px] h-[10px] cursor-gradient opacity-70" />
        <span className="absolute top-1/2 left-0 -translate-y-1/2 w-[10px] h-[2px] cursor-gradient opacity-70" />
        <span className="absolute top-1/2 right-0 -translate-y-1/2 w-[10px] h-[2px] cursor-gradient opacity-70" />
      </div>
    </>
  );
}
