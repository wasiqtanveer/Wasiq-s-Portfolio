import { useRef, useEffect } from 'react';
import gsap from 'gsap';

/**
 * 3D hover tilt. Attach the returned ref to any element and it will rotate in
 * 3D toward the cursor, lift slightly, and ease back to rest on leave.
 *
 * Skipped on touch devices and when prefers-reduced-motion is set.
 *
 * Implementation note: ALL transform sub-properties (rotationX, rotationY,
 * scale, z) are written through a SINGLE gsap.quickSetter applied once per
 * frame from our own rAF loop. Earlier versions mixed gsap.quickTo (rotation)
 * with gsap.to (scale/z) — two tweens fighting over the one CSS `transform`
 * property. They desynced GSAP's cached transform state, so the tilt only ran
 * the first time. One setter + our own spring = no competing tweens, so it
 * works on every hover and the motion is fully under our control.
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

    // One setter owns the whole transform — nothing else writes to it.
    const setTransform = gsap.quickSetter(el, 'css');

    // Live (smoothed) values and their targets.
    const cur = { rx: 0, ry: 0, sc: 1, z: 0 };
    const tgt = { rx: 0, ry: 0, sc: 1, z: 0 };

    let rect = null;
    let mx = 0, my = 0;
    let rafId = 0;
    let hovering = false;

    // Critically-damped-ish spring: higher = snappier. Rotation tracks faster
    // than the scale/lift settle so the card feels responsive but not twitchy.
    const ROT_EASE = 0.18;   // per-frame approach for rotation
    const SETTLE_EASE = 0.14; // per-frame approach for scale + z

    const tick = () => {
      // Recompute rotation target from the latest pointer (only while hovering).
      if (hovering && rect) {
        const px = (mx - rect.left) / rect.width - 0.5;   // -0.5 .. 0.5
        const py = (my - rect.top) / rect.height - 0.5;
        tgt.ry = px * max * 2;
        tgt.rx = -py * max * 2;
      }

      cur.rx += (tgt.rx - cur.rx) * ROT_EASE;
      cur.ry += (tgt.ry - cur.ry) * ROT_EASE;
      cur.sc += (tgt.sc - cur.sc) * SETTLE_EASE;
      cur.z  += (tgt.z  - cur.z)  * SETTLE_EASE;

      setTransform({
        rotationX: cur.rx,
        rotationY: cur.ry,
        scale: cur.sc,
        z: cur.z,
      });

      // Keep ticking while hovering, or until we've fully settled back to rest.
      const settled =
        Math.abs(cur.rx) < 0.01 && Math.abs(cur.ry) < 0.01 &&
        Math.abs(cur.sc - 1) < 0.001 && Math.abs(cur.z) < 0.05;

      if (hovering || !settled) {
        rafId = requestAnimationFrame(tick);
      } else {
        // Snap to exact rest and stop.
        setTransform({ rotationX: 0, rotationY: 0, scale: 1, z: 0 });
        rafId = 0;
        el.style.willChange = 'auto';
      }
    };

    const ensureRunning = () => {
      if (!rafId) rafId = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      mx = e.clientX;
      my = e.clientY;
    };

    const onEnter = () => {
      hovering = true;
      rect = el.getBoundingClientRect();
      el.style.transformStyle = 'preserve-3d';
      el.style.willChange = 'transform';
      tgt.sc = scale;
      tgt.z = lift;
      ensureRunning();
    };

    const onLeave = () => {
      hovering = false;
      rect = null;
      tgt.rx = 0;
      tgt.ry = 0;
      tgt.sc = 1;
      tgt.z = 0;
      ensureRunning(); // keep ticking so it springs back, then auto-stops
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
      gsap.set(el, { clearProps: 'transform' });
    };
  }, [max, scale, lift]);

  return ref;
}
