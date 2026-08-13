import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import './paper.css';

/**
 * A macOS-style arrow pointer, cut out of paper.
 *
 * Replaces the app shell's dot-and-crosshair cursor for the duration of this
 * route. The shell's own cursor stays mounted (it owns the click sound) but is
 * hidden by a `body[data-paper]` rule in paper.css — cheaper and far less
 * invasive than forking a shared component.
 *
 * Two things it deliberately does NOT do:
 *
 *  - it does not step its POSITION. Everything else on this page animates on
 *    twos, but a pointer that lands on discrete positions feels broken rather
 *    than stylised — you aim with it. Tracking is near-instant; the stop-motion
 *    treatment goes into the silhouette and the hover state instead.
 *  - it does not rotate or spin. The arrow is a pointing instrument; the tip
 *    has to stay exactly under the real pointer coordinate at all times.
 */

// macOS pointer geometry, in a 20×28 viewBox with the tip at the origin.
// Tip → straight down the left edge → the heel notch → out along the tail →
// back up its inner edge → the head's bottom-right corner → close.
const ARROW = [
  [1, 1], [1, 21.5], [6.2, 16.6], [9.6, 25.5], [13.4, 24.0], [10.0, 15.4], [16.8, 15.4],
];

const toPath = (pts) =>
  pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ') + ' Z';

/**
 * Three near-identical cuts of the same arrow. The offsets are tiny (±0.3 of a
 * viewBox unit ≈ a third of a pixel on screen) because this is animation boil,
 * not noise: the outline should look re-cut by hand each frame while the
 * silhouette stays put. The tip is pinned across all frames — it is the one
 * point that must never move, or the cursor would feel loose.
 */
function boilFrames(frames = 3) {
  let seed = 20260806;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  return Array.from({ length: frames }, (_, f) =>
    toPath(
      f === 0
        ? ARROW
        : ARROW.map(([x, y], i) =>
            i === 0 ? [x, y] : [x + (rand() - 0.5) * 0.6, y + (rand() - 0.5) * 0.6]
          )
    )
  );
}

const FRAMES = boilFrames();
const BOIL = ['paper-boil-a', 'paper-boil-b', 'paper-boil-c'];

export default function PaperCursor() {
  const wrap = useRef(null);
  const scaler = useRef(null);

  useGSAP(() => {
    const el = wrap.current;
    if (!el) return;

    // Tracking is instant-ish: 0.035s is enough to smooth the gaps between
    // pointer events at high refresh rates without introducing felt lag.
    const xTo = gsap.quickTo(el, 'x', { duration: 0.035, ease: 'power2.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.035, ease: 'power2.out' });

    let px = 0, py = 0, raf = 0;
    const flush = () => { raf = 0; xTo(px); yTo(py); };
    const onMove = (e) => {
      px = e.clientX;
      py = e.clientY;
      // One write per frame no matter how many events arrive.
      if (!raf) raf = requestAnimationFrame(flush);
    };

    // Reuses the `cursor-hover` event the rest of the site already dispatches,
    // so every existing hover target lights this up with no extra wiring.
    const onHover = (e) => {
      const on = e.detail.hovered;
      gsap.to(scaler.current, {
        scale: on ? 1.28 : 1,
        duration: 0.14,
        ease: 'steps(3)',       // the hover DOES step — it is decoration, not aim
        overwrite: 'auto',
      });
      // The hover state moves the OUTLINE, not the face. Filling the face with
      // the accent looked right on cream and then all but vanished the moment
      // the pointer crossed the accent-coloured masthead. A cream face with a
      // recoloured edge is the one combination that stays legible over every
      // surface on the page: paper, solid accent, solid slate, and the ground.
      gsap.to('.pc-edge', {
        fill: on ? 'var(--spot)' : 'var(--ink)',
        stroke: on ? 'var(--spot)' : 'var(--ink)',
        duration: 0.14,
        ease: 'steps(2)',
        overwrite: 'auto',
      });
    };

    // Press: the sheet flattens against the page for a frame.
    const onDown = () => gsap.to(scaler.current, { scale: 0.86, duration: 0.06, ease: 'steps(2)', overwrite: 'auto' });
    const onUp = () => gsap.to(scaler.current, { scale: 1, duration: 0.12, ease: 'steps(2)', overwrite: 'auto' });

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('cursor-hover', onHover);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('cursor-hover', onHover);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      if (raf) cancelAnimationFrame(raf);
    };
  }, { scope: wrap });

  return (
    <div ref={wrap} className="paper-cursor" aria-hidden="true">
      {/* Scaling lives on an inner node so the hover/press scale can never
          overwrite the position written by quickTo on the wrapper. Origin is
          the tip, so growing the arrow doesn't shift where it points. */}
      <div ref={scaler} style={{ transformOrigin: '1px 1px' }}>
        <svg width="20" height="28" viewBox="0 0 20 28" className="paper-cursor-svg">
          {FRAMES.map((d, i) => (
            <g key={i} className={BOIL[i]}>
              {/* Ink outline first, then the paper face inset inside it — the
                  same order a real cut-out reads in: dark edge, light face. */}
              <path d={d} className="pc-edge" fill="var(--ink)" stroke="var(--ink)" strokeWidth="3.2" strokeLinejoin="round" />
              <path d={d} fill="var(--paper-hi)" stroke="none" />
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
