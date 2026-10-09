import { useEffect, useRef } from 'react';

// The tip stays attached to the real pointer. Its single arrow flexes with
// velocity, compresses on press, and springs back without leaving a trail.
// Over the hero knot it offers a spin; while the knot is held it says so.
const LABELS = { view: 'VIEW ↗', grab: 'GIVE IT A SPIN', grabbing: 'NOW LET GO' };
export default function SharpCursor() {
  const ref = useRef(null);
  useEffect(() => {
    const element = ref.current;
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const arrow = element.querySelector('.exp-pointer-arrow');
    const label = element.querySelector('.exp-pointer-label');
    const knot = { hover: false, grabbing: false };
    let lastVisual = null, lastInteractive = null;
    const state = { scale: 1, rotation: 0, stretch: 0 };
    const target = { ...state };
    const velocity = { scale: 0, rotation: 0, stretch: 0 };
    let frame = 0, previous = 0, settle, lastX, lastY, pressed = false, hover = false;
    const tick = (time) => {
      const dt = Math.min((time - previous) / 1000 || 0.016, 0.032);
      previous = time;
      let moving = false;
      for (const key of Object.keys(state)) {
        velocity[key] += ((target[key] - state[key]) * 100 - velocity[key] * 10) * dt;
        state[key] += velocity[key] * dt;
        if (Math.abs(target[key] - state[key]) + Math.abs(velocity[key]) > 0.01) moving = true;
      }
      arrow.style.transform = `rotate(${state.rotation}deg) scale(${state.scale * (1 - state.stretch * 0.35)}, ${state.scale * (1 + state.stretch)})`;
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); } };
    const relax = () => { target.stretch = 0; target.rotation = hover ? -9 : 0; wake(); };
    const applyMode = () => {
      const mode = knot.grabbing ? 'grabbing' : lastVisual ? 'view' : lastInteractive ? 'link' : knot.hover ? 'grab' : 'default';
      if (mode !== element.dataset.mode) {
        element.dataset.mode = mode;
        if (LABELS[mode]) label.textContent = LABELS[mode];
      }
      hover = mode !== 'default';
      return mode;
    };
    const onKnot = (event) => {
      Object.assign(knot, event.detail);
      const mode = applyMode();
      target.scale = pressed || mode === 'grabbing' ? 0.78 : mode === 'grab' ? 1.3 : hover ? 1.22 : 1;
      relax();
    };
    const hide = () => { element.dataset.visible = 'false'; document.documentElement.classList.remove('exp-cursor-active'); lastX = lastY = undefined; };
    const keyboard = (event) => { if (event.key === 'Tab') hide(); };
    const move = (event) => {
      if (!media.matches || event.pointerType === 'touch') return;
      if (event.target.closest('input, textarea, select, [contenteditable="true"]')) { hide(); return; }
      lastVisual = event.target.closest('.exp-project-visual, .exp-lab-art');
      lastInteractive = event.target.closest('a, button, summary');
      const mode = applyMode();
      target.scale = pressed || mode === 'grabbing' ? 0.72 : mode === 'view' || mode === 'grab' ? 1.35 : hover ? 1.22 : 1;
      const dx = lastX === undefined ? 0 : event.clientX - lastX;
      const dy = lastY === undefined ? 0 : event.clientY - lastY;
      lastX = event.clientX; lastY = event.clientY;
      target.rotation = Math.max(-27, Math.min(27, dx * 0.85 - dy * 0.35)) + (hover ? -9 : 0);
      target.stretch = Math.min(0.3, Math.hypot(dx, dy) / 90);
      clearTimeout(settle); settle = setTimeout(relax, 70);
      element.style.transform = `translate3d(${event.clientX - 2}px, ${event.clientY - 2}px, 0)`;
      element.dataset.edge = event.clientX > window.innerWidth - 120 ? 'left' : 'right';
      element.dataset.visible = 'true';
      document.documentElement.classList.add('exp-cursor-active');
      wake();
    };
    const down = () => { if (!media.matches) return; pressed = true; target.scale = 0.72; target.stretch = 0.12; wake(); };
    const up = () => { if (!media.matches) return; pressed = false; target.scale = hover ? 1.22 : 1; velocity.scale = 3; relax(); };
    window.addEventListener('exp:knot', onKnot);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true });
    window.addEventListener('pointerup', up, { passive: true });
    document.documentElement.addEventListener('pointerleave', hide);
    window.addEventListener('blur', hide);
    window.addEventListener('keydown', keyboard);
    media.addEventListener('change', hide);
    return () => {
      hide(); clearTimeout(settle); cancelAnimationFrame(frame);
      window.removeEventListener('exp:knot', onKnot);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      document.documentElement.removeEventListener('pointerleave', hide);
      window.removeEventListener('blur', hide);
      window.removeEventListener('keydown', keyboard);
      media.removeEventListener('change', hide);
    };
  }, []);
  return <div ref={ref} className="exp-pointer" aria-hidden="true">
    <svg className="exp-pointer-arrow" viewBox="0 0 28 34" fill="none"><path d="M2 2 24 19 14 20 9 30Z" fill="currentColor" stroke="var(--exp-paper)" strokeWidth="1.5" strokeLinejoin="miter" /></svg>
    <span className="exp-pointer-label">{LABELS.view}</span>
  </div>;
}
