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
    // Asset preloading + minimum time lock
    const minimumTime = new Promise(res => setTimeout(res, 2500));
    const assetsReady = Promise.all([
      document.fonts.ready,
      new Promise(res => {
        const img = new Image();
        img.onload = res;
        img.onerror = res; // resolve even on error so preloader isn't stuck
        img.src = photoAsset;
      })
    ]);

    // Run fill animation immediately (visual only, not gated)
    const fillTween = gsap.fromTo('.preloader-fill',
      { width: '0%' },
      {
        width: '100%',
        duration: 2,
        ease: 'power2.inOut',
        delay: 0.6,
        onUpdate: function() {
          const progress = Math.round(this.progress() * 100);
          if (counterTopRef.current) counterTopRef.current.innerText = progress;
          if (counterBottomRef.current) counterBottomRef.current.innerText = progress;
        }
      }
    );

    // Entrance animation
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

    // Gate exit on BOTH assets loaded AND minimum time passed
    Promise.all([assetsReady, minimumTime]).then(() => {
      // Exit split animation
      const exitTl = gsap.timeline({
        onComplete: () => {
          // Small fade-out before unmounting to prevent flash
          gsap.to(container.current, {
            opacity: 0,
            duration: 0.2,
            onComplete: () => {
              if (onComplete) onComplete();
            }
          });
        }
      });

      exitTl
        .to(topHalf.current, { y: '-100%', duration: 1.1, ease: 'power4.inOut' }, 0)
        .to(bottomHalf.current, { y: '100%', duration: 1.1, ease: 'power4.inOut' }, 0);
    });

    return () => {
      fillTween.kill();
      entranceTl.kill();
    };
  }, []);

  const renderContent = (isTop) => (
    <div className="absolute inset-0 w-full h-full pointer-events-none">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[240px] preloader-inner">
        {/* WT. Initials - anchored above the bar */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-8 font-hero font-black text-[72px] text-text leading-none select-none whitespace-nowrap">
          WT.
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
    <div ref={container} className="fixed inset-0 z-[99999] pointer-events-none overflow-hidden">
      {/* Top Half Slice */}
      <div
        ref={topHalf}
        className="absolute inset-0 bg-bg will-change-transform z-20"
        style={{ clipPath: 'inset(0 0 50% 0)' }}
      >
        {renderContent(true)}
      </div>

      {/* Bottom Half Slice */}
      <div
        ref={bottomHalf}
        className="absolute inset-0 bg-bg will-change-transform z-20"
        style={{ clipPath: 'inset(50% 0 0 0)' }}
      >
        {renderContent(false)}
      </div>

      {/* Grain overlay */}
      <div className="absolute inset-0 w-full h-full opacity-40 z-30 mix-blend-overlay pointer-events-none bg-[url('data:image/svg+xml,%3Csvg_viewBox=%270_0_256_256%27_xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cfilter_id=%27noise%27%3E%3CfeTurbulence_type=%27fractalNoise%27_baseFrequency=%270.9%27_numOctaves=%274%27_stitchTiles=%27stitch%27/%3E%3C/filter%3E%3Crect_width=%27100%25%27_height=%27100%25%27_filter=%27url(%23noise)%27_opacity=%270.12%27/%3E%3C/svg%3E')] bg-[length:150px]" />
    </div>
  );
}
