import { useEffect, useId, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { travelTo } from './motion';

export default function LiquidNav() {
  const nav = useRef(null);
  const pill = useRef(null);
  const drop = useRef(null);
  const filterId = useId().replace(/:/g, '');
  const { pathname } = useLocation();

  useEffect(() => {
    const media = window.matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const element = nav.current;
    let frame = 0;
    let previous = 0;
    const state = { x: 0, scale: 1, dropX: 0, dropY: 0 };
    const target = { ...state };
    const velocity = { x: 0, scale: 0, dropX: 0, dropY: 0 };
    // Interruptible physical spring, shared for enter, travel, and retreat.
    const tick = (time) => {
      const dt = Math.min((time - previous) / 1000 || 0.016, 0.032);
      previous = time;
      let moving = false;
      for (const key of Object.keys(state)) {
        velocity[key] += ((target[key] - state[key]) * 100 - velocity[key] * 10) * dt;
        state[key] += velocity[key] * dt;
        if (Math.abs(target[key] - state[key]) + Math.abs(velocity[key]) > 0.01) moving = true;
      }
      pill.current.style.transform = `translate3d(${state.x}px, 0, 0) scaleX(${state.scale})`;
      drop.current.style.transform = `translate3d(${state.dropX}px, ${state.dropY}px, 0)`;
      frame = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!frame) { previous = performance.now(); frame = requestAnimationFrame(tick); } };
    const retreat = () => {
      element.dataset.liquid = 'false';
      element.querySelectorAll('a').forEach((link) => { link.dataset.near = 'false'; });
      target.dropX = target.x + 29;
      target.dropY = 5;
      wake();
    };
    const move = (event) => {
      if (!media.matches) return;
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      if (x < -55 || x > rect.width + 55 || y < -48 || y > rect.height + 48) {
        if (element.dataset.liquid === 'true') retreat();
        return;
      }
      const links = [...element.querySelectorAll('a')];
      const nearest = links.reduce((a, b) => Math.abs(x - a.offsetLeft - a.offsetWidth / 2) < Math.abs(x - b.offsetLeft - b.offsetWidth / 2) ? a : b);
      links.forEach((link) => { link.dataset.near = String(link === nearest); });
      target.x = nearest.offsetLeft + nearest.offsetWidth / 2 - 45;
      target.scale = nearest.offsetWidth / 90;
      target.dropX = Math.max(-45, Math.min(x - 20, rect.width + 5));
      target.dropY = Math.max(-39, Math.min(y - 20, rect.height + 3));
      element.dataset.liquid = 'true';
      wake();
    };
    const change = () => { if (!media.matches) retreat(); };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', retreat);
    media.addEventListener('change', change);
    return () => {
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', retreat);
      media.removeEventListener('change', change);
      cancelAnimationFrame(frame);
    };
  }, []);

  const go = (event, id) => {
    if (pathname !== '/') return;
    const section = document.querySelector(id);
    if (!section) return;
    event.preventDefault();
    history.replaceState(history.state, '', id);
    travelTo(section);
  };

  return (
    <header className="exp-header">
      <Link to="/" className="exp-wordmark" aria-label="Wasiq Tanveer home">wasiq<span>®</span></Link>
      <nav ref={nav} className="exp-nav" aria-label="Main navigation">
        <svg width="0" height="0" aria-hidden="true"><defs><filter id={filterId} x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" /><feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" /><feComposite in="SourceGraphic" operator="atop" /></filter></defs></svg>
        <div className="exp-liquid" style={{ filter: `url(#${filterId})` }} aria-hidden="true"><i ref={pill} className="exp-liquid-pill" /><i ref={drop} className="exp-liquid-drop" /></div>
        <Link to="/#work" onClick={(e) => go(e, '#work')}>Work<span>09</span></Link>
        <Link to="/#about" onClick={(e) => go(e, '#about')}>About</Link>
        <Link to="/#contact" onClick={(e) => go(e, '#contact')}>Contact <span>↗</span></Link>
      </nav>
    </header>
  );
}
