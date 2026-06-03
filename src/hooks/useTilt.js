import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * 3D hover tilt. Attach the returned ref to any element and it will rotate in
 * 3D toward the cursor, lift slightly, and add a soft green glow — then ease
 * back to rest on leave.
 *
 * Skipped on touch devices and when prefers-reduced-motion is set.
 *
 * @param {object} opts
 * @param {number} opts.max   Max rotation in degrees (default 8)
 * @param {number} opts.scale Hover scale (default 1.02)
 * @param {number} opts.lift  Z translate in px for the "pop" (default 0)
 */
export default function useTilt({ max = 8, scale = 1.02, lift = 0 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduce) return;

    el.style.transformStyle = 'preserve-3d';

    const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power3.out' });
    const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power3.out' });

    // Cache the element rect on enter so we never call getBoundingClientRect()
    // (a forced synchronous reflow) on every mousemove. Pointer samples are
    // coalesced into a single rAF flush per frame.
    let rect = null;
    let mx = 0, my = 0, rafId = 0;

    const flush = () => {
      rafId = 0;
      if (!rect) return;
      const px = (mx - rect.left) / rect.width - 0.5;   // -0.5 .. 0.5
      const py = (my - rect.top) / rect.height - 0.5;
      rotY(px * max * 2);
      rotX(-py * max * 2);
    };

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    const onEnter = () => {
      rect = el.getBoundingClientRect();
      // Re-assert the 3D context + hint on every enter so nothing that ran
      // between hovers (reveals, layer recycling) can leave it flattened.
      el.style.transformStyle = 'preserve-3d';
      el.style.willChange = 'transform';
      gsap.to(el, {
        scale,
        z: lift,
        duration: 0.4,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
      rect = null;
      // Snappy, tight return — no bouncy overshoot.
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        z: 0,
        duration: 0.45,
        ease: 'power3.out',
        overwrite: 'auto',
        onComplete: () => { el.style.willChange = 'auto'; },
      });
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [max, scale, lift]);

  return ref;
}
