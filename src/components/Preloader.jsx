import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import photoAsset from '../assets/unnamed - Edited.png';

export default function Preloader({ onComplete }) {
  const container = useRef(null);
  const topHalf = useRef(null);
  const bottomHalf = useRef(null);
  const counterTopRef = useRef(null);
  const counterBottomRef = useRef(null);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let done = false;

    // ── Real progress ────────────────────────────────────────────────────
    // The counter used to read a fixed 2s tween that had nothing to do with
    // loading, so it could sit at "100" while the gate was still shut — the
    // number was decoration wearing the costume of a status. It now counts
    // actual completed load signals, so 100 means 100.
    const signals = [
      document.fonts.ready,
      new Promise(res => {
        const img = new Image();
        img.onload = res;
        img.onerror = res; // resolve even on error so preloader isn't stuck
        img.src = photoAsset;
      }),
    ];

    let loaded = 0;
    const paint = (pct) => {
      const v = Math.round(pct);
      if (counterTopRef.current) counterTopRef.current.innerText = v;
      if (counterBottomRef.current) counterBottomRef.current.innerText = v;
      gsap.to('.preloader-fill', { width: `${v}%`, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
    };

    signals.forEach(p => p.then(() => {
      loaded += 1;
      paint((loaded / signals.length) * 100);
    }));

    // Floor, not a lock. 2500ms was long enough that a returning visitor paid
    // ~3.8s of held-back content on every hard load; 700ms is just enough for
    // the split to read as deliberate rather than as a flash.
    const minimumTime = new Promise(res => setTimeout(res, reduce ? 0 : 700));

    const entranceTl = gsap.timeline();
    entranceTl
      .fromTo('.preloader-inner',
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }
      )
      .fromTo(['.preloader-bar-wrap', '.preloader-counter'],
        { opacity: 0 },
        { opacity: 1, duration: 0.4 },
        0.2
      );

    const finish = () => {
      if (done) return;
      done = true;
      paint(100);

      // Reduced motion: no split wipe, just clear the gate.
      if (reduce) {
        gsap.to(container.current, { opacity: 0, duration: 0.15, onComplete: () => onComplete?.() });
        return;
      }

      gsap.timeline({
        onComplete: () => {
          // Small fade-out before unmounting to prevent flash
          gsap.to(container.current, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => onComplete?.(),
          });
        }
      })
        .to(topHalf.current, { y: '-100%', duration: 1.1, ease: 'power4.inOut' }, 0)
        .to(bottomHalf.current, { y: '100%', duration: 1.1, ease: 'power4.inOut' }, 0);
    };

    Promise.all([...signals, minimumTime]).then(finish);

    // Escape skips the rest of the intro. Bound on the document rather than the
    // overlay, which stays pointer-events-none so it never intercepts input.
    const onKey = (e) => { if (e.key === 'Escape') finish(); };
    document.addEventListener('keydown', onKey);

    // Hard ceiling: if a font or the image never resolves, the site still opens.
    const failsafe = setTimeout(finish, 6000);

    return () => {
      entranceTl.kill();
      clearTimeout(failsafe);
      document.removeEventListener('keydown', onKey);
    };
  }, [onComplete]);

  const renderContent = (isTop) => (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] preloader-inner">
        {/* WT. Initials - anchored above the bar */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 font-hero font-black text-[72px] text-text leading-none select-none whitespace-nowrap">
          WT<span className="text-green">.</span>
        </div>

        {/* The 2px Bar — split at 50vh cuts this in half */}
        <div className="preloader-bar-wrap w-full h-[2px] bg-border relative">
          <div className="preloader-fill absolute left-0 top-0 h-full bg-green shadow-[4px_0_12px_rgba(57,255,20,0.8)]" />
        </div>

        {/* Counter - anchored below the bar */}
        <div
          ref={isTop ? counterTopRef : counterBottomRef}
          className="preloader-counter absolute top-full left-1/2 -translate-x-1/2 mt-6 font-mono text-[11px] text-muted tracking-[0.2em] select-none"
        >
          0
        </div>
      </div>
    </div>
  );

  return (
    // pointer-events are live so a tap anywhere skips the intro.
    <div
      ref={container}
      className="fixed inset-0 z-[99999] overflow-hidden cursor-pointer"
      role="progressbar"
      aria-label="Loading site — press Escape to skip"
      aria-busy="true"
    >
      {/* Top Half Slice */}
      <div
        ref={topHalf}
        className="absolute inset-0 bg-black will-change-transform z-20"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
      >
        {renderContent(true)}
      </div>

      {/* Bottom Half Slice */}
      <div
        ref={bottomHalf}
        className="absolute inset-0 bg-black will-change-transform z-20"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
      >
        {renderContent(false)}
      </div>

      {/* Grain overlay */}
      <div className="absolute inset-0 w-full h-full opacity-40 z-30 pointer-events-none bg-[url('data:image/svg+xml,%3Csvg_viewBox=%270_0_256_256%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27noise%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.9%27_numOctaves=%274%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23noise)%27_opacity=%270.12%27/%3E%3C/svg%3E')] bg-[length:150px]" />
    </div>
  );
}
