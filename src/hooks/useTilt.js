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
    el.style.willChange = 'transform';

    const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' });
    const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' });

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;  // -0.5 .. 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      rotY(px * max * 2);
      rotX(-py * max * 2);
    };

    const onEnter = () => {
      gsap.to(el, {
        scale,
        z: lift,
        duration: 0.5,
        ease: 'power3.out',
        overwrite: 'auto',
      });
    };

    const onLeave = () => {
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        z: 0,
        duration: 0.7,
        ease: 'elastic.out(1, 0.6)',
        overwrite: 'auto',
      });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [max, scale, lift]);

  return ref;
}
