import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * Cursor-reactive tilt, QUANTIZED — the paper follows the pointer, but only
 * ever rests in a small grid of discrete poses.
 *
 * This is the single cheapest way to make a static sheet feel hand-operated.
 * A continuous tilt reads as "CSS 3D card, seen it a thousand times"; the same
 * tilt snapped to five positions per axis reads as a rig being nudged between
 * exposures, which is the whole vocabulary of this section.
 *
 * It is also nearly free. Nothing is tweened and nothing runs per frame: the
 * pointer position is bucketed, and the DOM is touched ONLY when the bucket
 * actually changes. Moving across a whole sheet costs at most a couple of
 * dozen style writes instead of one on every mousemove.
 *
 * The element needs a `perspective` on its parent — the tilt writes rotateX /
 * rotateY and nothing else, so it never fights a transform GSAP owns elsewhere.
 *
 * @param {object} opts
 * @param {number} opts.max   Peak rotation in degrees at the far corner.
 * @param {number} opts.steps Discrete positions per axis (odd = a true centre).
 */
export default function useSteppedTilt({ max = 2.4, steps = 5 } = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Pointer tilt is meaningless without a pointer, and this is exactly the
    // kind of ambient movement prefers-reduced-motion is asking us to drop.
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (coarse || reduce) return;

    const setTilt = gsap.quickSetter(el, 'css');
    const half = (steps - 1) / 2;
    let lastX = null;
    let lastY = null;
    let rafId = 0;
    let px = 0;
    let py = 0;

    const flush = () => {
      rafId = 0;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;

      // -0.5 … 0.5 relative to the sheet, clamped so the pose stops changing
      // once the pointer has left the sheet's neighbourhood.
      const nx = gsap.utils.clamp(-0.5, 0.5, (px - r.left) / r.width - 0.5);
      const ny = gsap.utils.clamp(-0.5, 0.5, (py - r.top) / r.height - 0.5);

      // Snap to a bucket, then convert the bucket index back to an angle. The
      // round-trip through an integer is what makes the motion land on frames.
      const bx = Math.round(nx * 2 * half);
      const by = Math.round(ny * 2 * half);
      if (bx === lastX && by === lastY) return;
      lastX = bx;
      lastY = by;

      setTilt({
        rotationY: (bx / half) * max,
        rotationX: (-by / half) * max,
      });
    };

    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      if (rafId) cancelAnimationFrame(rafId);
      gsap.set(el, { clearProps: 'transform' });
    };
  }, [max, steps]);

  return ref;
}
