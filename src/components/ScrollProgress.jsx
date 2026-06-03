import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

export default function ScrollProgress() {
  const barRef = useRef(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let frame = 0;

    const setProgress = (p) => {
      const clamped = Math.min(1, Math.max(0, p || 0));
      gsap.set(bar, { scaleX: clamped });
      bar.setAttribute('aria-valuenow', Math.round(clamped * 100));
    };

    // Preferred: read Lenis' own scroll progress (kept in sync with smooth scroll)
    const onLenisScroll = ({ progress }) => setProgress(progress);

    // Fallback when Lenis isn't mounted (e.g. touch devices / initial frames)
    const onNativeScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setProgress(max > 0 ? doc.scrollTop / max : 0);
    };

    let lenis = null;
    let nativeAttached = false;

    const attach = () => {
      lenis = window.__lenis;
      if (lenis) {
        // Lenis is ready — drop the native fallback and follow Lenis instead
        if (nativeAttached) {
          window.removeEventListener('scroll', onNativeScroll);
          nativeAttached = false;
        }
        lenis.on('scroll', onLenisScroll);
        onLenisScroll({ progress: lenis.progress ?? 0 });
        return;
      }

      // Lenis not mounted yet — show progress via native scroll meanwhile
      if (!nativeAttached) {
        window.addEventListener('scroll', onNativeScroll, { passive: true });
        nativeAttached = true;
        onNativeScroll();
      }
      if (frame < 60) {
        frame++;
        requestAnimationFrame(attach);
      }
    };

    attach();

    return () => {
      if (lenis) lenis.off('scroll', onLenisScroll);
      if (nativeAttached) window.removeEventListener('scroll', onNativeScroll);
    };
  }, []);

  return (
    <div
      ref={barRef}
      role="progressbar"
      aria-label="Page scroll progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      className="fixed top-0 left-0 h-[2px] w-full bg-[#39FF14] z-[99998] origin-left pointer-events-none shadow-[4px_0_12px_rgba(57,255,20,0.6)]"
      style={{ transform: 'scaleX(0)', willChange: 'transform' }}
    />
  );
}
